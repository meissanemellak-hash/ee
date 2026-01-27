import { prisma } from '../db/prisma'
import type { OrderRecommendation } from '@/types'

interface ForecastData {
  productId: string
  productName: string
  forecastedQuantity: number
}

interface IngredientNeed {
  ingredientId: string
  ingredientName: string
  unit: string
  neededQuantity: number
  packSize: number | null
  supplierName: string | null
}

interface RecommendationDetails {
  restaurantId: string
  restaurantName: string
  period: {
    start: string
    end: string
  }
  ingredients: Array<{
    ingredientId: string
    ingredientName: string
    neededQuantity: number
    currentStock: number
    quantityToOrder: number
    packSize: number | null
    numberOfPacks: number | null
    supplierName: string | null
  }>
  assumptions: {
    shrinkPct: number
    forecastDays: number
  }
  estimatedSavings?: number
}

/**
 * Calcule le forecast pour un produit sur 7 jours
 * Utilise un forecast existant ou calcule une moyenne sur 14 jours projetée sur 7 jours
 */
async function calculateProductForecast(
  restaurantId: string,
  productId: string,
  targetDate: Date = new Date()
): Promise<number> {
  // Vérifier si un forecast existe déjà pour les 7 prochains jours
  const endDate = new Date(targetDate)
  endDate.setDate(endDate.getDate() + 7)
  
  const existingForecast = await prisma.forecast.findFirst({
    where: {
      restaurantId,
      productId,
      forecastDate: {
        gte: targetDate,
        lte: endDate,
      },
    },
    orderBy: {
      forecastDate: 'asc',
    },
  })

  if (existingForecast) {
    // Utiliser le forecast existant et le projeter sur 7 jours
    return existingForecast.forecastedQuantity * 7
  }

  // Sinon, calculer la moyenne des ventes des 14 derniers jours et projeter sur 7 jours
  const startDate = new Date(targetDate)
  startDate.setDate(startDate.getDate() - 14)

  const sales = await prisma.sale.findMany({
    where: {
      restaurantId,
      productId,
      saleDate: {
        gte: startDate,
        lt: targetDate,
      },
    },
    select: {
      quantity: true,
    },
  })

  if (sales.length === 0) {
    return 0
  }

  const totalQuantity = sales.reduce((sum, sale) => sum + sale.quantity, 0)
  const averagePerDay = totalQuantity / 14
  
  // Projeter sur 7 jours
  return Math.ceil(averagePerDay * 7)
}

/**
 * Convertit les forecasts produits en besoins ingrédients via les recettes
 */
async function calculateIngredientNeeds(
  organizationId: string,
  restaurantId: string,
  forecasts: ForecastData[]
): Promise<Map<string, IngredientNeed>> {
  const ingredientNeeds = new Map<string, IngredientNeed>()

  // Pour chaque produit avec forecast
  for (const forecast of forecasts) {
    // Récupérer les recettes (BOM) pour ce produit
    const productIngredients = await prisma.productIngredient.findMany({
      where: {
        productId: forecast.productId,
      },
      include: {
        ingredient: true,
      },
    })

    // Pour chaque ingrédient dans la recette
    for (const productIngredient of productIngredients) {
      const ingredient = productIngredient.ingredient
      
      // Calculer la quantité nécessaire pour ce forecast
      const neededQuantity = forecast.forecastedQuantity * productIngredient.quantityNeeded

      // Ajouter ou additionner à la map
      const existing = ingredientNeeds.get(ingredient.id)
      if (existing) {
        ingredientNeeds.set(ingredient.id, {
          ...existing,
          neededQuantity: existing.neededQuantity + neededQuantity,
        })
      } else {
        ingredientNeeds.set(ingredient.id, {
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          unit: ingredient.unit,
          neededQuantity,
          packSize: ingredient.packSize,
          supplierName: ingredient.supplierName,
        })
      }
    }
  }

  return ingredientNeeds
}

/**
 * Génère des recommandations d'ingrédients basées sur les recettes (BOM)
 */
export async function generateBOMOrderRecommendations(
  restaurantId: string,
  shrinkPct: number = 0.1,
  days: number = 7
): Promise<{
  recommendations: OrderRecommendation[]
  details: RecommendationDetails
  estimatedSavings: number
}> {
  // Récupérer le restaurant et l'organisation
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      organization: {
        include: {
          products: true,
        },
      },
    },
  })

  if (!restaurant) {
    throw new Error('Restaurant not found')
  }

  const organization = restaurant.organization
  const targetDate = new Date()
  const endDate = new Date(targetDate)
  endDate.setDate(endDate.getDate() + days)

  // 1. Calculer les forecasts pour tous les produits sur 7 jours
  const forecasts: ForecastData[] = []
  
  for (const product of organization.products) {
    const forecastedQuantity = await calculateProductForecast(
      restaurantId,
      product.id,
      targetDate
    )
    
    if (forecastedQuantity > 0) {
      forecasts.push({
        productId: product.id,
        productName: product.name,
        forecastedQuantity,
      })
    }
  }

  if (forecasts.length === 0) {
    return {
      recommendations: [],
      details: {
        restaurantId,
        restaurantName: restaurant.name,
        period: {
          start: targetDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        },
        ingredients: [],
        assumptions: {
          shrinkPct,
          forecastDays: days,
        },
      },
      estimatedSavings: 0,
    }
  }

  // 2. Convertir les forecasts produits en besoins ingrédients
  const ingredientNeeds = await calculateIngredientNeeds(
    organization.id,
    restaurantId,
    forecasts
  )

  // 3. Récupérer les stocks actuels
  const inventory = await prisma.inventory.findMany({
    where: { restaurantId },
    include: {
      ingredient: true,
    },
  })

  // 4. Calculer les quantités à commander avec shrink et packs
  const recommendations: OrderRecommendation[] = []
  const detailsIngredients: RecommendationDetails['ingredients'] = []

  for (const [ingredientId, need] of Array.from(ingredientNeeds.entries())) {
    const inv = inventory.find((i) => i.ingredient.id === ingredientId)
    const currentStock = inv?.currentStock || 0

    // Appliquer le shrink
    const neededWithShrink = need.neededQuantity * (1 + shrinkPct)

    // Calculer la quantité à commander (besoin - stock actuel)
    let quantityToOrder = Math.max(0, neededWithShrink - currentStock)

    // Si un pack est défini, arrondir au pack supérieur
    let numberOfPacks: number | null = null
    if (need.packSize && need.packSize > 0) {
      numberOfPacks = Math.ceil(quantityToOrder / need.packSize)
      quantityToOrder = numberOfPacks * need.packSize
    }

    if (quantityToOrder > 0) {
      let ingredient = inv?.ingredient
      if (!ingredient) {
        const foundIngredient = await prisma.ingredient.findUnique({
          where: { id: ingredientId },
        })
        if (!foundIngredient) continue
        ingredient = foundIngredient
      }

      recommendations.push({
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        currentStock,
        recommendedQuantity: quantityToOrder,
        unit: ingredient.unit,
        estimatedCost: quantityToOrder * ingredient.costPerUnit,
        reason: `Basé sur les prévisions de ventes pour les ${days} prochains jours (shrink: ${(shrinkPct * 100).toFixed(1)}%)`,
      })

      detailsIngredients.push({
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        neededQuantity: need.neededQuantity,
        currentStock,
        quantityToOrder,
        packSize: need.packSize,
        numberOfPacks,
        supplierName: need.supplierName,
      })
    }
  }

  // 5. Calculer les économies estimées
  const estimatedSavings = calculateEstimatedSavings(
    recommendations,
    inventory,
    organization.shrinkPct
  )

  // 6. Construire les détails
  const details: RecommendationDetails = {
    restaurantId,
    restaurantName: restaurant.name,
    period: {
      start: targetDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    },
    ingredients: detailsIngredients,
    assumptions: {
      shrinkPct,
      forecastDays: days,
    },
    estimatedSavings, // Inclure les économies estimées dans les détails
  }

  return {
    recommendations,
    details,
    estimatedSavings,
  }
}

/**
 * Calcule les économies estimées (gaspillage évité + ruptures évitées)
 */
function calculateEstimatedSavings(
  recommendations: OrderRecommendation[],
  inventory: Array<{ currentStock: number; ingredient: { id: string; costPerUnit: number } }>,
  shrinkPct: number
): number {
  let savings = 0

  for (const rec of recommendations) {
    const inv = inventory.find((i) => i.ingredient.id === rec.ingredientId)
    const currentStock = inv?.currentStock || 0

    // Économie liée au gaspillage évité (surstock réduit)
    // Si le stock actuel est élevé, on évite le gaspillage en commandant moins
    if (currentStock > rec.recommendedQuantity * 2) {
      const overstockValue = (currentStock - rec.recommendedQuantity) * (inv?.ingredient.costPerUnit || 0)
      savings += overstockValue * 0.3 // 30% de la valeur du surstock évité
    }

    // Économie liée aux ruptures évitées
    // Basée sur une marge moyenne estimée de 60% sur les produits
    const costValue = rec.estimatedCost
    const marginValue = costValue * 0.6 // Marge estimée
    savings += marginValue * 0.2 // 20% de la marge comme économie de rupture évitée
  }

  // Plafonner à un montant raisonnable (10k€ max pour un restaurant)
  return Math.min(savings, 10000)
}
