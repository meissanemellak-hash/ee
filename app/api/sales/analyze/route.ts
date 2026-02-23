import { NextRequest, NextResponse } from 'next/server'
import type { SalesAnalysis } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string | null = null
    let authOrgId: string | null = null
    try {
      const { auth } = await import('@clerk/nextjs/server')
      const authResult = await auth()
      userId = authResult.userId ?? null
      authOrgId = authResult.orgId ?? null
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { getCurrentOrganization } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/db/prisma')
    const { logger } = await import('@/lib/logger')

    const searchParams = request.nextUrl.searchParams
    const clerkOrgIdFromQuery = searchParams.get('clerkOrgId')
    const orgIdToUse = authOrgId || clerkOrgIdFromQuery

    let organization: any = null

    if (orgIdToUse) {
      organization = await prisma.organization.findUnique({
        where: { clerkOrgId: orgIdToUse },
      })
      
      if (!organization) {
        try {
          const { clerkClient } = await import('@clerk/nextjs/server')
          const client = await clerkClient()
          const clerkOrg = await client.organizations.getOrganization({ organizationId: orgIdToUse })
          
          const userMemberships = await client.users.getOrganizationMembershipList({ userId })
          const isMember = userMemberships.data?.some(m => m.organization.id === orgIdToUse)
          
          if (isMember) {
            try {
              organization = await prisma.organization.create({
                data: {
                  name: clerkOrg.name,
                  clerkOrgId: orgIdToUse,
                  shrinkPct: 0.1,
                },
              })
            } catch (dbError) {
              if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
                organization = await prisma.organization.findUnique({
                  where: { clerkOrgId: orgIdToUse },
                })
              }
            }
          }
        } catch (error) {
          logger.error('[GET /api/sales/analyze] Erreur synchronisation:', error)
        }
      }
    } else {
      const { getOrganizationForDashboard } = await import('@/lib/auth')
      organization = await getOrganizationForDashboard(userId)
    }
    if (!organization) {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      return NextResponse.json({
        totalSales: 0,
        totalRevenue: 0,
        averagePerDay: 0,
        topProducts: [],
        salesByHour: [],
        salesByDay: [],
      })
    }

    const restaurantId = searchParams.get('restaurantId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const start = startDate ? new Date(startDate) : new Date()
    start.setDate(start.getDate() - 30) // 30 derniers jours par défaut

    const end = endDate ? new Date(endDate) : new Date()

    // Construire la requête
    const where: any = {
      restaurant: {
        organizationId: organization.id,
      },
      saleDate: {
        gte: start,
        lte: end,
      },
    }

    if (restaurantId) {
      where.restaurantId = restaurantId
    }

    // Récupérer les ventes
    const sales = await prisma.sale.findMany({
      where,
      include: {
        product: true,
        restaurant: true,
      },
    })

    // Revenu basé sur le prix actuel du produit (quantity × unitPrice) pour refléter les changements de prix
    const saleRevenue = (s: { quantity: number; amount: number; product: { unitPrice: number } }) =>
      s.quantity * s.product.unitPrice

    const totalSales = sales.reduce((sum, s) => sum + s.quantity, 0)
    const totalRevenue = sales.reduce((sum, s) => sum + saleRevenue(s), 0)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const averagePerDay = daysDiff > 0 ? totalSales / daysDiff : 0

    // Top produits
    const productMap = new Map<string, { quantity: number; revenue: number; name: string }>()
    for (const sale of sales) {
      const rev = saleRevenue(sale)
      const existing = productMap.get(sale.productId) || { quantity: 0, revenue: 0, name: sale.product.name }
      productMap.set(sale.productId, {
        quantity: existing.quantity + sale.quantity,
        revenue: existing.revenue + rev,
        name: existing.name,
      })
    }

    const topProducts = Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Ventes par heure
    const salesByHourMap = new Map<number, { quantity: number; revenue: number }>()
    for (const sale of sales) {
      const rev = saleRevenue(sale)
      const existing = salesByHourMap.get(sale.saleHour) || { quantity: 0, revenue: 0 }
      salesByHourMap.set(sale.saleHour, {
        quantity: existing.quantity + sale.quantity,
        revenue: existing.revenue + rev,
      })
    }

    const salesByHour = Array.from(salesByHourMap.entries())
      .map(([hour, data]) => ({
        hour,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => a.hour - b.hour)

    // Ventes par jour
    const salesByDayMap = new Map<string, { quantity: number; revenue: number }>()
    for (const sale of sales) {
      const rev = saleRevenue(sale)
      const dateKey = sale.saleDate.toISOString().split('T')[0]
      const existing = salesByDayMap.get(dateKey) || { quantity: 0, revenue: 0 }
      salesByDayMap.set(dateKey, {
        quantity: existing.quantity + sale.quantity,
        revenue: existing.revenue + rev,
      })
    }

    const salesByDay = Array.from(salesByDayMap.entries())
      .map(([date, data]) => ({
        date,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const analysis: SalesAnalysis = {
      totalSales,
      totalRevenue,
      averagePerDay,
      topProducts,
      salesByHour,
      salesByDay,
    }

    return NextResponse.json(analysis)
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error analyzing sales:', error)
    return NextResponse.json({
      totalSales: 0,
      totalRevenue: 0,
      averagePerDay: 0,
      topProducts: [],
      salesByHour: [],
      salesByDay: [],
    })
  }
}
