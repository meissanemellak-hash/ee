import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/restaurants/[id]
 * Récupère un restaurant spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, orgId: authOrgId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clerkOrgId = searchParams.get('clerkOrgId')
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
          console.error('[GET /api/restaurants/[id]] Erreur synchronisation:', error)
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

    // Récupérer le restaurant avec les compteurs et les ventes récentes
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: params.id,
        organizationId: organization.id,
      },
      include: {
        _count: {
          select: {
            sales: true,
            alerts: true,
            inventory: true,
          },
        },
      },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found or does not belong to your organization' },
        { status: 404 }
      )
    }

    // Calculer le chiffre d'affaires des 7 derniers jours
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const recentSalesData = await prisma.sale.aggregate({
      where: {
        restaurantId: restaurant.id,
        saleDate: {
          gte: sevenDaysAgo,
        },
      },
      _sum: {
        amount: true,
      },
    })

    const totalRevenue = recentSalesData._sum.amount || 0

    // Récupérer les 10 dernières ventes
    const recentSales = await prisma.sale.findMany({
      where: {
        restaurantId: restaurant.id,
      },
      take: 10,
      orderBy: {
        saleDate: 'desc',
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    })

    // Construire la réponse avec toutes les données nécessaires
    const response = {
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      timezone: restaurant.timezone,
      createdAt: restaurant.createdAt,
      _count: restaurant._count,
      totalRevenue,
      recentSales: recentSales.map((sale) => ({
        id: sale.id,
        amount: sale.amount,
        quantity: sale.quantity,
        saleDate: sale.saleDate.toISOString(),
        product: {
          name: sale.product.name,
        },
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[GET /api/restaurants/[id]] Erreur:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/restaurants/[id]
 * Supprime un restaurant (et ses données en cascade)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, orgId: authOrgId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    let clerkOrgId = searchParams.get('clerkOrgId')
    if (!clerkOrgId) {
      try {
        const body = await request.json()
        clerkOrgId = (body as { clerkOrgId?: string }).clerkOrgId ?? null
      } catch {
        // body vide ou invalide
      }
    }
    const orgIdToUse = authOrgId || clerkOrgId

    let organization: Awaited<ReturnType<typeof prisma.organization.findUnique>> = null

    if (orgIdToUse) {
      organization = await prisma.organization.findUnique({
        where: { clerkOrgId: orgIdToUse },
      })
    }
    if (!organization) {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      return NextResponse.json(
        {
          error: 'Organization not found',
          details: "L'organisation n'a pas pu être trouvée. Veuillez rafraîchir la page.",
        },
        { status: 404 }
      )
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: params.id,
        organizationId: organization.id,
      },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found or does not belong to your organization' },
        { status: 404 }
      )
    }

    await prisma.restaurant.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/restaurants/[id]] Erreur:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
