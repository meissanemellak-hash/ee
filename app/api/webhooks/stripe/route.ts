import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

/** Ne pas parser le body en JSON pour garder le corps brut (signature Stripe). Imports dynamiques pour le build. */
export async function POST(request: NextRequest) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { getStripe } = await import('@/lib/stripe')
  const { prisma } = await import('@/lib/db/prisma')
  const { logger } = await import('@/lib/logger')

  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe webhook non configuré' },
      { status: 500 }
    )
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event: Stripe.Event
  const rawBody = await request.text()

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature invalide'
    logger.error('[webhooks/stripe] Signature invalide:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await upsertSubscriptionFromStripe(subscription, prisma, logger)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await markSubscriptionCanceled(subscription.id, prisma)
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription && typeof invoice.subscription === 'string') {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription)
          await upsertSubscriptionFromStripe(sub, prisma, logger)
        }
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription && typeof invoice.subscription === 'string') {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription)
          await upsertSubscriptionFromStripe(sub, prisma, logger)
        }
        break
      }
      default:
        break
    }
  } catch (err) {
    logger.error('[webhooks/stripe] Erreur traitement:', err)
    return NextResponse.json(
      { error: 'Erreur lors du traitement du webhook' },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}

async function upsertSubscriptionFromStripe(
  sub: Stripe.Subscription,
  prisma: Awaited<ReturnType<typeof import('@/lib/db/prisma')['prisma']>>,
  logger: typeof import('@/lib/logger')['logger']
) {
  const organizationId = (sub.metadata?.organizationId as string) || null
  if (!organizationId) {
    logger.warn('[webhooks/stripe] Subscription sans metadata.organizationId:', sub.id)
    return
  }

  const status = mapStripeStatus(sub.status)
  const plan = sub.items.data[0]?.price?.lookup_key ?? sub.items.data[0]?.price?.id ?? null

  await prisma.subscription.upsert({
    where: { organizationId },
    create: {
      organizationId,
      stripeCustomerId: sub.customer as string,
      stripeSubscriptionId: sub.id,
      status,
      plan,
      currentPeriodStart: sub.current_period_start
        ? new Date(sub.current_period_start * 1000)
        : null,
      currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    },
    update: {
      stripeCustomerId: sub.customer as string,
      stripeSubscriptionId: sub.id,
      status,
      plan,
      currentPeriodStart: sub.current_period_start
        ? new Date(sub.current_period_start * 1000)
        : null,
      currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    },
  })
}

async function markSubscriptionCanceled(
  stripeSubscriptionId: string,
  prisma: Awaited<ReturnType<typeof import('@/lib/db/prisma')['prisma']>>
) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId },
    data: { status: 'canceled' },
  })
}

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  const map: Record<Stripe.Subscription.Status, string> = {
    active: 'active',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete_expired',
    past_due: 'past_due',
    paused: 'paused',
    trialing: 'trialing',
    unpaid: 'unpaid',
  }
  return map[status] ?? status
}
