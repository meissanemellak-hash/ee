import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const productIngredientSchema = z.object({
  ingredientId: z.string(),
  quantityNeeded: z.number().positive(),
  unit: z.string().optional().nullable(),
})

/**
 * GET /api/products/[id]/ingredients
 * Récupère tous les ingrédients d'un produit (recette). Imports dynamiques pour le build.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { getCurrentOrganization } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/db/prisma')
    const { logger } = await import('@/lib/logger')

    const searchParams = request.nextUrl.searchParams
    const clerkOrgIdFromQuery = searchParams.get('clerkOrgId')
    const orgIdToUse = authOrgId || clerkOrgIdFromQuery

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
          logger.error('[GET /api/products/[id]/ingredients] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Vérifier que le produit appartient à l'organisation
    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        organizationId: organization.id,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Récupérer les ingrédients du produit
    const productIngredients = await prisma.productIngredient.findMany({
      where: {
        productId: params.id,
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
      orderBy: {
        ingredient: {
          name: 'asc',
        },
      },
    })

    return NextResponse.json(productIngredients)
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error fetching product ingredients:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products/[id]/ingredients
 * Ajoute un ingrédient à un produit. Imports dynamiques pour le build.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { getCurrentOrganization } = await import('@/lib/auth')
    const { checkApiPermission } = await import('@/lib/auth-role')
    const { prisma } = await import('@/lib/db/prisma')
    const { logger } = await import('@/lib/logger')

    const body = await request.json()
    const { clerkOrgId, ...restBody } = body
    const orgIdToUse = authOrgId || clerkOrgId

    const validatedData = productIngredientSchema.parse(restBody)

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
          logger.error('[POST /api/products/[id]/ingredients] Erreur synchronisation:', error)
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

    const forbidden = await checkApiPermission(userId, organization.clerkOrgId, 'products:edit')
    if (forbidden) return forbidden

    // Vérifier que le produit appartient à l'organisation
    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        organizationId: organization.id,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Vérifier que l'ingrédient appartient à l'organisation
    const ingredient = await prisma.ingredient.findFirst({
      where: {
        id: validatedData.ingredientId,
        organizationId: organization.id,
      },
    })

    if (!ingredient) {
      return NextResponse.json(
        { error: 'Ingredient not found or does not belong to your organization' },
        { status: 404 }
      )
    }

    // Vérifier si la relation existe déjà
    const existing = await prisma.productIngredient.findUnique({
      where: {
        productId_ingredientId: {
          productId: params.id,
          ingredientId: validatedData.ingredientId,
        },
      },
    })

    if (existing) {
      // Mettre à jour la quantité et l'unité
      const updated = await prisma.productIngredient.update({
        where: { id: existing.id },
        data: {
          quantityNeeded: validatedData.quantityNeeded,
          unit: validatedData.unit ?? null,
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

      return NextResponse.json(updated)
    }

    // Créer la relation
    const productIngredient = await prisma.productIngredient.create({
      data: {
        productId: params.id,
        ingredientId: validatedData.ingredientId,
        quantityNeeded: validatedData.quantityNeeded,
        unit: validatedData.unit ?? null,
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

    return NextResponse.json(productIngredient, { status: 201 })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error adding product ingredient:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
