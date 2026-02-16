import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/stripe/cancel-subscription
 * Annule l'abonnement à la fin de la période en cours. Imports dynamiques pour le build.
 */
export async function POST() {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { getCurrentOrganization } = await import('@/lib/auth')
  const { getStripe } = await import('@/lib/stripe')
  const { prisma } = await import('@/lib/db/prisma')
  const { logger } = await import('@/lib/logger')

  let organization = await getCurrentOrganization()
  if (!organization) {
    try {
      const { auth, clerkClient } = await import('@clerk/nextjs/server')
      const { userId } = auth()
      if (userId) {
        const client = await clerkClient()
        const memberships = await client.users.getOrganizationMembershipList({ userId })
        if (memberships.data?.length) {
          for (const m of memberships.data) {
            const org = await prisma.organization.findUnique({
              where: { clerkOrgId: m.organization.id },
            })
            if (org) {
              const sub = await prisma.subscription.findUnique({
                where: { organizationId: org.id },
                select: { stripeSubscriptionId: true },
              })
              if (sub?.stripeSubscriptionId) {
                organization = org
                break
              }
            }
          }
          if (!organization) {
            const first = memberships.data[0].organization
            organization = await prisma.organization.findUnique({
              where: { clerkOrgId: first.id },
            })
            if (!organization) {
              organization = await prisma.organization.create({
                data: { name: first.name, clerkOrgId: first.id, shrinkPct: 0.1 },
              })
            }
          }
        }
      }
    } catch (e) {
      logger.error('[stripe/cancel-subscription] Fallback org:', e)
    }
  }
  if (!organization) {
    return NextResponse.json(
      { error: 'Aucune organisation sélectionnée' },
      { status: 400 }
    )
  }

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe n\'est pas configuré' },
      { status: 500 }
    )
  }

  const sub = await prisma.subscription.findUnique({
    where: { organizationId: organization.id },
    select: { stripeSubscriptionId: true, cancelAtPeriodEnd: true },
  })

  if (!sub?.stripeSubscriptionId) {
    return NextResponse.json(
      { error: 'Aucun abonnement actif à résilier' },
      { status: 400 }
    )
  }

  if (sub.cancelAtPeriodEnd) {
    return NextResponse.json(
      { error: 'L\'abonnement est déjà programmé pour prendre fin à la fin de la période' },
      { status: 400 }
    )
  }

  try {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    await prisma.subscription.update({
      where: { organizationId: organization.id },
      data: { cancelAtPeriodEnd: true },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('[stripe/cancel-subscription]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur Stripe' },
      { status: 500 }
    )
  }
}
