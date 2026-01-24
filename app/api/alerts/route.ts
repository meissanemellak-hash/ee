import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { requireOrganization } from '@/lib/auth'
import { runAllAlerts } from '@/lib/services/alerts'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organization = await requireOrganization()

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const resolved = searchParams.get('resolved') === 'true'

    const where: any = {
      restaurant: {
        organizationId: organization.id,
      },
      resolved,
    }

    if (restaurantId) {
      where.restaurantId = restaurantId
    }

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        restaurant: true,
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 100,
    })

    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Error fetching alerts:', error)
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
    const { restaurantId } = body

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      )
    }

    await runAllAlerts(restaurantId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error running alerts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requireOrganization()

    const body = await request.json()
    const { alertId, resolved } = body

    if (!alertId || typeof resolved !== 'boolean') {
      return NextResponse.json(
        { error: 'alertId and resolved are required' },
        { status: 400 }
      )
    }

    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        resolved,
        resolvedAt: resolved ? new Date() : null,
      },
    })

    return NextResponse.json(alert)
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
