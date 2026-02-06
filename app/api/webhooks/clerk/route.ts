import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db/prisma'
import { sendEmail } from '@/lib/services/email'
import { getAccountLockedEmailHtml } from '@/lib/services/email-templates'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'IA Restaurant Manager'
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'noreply@resend.dev'

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  // Récupérer les headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    )
  }

  // Récupérer le body
  const payload = await request.json()
  const body = JSON.stringify(payload)

  // Créer un nouveau webhook
  const wh = new Webhook(webhookSecret)

  let evt: any

  // Vérifier le webhook
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return NextResponse.json(
      { error: 'Error verifying webhook' },
      { status: 400 }
    )
  }

  // Traiter les événements
  const eventType = evt.type

  if (eventType === 'organization.created') {
    const { id, name } = evt.data

    // Créer l'organisation dans la base de données
    await prisma.organization.create({
      data: {
        clerkOrgId: id,
        name: name || 'Nouvelle organisation',
      },
    })
  } else if (eventType === 'organization.updated') {
    const { id, name } = evt.data

    // Mettre à jour l'organisation
    await prisma.organization.updateMany({
      where: { clerkOrgId: id },
      data: { name: name || 'Organisation' },
    })
  } else if (eventType === 'organization.deleted') {
    const { id } = evt.data

    // Supprimer l'organisation (cascade supprimera les données associées)
    await prisma.organization.deleteMany({
      where: { clerkOrgId: id },
    })
  } else if (eventType === 'email.created' || (typeof eventType === 'string' && eventType.includes('email'))) {
    // Mail envoyé par Clerk désactivé (Delivered by Clerk = off) : on envoie nous-mêmes en français via Resend.
    const data = evt.data as Record<string, unknown>
    const slug = (data?.slug ?? data?.email_type ?? data?.template ?? '') as string
    const slugNorm = slug.replace(/-/g, '_').toLowerCase()

    if (slugNorm === 'account_locked') {
      const toRaw = data?.to ?? data?.email_address ?? (Array.isArray(data?.email_addresses) ? (data.email_addresses as Array<{ email_address?: string } | string>)[0] : null)
      const to = typeof toRaw === 'string' ? toRaw : (toRaw && typeof toRaw === 'object' && 'email_address' in toRaw ? (toRaw as { email_address: string }).email_address : null)
      const subject = (data?.subject ?? `Votre compte a été verrouillé - ${APP_NAME}`) as string
      const vars = data?.template_variables as Record<string, string> | undefined
      const locked_date = vars?.locked_date ?? data?.locked_date ?? new Date().toLocaleDateString('fr-FR')
      const failed_attempts = vars?.failed_attempts ?? String(data?.failed_attempts ?? '')
      const lockout_duration = vars?.lockout_duration ?? data?.lockout_duration ?? '1 heure'
      const app_name = vars?.['app.name'] ?? vars?.app_name ?? (data?.app as Record<string, string>)?.name ?? APP_NAME

      if (to) {
        try {
          const html = getAccountLockedEmailHtml({
            locked_date: String(locked_date),
            failed_attempts: String(failed_attempts),
            lockout_duration: String(lockout_duration),
            app_name: String(app_name),
          })
          await sendEmail({
            from: EMAIL_FROM,
            to,
            subject,
            html,
          })
        } catch (err) {
          console.error('[webhook clerk] Erreur envoi email Compte verrouillé:', err)
          return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
