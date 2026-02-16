import { NextRequest, NextResponse } from 'next/server'
import { saleSchema } from '@/lib/validations/sales'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

/**
 * GET /api/sales/[id]
 * Récupère une vente spécifique. Imports dynamiques pour le build.
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
          logger.error('[GET /api/sales/[id]] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      )
    }

    const sale = await prisma.sale.findFirst({
      where: {
        id: params.id,
        restaurant: {
          organizationId: organization.id,
        },
      },
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
    })

    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(sale)
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error fetching sale:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/sales/[id]
 * Met à jour une vente. Imports dynamiques pour le build.
 */
export async function PATCH(
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
    const { recipeQuantityToInventoryUnit } = await import('@/lib/units')

    const body = await request.json()
    const { clerkOrgId, ...updateData } = body
    const orgIdToUse = authOrgId || clerkOrgId

    logger.log('[PATCH /api/sales/[id]] userId:', userId, 'auth().orgId:', authOrgId, 'body.clerkOrgId:', clerkOrgId, 'orgIdToUse:', orgIdToUse)

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
          logger.error('[PATCH /api/sales/[id]] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      logger.error('[PATCH /api/sales/[id]] Organisation non trouvée. authOrgId:', authOrgId, 'body.clerkOrgId:', clerkOrgId, 'orgIdToUse:', orgIdToUse)
      return NextResponse.json(
        { 
          error: 'Organization not found',
          details: orgIdToUse 
            ? 'L\'organisation existe dans Clerk mais n\'a pas pu être synchronisée dans la base de données. Veuillez rafraîchir la page.'
            : 'Aucune organisation active. Veuillez sélectionner une organisation.'
        },
        { status: 404 }
      )
    }

    const forbidden = await checkApiPermission(userId, organization.clerkOrgId, 'sales:edit')
    if (forbidden) return forbidden

    // Vérifier que la vente existe et appartient à l'organisation (avec recette pour ajustement stock)
    const existing = await prisma.sale.findFirst({
      where: {
        id: params.id,
        restaurant: {
          organizationId: organization.id,
        },
      },
      include: {
        product: {
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
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      )
    }

    // Valider les données si présentes
    if (Object.keys(updateData).length > 0) {
      const validatedData = saleSchema.partial().parse(updateData)

      // Vérifier restaurant si modifié
      if (validatedData.restaurantId) {
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
      }

      // Vérifier produit si modifié et charger sa recette
      let newProduct: typeof existing.product | null = null
      if (validatedData.productId) {
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
        newProduct = product
      }

      // Convertir saleDate en Date si c'est une string
      if (validatedData.saleDate) {
        validatedData.saleDate = typeof validatedData.saleDate === 'string'
          ? new Date(validatedData.saleDate)
          : validatedData.saleDate
      }

      const restaurantId = validatedData.restaurantId ?? existing.restaurantId
      const quantityOrProductChanged =
        validatedData.quantity !== undefined || validatedData.productId !== undefined
      const newQuantity = validatedData.quantity ?? existing.quantity
      const productForDeduction = newProduct ?? existing.product

      const sale = await prisma.$transaction(async (tx) => {
        // Si quantité ou produit a changé : remonter l'ancienne déduction puis déduire la nouvelle
        if (quantityOrProductChanged) {
          // Remonter les stocks pour l'ancienne vente (ancien produit × ancienne quantité, en unité inventaire)
          if (existing.product.productIngredients.length > 0) {
            const oldRestaurantId = existing.restaurantId
            for (const pi of existing.product.productIngredients) {
              const ingredientUnit = pi.ingredient?.unit ?? 'unité'
              const perUnitInInventory = recipeQuantityToInventoryUnit(
                pi.quantityNeeded,
                pi.unit,
                ingredientUnit
              )
              const amountToRestore = perUnitInInventory * existing.quantity
              const inv = await tx.inventory.findUnique({
                where: {
                  restaurantId_ingredientId: {
                    restaurantId: oldRestaurantId,
                    ingredientId: pi.ingredientId,
                  },
                },
              })
              if (inv) {
                await tx.inventory.update({
                  where: { id: inv.id },
                  data: {
                    currentStock: { increment: amountToRestore },
                    lastUpdated: new Date(),
                  },
                })
              }
            }
          }

          // Déduire pour la nouvelle vente (nouveau produit × nouvelle quantité, en unité inventaire)
          if (productForDeduction.productIngredients.length > 0) {
            for (const pi of productForDeduction.productIngredients) {
              const ingredientUnit = pi.ingredient?.unit ?? 'unité'
              const perUnitInInventory = recipeQuantityToInventoryUnit(
                pi.quantityNeeded,
                pi.unit,
                ingredientUnit
              )
              const amountToDeduct = perUnitInInventory * newQuantity
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
            }
          }
        }

        return tx.sale.update({
          where: { id: params.id },
          data: validatedData,
          include: {
            restaurant: {
              select: { id: true, name: true },
            },
            product: {
              select: { id: true, name: true, category: true, unitPrice: true },
            },
          },
        })
      })

      try {
        const { runAllAlerts } = await import('@/lib/services/alerts')
        await runAllAlerts(restaurantId)
      } catch (alertError) {
        logger.error('[PATCH /api/sales/[id]] runAllAlerts:', alertError)
      }

      return NextResponse.json(sale)
    }

    return NextResponse.json(existing)
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error updating sale:', error)
    
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

/**
 * DELETE /api/sales/[id]
 * Supprime une vente. Imports dynamiques pour le build.
 */
export async function DELETE(
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
    const { recipeQuantityToInventoryUnit } = await import('@/lib/units')

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
          logger.error('[DELETE /api/sales/[id]] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      logger.error('[DELETE /api/sales/[id]] Organisation non trouvée. authOrgId:', authOrgId, 'query.clerkOrgId:', clerkOrgIdFromQuery, 'orgIdToUse:', orgIdToUse)
      return NextResponse.json(
        { 
          error: 'Organization not found',
          details: orgIdToUse 
            ? 'L\'organisation existe dans Clerk mais n\'a pas pu être synchronisée dans la base de données. Veuillez rafraîchir la page.'
            : 'Aucune organisation active. Veuillez sélectionner une organisation.'
        },
        { status: 404 }
      )
    }

    const forbidden = await checkApiPermission(userId, organization.clerkOrgId, 'sales:delete')
    if (forbidden) return forbidden

    // Récupérer la vente avec la recette du produit pour remonter les stocks
    const sale = await prisma.sale.findFirst({
      where: {
        id: params.id,
        restaurant: {
          organizationId: organization.id,
        },
      },
      include: {
        product: {
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
        },
      },
    })

    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      )
    }

    const restaurantId = sale.restaurantId

    await prisma.$transaction(async (tx) => {
      // Remonter les stocks : ajouter back la quantité déduite à la création (en unité inventaire)
      if (sale.product.productIngredients.length > 0) {
        for (const pi of sale.product.productIngredients) {
          const ingredientUnit = pi.ingredient?.unit ?? 'unité'
          const perUnitInInventory = recipeQuantityToInventoryUnit(
            pi.quantityNeeded,
            pi.unit,
            ingredientUnit
          )
          const amountToRestore = perUnitInInventory * sale.quantity
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
                currentStock: { increment: amountToRestore },
                lastUpdated: new Date(),
              },
            })
          }
        }
      }
      await tx.sale.delete({
        where: { id: params.id },
      })
    })

    try {
      const { runAllAlerts } = await import('@/lib/services/alerts')
      await runAllAlerts(restaurantId)
    } catch (alertError) {
      logger.error('[DELETE /api/sales/[id]] runAllAlerts:', alertError)
    }

    return NextResponse.json({ message: 'Sale deleted successfully' })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error deleting sale:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
