import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { requireOrganization } from '@/lib/auth'
import { generateOrderRecommendations, generateStaffingRecommendations } from '@/lib/services/recommender'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organization = await requireOrganization()

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const type = searchParams.get('type') // 'ORDER' | 'STAFFING' | null (all)

    const where: any = {
      restaurant: {
        organizationId: organization.id,
      },
    }

    // Si aucun filtre de statut n'est spécifié, on filtre par défaut sur 'pending'
    if (!searchParams.get('status') || searchParams.get('status') === 'pending') {
      where.status = 'pending'
    } else if (searchParams.get('status') !== 'all') {
      where.status = searchParams.get('status')
    }

    if (restaurantId && restaurantId !== 'all') {
      where.restaurantId = restaurantId
    }

    if (type && type !== 'all') {
      where.type = type
    }

    const recommendations = await prisma.recommendation.findMany({
      where,
      include: {
        restaurant: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requireOrganization()

    const body = await request.json()
    const { restaurantId, type, forecastDate } = body

    if (!restaurantId || !type) {
      return NextResponse.json(
        { error: 'restaurantId and type are required' },
        { status: 400 }
      )
    }

    const date = forecastDate ? new Date(forecastDate) : new Date()

    let recommendations
    if (type === 'ORDER') {
      recommendations = await generateOrderRecommendations(restaurantId, date)
    } else if (type === 'STAFFING') {
      recommendations = await generateStaffingRecommendations(restaurantId, date)
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be ORDER or STAFFING' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, recommendations })
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
