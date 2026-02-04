import { NextResponse } from 'next/server'
import { getCurrentOrganization } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/subscription/status
 * Retourne si l'organisation courante a un abonnement actif (accès au dashboard).
 * Si Stripe n'est pas configuré (dev), retourne active: true pour ne pas bloquer.
 */
export async function GET() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ active: true, status: null, currentPeriodEnd: null })
  }

  const organization = await getCurrentOrganization()
  if (!organization) {
    return NextResponse.json({ active: false })
  }

  const sub = await prisma.subscription.findUnique({
    where: { organizationId: organization.id },
    select: { status: true, currentPeriodEnd: true },
  })

  const now = new Date()
  const hasActiveSubscription =
    sub &&
    (sub.status === 'active' || sub.status === 'trialing') &&
    (!sub.currentPeriodEnd || sub.currentPeriodEnd > now)

  return NextResponse.json({
    active: !!hasActiveSubscription,
    status: sub?.status ?? null,
    currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
  })
}
