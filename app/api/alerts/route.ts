import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const STAFFING_SLOTS = ['08:00-12:00', '12:00-14:00', '14:00-18:00', '18:00-22:00'] as const

/**
 * Parse le message d'une alerte Sur-effectif / Sous-effectif pour en extraire créneau, date et effectif recommandé.
 * Retourne null si le format ne correspond pas.
 */
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

  // Date : DD/MM/YYYY ou YYYY-MM-DD (ancien format)
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

export async function GET(request: NextRequest) {
  try {
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

    const { prisma } = await import('@/lib/db/prisma')
    const { getCurrentOrganization, getOrganizationForDashboard } = await import('@/lib/auth')
    const { logger } = await import('@/lib/logger')

    const { searchParams } = new URL(request.url)
    const clerkOrgId = searchParams.get('clerkOrgId')
    const restaurantId = searchParams.get('restaurantId')
    const resolved = searchParams.get('resolved')
    const type = searchParams.get('type')
    const severity = searchParams.get('severity')
    
    const orgIdToUse = authOrgId || clerkOrgId

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
          logger.error('[GET /api/alerts] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = (await getOrganizationForDashboard(userId)) ?? (await getCurrentOrganization())
    }

    if (!organization) {
      return NextResponse.json([])
    }

    const where: any = {
      restaurant: {
        organizationId: organization.id,
      },
    }

    // Filtre résolu/non résolu
    if (resolved !== null && resolved !== undefined) {
      where.resolved = resolved === 'true'
    }

    if (restaurantId) {
      where.restaurantId = restaurantId
    }

    if (type) {
      where.type = type
    }

    if (severity) {
      where.severity = severity
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
    const { logger } = await import('@/lib/logger')
    logger.error('Error fetching alerts:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const { prisma } = await import('@/lib/db/prisma')
    const { getCurrentOrganization } = await import('@/lib/auth')
    const { logger } = await import('@/lib/logger')

    const body = await request.json()
    const { restaurantId, clerkOrgId, createTest } = body
    const orgIdToUse = authOrgId || clerkOrgId

    logger.log('[POST /api/alerts] Début - userId:', userId, 'restaurantId:', restaurantId, 'createTest:', createTest, 'orgIdToUse:', orgIdToUse)

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
          logger.error('[POST /api/alerts] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization required' },
        { status: 400 }
      )
    }

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      )
    }

    // Vérifier que le restaurant appartient à l'organisation
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        organizationId: organization.id,
      },
    })

    if (!restaurant) {
      logger.error('[POST /api/alerts] Restaurant non trouvé:', restaurantId, 'pour organisation:', organization.id)
      return NextResponse.json(
        { error: 'Restaurant not found or does not belong to your organization' },
        { status: 404 }
      )
    }

    logger.log('[POST /api/alerts] Restaurant trouvé:', restaurant.name, 'createTest:', createTest)

    // Si createTest est true, créer des alertes de test
    if (createTest === true) {
      try {
        const { createTestAlerts } = await import('@/lib/services/alerts')
        await createTestAlerts(restaurantId)
        return NextResponse.json({ 
          success: true,
          alertsCreated: 3,
          message: '3 alertes de test créées avec succès'
        })
      } catch (testError) {
        logger.error('[POST /api/alerts] Erreur lors de la création des alertes de test:', testError)
        return NextResponse.json(
          { 
            error: 'Erreur lors de la création des alertes de test',
            details: testError instanceof Error ? testError.message : 'Erreur inconnue'
          },
          { status: 500 }
        )
      }
    }

    try {
      const { runAllAlerts } = await import('@/lib/services/alerts')
      await runAllAlerts(restaurantId)
    } catch (alertError) {
      logger.error('[POST /api/alerts] Erreur lors de la génération des alertes:', alertError)
      // Ne pas échouer complètement, on continue pour compter les alertes existantes
    }

    // Compter les alertes créées pour ce restaurant
    const alertsCount = await prisma.alert.count({
      where: {
        restaurantId,
        resolved: false,
      },
    })

    return NextResponse.json({ 
      success: true,
      alertsCreated: alertsCount,
      message: alertsCount > 0 
        ? `Liste mise à jour : ${alertsCount} alerte(s) active(s) pour ce restaurant.`
        : 'Aucune alerte active. Les stocks sont dans les seuils ou l’inventaire n’a pas encore de seuils min/max configurés.'
    })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('[POST /api/alerts] Erreur complète:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
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

    const { prisma } = await import('@/lib/db/prisma')
    const { getCurrentOrganization } = await import('@/lib/auth')
    const { logger } = await import('@/lib/logger')
    const { checkApiPermission } = await import('@/lib/auth-role')

    const body = await request.json()
    const { alertId, resolved, clerkOrgId } = body
    const orgIdToUse = authOrgId || clerkOrgId

    if (!alertId || typeof resolved !== 'boolean') {
      return NextResponse.json(
        { error: 'alertId and resolved are required' },
        { status: 400 }
      )
    }

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
          logger.error('[PATCH /api/alerts] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization required' },
        { status: 400 }
      )
    }

    const forbidden = await checkApiPermission(userId, organization.clerkOrgId, 'alerts:resolve')
    if (forbidden) return forbidden

    // Vérifier que l'alerte appartient à l'organisation
    const alert = await prisma.alert.findFirst({
      where: {
        id: alertId,
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
          logger.log(`[PATCH /api/alerts] Effectif prévu mis à jour: ${parsed.slotLabel} le ${parsed.planDate.toISOString().slice(0, 10)} = ${parsed.recommendedCount}`)
        } catch (err) {
          logger.error('[PATCH /api/alerts] Erreur mise à jour effectif prévu:', err)
        }
      }
    }

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: {
        resolved,
        resolvedAt: resolved ? new Date() : null,
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
