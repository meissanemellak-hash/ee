import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import { getCurrentAlertsStateFromInventory } from '@/lib/services/alerts'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/alerts/current-state?restaurantId=xxx&clerkOrgId=xxx
 * Retourne l'état actuel des ruptures/surstocks calculé depuis l'inventaire (sans écrire en base).
 * Permet d'afficher "État actuel" sur la page Alertes même si les alertes en base sont vides ou résolues.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId: authOrgId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clerkOrgId = searchParams.get('clerkOrgId')
    const restaurantId = searchParams.get('restaurantId')
    const orgIdToUse = authOrgId || clerkOrgId

    let organization: { id: string } | null = null

    if (orgIdToUse) {
      organization = await prisma.organization.findUnique({
        where: { clerkOrgId: orgIdToUse },
        select: { id: true },
      })
      if (!organization) {
        try {
          const { clerkClient } = await import('@clerk/nextjs/server')
          const client = await clerkClient()
          const clerkOrg = await client.organizations.getOrganization({ organizationId: orgIdToUse })
          const userMemberships = await client.users.getOrganizationMembershipList({ userId })
          const isMember = userMemberships.data?.some((m) => m.organization.id === orgIdToUse)
          if (isMember) {
            const created = await prisma.organization.create({
              data: { name: clerkOrg.name, clerkOrgId: orgIdToUse, shrinkPct: 0.1 },
              select: { id: true },
            })
            organization = created
          }
        } catch (e) {
          logger.error('[GET /api/alerts/current-state] Erreur sync org:', e)
        }
      }
    } else {
      const org = await getCurrentOrganization()
      organization = org ? { id: org.id } : null
    }

    if (!organization) {
      return NextResponse.json({ shortages: 0, overstocks: 0, items: [] })
    }

    if (!restaurantId || restaurantId === 'all') {
      return NextResponse.json(
        { error: 'restaurantId is required and must be a single restaurant id' },
        { status: 400 }
      )
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: { id: restaurantId, organizationId: organization.id },
    })
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found or does not belong to your organization' },
        { status: 404 }
      )
    }

    const state = await getCurrentAlertsStateFromInventory(restaurantId)
    return NextResponse.json(state)
  } catch (error) {
    logger.error('[GET /api/alerts/current-state]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
