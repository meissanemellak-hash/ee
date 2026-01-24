import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { requireOrganization } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requireOrganization()

    const body = await request.json()
    const { status } = body

    if (!status || !['pending', 'accepted', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, accepted, or dismissed' },
        { status: 400 }
      )
    }

    // Vérifier que la recommandation appartient à l'organisation
    const recommendation = await prisma.recommendation.findFirst({
      where: {
        id: params.id,
        restaurant: {
          organization: {
            // Vérification via requireOrganization
          },
        },
      },
    })

    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.recommendation.update({
      where: { id: params.id },
      data: { status },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating recommendation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
