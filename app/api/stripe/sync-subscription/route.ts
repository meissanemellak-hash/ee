import { NextResponse } from 'next/server'
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { getStripe } from '@/lib/stripe'
import { getCurrentOrganization } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'
import { syncStripeSubscriptionToOrg } from '@/lib/sync-stripe-subscription'

export const dynamic = 'force-dynamic'

/**
 * POST /api/stripe/sync-subscription
 * Cherche un abonnement Stripe actif pour l'email de l'utilisateur et le rattache
 * à l'organisation courante (cas où le webhook n'a pas enregistré l'abonnement).
 */
export async function POST() {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let organization = await getCurrentOrganization()
  if (!organization) {
    try {
      const client = await clerkClient()
      const userMemberships = await client.users.getOrganizationMembershipList({ userId })
      if (userMemberships.data?.length) {
        const first = userMemberships.data[0].organization
        organization = await prisma.organization.findUnique({
          where: { clerkOrgId: first.id },
        })
        if (!organization) {
          organization = await prisma.organization.create({
            data: {
              name: first.name,
              clerkOrgId: first.id,
              shrinkPct: 0.1,
            },
          })
        }
      }
    } catch (e) {
      logger.error('[stripe/sync-subscription] Fallback org:', e)
    }
  }
  if (!organization) {
    return NextResponse.json(
      { error: 'Aucune organisation sélectionnée' },
      { status: 400 }
    )
  }

  if (!getStripe()) {
    return NextResponse.json(
      { error: 'Stripe n\'est pas configuré' },
      { status: 500 }
    )
  }

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.trim()
  if (!email) {
    return NextResponse.json(
      { error: 'Impossible de récupérer votre email' },
      { status: 400 }
    )
  }

  try {
    const synced = await syncStripeSubscriptionToOrg(organization.id, email)
    if (!synced) {
      return NextResponse.json(
        { error: 'Aucun abonnement actif trouvé pour votre email. Vérifiez que le paiement a bien été effectué.' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('[stripe/sync-subscription]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur lors de la synchronisation' },
      { status: 500 }
    )
  }
}
