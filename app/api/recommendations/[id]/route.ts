import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkApiPermission } from '@/lib/auth-role'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import { runAllAlerts } from '@/lib/services/alerts'
import { logger } from '@/lib/logger'

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
          logger.error('[PATCH /api/recommendations/[id]] Erreur synchronisation:', error)
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
      const data = recommendation.data as Record<string, unknown> | unknown[] | null | undefined
      const items: { ingredientId: string; quantity: number }[] = []

      const readQty = (r: any): number =>
        Number(r?.quantityToOrder ?? r?.recommendedQuantity ?? r?.quantity ?? r?.toOrder ?? 0)

      if (Array.isArray(data)) {
        for (const r of data) {
          const row = r as Record<string, unknown>
          const qty = readQty(r)
          if (row?.ingredientId != null && qty > 0) {
            items.push({ ingredientId: String(row.ingredientId), quantity: qty })
          }
        }
      } else if (data && typeof data === 'object') {
        const ingredients = (data as any).ingredients ?? (data as any).recommendations
        if (Array.isArray(ingredients)) {
          for (const ing of ingredients) {
            const qty = readQty(ing)
            if (ing?.ingredientId && qty > 0) {
              items.push({ ingredientId: String(ing.ingredientId), quantity: qty })
            }
          }
        }
      }

      if (items.length > 0) {
        logger.log('[PATCH /api/recommendations/[id]] Mise à jour inventaire:', items.length, 'ligne(s)')
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
        logger.error('[PATCH /api/recommendations/[id]] runAllAlerts:', alertError)
      }
    } else if (status === 'accepted' && recommendation.type === 'STAFFING') {
      const raw = recommendation.data as unknown
      const data = Array.isArray(raw)
        ? raw
        : (raw && typeof raw === 'object' && 'slots' in raw && Array.isArray((raw as { slots?: unknown }).slots))
          ? (raw as { slots: Array<{ date?: string; timeSlot: string; recommendedStaff: number }> }).slots
          : null
      const restaurantId = recommendation.restaurantId
      if (data && data.length > 0 && restaurantId) {
        const first = data[0] as { date?: string; timeSlot?: string; recommendedStaff?: number }
        const dateStr = (first.date && /^\d{4}-\d{2}-\d{2}$/.test(String(first.date)))
          ? String(first.date)
          : new Date().toISOString().slice(0, 10)
        const planDate = new Date(dateStr + 'T00:00:00.000Z')
        const SLOT_LABELS = ['08:00-12:00', '12:00-14:00', '14:00-18:00', '18:00-22:00'] as const
        for (const item of data as Array<{ timeSlot?: string; recommendedStaff?: number }>) {
          const slot = item.timeSlot
          if (!slot || !SLOT_LABELS.includes(slot as any)) continue
          const count = Math.max(0, Math.floor(Number(item.recommendedStaff)) || 0)
          await prisma.plannedStaffing.upsert({
            where: {
              restaurantId_planDate_slotLabel: { restaurantId, planDate, slotLabel: slot },
            },
            create: { restaurantId, planDate, slotLabel: slot, plannedCount: count },
            update: { plannedCount: count },
          })
        }
        logger.log('[PATCH /api/recommendations/[id]] Effectif prévu enregistré pour', dateStr, restaurantId)
      }
      await prisma.recommendation.update({
        where: { id: params.id },
        data: { status },
      })
      try {
        await runAllAlerts(restaurantId)
      } catch (alertError) {
        logger.error('[PATCH /api/recommendations/[id]] runAllAlerts:', alertError)
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
    logger.error('Error updating recommendation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
