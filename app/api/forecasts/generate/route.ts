import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkApiPermission } from '@/lib/auth-role'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { generateForecastsForRestaurant } from '@/lib/services/forecast'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId: authOrgId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { restaurantId, forecastDate, startDate, endDate, method, clerkOrgId } = body
    const orgIdToUse = authOrgId || clerkOrgId

    logger.log('[POST /api/forecasts/generate] userId:', userId, 'auth().orgId:', authOrgId, 'body.clerkOrgId:', clerkOrgId, 'orgIdToUse:', orgIdToUse)

    let organization: any = null

    if (orgIdToUse) {
      organization = await prisma.organization.findUnique({
        where: { clerkOrgId: orgIdToUse },
      })
      
      if (!organization) {
        logger.log('[POST /api/forecasts/generate] Organisation non trouvée dans la DB, synchronisation depuis Clerk...')
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
              logger.log(`✅ Organisation "${organization.name}" synchronisée`)
            } catch (dbError) {
              if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
                organization = await prisma.organization.findUnique({
                  where: { clerkOrgId: orgIdToUse },
                })
              }
            }
          }
        } catch (error) {
          logger.error('[POST /api/forecasts/generate] Erreur synchronisation:', error)
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

    const forbidden = await checkApiPermission(userId, organization.clerkOrgId, 'forecasts:generate')
    if (forbidden) return forbidden

    const useRange = startDate != null && endDate != null && startDate !== '' && endDate !== ''
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      )
    }
    if (!useRange && !forecastDate) {
      return NextResponse.json(
        { error: 'Either forecastDate or both startDate and endDate are required' },
        { status: 400 }
      )
    }
    if (useRange && (!startDate || !endDate)) {
      return NextResponse.json(
        { error: 'When using a range, both startDate and endDate are required' },
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
      return NextResponse.json(
        { error: 'Restaurant not found or does not belong to your organization' },
        { status: 404 }
      )
    }

    const methodValue = method || 'moving_average'
    let forecasts: Awaited<ReturnType<typeof generateForecastsForRestaurant>>

    if (useRange) {
      const start = new Date(startDate as string)
      const end = new Date(endDate as string)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      if (start.getTime() > end.getTime()) {
        return NextResponse.json(
          { error: 'startDate must be before or equal to endDate' },
          { status: 400 }
        )
      }
      const maxDays = 31
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
      if (daysDiff > maxDays) {
        return NextResponse.json(
          { error: `La plage ne peut pas dépasser ${maxDays} jours` },
          { status: 400 }
        )
      }
      const allForecasts: Awaited<ReturnType<typeof generateForecastsForRestaurant>> = []
      for (let d = new Date(start); d.getTime() <= end.getTime(); d.setDate(d.getDate() + 1)) {
        const dayForecasts = await generateForecastsForRestaurant(
          restaurantId,
          new Date(d),
          methodValue
        )
        allForecasts.push(...dayForecasts)
      }
      forecasts = allForecasts
    } else {
      const date = new Date(forecastDate as string)
      forecasts = await generateForecastsForRestaurant(
        restaurantId,
        date,
        methodValue
      )
    }

    return NextResponse.json({ success: true, forecasts })
  } catch (error) {
    logger.error('Error generating forecasts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
