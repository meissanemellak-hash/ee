import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { requireOrganization } from '@/lib/auth'
import { generateBOMOrderRecommendations } from '@/lib/services/recommender-bom'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requireOrganization()

    const body = await request.json()
    const { restaurantId, shrinkPct, days } = body

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      )
    }

    const result = await generateBOMOrderRecommendations(
      restaurantId,
      shrinkPct || 0.1,
      days || 7
    )

    // Sauvegarder la recommandation
    if (result.recommendations.length > 0) {
      const { prisma } = await import('@/lib/db/prisma')
      await prisma.recommendation.create({
        data: {
          restaurantId,
          type: 'ORDER',
          data: result.details as any,
          priority: 'medium',
          status: 'pending',
        },
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating BOM recommendations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
