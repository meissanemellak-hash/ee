import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Schéma de validation pour la création/modification (zod uniquement en tête pour le build)
const ingredientSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  unit: z.string().min(1, 'L\'unité est requise'),
  costPerUnit: z.number().positive('Le coût par unité doit être positif'),
  packSize: z.number().positive().optional().nullable(),
  supplierName: z.string().optional().nullable(),
  clerkOrgId: z.string().optional(), // Accepté depuis le client si auth().orgId est undefined
})

/**
 * GET /api/ingredients
 * Liste tous les ingrédients de l'organisation. Imports dynamiques pour le build.
 */
export async function GET(request: NextRequest) {
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

    const { prisma } = await import('@/lib/db/prisma')
    const { logger } = await import('@/lib/logger')

    // Accepter clerkOrgId depuis les paramètres de requête si auth().orgId est undefined
    const searchParams = request.nextUrl.searchParams
    const clerkOrgIdFromQuery = searchParams.get('clerkOrgId')
    const orgIdToUse = authOrgId || clerkOrgIdFromQuery

    logger.log('[GET /api/ingredients] userId:', userId, 'auth().orgId:', authOrgId, 'query.clerkOrgId:', clerkOrgIdFromQuery, 'orgIdToUse:', orgIdToUse)

    let organization: any = null

    // Si orgIdToUse est défini, chercher directement dans la DB
    if (orgIdToUse) {
      organization = await prisma.organization.findUnique({
        where: { clerkOrgId: orgIdToUse },
      })
      
      // Si pas trouvée, essayer de synchroniser
      if (!organization) {
        logger.log('[GET /api/ingredients] Organisation non trouvée dans la DB, synchronisation depuis Clerk...')
        try {
          const { clerkClient } = await import('@clerk/nextjs/server')
          const client = await clerkClient()
          const clerkOrg = await client.organizations.getOrganization({ organizationId: orgIdToUse })
          
          // Vérifier que l'utilisateur est membre
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
          logger.error('[GET /api/ingredients] Erreur synchronisation:', error)
        }
      }
    } else {
      // Fallback : utiliser getCurrentOrganization()
      const { getCurrentOrganization } = await import('@/lib/auth')
      organization = await getCurrentOrganization()
      
      if (!organization && authOrgId) {
        await new Promise(resolve => setTimeout(resolve, 500))
        organization = await getCurrentOrganization()
      }
    }
    
    if (!organization) {
      logger.error('[GET /api/ingredients] Organisation non trouvée. authOrgId:', authOrgId, 'query.clerkOrgId:', clerkOrgIdFromQuery, 'orgIdToUse:', orgIdToUse)
      
      if (orgIdToUse) {
        logger.error('[GET /api/ingredients] ERREUR: orgIdToUse était défini mais organisation non trouvée après synchronisation')
      }
      
      return NextResponse.json({ 
        error: 'Organization not found',
        details: orgIdToUse 
          ? 'L\'organisation existe dans Clerk mais n\'a pas pu être synchronisée dans la base de données. Veuillez rafraîchir la page.'
          : 'Aucune organisation active. Veuillez sélectionner une organisation.'
      }, { status: 404 })
    }
    
    logger.log('[GET /api/ingredients] Organisation trouvée:', organization.name, organization.id)

    // Récupérer les paramètres de recherche et filtres
    const search = searchParams.get('search') || ''
    const unit = searchParams.get('unit') || ''
    const restaurantId = searchParams.get('restaurantId') || ''
    
    // Vérifier que le restaurant appartient à l'organisation si restaurantId fourni
    let validRestaurantId: string | null = null
    if (restaurantId) {
      const restaurant = await prisma.restaurant.findFirst({
        where: { id: restaurantId, organizationId: organization.id },
        select: { id: true },
      })
      validRestaurantId = restaurant?.id ?? null
    }
    
    // Construire la requête avec filtres
    const where: any = {
      organizationId: organization.id,
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      }
    }

    if (unit) {
      where.unit = unit
    }

    const ingredients = await prisma.ingredient.findMany({
      where,
      orderBy: [
        { unit: 'asc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: {
            productIngredients: true,
            inventory: validRestaurantId
              ? { where: { restaurantId: validRestaurantId } }
              : true,
          },
        },
      },
    })

    // Récupérer les unités uniques pour les filtres
    const units = await prisma.ingredient.findMany({
      where: { organizationId: organization.id },
      select: { unit: true },
      distinct: ['unit'],
    })

    return NextResponse.json({
      ingredients,
      units: units.map(u => u.unit).filter((u): u is string => u !== null && u !== ''),
    })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error fetching ingredients:', error)
    return NextResponse.json(
      { error: 'Error fetching ingredients', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ingredients
 * Crée un nouvel ingrédient. Imports dynamiques pour le build.
 */
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
    const { logger } = await import('@/lib/logger')

    const body = await request.json()
    
    // Valider les données
    const validatedData = ingredientSchema.parse(body)

    // Utiliser clerkOrgId depuis le body si auth().orgId est undefined
    const orgIdToUse = authOrgId || validatedData.clerkOrgId

    logger.log('[POST /api/ingredients] userId:', userId, 'auth().orgId:', authOrgId, 'body.clerkOrgId:', validatedData.clerkOrgId, 'orgIdToUse:', orgIdToUse)

    if (!orgIdToUse) {
      return NextResponse.json({ 
        error: 'Organization not found',
        details: 'Aucune organisation active. Veuillez sélectionner une organisation.'
      }, { status: 404 })
    }

    const forbidden = await checkApiPermission(userId, orgIdToUse, 'ingredients:create')
    if (forbidden) return forbidden

    // Récupérer ou créer l'organisation
    let organization = await prisma.organization.findUnique({
      where: { clerkOrgId: orgIdToUse },
    })

    // Si l'organisation n'existe pas dans la DB, la créer depuis Clerk
    if (!organization) {
      logger.log('[POST /api/ingredients] Organisation non trouvée dans la DB, synchronisation depuis Clerk...')
      try {
        const { clerkClient } = await import('@clerk/nextjs/server')
        const client = await clerkClient()
        const clerkOrg = await client.organizations.getOrganization({ organizationId: orgIdToUse })
        
        // Vérifier que l'utilisateur est membre de cette organisation
        const userMemberships = await client.users.getOrganizationMembershipList({ userId })
        const isMember = userMemberships.data?.some(m => m.organization.id === orgIdToUse)
        
        if (!isMember) {
          return NextResponse.json({ 
            error: 'Forbidden',
            details: 'Vous n\'êtes pas membre de cette organisation.'
          }, { status: 403 })
        }

        // Créer l'organisation dans la DB
        try {
          organization = await prisma.organization.create({
            data: {
              name: clerkOrg.name,
              clerkOrgId: orgIdToUse,
              shrinkPct: 0.1,
            },
          })
          logger.log(`✅ Organisation "${organization.name}" créée dans la DB`)
        } catch (dbError) {
          // Si l'organisation existe déjà (race condition), la récupérer
          if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
            organization = await prisma.organization.findUnique({
              where: { clerkOrgId: orgIdToUse },
            })
          } else {
            throw dbError
          }
        }
      } catch (error) {
        logger.error('[POST /api/ingredients] Erreur lors de la synchronisation:', error)
        logger.error('[POST /api/ingredients] Détails de l\'erreur:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          orgIdToUse,
        })
        
        // Réessayer une dernière fois de récupérer l'organisation
        organization = await prisma.organization.findUnique({
          where: { clerkOrgId: orgIdToUse },
        })
        
        if (!organization) {
          return NextResponse.json({ 
            error: 'Organization sync failed',
            details: error instanceof Error ? error.message : 'Impossible de synchroniser l\'organisation. Veuillez réessayer.'
          }, { status: 500 })
        }
      }
    }
    
    if (!organization) {
      logger.error('[POST /api/ingredients] Organisation non trouvée après synchronisation. orgIdToUse:', orgIdToUse)
      return NextResponse.json({ 
        error: 'Organization not found',
        details: 'L\'organisation n\'a pas pu être synchronisée. Veuillez rafraîchir la page.'
      }, { status: 404 })
    }

    // Vérifier si un ingrédient avec le même nom existe déjà
    const existingIngredient = await prisma.ingredient.findFirst({
      where: {
        organizationId: organization.id,
        name: validatedData.name,
      },
    })

    if (existingIngredient) {
      return NextResponse.json(
        { error: 'Un ingrédient avec ce nom existe déjà' },
        { status: 400 }
      )
    }

    // Créer l'ingrédient
    const ingredient = await prisma.ingredient.create({
      data: {
        organizationId: organization.id,
        name: validatedData.name,
        unit: validatedData.unit,
        costPerUnit: validatedData.costPerUnit,
        packSize: validatedData.packSize || null,
        supplierName: validatedData.supplierName || null,
      },
    })

    return NextResponse.json({
      ingredient,
      message: 'Ingrédient créé avec succès',
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    const { logger } = await import('@/lib/logger')
    logger.error('Error creating ingredient:', error)
    return NextResponse.json(
      { error: 'Error creating ingredient', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
