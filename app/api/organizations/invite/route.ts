import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { z } from 'zod'
import { getCurrentUserRole, APP_ROLE_METADATA_KEY } from '@/lib/auth-role'

const inviteSchema = z.object({
  email: z.string().email('Email invalide'),
  role: z.enum(['admin', 'manager', 'staff']),
})

/**
 * POST /api/organizations/invite
 * Invite un membre dans l'organisation avec un rôle
 * Seul un admin peut inviter
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = auth()
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = await getCurrentUserRole(userId, orgId)
    if (!role || role !== 'admin') {
      return NextResponse.json(
        { error: 'Seul un administrateur peut inviter des membres' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = inviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, role: inviteRole } = parsed.data

    const client = await clerkClient()

    const clerkRole: 'org:admin' | 'org:member' =
      inviteRole === 'admin' ? 'org:admin' : 'org:member'

    const publicMetadata: Record<string, unknown> =
      inviteRole === 'manager' ? { [APP_ROLE_METADATA_KEY]: 'manager' } : {}
    if (inviteRole === 'staff') {
      publicMetadata[APP_ROLE_METADATA_KEY] = 'staff'
    }

    const invitation = await client.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: email,
      role: clerkRole,
      inviterUserId: userId,
      publicMetadata: Object.keys(publicMetadata).length > 0 ? publicMetadata : undefined,
    })

    return NextResponse.json({
      success: true,
      message: `Invitation envoyée à ${email}`,
      invitation: {
        id: invitation.id,
        emailAddress: invitation.emailAddress,
        role: inviteRole,
      },
    })
  } catch (error) {
    console.error('[POST /api/organizations/invite]', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors de l\'invitation'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
