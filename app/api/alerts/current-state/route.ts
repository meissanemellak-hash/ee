import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/alerts/current-state?restaurantId=xxx&clerkOrgId=xxx
 * Retourne l'état actuel des ruptures/surstocks calculé depuis l'inventaire (sans écrire en base).
 * Imports dynamiques pour éviter tout chargement Clerk/Prisma au build.
 */
export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null
    let authOrgId: string | null = null
    try {
      const { auth } = await import('@clerk/nextjs/server')
      const authResult = auth()
      userId = authResult.userId ?? null
      authOrgId = authResult.orgId ?? null
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/db/prisma')
    const { getCurrentOrganization } = await import('@/lib/auth')
    const { logger } = await import('@/lib/logger')

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
          const isMember = userMemberships.data?.some((m: { organization: { id: string } }) => m.organization.id === orgIdToUse)
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

    const { getCurrentAlertsStateFromInventory } = await import('@/lib/services/alerts')
    const state = await getCurrentAlertsStateFromInventory(restaurantId)
    return NextResponse.json(state)
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('[GET /api/alerts/current-state]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
