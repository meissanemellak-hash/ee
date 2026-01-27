import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import { saleSchema } from '@/lib/validations/sales'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

/**
 * GET /api/sales/[id]
 * Récupère une vente spécifique
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
          console.error('[GET /api/sales/[id]] Erreur synchronisation:', error)
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
    console.error('Error fetching sale:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/sales/[id]
 * Met à jour une vente
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, orgId: authOrgId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clerkOrgId, ...updateData } = body
    const orgIdToUse = authOrgId || clerkOrgId

    console.log('[PATCH /api/sales/[id]] userId:', userId, 'auth().orgId:', authOrgId, 'body.clerkOrgId:', clerkOrgId, 'orgIdToUse:', orgIdToUse)

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
          console.error('[PATCH /api/sales/[id]] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      console.error('[PATCH /api/sales/[id]] Organisation non trouvée. authOrgId:', authOrgId, 'body.clerkOrgId:', clerkOrgId, 'orgIdToUse:', orgIdToUse)
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

    // Vérifier que la vente existe et appartient à l'organisation
    const existing = await prisma.sale.findFirst({
      where: {
        id: params.id,
        restaurant: {
          organizationId: organization.id,
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

      // Vérifier produit si modifié
      if (validatedData.productId) {
        const product = await prisma.product.findFirst({
          where: {
            id: validatedData.productId,
            organizationId: organization.id,
          },
        })

        if (!product) {
          return NextResponse.json(
            { error: 'Product not found or does not belong to your organization' },
            { status: 404 }
          )
        }
      }

      // Convertir saleDate en Date si c'est une string
      if (validatedData.saleDate) {
        validatedData.saleDate = typeof validatedData.saleDate === 'string' 
          ? new Date(validatedData.saleDate) 
          : validatedData.saleDate
      }

      // Mettre à jour la vente
      const sale = await prisma.sale.update({
        where: { id: params.id },
        data: validatedData,
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

      return NextResponse.json(sale)
    }

    return NextResponse.json(existing)
  } catch (error) {
    console.error('Error updating sale:', error)
    
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
 * Supprime une vente
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
          console.error('[DELETE /api/sales/[id]] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      console.error('[DELETE /api/sales/[id]] Organisation non trouvée. authOrgId:', authOrgId, 'query.clerkOrgId:', clerkOrgIdFromQuery, 'orgIdToUse:', orgIdToUse)
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

    // Vérifier que la vente existe et appartient à l'organisation
    const sale = await prisma.sale.findFirst({
      where: {
        id: params.id,
        restaurant: {
          organizationId: organization.id,
        },
      },
    })

    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      )
    }

    await prisma.sale.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Sale deleted successfully' })
  } catch (error) {
    console.error('Error deleting sale:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
