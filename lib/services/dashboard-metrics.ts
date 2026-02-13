import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'

/**
 * Interface pour les métriques du dashboard exécutif
 */
export interface ExecutiveDashboardMetrics {
  // Hero Metric
  totalSavingsThisMonth: number
  savingsChangePercent: number | null // % vs mois précédent
  
  // KPIs
  acceptedRecommendationsCount: number
  acceptedRecommendationsSavings: number
  criticalAlertsCount: number
  criticalAlertsRisk: number // Impact financier estimé
  estimatedWaste: number // Gaspillage estimé ce mois
  
  // Top recommandations actionnables
  topActionableRecommendations: Array<{
    id: string
    type: string
    restaurantName: string
    message: string
    estimatedSavings: number
    priority: string
  }>
  
  // Alertes critiques
  criticalAlerts: Array<{
    id: string
    type: string
    severity: string
    message: string
    restaurantName: string
    estimatedImpact: number
  }>
}

/**
 * Calcule les métriques du dashboard exécutif.
 * Si restaurantId est fourni, toutes les métriques sont filtrées pour ce restaurant uniquement.
 */
export async function calculateExecutiveDashboardMetrics(
  organizationId: string,
  restaurantId?: string | null
): Promise<ExecutiveDashboardMetrics> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const restaurantWhere = restaurantId
    ? { organizationId, id: restaurantId }
    : { organizationId }

  // 1. Récupérer toutes les recommandations acceptées ce mois-ci (pour les économies du mois)
  const acceptedRecommendationsThisMonth = await prisma.recommendation.findMany({
    where: {
      restaurant: restaurantWhere,
      status: 'accepted',
      updatedAt: {
        gte: startOfMonth,
      },
    },
    include: {
      restaurant: true,
    },
  })

  // Nombre total de recommandations acceptées (toutes périodes), pour alignement avec la page Recommandations et les rapports
  const totalAcceptedCount = await prisma.recommendation.count({
    where: {
      restaurant: restaurantWhere,
      status: 'accepted',
    },
  })

  // 2. Calculer les économies totales ce mois-ci
  let totalSavingsThisMonth = 0
  const acceptedRecommendationsSavings = acceptedRecommendationsThisMonth.reduce((sum, rec) => {
    // Pour les recommandations BOM, les économies sont dans data.estimatedSavings
    // Pour les autres, on peut estimer depuis data
    const data = rec.data as any
    
    logger.log('[dashboard-metrics] Recommendation ID:', rec.id, 'data.estimatedSavings:', data?.estimatedSavings, 'data keys:', Object.keys(data || {}))
    
    if (data?.estimatedSavings) {
      // Recommandation BOM avec estimatedSavings
      const savings = data.estimatedSavings || 0
      logger.log('[dashboard-metrics] Utilisation estimatedSavings:', savings)
      return sum + savings
    } else if (data?.ingredients && Array.isArray(data.ingredients)) {
      // Recommandation BOM sans estimatedSavings - calculer depuis les ingrédients
      // Estimation basée sur les quantités à commander et coûts estimés
      const estimatedSavings = data.ingredients.reduce((acc: number, ing: any) => {
        // Estimation : 20% de la marge sur le coût estimé
        // Coût estimé = quantité à commander × coût unitaire (si disponible)
        const quantityToOrder = ing.quantityToOrder || 0
        // Estimation conservatrice : 10€ par ingrédient commandé
        return acc + (quantityToOrder > 0 ? 100 : 0)
      }, 0)
      logger.log('[dashboard-metrics] Calcul estimatedSavings depuis ingredients:', estimatedSavings)
      return sum + estimatedSavings
    } else if (Array.isArray(data)) {
      // Array d'OrderRecommendation, estimer depuis estimatedCost
      const estimatedSavings = data.reduce((acc: number, item: any) => {
        // Estimation : 20% de la marge sur le coût estimé
        return acc + (item.estimatedCost || 0) * 0.2
      }, 0)
      return sum + estimatedSavings
    } else if (data?.recommendations && Array.isArray(data.recommendations)) {
      // Structure avec recommendations array
      const estimatedSavings = data.recommendations.reduce((acc: number, item: any) => {
        return acc + (item.estimatedCost || 0) * 0.2
      }, 0)
      return sum + estimatedSavings
    }
    
    // Par défaut, estimation basée sur le type
    return sum + 500 // Estimation conservatrice
  }, 0)

  totalSavingsThisMonth = acceptedRecommendationsSavings

  // 3. Calculer les économies du mois précédent pour la comparaison
  const acceptedRecommendationsLastMonth = await prisma.recommendation.findMany({
    where: {
      restaurant: {
        organizationId,
      },
      status: 'accepted',
      updatedAt: {
        gte: startOfLastMonth,
        lte: endOfLastMonth,
      },
    },
  })

  const savingsLastMonth = acceptedRecommendationsLastMonth.reduce((sum, rec) => {
    const data = rec.data as any
    if (data?.estimatedSavings) {
      return sum + (data.estimatedSavings || 0)
    } else if (Array.isArray(data)) {
      return sum + data.reduce((acc: number, item: any) => acc + (item.estimatedCost || 0) * 0.2, 0)
    }
    return sum + 500
  }, 0)

  const savingsChangePercent = savingsLastMonth > 0
    ? ((totalSavingsThisMonth - savingsLastMonth) / savingsLastMonth) * 100
    : null

  // 4. Récupérer les alertes critiques
  const criticalAlerts = await prisma.alert.findMany({
    where: {
      restaurant: restaurantWhere,
      resolved: false,
      severity: {
        in: ['high', 'critical'],
      },
    },
    include: {
      restaurant: true,
    },
    orderBy: [
      { severity: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 3,
  })

  // Inventaire des restaurants des alertes critiques (pour calcul d'impact basé sur les données)
  const alertRestaurantIds = [...new Set(criticalAlerts.map((a) => a.restaurantId))]
  const inventoryForAlerts =
    alertRestaurantIds.length > 0
      ? await prisma.inventory.findMany({
          where: { restaurantId: { in: alertRestaurantIds } },
          include: { ingredient: true },
        })
      : []
  const inventoryByRestaurant = new Map<string, typeof inventoryForAlerts>()
  for (const inv of inventoryForAlerts) {
    const list = inventoryByRestaurant.get(inv.restaurantId) ?? []
    list.push(inv)
    inventoryByRestaurant.set(inv.restaurantId, list)
  }

  const quantityToCostUnit = (qty: number, unit: string | null | undefined): number => {
    const u = (unit ?? '').toLowerCase().trim()
    if (u === 'g' || u === 'gramme' || u === 'grammes') return qty / 1000
    if (u === 'ml' || u === 'millilitre' || u === 'millilitres') return qty / 1000
    return qty
  }

  const computeAlertImpact = (
    alert: (typeof criticalAlerts)[0],
    invList: Array<{ currentStock: number; minThreshold: number; maxThreshold: number | null; ingredient: { name: string; unit: string | null; costPerUnit: number } }>
  ): number => {
    if (alert.type === 'SHORTAGE') {
      const nameMatch = alert.message.match(/pour\s+([^:(]+?)(?=\s*(?:\(|:|\d|demain|aujourd'hui|dans\s+\d|le\s+\d)|$)/i)
      const ingredientName = nameMatch?.[1]?.trim()?.toLowerCase()
      const inv = ingredientName
        ? invList.find((i) => i.ingredient.name.toLowerCase().trim() === ingredientName)
        : null
      if (inv) {
        let shortfall: number
        const besoinMatch = alert.message.match(/besoin\s+estimé:\s*([\d.,]+)/i)
        const stockMatch = alert.message.match(/Stock\s+actuel:\s*([\d.,]+)/i)
        if (besoinMatch && stockMatch) {
          const besoin = parseFloat(besoinMatch[1].replace(',', '.'))
          const stock = parseFloat(stockMatch[1].replace(',', '.'))
          shortfall = Math.max(0, besoin - stock)
        } else {
          shortfall = Math.max(0, inv.minThreshold - inv.currentStock)
        }
        const costPerUnit = inv.ingredient?.costPerUnit ?? 0
        const impact = quantityToCostUnit(shortfall, inv.ingredient?.unit) * costPerUnit * 1.3 // marge perdue
        return Math.round(Math.min(Math.max(impact, 50), 10000))
      }
      return 2000
    }
    if (alert.type === 'OVERSTOCK') {
      const nameMatch = alert.message.match(/pour\s+([^:(]+?)(?=\s*[:(\d])/i)
      const ingredientName = nameMatch?.[1]?.trim()?.toLowerCase()
      const inv = ingredientName
        ? invList.find((i) => i.ingredient.name.toLowerCase().trim() === ingredientName)
        : null
      if (inv && inv.maxThreshold != null && inv.currentStock > inv.maxThreshold) {
        const surplus = inv.currentStock - inv.maxThreshold
        const costPerUnit = inv.ingredient?.costPerUnit ?? 0
        const impact = quantityToCostUnit(surplus, inv.ingredient?.unit) * costPerUnit
        return Math.round(Math.min(Math.max(impact, 50), 8000))
      }
      return 1500
    }
    if (alert.type === 'OVERSTAFFING') return 1000
    return 500
  }

  // 5. Calculer l'impact financier des alertes critiques (données réelles si possible, sinon forfait)
  const criticalAlertsRisk = criticalAlerts.reduce((sum, alert) => {
    const invList = inventoryByRestaurant.get(alert.restaurantId) ?? []
    return sum + computeAlertImpact(alert, invList)
  }, 0)

  // 6. Récupérer les top recommandations actionnables (pending, triées par priorité)
  const topActionableRecommendations = await prisma.recommendation.findMany({
    where: {
      restaurant: {
        organizationId,
      },
      status: 'pending',
    },
    include: {
      restaurant: true,
    },
    orderBy: [
      { priority: 'desc' }, // high > medium > low
      { createdAt: 'desc' },
    ],
    take: 3,
  })

  // 7. Gaspillage estimé (option 3 hybride : calcul réel si possible, sinon forfait par alerte)
  const overstockAlerts = await prisma.alert.findMany({
    where: {
      restaurant: restaurantWhere,
      type: 'OVERSTOCK',
      resolved: false,
      createdAt: {
        gte: startOfMonth,
      },
    },
  })

  const FALLBACK_WASTE_PER_ALERT = 800

  let estimatedWaste: number
  try {
    const overstockInventory = await prisma.inventory.findMany({
      where: {
        restaurant: restaurantWhere,
        maxThreshold: { not: null },
      },
      include: { ingredient: true },
    })
    const itemsInOverstock = overstockInventory.filter(
      (inv) => inv.maxThreshold != null && inv.currentStock > inv.maxThreshold
    )
    // Normalise le surplus dans l'unité du coût (ex. g → kg) pour que surplus * costPerUnit donne des € cohérents
    const surplusToCostUnit = (surplus: number, unit: string | null | undefined): number => {
      const u = (unit ?? '').toLowerCase().trim()
      if (u === 'g' || u === 'gramme' || u === 'grammes') return surplus / 1000 // surplus en g → quantité en kg
      if (u === 'ml' || u === 'millilitre' || u === 'millilitres') return surplus / 1000 // surplus en ml → quantité en L
      return surplus // kg, L, unité, pièce, etc. : pas de conversion
    }
    const computedWaste = itemsInOverstock.reduce((sum, inv) => {
      const surplus = inv.currentStock - (inv.maxThreshold ?? 0)
      const costPerUnit = inv.ingredient?.costPerUnit ?? 0
      const quantityInCostUnit = surplusToCostUnit(surplus, inv.ingredient?.unit)
      return sum + quantityInCostUnit * costPerUnit
    }, 0)
    estimatedWaste = computedWaste > 0 ? Math.round(computedWaste * 100) / 100 : overstockAlerts.length * FALLBACK_WASTE_PER_ALERT
  } catch {
    estimatedWaste = overstockAlerts.length * FALLBACK_WASTE_PER_ALERT
  }

  // Formater les recommandations actionnables
  const formattedRecommendations = topActionableRecommendations.map((rec) => {
    const data = rec.data as any
    let estimatedSavings = 0
    let message = ''

    if (data?.estimatedSavings) {
      estimatedSavings = data.estimatedSavings
    } else if (Array.isArray(data)) {
      estimatedSavings = data.reduce((acc: number, item: any) => acc + (item.estimatedCost || 0) * 0.2, 0)
    } else {
      estimatedSavings = 500
    }

    // Générer un message basé sur le type
    if (rec.type === 'ORDER') {
      if (data?.ingredients && Array.isArray(data.ingredients)) {
        const ingredientCount = data.ingredients.length
        message = `Commander ${ingredientCount} ingrédient${ingredientCount > 1 ? 's' : ''} → évite ~${Math.round(estimatedSavings)}€ de ventes perdues`
      } else {
        message = `Commande recommandée → évite ~${Math.round(estimatedSavings)}€ de ruptures de stock`
      }
    } else if (rec.type === 'STAFFING') {
      message = `Ajustement staffing → effectif recommandé par créneau`
    } else {
      message = `Recommandation → économie estimée ~${Math.round(estimatedSavings)}€`
    }

    return {
      id: rec.id,
      type: rec.type,
      restaurantName: rec.restaurant.name,
      message,
      estimatedSavings,
      priority: rec.priority,
    }
  })

  // Formater les alertes critiques (impact calculé depuis inventaire/coûts ou forfait)
  const formattedAlerts = criticalAlerts.map((alert) => {
    const invList = inventoryByRestaurant.get(alert.restaurantId) ?? []
    const estimatedImpact = computeAlertImpact(alert, invList)
    return {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      restaurantName: alert.restaurant.name,
      estimatedImpact,
    }
  })

  return {
    totalSavingsThisMonth,
    savingsChangePercent,
    acceptedRecommendationsCount: totalAcceptedCount,
    acceptedRecommendationsSavings: totalSavingsThisMonth,
    criticalAlertsCount: criticalAlerts.length,
    criticalAlertsRisk,
    estimatedWaste,
    topActionableRecommendations: formattedRecommendations,
    criticalAlerts: formattedAlerts,
  }
}
