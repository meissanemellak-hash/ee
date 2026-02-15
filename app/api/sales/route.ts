import { NextRequest, NextResponse } from 'next/server'
import { saleSchema } from '@/lib/validations/sales'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

/**
 * GET /api/sales
 * Liste toutes les ventes de l'organisation avec filtres optionnels. Imports dynamiques pour le build.
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

    const { getCurrentOrganization } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/db/prisma')
    const { logger } = await import('@/lib/logger')

    const searchParams = request.nextUrl.searchParams
    const clerkOrgIdFromQuery = searchParams.get('clerkOrgId')
    const orgIdToUse = authOrgId || clerkOrgIdFromQuery

    logger.log('[GET /api/sales] userId:', userId, 'auth().orgId:', authOrgId, 'query.clerkOrgId:', clerkOrgIdFromQuery, 'orgIdToUse:', orgIdToUse)

    let organization: any = null

    if (orgIdToUse) {
      organization = await prisma.organization.findUnique({
        where: { clerkOrgId: orgIdToUse },
      })
      
      if (!organization) {
        logger.log('[GET /api/sales] Organisation non trouvée dans la DB, synchronisation depuis Clerk...')
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
          const { logger } = await import('@/lib/logger')
          logger.error('[GET /api/sales] Erreur synchronisation:', error)
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

    // Récupérer les paramètres de filtrage
    const restaurantId = searchParams.get('restaurantId')
    const productId = searchParams.get('productId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const usePagination = pageParam !== null || limitParam !== null

    // Construire la clause where
    const where: any = {
      restaurant: {
        organizationId: organization.id,
      },
    }

    if (restaurantId) {
      where.restaurantId = restaurantId
    }

    if (productId) {
      where.productId = productId
    }

    if (startDate || endDate) {
      where.saleDate = {}
      if (startDate) {
        where.saleDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.saleDate.lte = new Date(endDate)
      }
    }

    if (usePagination) {
      const page = parseInt(pageParam || '1')
      const limit = parseInt(limitParam || '50')
      const skip = (page - 1) * limit

      const baseParams: (string | Date | null)[] = [organization.id, restaurantId || null, productId || null, startDate ? new Date(startDate) : null, endDate ? new Date(endDate) : null]
      const revenueQuery = prisma.$queryRawUnsafe<[{ total: string }]>(
        `SELECT COALESCE(SUM(s.quantity * p.unit_price), 0)::text as total
         FROM sales s
         INNER JOIN products p ON s.product_id = p.id
         INNER JOIN restaurants r ON s.restaurant_id = r.id
         WHERE r.organization_id = $1
         AND ($2::text IS NULL OR $2 = '' OR s.restaurant_id = $2)
         AND ($3::text IS NULL OR $3 = '' OR s.product_id = $3)
         AND ($4::timestamptz IS NULL OR s.sale_date >= $4)
         AND ($5::timestamptz IS NULL OR s.sale_date <= $5)`,
        ...baseParams
      )
      const quantityQuery = prisma.$queryRawUnsafe<[{ total: string }]>(
        `SELECT COALESCE(SUM(s.quantity), 0)::text as total
         FROM sales s
         INNER JOIN restaurants r ON s.restaurant_id = r.id
         WHERE r.organization_id = $1
         AND ($2::text IS NULL OR $2 = '' OR s.restaurant_id = $2)
         AND ($3::text IS NULL OR $3 = '' OR s.product_id = $3)
         AND ($4::timestamptz IS NULL OR s.sale_date >= $4)
         AND ($5::timestamptz IS NULL OR s.sale_date <= $5)`,
        ...baseParams
      )

      const [[revenueRow], [quantityRow], sales, total] = await Promise.all([
        revenueQuery,
        quantityQuery,
        prisma.sale.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            restaurantId: true,
            productId: true,
            quantity: true,
            amount: true,
            saleDate: true,
            saleHour: true,
            createdAt: true,
            restaurant: {
              select: {
                id: true,
                name: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                unitPrice: true,
              },
            },
          },
          orderBy: {
            saleDate: 'desc',
          },
        }),
        prisma.sale.count({ where }),
      ])

      const totalRevenue = Number(revenueRow?.total ?? 0)
      const totalQuantity = Number(quantityRow?.total ?? 0)

      return NextResponse.json({
        sales,
        total,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalQuantity,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    }

    // Format simple (compatibilité avec l'ancien code)
    const limit = limitParam ? parseInt(limitParam) : 100
    const sales = await prisma.sale.findMany({
      where,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            unitPrice: true,
          },
        },
      },
      orderBy: {
        saleDate: 'desc',
      },
      take: limit,
    })

    return NextResponse.json(sales)
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sales
 * Crée une nouvelle vente. Imports dynamiques pour le build.
 */
export async function POST(request: NextRequest) {
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

    const { getCurrentOrganization } = await import('@/lib/auth')
    const { checkApiPermission } = await import('@/lib/auth-role')
    const { prisma } = await import('@/lib/db/prisma')
    const { logger } = await import('@/lib/logger')

    const body = await request.json()
    const validatedData = saleSchema.parse(body)
    const orgIdToUse = authOrgId || body.clerkOrgId

    logger.log('[POST /api/sales] userId:', userId, 'auth().orgId:', authOrgId, 'body.clerkOrgId:', body.clerkOrgId, 'orgIdToUse:', orgIdToUse)

    let organization: any = null

    if (orgIdToUse) {
      organization = await prisma.organization.findUnique({
        where: { clerkOrgId: orgIdToUse },
      })
      
      if (!organization) {
        logger.log('[POST /api/sales] Organisation non trouvée dans la DB, synchronisation depuis Clerk...')
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
          const { logger } = await import('@/lib/logger')
          logger.error('[POST /api/sales] Erreur synchronisation:', error)
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

    const forbidden = await checkApiPermission(userId, organization.clerkOrgId, 'sales:create')
    if (forbidden) return forbidden

    // Vérifier que le restaurant appartient à l'organisation
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: validatedData.restaurantId,
        organizationId: organization.id,
      },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found or does not belong to your organization' },
        { status: 404 }
      )
    }

    // Vérifier que le produit appartient à l'organisation et charger la recette (BOM)
    const product = await prisma.product.findFirst({
      where: {
        id: validatedData.productId,
        organizationId: organization.id,
      },
      include: {
        productIngredients: {
          select: {
            ingredientId: true,
            quantityNeeded: true,
            unit: true,
            ingredient: { select: { unit: true } },
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or does not belong to your organization' },
        { status: 404 }
      )
    }

    // Convertir saleDate en Date si c'est une string
    const saleDate = typeof validatedData.saleDate === 'string'
      ? new Date(validatedData.saleDate)
      : validatedData.saleDate

    const restaurantId = validatedData.restaurantId
    const quantitySold = validatedData.quantity

    // Créer la vente et déduire l'inventaire selon la recette (BOM) dans une transaction
    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          restaurantId,
          productId: validatedData.productId,
          quantity: quantitySold,
          amount: validatedData.amount,
          saleDate,
          saleHour: validatedData.saleHour,
        },
        include: {
          restaurant: {
            select: { id: true, name: true },
          },
          product: {
            select: { id: true, name: true, category: true, unitPrice: true },
          },
        },
      })

      // Déduction des stocks pour chaque ingrédient de la recette (unité recette → unité inventaire)
      const { recipeQuantityToInventoryUnit } = await import('@/lib/units')
      if (product.productIngredients.length > 0) {
        for (const pi of product.productIngredients) {
          const ingredientUnit = pi.ingredient?.unit ?? 'unité'
          const perUnitInInventory = recipeQuantityToInventoryUnit(
            pi.quantityNeeded,
            pi.unit,
            ingredientUnit
          )
          const amountToDeduct = perUnitInInventory * quantitySold
          const inv = await tx.inventory.findUnique({
            where: {
              restaurantId_ingredientId: {
                restaurantId,
                ingredientId: pi.ingredientId,
              },
            },
          })
          if (inv) {
            await tx.inventory.update({
              where: { id: inv.id },
              data: {
                currentStock: { decrement: amountToDeduct },
                lastUpdated: new Date(),
              },
            })
          }
          // Si pas de ligne d'inventaire pour cet ingrédient, on ne crée pas de stock négatif
        }
      }

      return created
    })

    // Relancer les alertes (sans faire échouer la création si les alertes plantent)
    try {
      await runAllAlerts(restaurantId)
    } catch (alertError) {
      logger.error('[POST /api/sales] runAllAlerts:', alertError)
    }

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error creating sale:', error)
    
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
