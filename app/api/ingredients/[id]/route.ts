import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Schéma de validation pour la modification
const ingredientSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  unit: z.string().min(1, 'L\'unité est requise'),
  costPerUnit: z.number().positive('Le coût par unité doit être positif'),
  packSize: z.number().positive().optional().nullable(),
  supplierName: z.string().optional().nullable(),
})

/**
 * GET /api/ingredients/[id]
 * Récupère un ingrédient par son ID
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
          console.error('[GET /api/ingredients/[id]] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const ingredient = await prisma.ingredient.findFirst({
      where: {
        id: params.id,
        organizationId: organization.id,
      },
      include: {
        _count: {
          select: {
            productIngredients: true,
            inventory: true,
          },
        },
      },
    })

    if (!ingredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
    }

    return NextResponse.json({ ingredient })
  } catch (error) {
    console.error('Error fetching ingredient:', error)
    return NextResponse.json(
      { error: 'Error fetching ingredient', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/ingredients/[id]
 * Modifie un ingrédient
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
          console.error('[PATCH /api/ingredients/[id]] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Vérifier que l'ingrédient existe et appartient à l'organisation
    const existingIngredient = await prisma.ingredient.findFirst({
      where: {
        id: params.id,
        organizationId: organization.id,
      },
    })

    if (!existingIngredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
    }

    // Retirer clerkOrgId du body avant validation
    const { clerkOrgId, ...bodyWithoutOrgId } = body as any
    const bodyToValidate = bodyWithoutOrgId
    
    // Valider les données
    const validatedData = ingredientSchema.parse(bodyToValidate)

    // Vérifier si un autre ingrédient avec le même nom existe déjà
    if (validatedData.name !== existingIngredient.name) {
      const duplicateIngredient = await prisma.ingredient.findFirst({
        where: {
          organizationId: organization.id,
          name: validatedData.name,
          id: { not: params.id },
        },
      })

      if (duplicateIngredient) {
        return NextResponse.json(
          { error: 'Un ingrédient avec ce nom existe déjà' },
          { status: 400 }
        )
      }
    }

    // Mettre à jour l'ingrédient
    const ingredient = await prisma.ingredient.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        unit: validatedData.unit,
        costPerUnit: validatedData.costPerUnit,
        packSize: validatedData.packSize || null,
        supplierName: validatedData.supplierName || null,
      },
    })

    return NextResponse.json({
      ingredient,
      message: 'Ingrédient modifié avec succès',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating ingredient:', error)
    return NextResponse.json(
      { error: 'Error updating ingredient', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/ingredients/[id]
 * Supprime un ingrédient
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
          console.error('[DELETE /api/ingredients/[id]] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Vérifier que l'ingrédient existe et appartient à l'organisation
    const ingredient = await prisma.ingredient.findFirst({
      where: {
        id: params.id,
        organizationId: organization.id,
      },
      include: {
        _count: {
          select: {
            productIngredients: true,
            inventory: true,
          },
        },
      },
    })

    if (!ingredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
    }

    // Vérifier s'il y a des recettes ou des stocks associés
    if (ingredient._count.productIngredients > 0) {
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer cet ingrédient',
          details: `Cet ingrédient est utilisé dans ${ingredient._count.productIngredients} recette(s). Supprimez d'abord les recettes associées.`,
        },
        { status: 400 }
      )
    }

    if (ingredient._count.inventory > 0) {
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer cet ingrédient',
          details: `Cet ingrédient a ${ingredient._count.inventory} stock(s) associé(s). Supprimez d'abord les stocks.`,
        },
        { status: 400 }
      )
    }

    // Supprimer l'ingrédient
    await prisma.ingredient.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Ingrédient supprimé avec succès',
    })
  } catch (error) {
    console.error('Error deleting ingredient:', error)
    return NextResponse.json(
      { error: 'Error deleting ingredient', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
