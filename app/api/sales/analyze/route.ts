import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import type { SalesAnalysis } from '@/types'

// Force dynamic rendering pour les routes API avec authentification
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organization = await getCurrentOrganization()
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

    const { searchParams } = new URL(request.url)
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

    // Calculer les statistiques
    const totalSales = sales.reduce((sum, s) => sum + s.quantity, 0)
    const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const averagePerDay = daysDiff > 0 ? totalSales / daysDiff : 0

    // Top produits
    const productMap = new Map<string, { quantity: number; revenue: number; name: string }>()
    for (const sale of sales) {
      const existing = productMap.get(sale.productId) || { quantity: 0, revenue: 0, name: sale.product.name }
      productMap.set(sale.productId, {
        quantity: existing.quantity + sale.quantity,
        revenue: existing.revenue + sale.amount,
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
      const existing = salesByHourMap.get(sale.saleHour) || { quantity: 0, revenue: 0 }
      salesByHourMap.set(sale.saleHour, {
        quantity: existing.quantity + sale.quantity,
        revenue: existing.revenue + sale.amount,
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
      const dateKey = sale.saleDate.toISOString().split('T')[0]
      const existing = salesByDayMap.get(dateKey) || { quantity: 0, revenue: 0 }
      salesByDayMap.set(dateKey, {
        quantity: existing.quantity + sale.quantity,
        revenue: existing.revenue + sale.amount,
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
    console.error('Error analyzing sales:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
