import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/stripe/invoices
 * Liste les factures Stripe. Imports dynamiques pour le build.
 */
export async function GET() {
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
      logger.error('[stripe/invoices] Fallback org:', e)
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
    return NextResponse.json({ invoices: [] })
  }

  try {
    const list = await stripe.invoices.list({
      customer: sub.stripeCustomerId,
      limit: 24,
    })
    const invoices = (list.data ?? []).map((inv) => ({
      id: inv.id,
      created: inv.created,
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
      invoicePdf: inv.invoice_pdf ?? null,
    }))
    return NextResponse.json({ invoices })
  } catch (err) {
    logger.error('[stripe/invoices]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur Stripe' },
      { status: 500 }
    )
  }
}
