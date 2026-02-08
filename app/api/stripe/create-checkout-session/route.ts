import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getCurrentOrganization } from '@/lib/auth'
import { getStripe, STRIPE_PLANS, type PlanId } from '@/lib/stripe'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/stripe/create-checkout-session
 * Body: { plan: 'starter' | 'growth' | 'pro' }
 * Redirige l'utilisateur vers Stripe Checkout pour souscrire à un abonnement.
 */
export async function POST(request: NextRequest) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

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

  const planInput = (body.plan ?? 'pro') as string
  const planId = PLAN_INPUT_TO_ID[planInput.toLowerCase()] ?? 'pro'
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
    logger.error('[stripe/create-checkout-session]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur Stripe' },
      { status: 500 }
    )
  }
}
