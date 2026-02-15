import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Mapping lookup_key Stripe (essentiel, croissance, pro) → PlanId. */
const LOOKUP_KEY_TO_PLAN_ID: Record<string, 'starter' | 'growth' | 'pro'> = {
  essentiel: 'starter',
  croissance: 'growth',
  pro: 'pro',
}

/**
 * POST /api/admin/create-checkout-link
 * Body: { clerkOrgId: string, plan?: 'starter' | 'growth' | 'pro' } ou { organizationId: string, plan?: ... }
 * Réservé au super-admin. Crée une session Stripe Checkout pour le plan choisi.
 * Imports dynamiques pour éviter tout chargement Clerk/Stripe/Prisma au build.
 */
export async function POST(request: NextRequest) {
  let userId: string | null = null
  let userEmail: string | null = null
  try {
    const { auth, currentUser } = await import('@clerk/nextjs/server')
    const authResult = auth()
    userId = authResult.userId ?? null
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const user = await currentUser()
    userEmail = user?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() ?? null
  } catch {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()
  if (!superAdminEmail || userEmail !== superAdminEmail) {
    return NextResponse.json({ error: 'Accès réservé à l\'administrateur' }, { status: 403 })
  }

  const { getStripe, STRIPE_PLANS } = await import('@/lib/stripe')
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe n\'est pas configuré' },
      { status: 500 }
    )
  }

  let body: { clerkOrgId?: string; organizationId?: string; plan?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const rawPlan = (body.plan ?? 'pro') as string
  const planId = LOOKUP_KEY_TO_PLAN_ID[rawPlan.toLowerCase()] ?? (rawPlan as 'starter' | 'growth' | 'pro')
  const plan = STRIPE_PLANS[planId]
  if (!plan?.priceId) {
    return NextResponse.json(
      { error: `Plan ${planId} non configuré (STRIPE_PRICE_${planId.toUpperCase()})` },
      { status: 500 }
    )
  }

  const clerkOrgId = body.clerkOrgId && typeof body.clerkOrgId === 'string' ? body.clerkOrgId : null
  const organizationId = body.organizationId && typeof body.organizationId === 'string' ? body.organizationId : null

  if (!clerkOrgId && !organizationId) {
    return NextResponse.json(
      { error: 'clerkOrgId ou organizationId requis' },
      { status: 400 }
    )
  }

  let organization: { id: string; name: string } | null = null

  if (clerkOrgId) {
    try {
      const { ensureOrganizationInDb } = await import('@/lib/auth')
      const org = await ensureOrganizationInDb(clerkOrgId)
      organization = org ? { id: org.id, name: org.name } : null
    } catch (err) {
      const { logger } = await import('@/lib/logger')
      logger.error('[admin/create-checkout-link] ensureOrganizationInDb:', err)
      return NextResponse.json(
        { error: 'Impossible de synchroniser l\'organisation depuis Clerk' },
        { status: 500 }
      )
    }
  } else if (organizationId) {
    const { prisma } = await import('@/lib/db/prisma')
    organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true },
    })
  }

  if (!organization) {
    return NextResponse.json(
      { error: 'clerkOrgId ou organizationId requis et organisation introuvable' },
      { status: 400 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
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
      success_url: `${appUrl}/merci-paiement`,
      cancel_url: `${appUrl}/`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (err) {
    const { logger } = await import('@/lib/logger')
    logger.error('[admin/create-checkout-link]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur Stripe' },
      { status: 500 }
    )
  }
}
