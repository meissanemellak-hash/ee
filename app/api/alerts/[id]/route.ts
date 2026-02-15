import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const STAFFING_SLOTS = ['08:00-12:00', '12:00-14:00', '14:00-18:00', '18:00-22:00'] as const

function parseStaffingAlertMessage(
  message: string,
  restaurantId: string
): { restaurantId: string; slotLabel: string; planDate: Date; recommendedCount: number } | null {
  const slotMatch = message.match(/créneau (\d{2}:\d{2}-\d{2}:\d{2})/)
  const recMatch = message.match(/vs (\d+) recommandé/)
  if (!slotMatch || !recMatch) return null
  const slotLabel = slotMatch[1]
  const recommendedCount = parseInt(recMatch[1], 10)
  if (!STAFFING_SLOTS.includes(slotLabel as any) || isNaN(recommendedCount)) return null

  const dateMatchFr = message.match(/le (\d{2}\/\d{2}\/\d{4})/)
  const dateMatchIso = message.match(/le (\d{4}-\d{2}-\d{2})/)
  let planDate: Date
  if (dateMatchFr) {
    const [d, m, y] = dateMatchFr[1].split('/')
    planDate = new Date(Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)))
  } else if (dateMatchIso) {
    const [y, m, d] = dateMatchIso[1].split('-')
    planDate = new Date(Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)))
  } else {
    return null
  }
  if (isNaN(planDate.getTime())) return null

  return { restaurantId, slotLabel, planDate, recommendedCount }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json()
    const { resolved, clerkOrgId } = body
    const orgIdToUse = authOrgId || clerkOrgId

    if (typeof resolved !== 'boolean') {
      return NextResponse.json(
        { error: 'resolved is required and must be a boolean' },
        { status: 400 }
      )
    }

    const { prisma } = await import('@/lib/db/prisma')
    const { getCurrentOrganization } = await import('@/lib/auth')
    const { logger } = await import('@/lib/logger')

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
          const isMember = userMemberships.data?.some((m: { organization: { id: string } }) => m.organization.id === orgIdToUse)
          
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
          logger.error('[PATCH /api/alerts/[id]] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      return NextResponse.json(
        { 
          error: 'Organization not found',
          details: 'L\'organisation n\'a pas pu être trouvée. Veuillez rafraîchir la page.'
        },
        { status: 404 }
      )
    }

    const { checkApiPermission } = await import('@/lib/auth-role')
    const forbidden = await checkApiPermission(userId, organization.clerkOrgId, 'alerts:resolve')
    if (forbidden) return forbidden

    // Vérifier que l'alerte appartient à l'organisation
    const alert = await prisma.alert.findFirst({
      where: {
        id: params.id,
        restaurant: {
          organizationId: organization.id,
        },
      },
    })

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found or does not belong to your organization' },
        { status: 404 }
      )
    }

    // Résolution d'une alerte effectif : appliquer automatiquement l'effectif recommandé
    if (resolved && (alert.type === 'OVERSTAFFING' || alert.type === 'UNDERSTAFFING')) {
      const parsed = parseStaffingAlertMessage(alert.message, alert.restaurantId)
      if (parsed) {
        try {
          await prisma.plannedStaffing.upsert({
            where: {
              restaurantId_planDate_slotLabel: {
                restaurantId: parsed.restaurantId,
                planDate: parsed.planDate,
                slotLabel: parsed.slotLabel,
              },
            },
            create: {
              restaurantId: parsed.restaurantId,
              planDate: parsed.planDate,
              slotLabel: parsed.slotLabel,
              plannedCount: parsed.recommendedCount,
            },
            update: { plannedCount: parsed.recommendedCount },
          })
          logger.log(`[PATCH /api/alerts/[id]] Effectif prévu mis à jour: ${parsed.slotLabel} = ${parsed.recommendedCount}`)
        } catch (err) {
          logger.error('[PATCH /api/alerts/[id]] Erreur mise à jour effectif prévu:', err)
        }
      }
    }

    const updated = await prisma.alert.update({
      where: { id: params.id },
      data: {
        resolved,
        resolvedAt: resolved ? new Date() : null,
      },
      include: {
        restaurant: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error updating alert:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
