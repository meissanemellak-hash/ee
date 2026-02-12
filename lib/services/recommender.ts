import { prisma } from '../db/prisma'
import { generateForecast } from './forecast'
import type { OrderRecommendation, StaffingRecommendation } from '@/types'

/**
 * Génère des recommandations de commande d'ingrédients
 * basées sur les prévisions de ventes et le stock actuel
 */
export async function generateOrderRecommendations(
  restaurantId: string,
  forecastDate: Date = new Date()
): Promise<OrderRecommendation[]> {
  // Récupérer les prévisions pour les prochains jours
  const daysAhead = 7
  const recommendations: OrderRecommendation[] = []

  // Récupérer tous les produits du restaurant
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      organization: {
        include: {
          products: {
            include: {
              productIngredients: {
                include: {
                  ingredient: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!restaurant) {
    return []
  }

  // Pour chaque produit, calculer les besoins en ingrédients
  const ingredientNeeds = new Map<string, number>()

  for (const product of restaurant.organization.products) {
    // Générer la prévision pour ce produit
    const forecast = await generateForecast({
      restaurantId,
      productId: product.id,
      forecastDate,
    })

    // Calculer les besoins en ingrédients
    for (const productIngredient of product.productIngredients) {
      const ingredientId = productIngredient.ingredientId
      const neededQuantity =
        forecast.forecastedQuantity * productIngredient.quantityNeeded

      const current = ingredientNeeds.get(ingredientId) || 0
      ingredientNeeds.set(ingredientId, current + neededQuantity)
    }
  }

  // Récupérer le stock actuel
  const inventory = await prisma.inventory.findMany({
    where: { restaurantId },
    include: {
      ingredient: true,
    },
  })

  // Générer les recommandations
  for (const [ingredientId, neededQuantity] of Array.from(ingredientNeeds.entries())) {
    const inv = inventory.find(i => i.ingredientId === ingredientId)
    const ingredient = inv?.ingredient

    if (!ingredient) continue

    const currentStock = inv.currentStock
    const minThreshold = inv.minThreshold
    const safetyMargin = 1.2 // 20% de marge de sécurité

    // Calculer la quantité recommandée
    const recommendedQuantity = Math.max(
      0,
      Math.ceil(neededQuantity * safetyMargin - currentStock)
    )

    // Générer une recommandation si nécessaire
    if (recommendedQuantity > 0 || currentStock < minThreshold) {
      const finalQuantity = Math.max(
        recommendedQuantity,
        minThreshold - currentStock
      )

      recommendations.push({
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        currentStock,
        recommendedQuantity: finalQuantity,
        unit: ingredient.unit,
        estimatedCost: finalQuantity * ingredient.costPerUnit,
        reason:
          currentStock < minThreshold
            ? 'Stock en dessous du seuil minimum'
            : `Basé sur les prévisions de ventes pour les ${daysAhead} prochains jours`,
      })
    }
  }

  // Sauvegarder les recommandations
  if (recommendations.length > 0) {
    await prisma.recommendation.create({
      data: {
        restaurantId,
        type: 'ORDER',
        data: recommendations as any,
        priority: recommendations.some(r => r.currentStock < 0) ? 'high' : 'medium',
      },
    })
  }

  return recommendations
}

const TIME_SLOTS = [
  { start: 8, end: 12, label: '08:00-12:00' },
  { start: 12, end: 14, label: '12:00-14:00' },
  { start: 14, end: 18, label: '14:00-18:00' },
  { start: 18, end: 22, label: '18:00-22:00' },
] as const

/**
 * Calcule l'effectif recommandé par créneau (sans sauvegarder).
 * Utilisé pour les alertes Sur/Sous-effectif et pour la génération des recommandations.
 */
export async function computeStaffingRecommendations(
  restaurantId: string,
  targetDate: Date = new Date()
): Promise<StaffingRecommendation[]> {
  const recommendations: StaffingRecommendation[] = []

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  const sales = await prisma.sale.findMany({
    where: {
      restaurantId,
      saleDate: { gte: startDate, lte: endDate },
    },
    select: { quantity: true, saleHour: true, amount: true },
  })

  for (const slot of TIME_SLOTS) {
    const slotSales = sales.filter(
      (s) => s.saleHour >= slot.start && s.saleHour < slot.end
    )
    if (slotSales.length === 0) continue

    const avgSales = slotSales.reduce((sum, s) => sum + s.quantity, 0) / slotSales.length
    const hoursInSlot = slot.end - slot.start
    const recommendedStaff = Math.ceil((avgSales / hoursInSlot) / 15)
    const finalRecommendedStaff = Math.max(2, recommendedStaff)

    recommendations.push({
      date: targetDate.toISOString().split('T')[0],
      timeSlot: slot.label,
      recommendedStaff: finalRecommendedStaff,
      reason: `Basé sur une moyenne de ${Math.round(avgSales)} ventes pour cette tranche horaire`,
      expectedSales: Math.round(avgSales),
    })
  }

  return recommendations
}

/**
 * Génère et sauvegarde des recommandations de staffing
 * basées sur les prévisions de ventes par tranche horaire
 */
export async function generateStaffingRecommendations(
  restaurantId: string,
  targetDate: Date = new Date()
): Promise<StaffingRecommendation[]> {
  const recommendations = await computeStaffingRecommendations(restaurantId, targetDate)

  if (recommendations.length > 0) {
    await prisma.recommendation.create({
      data: {
        restaurantId,
        type: 'STAFFING',
        data: recommendations as any,
        priority: 'medium',
      },
    })
  }

  return recommendations
}
