import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/stripe/update-payment-method
 * Body: { paymentMethodId: string }. Imports dynamiques pour le build.
 */
export async function POST(request: NextRequest) {
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
    } catch (e) {
      logger.error('[stripe/update-payment-method] Fallback org:', e)
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

  let body: { paymentMethodId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }
  const paymentMethodId = body.paymentMethodId?.trim()
  if (!paymentMethodId) {
    return NextResponse.json(
      { error: 'paymentMethodId requis' },
      { status: 400 }
    )
  }

  const sub = await prisma.subscription.findUnique({
    where: { organizationId: organization.id },
    select: { stripeCustomerId: true, stripeSubscriptionId: true },
  })

  if (!sub?.stripeCustomerId) {
    return NextResponse.json(
      { error: 'Aucun abonnement lié à cette organisation' },
      { status: 400 }
    )
  }

  try {
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: sub.stripeCustomerId,
      })
    } catch (attachErr: unknown) {
      const msg = attachErr instanceof Error ? attachErr.message : String(attachErr)
      if (!msg.includes('already been attached') && !msg.includes('already attached')) {
        throw attachErr
      }
      // SetupIntent a déjà attaché le moyen de paiement au client
    }
    await stripe.customers.update(sub.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })
    if (sub.stripeSubscriptionId) {
      await stripe.subscriptions.update(sub.stripeSubscriptionId, {
        default_payment_method: paymentMethodId,
      })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('[stripe/update-payment-method]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur Stripe' },
      { status: 500 }
    )
  }
}
