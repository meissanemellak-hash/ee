import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkApiPermission } from '@/lib/auth-role'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import { runAllAlerts, createTestAlerts } from '@/lib/services/alerts'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId: authOrgId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
          const isMember = userMemberships.data?.some(m => m.organization.id === orgIdToUse)
          
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
      organization = await getCurrentOrganization()
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
    logger.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId: authOrgId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
          const isMember = userMemberships.data?.some(m => m.organization.id === orgIdToUse)
          
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
    const { userId, orgId: authOrgId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
          const isMember = userMemberships.data?.some(m => m.organization.id === orgIdToUse)
          
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

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: {
        resolved,
        resolvedAt: resolved ? new Date() : null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    logger.error('Error updating alert:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
