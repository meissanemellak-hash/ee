import { NextRequest, NextResponse } from 'next/server'
import type { PlanId } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

/** Mapping lookup_key Stripe (essentiel, croissance, pro) → PlanId. */
const LOOKUP_KEY_TO_PLAN_ID: Record<string, PlanId> = {
  essentiel: 'starter',
  croissance: 'growth',
  pro: 'pro',
}

/**
 * POST /api/stripe/create-checkout-session
 * Body: { plan: 'starter' | 'growth' | 'pro' | 'essentiel' | 'croissance' | 'pro' }
 * Redirige l'utilisateur vers Stripe Checkout. Imports dynamiques pour le build.
 */
export async function POST(request: NextRequest) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let userId: string | null = null
  try {
    const { auth } = await import('@clerk/nextjs/server')
    userId = auth().userId ?? null
  } catch {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { getCurrentOrganization } = await import('@/lib/auth')
  const { getStripe, STRIPE_PLANS } = await import('@/lib/stripe')
  const { prisma } = await import('@/lib/db/prisma')

  const organization = await getCurrentOrganization()
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

  let body: { plan?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const rawPlan = (body.plan ?? 'pro') as string
  const planId: PlanId = LOOKUP_KEY_TO_PLAN_ID[rawPlan.toLowerCase()] ?? (rawPlan as PlanId)
  if (!STRIPE_PLANS[planId]?.priceId) {
    return NextResponse.json(
      { error: 'Plan invalide ou prix Stripe non configuré' },
      { status: 400 }
    )
  }

  const plan = STRIPE_PLANS[planId]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  let customerId: string | null = null
  const existing = await prisma.subscription.findUnique({
    where: { organizationId: organization.id },
    select: { stripeCustomerId: true },
  })
  if (existing?.stripeCustomerId) {
    customerId = existing.stripeCustomerId
  }

  const { currentUser } = await import('@clerk/nextjs/server')
  const user = await currentUser()
  const customerEmail = user?.emailAddresses?.[0]?.emailAddress

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      ...(customerId ? { customer: customerId } : { customer_email: customerEmail ?? undefined }),
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          organizationId: organization.id,
        },
      },
      metadata: {
        organizationId: organization.id,
      },
      success_url: `${appUrl}/dashboard/settings/billing?success=1`,
      cancel_url: `${appUrl}/dashboard/settings/billing?canceled=1`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (err) {
    const { logger } = await import('@/lib/logger')
    logger.error('[stripe/create-checkout-session]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur Stripe' },
      { status: 500 }
    )
  }
}
