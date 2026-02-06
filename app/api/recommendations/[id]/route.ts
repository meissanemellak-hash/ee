import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkApiPermission } from '@/lib/auth-role'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import { runAllAlerts } from '@/lib/services/alerts'

export const dynamic = 'force-dynamic'

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
    const { clerkOrgId } = body
    const orgIdToUse = authOrgId || clerkOrgId

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
          console.error('[PATCH /api/recommendations/[id]] Erreur synchronisation:', error)
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

    const forbidden = await checkApiPermission(userId, organization.clerkOrgId, 'recommendations:accept')
    if (forbidden) return forbidden

    const { status } = body

    if (!status || !['pending', 'accepted', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, accepted, or dismissed' },
        { status: 400 }
      )
    }

    // Vérifier que la recommandation appartient à l'organisation
    const recommendation = await prisma.recommendation.findFirst({
      where: {
        id: params.id,
        restaurant: {
          organizationId: organization.id,
        },
      },
    })

    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      )
    }

    const restaurantId = recommendation.restaurantId

    // Quand on accepte une recommandation de type ORDER, appliquer la réception de commande (mise à jour inventaire)
    if (status === 'accepted' && recommendation.type === 'ORDER') {
      const data = recommendation.data as any
      const items: { ingredientId: string; quantity: number }[] = []

      if (Array.isArray(data)) {
        for (const r of data) {
          if (r?.ingredientId && (r.recommendedQuantity ?? 0) > 0) {
            items.push({ ingredientId: r.ingredientId, quantity: Number(r.recommendedQuantity) })
          }
        }
      } else if (data?.ingredients && Array.isArray(data.ingredients)) {
        for (const ing of data.ingredients) {
          if (ing?.ingredientId && (ing.quantityToOrder ?? 0) > 0) {
            items.push({ ingredientId: ing.ingredientId, quantity: Number(ing.quantityToOrder) })
          }
        }
      }

      await prisma.$transaction(async (tx) => {
        for (const { ingredientId, quantity } of items) {
          const inv = await tx.inventory.findUnique({
            where: {
              restaurantId_ingredientId: { restaurantId, ingredientId },
            },
          })
          if (inv) {
            await tx.inventory.update({
              where: { id: inv.id },
              data: {
                currentStock: { increment: quantity },
                lastUpdated: new Date(),
              },
            })
          } else {
            const ingredient = await tx.ingredient.findUnique({ where: { id: ingredientId } })
            if (ingredient) {
              await tx.inventory.create({
                data: {
                  restaurantId,
                  ingredientId,
                  currentStock: quantity,
                  minThreshold: 0,
                  lastUpdated: new Date(),
                },
              })
            }
          }
        }
        await tx.recommendation.update({
          where: { id: params.id },
          data: { status },
        })
      })

      try {
        await runAllAlerts(restaurantId)
      } catch (alertError) {
        console.error('[PATCH /api/recommendations/[id]] runAllAlerts:', alertError)
      }
    } else {
      await prisma.recommendation.update({
        where: { id: params.id },
        data: { status },
      })
    }

    const updated = await prisma.recommendation.findUnique({
      where: { id: params.id },
      include: { restaurant: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating recommendation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
