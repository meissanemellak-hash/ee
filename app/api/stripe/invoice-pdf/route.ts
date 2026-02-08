import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getCurrentOrganization } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/stripe/invoice-pdf?invoiceId=in_xxx
 * Proxy du PDF de facture Stripe pour forcer le nom de fichier en français (Facture-xxx.pdf).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const invoiceId = searchParams.get('invoiceId')?.trim()
  if (!invoiceId) {
    return NextResponse.json({ error: 'invoiceId requis' }, { status: 400 })
  }

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
      logger.error('[stripe/invoice-pdf] Fallback org:', e)
    }
  }
  if (!organization) {
    return NextResponse.json({ error: 'Aucune organisation sélectionnée' }, { status: 400 })
  }

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 })
  }

  const sub = await prisma.subscription.findUnique({
    where: { organizationId: organization.id },
    select: { stripeCustomerId: true },
  })
  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: 'Aucun abonnement' }, { status: 403 })
  }

  try {
    const invoice = await stripe.invoices.retrieve(invoiceId)
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
    if (customerId !== sub.stripeCustomerId) {
      return NextResponse.json({ error: 'Facture non autorisée' }, { status: 403 })
    }
    const pdfUrl = invoice.invoice_pdf
    if (!pdfUrl) {
      return NextResponse.json({ error: 'PDF non disponible' }, { status: 404 })
    }

    const pdfRes = await fetch(pdfUrl, {
      headers: process.env.STRIPE_SECRET_KEY
        ? { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }
        : undefined,
    })
    if (!pdfRes.ok) {
      logger.error('[stripe/invoice-pdf] Fetch PDF failed:', pdfRes.status)
      return NextResponse.json({ error: 'Impossible de récupérer le PDF' }, { status: 502 })
    }
    const pdfBuffer = await pdfRes.arrayBuffer()
    const number = (invoice.number || invoice.id).replace(/[^a-zA-Z0-9-_]/g, '_')
    const filename = `Facture-${number}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    logger.error('[stripe/invoice-pdf]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur Stripe' },
      { status: 500 }
    )
  }
}
