import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/products/bom/export
 * Exporte toutes les recettes (BOM - Bill of Materials) de l'organisation en JSON.
 * Format: [{ produit, ingrédient, quantité, unité }]. Imports dynamiques pour le build.
 */
export async function GET(request: NextRequest) {
  try {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string | null = null
    try {
      const { auth } = await import('@clerk/nextjs/server')
      userId = auth().userId ?? null
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { getCurrentOrganization, getOrganizationByClerkIdIfMember } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/db/prisma')

    const searchParams = request.nextUrl.searchParams
    const clerkOrgIdFromClient = searchParams.get('clerkOrgId')

    let organization = await getCurrentOrganization()
    if (!organization && clerkOrgIdFromClient) {
      organization = await getOrganizationByClerkIdIfMember(userId, clerkOrgIdFromClient)
    }
    if (!organization) {
      return NextResponse.json(
        {
          error: 'Organisation requise',
          details:
            "Aucune organisation active. Vérifiez qu'une organisation est bien sélectionnée.",
        },
        { status: 400 }
      )
    }

    const productIngredients = await prisma.productIngredient.findMany({
      where: {
        product: {
          organizationId: organization.id,
        },
      },
      include: {
        product: {
          select: { name: true },
        },
        ingredient: {
          select: { name: true, unit: true },
        },
      },
      orderBy: [{ product: { name: 'asc' } }, { ingredient: { name: 'asc' } }],
    })

    const bomData = productIngredients.map((pi) => ({
      produit: pi.product.name,
      ingrédient: pi.ingredient.name,
      quantité: pi.quantityNeeded,
      unité: pi.ingredient.unit,
    }))

    return NextResponse.json({ bom: bomData })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('[GET /api/products/bom/export] Erreur:', error)
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
