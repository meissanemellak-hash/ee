import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/stripe/create-portal-session
 * Crée une session Stripe Customer Portal. Imports dynamiques pour le build.
 */
export async function POST(request: NextRequest) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
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
                select: { stripeCustomerId: true },
              })
              if (sub?.stripeCustomerId) {
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
      logger.error('[stripe/create-portal-session] Fallback org:', e)
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
    select: { stripeCustomerId: true },
  })

  if (!sub?.stripeCustomerId) {
    return NextResponse.json(
      { error: 'Aucun abonnement lié à cette organisation' },
      { status: 400 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${appUrl}/dashboard/settings/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    logger.error('[stripe/create-portal-session]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur Stripe' },
      { status: 500 }
    )
  }
}
