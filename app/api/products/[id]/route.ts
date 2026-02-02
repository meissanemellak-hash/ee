import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkApiPermission } from '@/lib/auth-role'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Schéma de validation pour la modification
const productSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  category: z.string().optional().nullable(),
  unitPrice: z.number().positive('Le prix doit être positif'),
})

/**
 * GET /api/products/[id]
 * Récupère un produit par son ID
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

    // Accepter clerkOrgId depuis les paramètres de requête
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
          console.error('[GET /api/products/[id]] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        organizationId: organization.id,
      },
      include: {
        _count: {
          select: {
            sales: true,
            productIngredients: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Error fetching product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/products/[id]
 * Modifie un produit
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
    const clerkOrgIdFromBody = (body as any).clerkOrgId
    const orgIdToUse = authOrgId || clerkOrgIdFromBody

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
          console.error('[PATCH /api/products/[id]] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Vérifier que le produit existe et appartient à l'organisation
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: params.id,
        organizationId: organization.id,
      },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Retirer clerkOrgId du body avant validation
    const { clerkOrgId, ...bodyWithoutOrgId } = body as any
    const bodyToValidate = bodyWithoutOrgId
    
    // Valider les données
    const validatedData = productSchema.parse(bodyToValidate)

    // Vérifier si un autre produit avec le même nom existe déjà
    if (validatedData.name !== existingProduct.name) {
      const duplicateProduct = await prisma.product.findFirst({
        where: {
          organizationId: organization.id,
          name: validatedData.name,
          id: { not: params.id },
        },
      })

      if (duplicateProduct) {
        return NextResponse.json(
          { error: 'Un produit avec ce nom existe déjà' },
          { status: 400 }
        )
      }
    }

    // Mettre à jour le produit
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        category: validatedData.category || null,
        unitPrice: validatedData.unitPrice,
      },
    })

    return NextResponse.json({
      product,
      message: 'Produit modifié avec succès',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Error updating product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/products/[id]
 * Supprime un produit
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
    let clerkOrgIdFromQuery = searchParams.get('clerkOrgId')
    if (!clerkOrgIdFromQuery) {
      try {
        const body = await request.json()
        clerkOrgIdFromQuery = (body as { clerkOrgId?: string })?.clerkOrgId ?? null
      } catch {
        /* body vide ou invalide */
      }
    }
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
          console.error('[DELETE /api/products/[id]] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const clerkOrgId = orgIdToUse || organization.clerkOrgId
    const forbidden = await checkApiPermission(userId, clerkOrgId, 'products:delete')
    if (forbidden) return forbidden

    // Vérifier que le produit existe et appartient à l'organisation
    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        organizationId: organization.id,
      },
      include: {
        _count: {
          select: {
            sales: true,
            productIngredients: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Vérifier s'il y a des ventes associées
    if (product._count.sales > 0) {
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer ce produit',
          details: `Ce produit a ${product._count.sales} vente(s) associée(s). Supprimez d'abord les ventes.`,
        },
        { status: 400 }
      )
    }

    // Supprimer le produit (les recettes seront supprimées automatiquement via onDelete: Cascade)
    await prisma.product.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Produit supprimé avec succès',
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Error deleting product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
