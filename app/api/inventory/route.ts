import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkApiPermission } from '@/lib/auth-role'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import { runAllAlerts } from '@/lib/services/alerts'

export const dynamic = 'force-dynamic'

/**
 * GET /api/inventory
 * Récupère les inventaires d'un restaurant
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId: authOrgId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const clerkOrgId = searchParams.get('clerkOrgId')
    const orgIdToUse = authOrgId || clerkOrgId

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
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
          console.error('[GET /api/inventory] Erreur synchronisation:', error)
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

    // Récupérer tous les inventaires du restaurant
    const inventory = await prisma.inventory.findMany({
      where: { restaurantId },
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            unit: true,
            costPerUnit: true,
          },
        },
      },
      orderBy: {
        ingredient: {
          name: 'asc',
        },
      },
    })

    return NextResponse.json(inventory)
  } catch (error) {
    console.error('[GET /api/inventory] Erreur:', error)
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
 * POST /api/inventory
 * Crée ou met à jour un inventaire
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId: authOrgId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { restaurantId, ingredientId, currentStock, minThreshold, maxThreshold, clerkOrgId } = body
    const orgIdToUse = authOrgId || clerkOrgId

    if (!restaurantId || !ingredientId || currentStock === undefined || !minThreshold) {
      return NextResponse.json(
        { error: 'restaurantId, ingredientId, currentStock, and minThreshold are required' },
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
          console.error('[POST /api/inventory] Erreur synchronisation:', error)
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

    const effectiveOrgId = orgIdToUse || organization.clerkOrgId
    const forbidden = await checkApiPermission(userId, effectiveOrgId, 'inventory:edit')
    if (forbidden) return forbidden

    // Vérifier que le restaurant et l'ingrédient appartiennent à l'organisation
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

    const ingredient = await prisma.ingredient.findFirst({
      where: {
        id: ingredientId,
        organizationId: organization.id,
      },
    })

    if (!ingredient) {
      return NextResponse.json(
        { error: 'Ingredient not found or does not belong to your organization' },
        { status: 404 }
      )
    }

    // Créer ou mettre à jour l'inventaire (upsert)
    const inventory = await prisma.inventory.upsert({
      where: {
        restaurantId_ingredientId: {
          restaurantId,
          ingredientId,
        },
      },
      update: {
        currentStock,
        minThreshold,
        maxThreshold: maxThreshold || null,
        lastUpdated: new Date(),
      },
      create: {
        restaurantId,
        ingredientId,
        currentStock,
        minThreshold,
        maxThreshold: maxThreshold || null,
        lastUpdated: new Date(),
      },
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            unit: true,
            costPerUnit: true,
          },
        },
      },
    })

    // Génération automatique des alertes après mise à jour de l'inventaire
    try {
      await runAllAlerts(restaurantId)
    } catch (alertError) {
      console.error('[POST /api/inventory] runAllAlerts:', alertError)
    }

    return NextResponse.json(inventory)
  } catch (error) {
    console.error('[POST /api/inventory] Erreur:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
