import { NextRequest, NextResponse } from 'next/server'
import type { ReportType, ReportFilters } from '@/lib/services/reports'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const { checkApiPermission } = await import('@/lib/auth-role')
    const { prisma } = await import('@/lib/db/prisma')
    const { getCurrentOrganization } = await import('@/lib/auth')
    const { logger } = await import('@/lib/logger')

    const body = await request.json()
    const { reportType, filters, clerkOrgId } = body
    const orgIdToUse = authOrgId || clerkOrgId

    if (!reportType) {
      return NextResponse.json(
        { error: 'reportType is required' },
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
          logger.error('[POST /api/reports/generate] Erreur synchronisation:', error)
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

    const forbidden = await checkApiPermission(userId, organization.clerkOrgId, 'reports:generate')
    if (forbidden) return forbidden

    // Vérifier que le restaurant appartient à l'organisation si spécifié
    if (filters?.restaurantId) {
      const restaurant = await prisma.restaurant.findFirst({
        where: {
          id: filters.restaurantId,
          organizationId: organization.id,
        },
      })

      if (!restaurant) {
        return NextResponse.json(
          { error: 'Restaurant not found or does not belong to your organization' },
          { status: 404 }
        )
      }
    }

    const { generateReport } = await import('@/lib/services/reports')
    const report = await generateReport(organization.id, reportType as ReportType, (filters as ReportFilters) || {})

    return NextResponse.json(report)
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('[POST /api/reports/generate] Erreur:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
