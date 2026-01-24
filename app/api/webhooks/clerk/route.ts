import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db/prisma'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

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
  }

  return NextResponse.json({ received: true })
}
