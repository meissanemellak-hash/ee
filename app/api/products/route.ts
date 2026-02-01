import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { requirePermission } from '@/lib/auth-role'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Schéma de validation pour la création/modification
const productSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  category: z.string().optional().nullable(),
  unitPrice: z.number().positive('Le prix doit être positif'),
  clerkOrgId: z.string().optional(), // Accepté depuis le client si auth().orgId est undefined
})

/**
 * GET /api/products
 * Liste tous les produits de l'organisation
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId: authOrgId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Accepter clerkOrgId depuis les paramètres de requête si auth().orgId est undefined
    const searchParams = request.nextUrl.searchParams
    const clerkOrgIdFromQuery = searchParams.get('clerkOrgId')
    const orgIdToUse = authOrgId || clerkOrgIdFromQuery

    console.log('[GET /api/products] userId:', userId, 'auth().orgId:', authOrgId, 'query.clerkOrgId:', clerkOrgIdFromQuery, 'orgIdToUse:', orgIdToUse)

    let organization: any = null

    // Si orgIdToUse est défini, chercher directement dans la DB
    if (orgIdToUse) {
      organization = await prisma.organization.findUnique({
        where: { clerkOrgId: orgIdToUse },
      })
      
      // Si pas trouvée, essayer de synchroniser
      if (!organization) {
        console.log('[GET /api/products] Organisation non trouvée dans la DB, synchronisation depuis Clerk...')
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
              console.log(`✅ Organisation "${organization.name}" synchronisée`)
            } catch (dbError) {
              if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
                organization = await prisma.organization.findUnique({
                  where: { clerkOrgId: orgIdToUse },
                })
              }
            }
          }
        } catch (error) {
          console.error('[GET /api/products] Erreur synchronisation:', error)
        }
      }
    } else {
      // Fallback : utiliser getCurrentOrganization()
      organization = await getCurrentOrganization()
      
      if (!organization && authOrgId) {
        await new Promise(resolve => setTimeout(resolve, 500))
        organization = await getCurrentOrganization()
      }
    }
    
    if (!organization) {
      console.error('[GET /api/products] Organisation non trouvée. authOrgId:', authOrgId, 'query.clerkOrgId:', clerkOrgIdFromQuery, 'orgIdToUse:', orgIdToUse)
      
      // Si orgIdToUse était défini mais l'organisation n'a pas pu être trouvée/créée, c'est un problème
      if (orgIdToUse) {
        console.error('[GET /api/products] ERREUR: orgIdToUse était défini mais organisation non trouvée après synchronisation')
      }
      
      return NextResponse.json({ 
        error: 'Organization not found',
        details: orgIdToUse 
          ? 'L\'organisation existe dans Clerk mais n\'a pas pu être synchronisée dans la base de données. Veuillez rafraîchir la page.'
          : 'Aucune organisation active. Veuillez sélectionner une organisation.'
      }, { status: 404 })
    }
    
    console.log('[GET /api/products] Organisation trouvée:', organization.name, organization.id)

    // Récupérer les paramètres de recherche et filtres
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const restaurantIdParam = searchParams.get('restaurantId') || ''
    const usePagination = pageParam !== null || limitParam !== null

    // Vérifier que le restaurant appartient à l'organisation si restaurantId fourni
    let validRestaurantId: string | null = null
    if (restaurantIdParam) {
      const restaurant = await prisma.restaurant.findFirst({
        where: { id: restaurantIdParam, organizationId: organization.id },
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

    if (category) {
      where.category = category
    }

    // Récupérer les catégories uniques pour les filtres
    const categoriesResult = await prisma.product.findMany({
      where: { organizationId: organization.id },
      select: { category: true },
      distinct: ['category'],
    })
    const categories = categoriesResult
      .map(c => c.category)
      .filter((c): c is string => c !== null && c !== '')

    if (usePagination) {
      const page = parseInt(pageParam || '1')
      const limit = parseInt(limitParam || '50')
      const skip = (page - 1) * limit

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: [
            { category: 'asc' },
            { name: 'asc' },
          ],
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            category: true,
            unitPrice: true,
            createdAt: true,
            _count: {
              select: {
                sales: validRestaurantId
                  ? { where: { restaurantId: validRestaurantId } }
                  : true,
                productIngredients: true,
              },
            },
          },
        }),
        prisma.product.count({ where }),
      ])

      return NextResponse.json({
        products,
        categories,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    }

    // Format simple (compatibilité avec l'ancien code)
    const products = await prisma.product.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: {
            sales: validRestaurantId
              ? { where: { restaurantId: validRestaurantId } }
              : true,
            productIngredients: true,
          },
        },
      },
    })

    return NextResponse.json({
      products,
      categories,
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Error fetching products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products
 * Crée un nouveau produit
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId: authOrgId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Valider les données
    const validatedData = productSchema.parse(body)

    // Utiliser clerkOrgId depuis le body si auth().orgId est undefined
    const orgIdToUse = authOrgId || validatedData.clerkOrgId

    console.log('[POST /api/products] userId:', userId, 'auth().orgId:', authOrgId, 'body.clerkOrgId:', validatedData.clerkOrgId, 'orgIdToUse:', orgIdToUse)

    if (!orgIdToUse) {
      return NextResponse.json({ 
        error: 'Organization not found',
        details: 'Aucune organisation active. Veuillez sélectionner une organisation.'
      }, { status: 404 })
    }

    // Récupérer ou créer l'organisation
    let organization = await prisma.organization.findUnique({
      where: { clerkOrgId: orgIdToUse },
    })

    // Si l'organisation n'existe pas dans la DB, la créer depuis Clerk
    if (!organization) {
      console.log('[POST /api/products] Organisation non trouvée dans la DB, synchronisation depuis Clerk...')
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
          console.log(`✅ Organisation "${organization.name}" créée dans la DB`)
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
        console.error('[POST /api/products] Erreur lors de la synchronisation:', error)
        console.error('[POST /api/products] Détails de l\'erreur:', {
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
    
    const allowed = await requirePermission(userId, orgIdToUse, 'products:create')
    if (!allowed) {
      return NextResponse.json(
        { error: 'Accès refusé. Seul un admin ou manager peut créer un produit.' },
        { status: 403 }
      )
    }

    if (!organization) {
      console.error('[POST /api/products] Organisation non trouvée après synchronisation. orgIdToUse:', orgIdToUse)
      // Dernière tentative : chercher toutes les organisations de l'utilisateur
      try {
        const { clerkClient } = await import('@clerk/nextjs/server')
        const client = await clerkClient()
        const userMemberships = await client.users.getOrganizationMembershipList({ userId })
        const matchingOrg = userMemberships.data?.find(m => m.organization.id === orgIdToUse)
        
        if (matchingOrg) {
          // L'organisation existe dans Clerk, chercher dans la DB avec tous les IDs possibles
          const allOrgs = await prisma.organization.findMany({
            where: {
              clerkOrgId: {
                in: userMemberships.data?.map(m => m.organization.id) || [],
              },
            },
          })
          console.log('[POST /api/products] Organisations trouvées dans la DB:', allOrgs.map(o => ({ id: o.id, name: o.name, clerkOrgId: o.clerkOrgId })))
        }
      } catch (debugError) {
        console.error('[POST /api/products] Erreur lors du debug:', debugError)
      }
      
      return NextResponse.json({ 
        error: 'Organization not found',
        details: 'L\'organisation n\'a pas pu être synchronisée. Veuillez rafraîchir la page.'
      }, { status: 404 })
    }

    // Vérifier si un produit avec le même nom existe déjà
    const existingProduct = await prisma.product.findFirst({
      where: {
        organizationId: organization.id,
        name: validatedData.name,
      },
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Un produit avec ce nom existe déjà' },
        { status: 400 }
      )
    }

    // Créer le produit
    const product = await prisma.product.create({
      data: {
        organizationId: organization.id,
        name: validatedData.name,
        category: validatedData.category || null,
        unitPrice: validatedData.unitPrice,
      },
    })

    return NextResponse.json({
      product,
      message: 'Produit créé avec succès',
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Error creating product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
