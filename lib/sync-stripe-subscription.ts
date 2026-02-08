import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'

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

/**
 * Cherche un abonnement Stripe actif pour l'email donné et le rattache à l'organisation.
 * Utilisé par la page Facturation (sync auto) et l'API POST /api/stripe/sync-subscription.
 * @returns true si un abonnement a été synchronisé, false sinon
 */
export async function syncStripeSubscriptionToOrg(
  organizationId: string,
  userEmail: string
): Promise<boolean> {
  const stripe = getStripe()
  if (!stripe) return false

  const email = userEmail?.trim()
  if (!email) return false

  try {
    const customers = await stripe.customers.list({ email, limit: 10 })
    if (!customers.data?.length) return false

    let stripeSubscription: Stripe.Subscription | null = null
    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all',
        limit: 20,
      })
      const activeOrTrialing = subs.data.find(
        (s) => s.status === 'active' || s.status === 'trialing'
      )
      if (activeOrTrialing) {
        stripeSubscription = activeOrTrialing
        break
      }
    }

    if (!stripeSubscription) return false

    const status = mapStripeStatus(stripeSubscription.status)
    const plan =
      stripeSubscription.items.data[0]?.price?.lookup_key ??
      stripeSubscription.items.data[0]?.price?.id ??
      null

    await prisma.subscription.upsert({
      where: { organizationId },
      create: {
        organizationId,
        stripeCustomerId: stripeSubscription.customer as string,
        stripeSubscriptionId: stripeSubscription.id,
        status,
        plan,
        currentPeriodStart: stripeSubscription.current_period_start
          ? new Date(stripeSubscription.current_period_start * 1000)
          : null,
        currentPeriodEnd: stripeSubscription.current_period_end
          ? new Date(stripeSubscription.current_period_end * 1000)
          : null,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end ?? false,
      },
      update: {
        stripeCustomerId: stripeSubscription.customer as string,
        stripeSubscriptionId: stripeSubscription.id,
        status,
        plan,
        currentPeriodStart: stripeSubscription.current_period_start
          ? new Date(stripeSubscription.current_period_start * 1000)
          : null,
        currentPeriodEnd: stripeSubscription.current_period_end
          ? new Date(stripeSubscription.current_period_end * 1000)
          : null,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end ?? false,
      },
    })

    if (!stripeSubscription.metadata?.organizationId) {
      await stripe.subscriptions.update(stripeSubscription.id, {
        metadata: { organizationId },
      })
      logger.log('[sync-stripe-subscription] Metadata organizationId mise à jour:', stripeSubscription.id)
    }

    return true
  } catch (err) {
    logger.error('[sync-stripe-subscription]', err)
    return false
  }
}

/**
 * Rafraîchit l'abonnement en base à partir de Stripe (par ex. après réactivation dans le portail).
 * Utilisé au chargement de la page Facturation pour afficher l'état à jour.
 * @returns true si la mise à jour a été faite, false sinon
 */
export async function refreshSubscriptionFromStripe(organizationId: string): Promise<boolean> {
  const stripe = getStripe()
  if (!stripe) return false

  const local = await prisma.subscription.findUnique({
    where: { organizationId },
    select: { stripeSubscriptionId: true },
  })
  if (!local?.stripeSubscriptionId) return false

  try {
    const stripeSub = await stripe.subscriptions.retrieve(local.stripeSubscriptionId)
    const status = mapStripeStatus(stripeSub.status)
    const plan =
      stripeSub.items.data[0]?.price?.lookup_key ??
      stripeSub.items.data[0]?.price?.id ??
      null

    await prisma.subscription.upsert({
      where: { organizationId },
      create: {
        organizationId,
        stripeCustomerId: stripeSub.customer as string,
        stripeSubscriptionId: stripeSub.id,
        status,
        plan,
        currentPeriodStart: stripeSub.current_period_start
          ? new Date(stripeSub.current_period_start * 1000)
          : null,
        currentPeriodEnd: stripeSub.current_period_end
          ? new Date(stripeSub.current_period_end * 1000)
          : null,
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end ?? false,
      },
      update: {
        stripeCustomerId: stripeSub.customer as string,
        stripeSubscriptionId: stripeSub.id,
        status,
        plan,
        currentPeriodStart: stripeSub.current_period_start
          ? new Date(stripeSub.current_period_start * 1000)
          : null,
        currentPeriodEnd: stripeSub.current_period_end
          ? new Date(stripeSub.current_period_end * 1000)
          : null,
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end ?? false,
      },
    })
    return true
  } catch (err) {
    logger.error('[refreshSubscriptionFromStripe]', err)
    return false
  }
}
