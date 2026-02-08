import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getStripe, STRIPE_PLANS, type PlanId } from '@/lib/stripe'
import { ensureOrganizationInDb } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()

/**
 * POST /api/admin/create-checkout-link
 * Body: { clerkOrgId?: string, organizationId?: string, plan?: 'starter' | 'growth' | 'pro' }
 * Réservé au super-admin. Crée une session Stripe Checkout pour cette organisation (défaut: plan Pro).
 */
export async function POST(request: NextRequest) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase()
  if (!SUPER_ADMIN_EMAIL || email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Accès réservé à l\'administrateur' }, { status: 403 })
  }

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

  const planId = (body.plan ?? 'pro') as PlanId
  const plan = STRIPE_PLANS[planId]
  if (!plan?.priceId) {
    return NextResponse.json(
      { error: `Plan ${planId} invalide ou prix Stripe non configuré` },
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
      const org = await ensureOrganizationInDb(clerkOrgId)
      organization = org ? { id: org.id, name: org.name } : null
    } catch (err) {
      logger.error('[admin/create-checkout-link] ensureOrganizationInDb:', err)
      return NextResponse.json(
        { error: 'Impossible de synchroniser l\'organisation depuis Clerk' },
        { status: 500 }
      )
    }
  } else if (organizationId) {
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
    logger.error('[admin/create-checkout-link]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur Stripe' },
      { status: 500 }
    )
  }
}
