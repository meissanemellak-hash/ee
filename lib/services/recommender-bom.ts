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
  /** Coût total estimé de la commande (somme des coûts ingrédients) */
  estimatedOrderCost?: number
  /** Gain estimé lié aux ruptures et au gaspillage évités (indicateur) */
  estimatedSavings?: number
  reason?: string
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

  // Sinon, calculer la moyenne des ventes des 14 derniers jours (incluant aujourd'hui) et projeter sur 7 jours
  const startDate = new Date(targetDate)
  startDate.setDate(startDate.getDate() - 14)
  startDate.setHours(0, 0, 0, 0) // Début de journée
  
  const endDateForSales = new Date(targetDate)
  endDateForSales.setHours(23, 59, 59, 999) // Fin de journée pour inclure les ventes d'aujourd'hui

  const sales = await prisma.sale.findMany({
    where: {
      restaurantId,
      productId,
      saleDate: {
        gte: startDate,
        lte: endDateForSales, // Inclure les ventes d'aujourd'hui
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
 * Une seule requête Prisma pour tous les produits (évite N+1)
 */
async function calculateIngredientNeeds(
  organizationId: string,
  restaurantId: string,
  forecasts: ForecastData[]
): Promise<Map<string, IngredientNeed>> {
  const ingredientNeeds = new Map<string, IngredientNeed>()
  const productIds = Array.from(new Set(forecasts.map((f) => f.productId)))

  if (productIds.length === 0) return ingredientNeeds

  // Une seule requête pour toutes les recettes (BOM) des produits concernés
  const allProductIngredients = await prisma.productIngredient.findMany({
    where: { productId: { in: productIds } },
    include: { ingredient: true },
  })

  const byProductId = new Map<string, typeof allProductIngredients>()
  for (const pi of allProductIngredients) {
    const list = byProductId.get(pi.productId) ?? []
    list.push(pi)
    byProductId.set(pi.productId, list)
  }

  for (const forecast of forecasts) {
    const productIngredients = byProductId.get(forecast.productId) ?? []
    for (const productIngredient of productIngredients) {
      const ingredient = productIngredient.ingredient
      const neededQuantity = forecast.forecastedQuantity * productIngredient.quantityNeeded
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
    // Fallback : recommandations basées sur les ruptures de stock (stock < seuil min), sans prévisions
    const inventory = await prisma.inventory.findMany({
      where: { restaurantId },
      include: { ingredient: true },
    })

    const recommendationsFromThresholds: OrderRecommendation[] = []
    const detailsIngredientsFromThresholds: RecommendationDetails['ingredients'] = []

    for (const inv of inventory) {
      const minThreshold = inv.minThreshold ?? 0
      if (minThreshold <= 0) continue
      const currentStock = inv.currentStock
      if (currentStock >= minThreshold) continue

      let quantityToOrder = minThreshold - currentStock
      let numberOfPacks: number | null = null
      const packSize = inv.ingredient.packSize ?? null
      if (packSize && packSize > 0) {
        numberOfPacks = Math.ceil(quantityToOrder / packSize)
        quantityToOrder = numberOfPacks * packSize
      }
      // Ne pas dépasser le seuil max (éviter surstock)
      const maxThreshold = inv.maxThreshold ?? null
      if (maxThreshold != null && currentStock + quantityToOrder > maxThreshold) {
        quantityToOrder = Math.max(0, maxThreshold - currentStock)
        numberOfPacks = packSize && packSize > 0 ? Math.ceil(quantityToOrder / packSize) : null
      }
      if (quantityToOrder <= 0) continue

      recommendationsFromThresholds.push({
        ingredientId: inv.ingredient.id,
        ingredientName: inv.ingredient.name,
        currentStock,
        recommendedQuantity: quantityToOrder,
        unit: inv.ingredient.unit,
        estimatedCost: quantityToOrder * (inv.ingredient.costPerUnit || 0),
        reason: `Rupture de stock : en dessous du seuil minimum (${minThreshold} ${inv.ingredient.unit}). Réapprovisionnement recommandé.`,
      })
      detailsIngredientsFromThresholds.push({
        ingredientId: inv.ingredient.id,
        ingredientName: inv.ingredient.name,
        neededQuantity: minThreshold,
        currentStock,
        quantityToOrder,
        packSize,
        numberOfPacks,
        supplierName: inv.ingredient.supplierName,
      })
    }

    if (recommendationsFromThresholds.length > 0) {
      const estimatedOrderCost = recommendationsFromThresholds.reduce((s, r) => s + (r.estimatedCost || 0), 0)
      return {
        recommendations: recommendationsFromThresholds,
        details: {
          restaurantId,
          restaurantName: restaurant.name,
          period: {
            start: targetDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
          },
          ingredients: detailsIngredientsFromThresholds,
          assumptions: { shrinkPct, forecastDays: days },
          estimatedOrderCost,
          estimatedSavings: estimatedOrderCost * 0.2,
          reason: 'Recommandations basées sur les seuils minimums (ruptures de stock). Aucune vente récente pour calculer des prévisions.',
        },
        estimatedSavings: estimatedOrderCost * 0.2,
      }
    }

    // Aucune prévision et aucune rupture : message explicatif
    const hasProducts = organization.products.length > 0
    const startDateCheck = new Date(targetDate)
    startDateCheck.setDate(startDateCheck.getDate() - 14)
    startDateCheck.setHours(0, 0, 0, 0)
    const endDateCheck = new Date(targetDate)
    endDateCheck.setHours(23, 59, 59, 999)
    const hasSales = await prisma.sale.count({
      where: {
        restaurantId,
        saleDate: { gte: startDateCheck, lte: endDateCheck },
      },
    }) > 0
    let productsWithRecipes = 0
    for (const product of organization.products) {
      const recipeCount = await prisma.productIngredient.count({ where: { productId: product.id } })
      if (recipeCount > 0) productsWithRecipes++
    }

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
        assumptions: { shrinkPct, forecastDays: days },
        reason: !hasProducts
          ? 'Aucun produit trouvé dans l\'organisation. Ajoutez des produits pour générer des recommandations.'
          : !hasSales
            ? 'Aucune vente sur les 14 derniers jours. Des recommandations de commande ont été générées uniquement si vous aviez des ruptures de stock (stock < seuil min).'
            : productsWithRecipes === 0
              ? 'Aucun produit n\'a de recette (ingrédients). Allez dans "Produits" → Modifier un produit → "Recette du produit".'
              : `Seulement ${productsWithRecipes} produit(s) sur ${organization.products.length} ont des recettes.`,
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
  let totalNeededQuantity = 0
  let totalCurrentStock = 0
  let ingredientsWithSufficientStock = 0

  for (const [ingredientId, need] of Array.from(ingredientNeeds.entries())) {
    const inv = inventory.find((i) => i.ingredient.id === ingredientId)
    const currentStock = inv?.currentStock || 0

    // Appliquer le shrink
    const neededWithShrink = need.neededQuantity * (1 + shrinkPct)
    totalNeededQuantity += neededWithShrink
    totalCurrentStock += currentStock

    // Calculer la quantité à commander (besoin - stock actuel)
    let quantityToOrder = Math.max(0, neededWithShrink - currentStock)

    // Aligner avec les alertes : si stock sous le seuil min, recommander au moins jusqu'au seuil
    const minThreshold = inv?.minThreshold ?? 0
    if (minThreshold > 0 && currentStock < minThreshold) {
      const toMin = minThreshold - currentStock
      quantityToOrder = Math.max(quantityToOrder, toMin)
    }

    // Si un pack est défini, arrondir au pack supérieur
    let numberOfPacks: number | null = null
    if (need.packSize && need.packSize > 0) {
      numberOfPacks = Math.ceil(quantityToOrder / need.packSize)
      quantityToOrder = numberOfPacks * need.packSize
    }

    // Ne pas recommander plus que le seuil max pour éviter le surstock
    const maxThreshold = inv?.maxThreshold ?? null
    if (maxThreshold != null && currentStock + quantityToOrder > maxThreshold) {
      quantityToOrder = Math.max(0, maxThreshold - currentStock)
      if (quantityToOrder <= 0) continue
      numberOfPacks = need.packSize && need.packSize > 0 ? Math.ceil(quantityToOrder / need.packSize) : null
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
    } else {
      // Compter les ingrédients avec stock suffisant
      ingredientsWithSufficientStock++
    }
  }

  // Ingrédients en rupture (sous seuil min) non couverts par les prévisions : les ajouter aux recommandations
  const recommendedIds = new Set(recommendations.map((r) => r.ingredientId))
  for (const inv of inventory) {
    const minThreshold = inv.minThreshold ?? 0
    if (minThreshold <= 0 || inv.currentStock >= minThreshold) continue
    if (recommendedIds.has(inv.ingredient.id)) continue

    let quantityToOrder = minThreshold - inv.currentStock
    let numberOfPacks: number | null = null
    const packSize = inv.ingredient.packSize ?? null
    if (packSize && packSize > 0) {
      numberOfPacks = Math.ceil(quantityToOrder / packSize)
      quantityToOrder = numberOfPacks * packSize
    }
    // Ne pas dépasser le seuil max (éviter surstock)
    const maxThreshold = inv.maxThreshold ?? null
    if (maxThreshold != null && inv.currentStock + quantityToOrder > maxThreshold) {
      quantityToOrder = Math.max(0, maxThreshold - inv.currentStock)
      numberOfPacks = packSize && packSize > 0 ? Math.ceil(quantityToOrder / packSize) : null
    }
    if (quantityToOrder <= 0) continue

    recommendedIds.add(inv.ingredient.id)
    recommendations.push({
      ingredientId: inv.ingredient.id,
      ingredientName: inv.ingredient.name,
      currentStock: inv.currentStock,
      recommendedQuantity: quantityToOrder,
      unit: inv.ingredient.unit,
      estimatedCost: quantityToOrder * (inv.ingredient.costPerUnit || 0),
      reason: `Rupture de stock : en dessous du seuil minimum (${minThreshold} ${inv.ingredient.unit}). Réapprovisionnement recommandé.`,
    })
    detailsIngredients.push({
      ingredientId: inv.ingredient.id,
      ingredientName: inv.ingredient.name,
      neededQuantity: minThreshold,
      currentStock: inv.currentStock,
      quantityToOrder,
      packSize,
      numberOfPacks,
      supplierName: inv.ingredient.supplierName,
    })
  }

  // Si aucune recommandation générée mais qu'on a des besoins calculés, c'est que les stocks sont suffisants
  if (recommendations.length === 0 && ingredientNeeds.size > 0) {
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
        reason: `Aucune commande nécessaire. Vos stocks actuels sont suffisants pour couvrir les besoins prévus pour les ${days} prochains jours. Besoin total: ${totalNeededQuantity.toFixed(2)}, Stock actuel: ${totalCurrentStock.toFixed(2)}.`,
      },
      estimatedSavings: 0,
    }
  }

  // 5. Calculer le coût estimé de la commande (somme des coûts ingrédients) et le gain estimé (indicateur)
  const estimatedOrderCost = recommendations.reduce((sum, r) => sum + (r.estimatedCost || 0), 0)
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
    estimatedOrderCost, // Coût total de la commande recommandée (€)
    estimatedSavings,   // Gain estimé : ruptures/gaspillage évités (indicateur)
  }

  return {
    recommendations,
    details,
    estimatedSavings,
  }
}

/**
 * Calcule le gain estimé (gaspillage évité + ruptures évitées) – indicateur, pas le coût de la commande
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
