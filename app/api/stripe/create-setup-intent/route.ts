import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getCurrentOrganization } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/stripe/create-setup-intent
 * Crée un SetupIntent pour le client Stripe de l'organisation (mise à jour du moyen de paiement in-app).
 */
export async function POST() {
  let organization = await getCurrentOrganization()
  if (!organization) {
    try {
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
      logger.error('[stripe/create-setup-intent] Fallback org:', e)
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

  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: sub.stripeCustomerId,
      usage: 'off_session',
    })
    return NextResponse.json({ clientSecret: setupIntent.client_secret })
  } catch (err) {
    logger.error('[stripe/create-setup-intent]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur Stripe' },
      { status: 500 }
    )
  }
}
