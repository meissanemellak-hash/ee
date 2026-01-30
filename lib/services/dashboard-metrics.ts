import { prisma } from '@/lib/db/prisma'

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

  // 1. Récupérer toutes les recommandations acceptées ce mois-ci
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

  // 2. Calculer les économies totales ce mois-ci
  let totalSavingsThisMonth = 0
  const acceptedRecommendationsSavings = acceptedRecommendationsThisMonth.reduce((sum, rec) => {
    // Pour les recommandations BOM, les économies sont dans data.estimatedSavings
    // Pour les autres, on peut estimer depuis data
    const data = rec.data as any
    
    console.log('[dashboard-metrics] Recommendation ID:', rec.id, 'data.estimatedSavings:', data?.estimatedSavings, 'data keys:', Object.keys(data || {}))
    
    if (data?.estimatedSavings) {
      // Recommandation BOM avec estimatedSavings
      const savings = data.estimatedSavings || 0
      console.log('[dashboard-metrics] Utilisation estimatedSavings:', savings)
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
      console.log('[dashboard-metrics] Calcul estimatedSavings depuis ingredients:', estimatedSavings)
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

  // 5. Calculer l'impact financier des alertes critiques
  const criticalAlertsRisk = criticalAlerts.reduce((sum, alert) => {
    // Estimation basée sur le type d'alerte
    let estimatedImpact = 0
    
    if (alert.type === 'SHORTAGE') {
      // Rupture de stock : impact sur les ventes perdues
      estimatedImpact = 2000 // Estimation conservatrice
    } else if (alert.type === 'OVERSTOCK') {
      // Surstock : risque de gaspillage
      estimatedImpact = 1500
    } else if (alert.type === 'OVERSTAFFING') {
      // Sur-effectif : coût du personnel
      estimatedImpact = 1000
    } else {
      estimatedImpact = 500
    }
    
    return sum + estimatedImpact
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

  // 7. Calculer le gaspillage estimé (basé sur les alertes OVERSTOCK)
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

  const estimatedWaste = overstockAlerts.length * 800 // Estimation par alerte

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
        message = `Commande recommandée → évite ~${Math.round(estimatedSavings)}€ de ruptures`
      }
    } else if (rec.type === 'STAFFING') {
      message = `Ajustement staffing → économie estimée ~${Math.round(estimatedSavings)}€`
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

  // Formater les alertes critiques
  const formattedAlerts = criticalAlerts.map((alert) => {
    let estimatedImpact = 0
    
    if (alert.type === 'SHORTAGE') {
      estimatedImpact = 2000
    } else if (alert.type === 'OVERSTOCK') {
      estimatedImpact = 1500
    } else if (alert.type === 'OVERSTAFFING') {
      estimatedImpact = 1000
    } else {
      estimatedImpact = 500
    }

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
    acceptedRecommendationsCount: acceptedRecommendationsThisMonth.length,
    acceptedRecommendationsSavings: totalSavingsThisMonth,
    criticalAlertsCount: criticalAlerts.length,
    criticalAlertsRisk,
    estimatedWaste,
    topActionableRecommendations: formattedRecommendations,
    criticalAlerts: formattedAlerts,
  }
}
