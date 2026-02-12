import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import { runAllAlerts } from '@/lib/services/alerts'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const SLOT_LABELS = ['08:00-12:00', '12:00-14:00', '14:00-18:00', '18:00-22:00'] as const

function toPlanDate(dateStr: string): Date {
  const d = new Date(dateStr + 'T00:00:00.000Z')
  if (isNaN(d.getTime())) throw new Error('Invalid date')
  return d
}

async function resolveOrganization(userId: string, orgIdToUse: string | null) {
  if (!orgIdToUse) return getCurrentOrganization()
  let organization = await prisma.organization.findUnique({
    where: { clerkOrgId: orgIdToUse },
  })
  if (!organization) {
    try {
      const { clerkClient } = await import('@clerk/nextjs/server')
      const client = await clerkClient()
      const clerkOrg = await client.organizations.getOrganization({ organizationId: orgIdToUse })
      const userMemberships = await client.users.getOrganizationMembershipList({ userId })
      const isMember = userMemberships.data?.some((m: any) => m.organization.id === orgIdToUse)
      if (isMember) {
        try {
          organization = await prisma.organization.create({
            data: { name: clerkOrg.name, clerkOrgId: orgIdToUse, shrinkPct: 0.1 },
          })
        } catch (dbError) {
          if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
            organization = await prisma.organization.findUnique({
              where: { clerkOrgId: orgIdToUse },
            })
          } else {
            throw dbError
          }
        }
      }
    } catch (error) {
      logger.error('[planned-staffing] resolveOrganization:', error)
    }
  }
  return organization ?? getCurrentOrganization()
}

/**
 * GET /api/planned-staffing?restaurantId= & date= (YYYY-MM-DD) & clerkOrgId= (optionnel)
 * Retourne l'effectif prévu pour un restaurant et une date.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId: authOrgId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const clerkOrgId = searchParams.get('clerkOrgId')
    const orgIdToUse = authOrgId || clerkOrgId
    const organization = await resolveOrganization(userId, orgIdToUse)
    if (!organization) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    const restaurantId = searchParams.get('restaurantId')
    const dateStr = searchParams.get('date')
    if (!restaurantId || !dateStr) {
      return NextResponse.json({ error: 'restaurantId and date are required' }, { status: 400 })
    }

    const planDate = toPlanDate(dateStr)

    const restaurant = await prisma.restaurant.findFirst({
      where: { id: restaurantId, organizationId: organization.id },
    })
    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

    const rows = await prisma.plannedStaffing.findMany({
      where: { restaurantId, planDate },
      orderBy: { slotLabel: 'asc' },
    })

    const slots = SLOT_LABELS.map((label) => {
      const row = rows.find((r) => r.slotLabel === label)
      return { slotLabel: label, plannedCount: row?.plannedCount ?? 0 }
    })

    return NextResponse.json({ restaurantId, date: dateStr, slots })
  } catch (e) {
    if (e instanceof Error && e.message === 'Invalid date') {
      return NextResponse.json({ error: 'Invalid date format (use YYYY-MM-DD)' }, { status: 400 })
    }
    logger.error('[GET /api/planned-staffing]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/planned-staffing
 * Body: { restaurantId, date: "YYYY-MM-DD", slots: [{ slotLabel, plannedCount }] }
 * Met à jour l'effectif prévu pour la date, puis relance les alertes.
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId, orgId: authOrgId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { restaurantId, date: dateStr, slots, clerkOrgId: bodyClerkOrgId } = body as {
      restaurantId?: string
      date?: string
      slots?: Array<{ slotLabel: string; plannedCount: number }>
      clerkOrgId?: string
    }
    const orgIdToUse = authOrgId || bodyClerkOrgId
    const organization = await resolveOrganization(userId, orgIdToUse)
    if (!organization) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    if (!restaurantId || !dateStr || !Array.isArray(slots)) {
      return NextResponse.json(
        { error: 'restaurantId, date and slots (array) are required' },
        { status: 400 }
      )
    }

    const planDate = toPlanDate(dateStr)

    const restaurant = await prisma.restaurant.findFirst({
      where: { id: restaurantId, organizationId: organization.id },
    })
    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

    for (const { slotLabel, plannedCount } of slots) {
      if (!SLOT_LABELS.includes(slotLabel as any)) continue
      const count = Math.max(0, Math.floor(Number(plannedCount)) || 0)
      await prisma.plannedStaffing.upsert({
        where: {
          restaurantId_planDate_slotLabel: { restaurantId, planDate, slotLabel },
        },
        create: { restaurantId, planDate, slotLabel, plannedCount: count },
        update: { plannedCount: count },
      })
    }

    try {
      await runAllAlerts(restaurantId)
    } catch (alertErr) {
      logger.error('[PUT /api/planned-staffing] runAllAlerts:', alertErr)
    }

    const rows = await prisma.plannedStaffing.findMany({
      where: { restaurantId, planDate },
      orderBy: { slotLabel: 'asc' },
    })
    const outSlots = SLOT_LABELS.map((label) => {
      const row = rows.find((r) => r.slotLabel === label)
      return { slotLabel: label, plannedCount: row?.plannedCount ?? 0 }
    })

    return NextResponse.json({ restaurantId, date: dateStr, slots: outSlots })
  } catch (e) {
    if (e instanceof Error && e.message === 'Invalid date') {
      return NextResponse.json({ error: 'Invalid date format (use YYYY-MM-DD)' }, { status: 400 })
    }
    logger.error('[PUT /api/planned-staffing]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
