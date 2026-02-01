import { prisma } from '../db/prisma'

export type ReportType = 'SALES' | 'PERFORMANCE' | 'INVENTORY' | 'RECOMMENDATIONS' | 'ALERTS' | 'SUMMARY'

/**
 * Parse une date string (format YYYY-MM-DD) en Date object en utilisant le fuseau horaire local
 * Évite les problèmes de décalage d'un jour dus aux conversions UTC
 */
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

/**
 * Formate une Date en string YYYY-MM-DD en utilisant le fuseau horaire local
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export interface ReportFilters {
  restaurantId?: string
  startDate?: string
  endDate?: string
  includeResolved?: boolean
}

export interface SalesReport {
  type: 'SALES'
  period: {
    start: string
    end: string
  }
  summary: {
    totalSales: number
    totalRevenue: number
    averagePerDay: number
    topProducts: Array<{
      productId: string
      productName: string
      quantity: number
      revenue: number
      percentage: number
    }>
  }
  dailyBreakdown: Array<{
    date: string
    sales: number
    revenue: number
  }>
  hourlyBreakdown: Array<{
    hour: number
    sales: number
    revenue: number
  }>
}

export interface PerformanceReport {
  type: 'PERFORMANCE'
  period: {
    start: string
    end: string
  }
  summary: {
    totalRestaurants: number
    totalProducts: number
    totalSales: number
    totalRevenue: number
    averageRevenuePerRestaurant: number
  }
  restaurants: Array<{
    restaurantId: string
    restaurantName: string
    sales: number
    revenue: number
    topProduct: {
      productId: string
      productName: string
      quantity: number
    }
  }>
}

export interface InventoryReport {
  type: 'INVENTORY'
  generatedAt: string
  restaurants: Array<{
    restaurantId: string
    restaurantName: string
    ingredients: Array<{
      ingredientId: string
      ingredientName: string
      currentStock: number
      minThreshold: number
      maxThreshold: number | null
      status: 'OK' | 'LOW' | 'CRITICAL' | 'OVERSTOCK'
      unit: string
      notConfigured?: boolean // Indique si l'inventaire n'est pas configuré pour cet ingrédient
    }>
  }>
}

export interface RecommendationsReport {
  type: 'RECOMMENDATIONS'
  period: {
    start: string
    end: string
  }
  summary: {
    totalRecommendations: number
    accepted: number
    pending: number
    dismissed: number
    totalEstimatedSavings: number
  }
  recommendations: Array<{
    id: string
    type: string
    restaurantName: string
    priority: string
    status: string
    estimatedSavings: number
    createdAt: string
  }>
}

export interface AlertsReport {
  type: 'ALERTS'
  period: {
    start: string
    end: string
  }
  summary: {
    totalAlerts: number
    critical: number
    high: number
    medium: number
    low: number
    resolved: number
  }
  alerts: Array<{
    id: string
    type: string
    severity: string
    message: string
    restaurantName: string
    resolved: boolean
    createdAt: string
    resolvedAt: string | null
  }>
}

export interface SummaryReport {
  type: 'SUMMARY'
  period: {
    start: string
    end: string
  }
  sales: {
    totalSales: number
    totalRevenue: number
    averagePerDay: number
  }
  recommendations: {
    total: number
    accepted: number
    estimatedSavings: number
  }
  alerts: {
    total: number
    critical: number
    resolved: number
  }
  topProducts: Array<{
    productId: string
    productName: string
    quantity: number
    revenue: number
  }>
}

export type Report = SalesReport | PerformanceReport | InventoryReport | RecommendationsReport | AlertsReport | SummaryReport

/**
 * Génère un rapport de ventes
 */
export async function generateSalesReport(
  organizationId: string,
  filters: ReportFilters
): Promise<SalesReport> {
  const startDate = filters.startDate ? new Date(filters.startDate) : (() => {
    const date = new Date()
    date.setDate(date.getDate() - 30) // Par défaut, 30 derniers jours
    return date
  })()
  startDate.setHours(0, 0, 0, 0) // Début de journée
  
  const endDate = filters.endDate ? new Date(filters.endDate) : new Date()
  endDate.setHours(23, 59, 59, 999) // Fin de journée

  const where: any = {
    restaurant: {
      organizationId,
    },
    saleDate: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (filters.restaurantId) {
    where.restaurantId = filters.restaurantId
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      product: true,
      restaurant: true,
    },
  })

  const totalSales = sales.reduce((sum, sale) => sum + sale.quantity, 0)
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0)
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const averagePerDay = daysDiff > 0 ? totalSales / daysDiff : 0

  // Top produits
  const productStats = new Map<string, { name: string; quantity: number; revenue: number }>()
  for (const sale of sales) {
    const existing = productStats.get(sale.productId) || { name: sale.product.name, quantity: 0, revenue: 0 }
    productStats.set(sale.productId, {
      name: sale.product.name,
      quantity: existing.quantity + sale.quantity,
      revenue: existing.revenue + sale.amount,
    })
  }

  const topProducts = Array.from(productStats.entries())
    .map(([productId, stats]) => ({
      productId,
      productName: stats.name,
      quantity: stats.quantity,
      revenue: stats.revenue,
      percentage: totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // Breakdown quotidien
  const dailyBreakdown = new Map<string, { sales: number; revenue: number }>()
  for (const sale of sales) {
    const dateKey = sale.saleDate.toISOString().split('T')[0]
    const existing = dailyBreakdown.get(dateKey) || { sales: 0, revenue: 0 }
    dailyBreakdown.set(dateKey, {
      sales: existing.sales + sale.quantity,
      revenue: existing.revenue + sale.amount,
    })
  }

  // Breakdown horaire
  const hourlyBreakdown = new Map<number, { sales: number; revenue: number }>()
  for (const sale of sales) {
    const hour = sale.saleHour
    const existing = hourlyBreakdown.get(hour) || { sales: 0, revenue: 0 }
    hourlyBreakdown.set(hour, {
      sales: existing.sales + sale.quantity,
      revenue: existing.revenue + sale.amount,
    })
  }

  return {
    type: 'SALES',
    period: {
      start: formatLocalDate(startDate),
      end: formatLocalDate(endDate),
    },
    summary: {
      totalSales,
      totalRevenue,
      averagePerDay: Math.round(averagePerDay * 100) / 100,
      topProducts,
    },
    dailyBreakdown: Array.from(dailyBreakdown.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    hourlyBreakdown: Array.from(hourlyBreakdown.entries())
      .map(([hour, stats]) => ({ hour, ...stats }))
      .sort((a, b) => a.hour - b.hour),
  }
}

/**
 * Génère un rapport de performance
 */
export async function generatePerformanceReport(
  organizationId: string,
  filters: ReportFilters
): Promise<PerformanceReport> {
  const startDate = filters.startDate ? parseLocalDate(filters.startDate) : (() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    date.setHours(0, 0, 0, 0)
    return date
  })()
  
  const endDate = filters.endDate ? parseLocalDate(filters.endDate) : new Date()
  endDate.setHours(23, 59, 59, 999) // Fin de journée

  const restaurants = await prisma.restaurant.findMany({
    where: {
      organizationId,
      ...(filters.restaurantId && { id: filters.restaurantId }),
    },
    include: {
      _count: {
        select: {
          sales: {
            where: {
              saleDate: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      },
    },
  })

  const products = await prisma.product.findMany({
    where: { organizationId },
  })

  const restaurantStats = await Promise.all(
    restaurants.map(async (restaurant) => {
      const sales = await prisma.sale.findMany({
        where: {
          restaurantId: restaurant.id,
          saleDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          product: true,
        },
      })

      const revenue = sales.reduce((sum, sale) => sum + sale.amount, 0)
      const salesCount = sales.reduce((sum, sale) => sum + sale.quantity, 0)

      // Top produit
      const productStats = new Map<string, { name: string; quantity: number }>()
      for (const sale of sales) {
        const existing = productStats.get(sale.productId) || { name: sale.product.name, quantity: 0 }
        productStats.set(sale.productId, {
          name: sale.product.name,
          quantity: existing.quantity + sale.quantity,
        })
      }

      const topProduct = Array.from(productStats.entries())
        .sort((a, b) => b[1].quantity - a[1].quantity)[0]

      return {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        sales: salesCount,
        revenue,
        topProduct: topProduct
          ? {
              productId: topProduct[0],
              productName: topProduct[1].name,
              quantity: topProduct[1].quantity,
            }
          : null,
      }
    })
  )

  const totalSales = restaurantStats.reduce((sum, r) => sum + r.sales, 0)
  const totalRevenue = restaurantStats.reduce((sum, r) => sum + r.revenue, 0)
  const averageRevenuePerRestaurant = restaurants.length > 0 ? totalRevenue / restaurants.length : 0

  return {
    type: 'PERFORMANCE',
    period: {
      start: formatLocalDate(startDate),
      end: formatLocalDate(endDate),
    },
    summary: {
      totalRestaurants: restaurants.length,
      totalProducts: products.length,
      totalSales,
      totalRevenue,
      averageRevenuePerRestaurant: Math.round(averageRevenuePerRestaurant * 100) / 100,
    },
    restaurants: restaurantStats.filter((r): r is typeof r & { topProduct: NonNullable<typeof r.topProduct> } => r.topProduct !== null),
  }
}

/**
 * Génère un rapport d'inventaire
 */
export async function generateInventoryReport(
  organizationId: string,
  filters: ReportFilters
): Promise<InventoryReport> {
  const restaurants = await prisma.restaurant.findMany({
    where: {
      organizationId,
      ...(filters.restaurantId && { id: filters.restaurantId }),
    },
  })

  // Récupérer tous les ingrédients de l'organisation pour avoir une vue complète
  const allIngredients = await prisma.ingredient.findMany({
    where: { organizationId },
  })

  const restaurantInventories = await Promise.all(
    restaurants.map(async (restaurant) => {
      const inventory = await prisma.inventory.findMany({
        where: { restaurantId: restaurant.id },
        include: {
          ingredient: true,
        },
      })

      // Créer un Map pour accéder rapidement aux inventaires existants
      const inventoryMap = new Map(
        inventory.map((inv) => [inv.ingredientId, inv])
      )

      // Pour chaque ingrédient de l'organisation, créer une entrée dans le rapport
      const ingredients = allIngredients.map((ingredient) => {
        const inv = inventoryMap.get(ingredient.id)

        if (!inv) {
          // Ingrédient sans inventaire configuré
          return {
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            currentStock: 0,
            minThreshold: 0,
            maxThreshold: null,
            status: 'OK' as const,
            unit: ingredient.unit,
            notConfigured: true, // Flag pour indiquer que l'inventaire n'est pas configuré
          }
        }

        // Ingrédient avec inventaire configuré
        let status: 'OK' | 'LOW' | 'CRITICAL' | 'OVERSTOCK' = 'OK'
        
        if (inv.currentStock < inv.minThreshold) {
          const percentage = (inv.currentStock / inv.minThreshold) * 100
          status = percentage < 20 ? 'CRITICAL' : 'LOW'
        } else if (inv.maxThreshold && inv.currentStock > inv.maxThreshold) {
          status = 'OVERSTOCK'
        }

        return {
          ingredientId: inv.ingredientId,
          ingredientName: inv.ingredient.name,
          currentStock: inv.currentStock,
          minThreshold: inv.minThreshold,
          maxThreshold: inv.maxThreshold,
          status,
          unit: inv.ingredient.unit,
          notConfigured: false,
        }
      })

      return {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        ingredients,
      }
    })
  )

  return {
    type: 'INVENTORY',
    generatedAt: new Date().toISOString(),
    restaurants: restaurantInventories,
  }
}

/**
 * Génère un rapport de recommandations
 */
export async function generateRecommendationsReport(
  organizationId: string,
  filters: ReportFilters
): Promise<RecommendationsReport> {
  const startDate = filters.startDate ? parseLocalDate(filters.startDate) : (() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    date.setHours(0, 0, 0, 0)
    return date
  })()
  
  const endDate = filters.endDate ? parseLocalDate(filters.endDate) : new Date()
  endDate.setHours(23, 59, 59, 999) // Fin de journée

  const where: any = {
    restaurant: {
      organizationId,
    },
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (filters.restaurantId) {
    where.restaurantId = filters.restaurantId
  }

  const recommendations = await prisma.recommendation.findMany({
    where,
    include: {
      restaurant: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const accepted = recommendations.filter((r) => r.status === 'accepted').length
  const pending = recommendations.filter((r) => r.status === 'pending').length
  const dismissed = recommendations.filter((r) => r.status === 'dismissed').length

  let totalEstimatedSavings = 0
  for (const rec of recommendations.filter((r) => r.status === 'accepted')) {
    const data = rec.data as any
    if (data?.estimatedSavings) {
      totalEstimatedSavings += data.estimatedSavings
    }
  }

  return {
    type: 'RECOMMENDATIONS',
    period: {
      start: formatLocalDate(startDate),
      end: formatLocalDate(endDate),
    },
    summary: {
      totalRecommendations: recommendations.length,
      accepted,
      pending,
      dismissed,
      totalEstimatedSavings,
    },
    recommendations: recommendations.map((rec) => {
      const data = rec.data as any
      return {
        id: rec.id,
        type: rec.type,
        restaurantName: rec.restaurant.name,
        priority: rec.priority,
        status: rec.status,
        estimatedSavings: data?.estimatedSavings || 0,
        createdAt: rec.createdAt.toISOString(),
      }
    }),
  }
}

/**
 * Génère un rapport d'alertes
 */
export async function generateAlertsReport(
  organizationId: string,
  filters: ReportFilters
): Promise<AlertsReport> {
  const startDate = filters.startDate ? parseLocalDate(filters.startDate) : (() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    date.setHours(0, 0, 0, 0)
    return date
  })()
  
  const endDate = filters.endDate ? parseLocalDate(filters.endDate) : new Date()
  endDate.setHours(23, 59, 59, 999) // Fin de journée

  const where: any = {
    restaurant: {
      organizationId,
    },
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (filters.restaurantId) {
    where.restaurantId = filters.restaurantId
  }

  if (filters.includeResolved === false) {
    where.resolved = false
  }

  const alerts = await prisma.alert.findMany({
    where,
    include: {
      restaurant: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const critical = alerts.filter((a) => a.severity === 'critical' && !a.resolved).length
  const high = alerts.filter((a) => a.severity === 'high' && !a.resolved).length
  const medium = alerts.filter((a) => a.severity === 'medium' && !a.resolved).length
  const low = alerts.filter((a) => a.severity === 'low' && !a.resolved).length
  const resolved = alerts.filter((a) => a.resolved).length

  return {
    type: 'ALERTS',
    period: {
      start: formatLocalDate(startDate),
      end: formatLocalDate(endDate),
    },
    summary: {
      totalAlerts: alerts.length,
      critical,
      high,
      medium,
      low,
      resolved,
    },
    alerts: alerts.map((alert) => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      restaurantName: alert.restaurant.name,
      resolved: alert.resolved,
      createdAt: alert.createdAt.toISOString(),
      resolvedAt: alert.resolvedAt?.toISOString() || null,
    })),
  }
}

/**
 * Génère un rapport récapitulatif
 */
export async function generateSummaryReport(
  organizationId: string,
  filters: ReportFilters
): Promise<SummaryReport> {
  const startDate = filters.startDate ? parseLocalDate(filters.startDate) : (() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    date.setHours(0, 0, 0, 0)
    return date
  })()
  
  const endDate = filters.endDate ? parseLocalDate(filters.endDate) : new Date()
  endDate.setHours(23, 59, 59, 999) // Fin de journée

  // Ventes
  const salesWhere: any = {
    restaurant: {
      organizationId,
    },
    saleDate: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (filters.restaurantId) {
    salesWhere.restaurantId = filters.restaurantId
  }

  const sales = await prisma.sale.findMany({
    where: salesWhere,
    include: {
      product: true,
    },
  })

  const totalSales = sales.reduce((sum, sale) => sum + sale.quantity, 0)
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0)
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const averagePerDay = daysDiff > 0 ? totalRevenue / daysDiff : 0

  // Top produits
  const productStats = new Map<string, { name: string; quantity: number; revenue: number }>()
  for (const sale of sales) {
    const existing = productStats.get(sale.productId) || { name: sale.product.name, quantity: 0, revenue: 0 }
    productStats.set(sale.productId, {
      name: sale.product.name,
      quantity: existing.quantity + sale.quantity,
      revenue: existing.revenue + sale.amount,
    })
  }

  const topProducts = Array.from(productStats.entries())
    .map(([productId, stats]) => ({
      productId,
      productName: stats.name,
      quantity: stats.quantity,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Recommandations
  const recommendationsWhere: any = {
    restaurant: {
      organizationId,
    },
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (filters.restaurantId) {
    recommendationsWhere.restaurantId = filters.restaurantId
  }

  const recommendations = await prisma.recommendation.findMany({
    where: recommendationsWhere,
  })

  const acceptedRecommendations = recommendations.filter((r) => r.status === 'accepted')
  let estimatedSavings = 0
  for (const rec of acceptedRecommendations) {
    const data = rec.data as any
    if (data?.estimatedSavings) {
      estimatedSavings += data.estimatedSavings
    }
  }

  // Alertes
  const alertsWhere: any = {
    restaurant: {
      organizationId,
    },
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (filters.restaurantId) {
    alertsWhere.restaurantId = filters.restaurantId
  }

  const alerts = await prisma.alert.findMany({
    where: alertsWhere,
  })

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical' && !a.resolved).length
  const resolvedAlerts = alerts.filter((a) => a.resolved).length

  return {
    type: 'SUMMARY',
    period: {
      start: formatLocalDate(startDate),
      end: formatLocalDate(endDate),
    },
    sales: {
      totalSales,
      totalRevenue,
      averagePerDay: Math.round(averagePerDay * 100) / 100,
    },
    recommendations: {
      total: recommendations.length,
      accepted: acceptedRecommendations.length,
      estimatedSavings,
    },
    alerts: {
      total: alerts.length,
      critical: criticalAlerts,
      resolved: resolvedAlerts,
    },
    topProducts,
  }
}

/**
 * Génère un rapport selon le type demandé
 */
export async function generateReport(
  organizationId: string,
  reportType: ReportType,
  filters: ReportFilters
): Promise<Report> {
  switch (reportType) {
    case 'SALES':
      return generateSalesReport(organizationId, filters)
    case 'PERFORMANCE':
      return generatePerformanceReport(organizationId, filters)
    case 'INVENTORY':
      return generateInventoryReport(organizationId, filters)
    case 'RECOMMENDATIONS':
      return generateRecommendationsReport(organizationId, filters)
    case 'ALERTS':
      return generateAlertsReport(organizationId, filters)
    case 'SUMMARY':
      return generateSummaryReport(organizationId, filters)
    default:
      throw new Error(`Type de rapport non supporté: ${reportType}`)
  }
}
