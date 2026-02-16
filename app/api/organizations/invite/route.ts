import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email('Email invalide'),
  role: z.enum(['admin', 'manager', 'staff']),
  clerkOrgId: z.string().optional(),
})

export const dynamic = 'force-dynamic'

/**
 * POST /api/organizations/invite
 * Invite un membre dans l'organisation avec un rôle
 * Seul un admin peut inviter
 */
export async function POST(request: NextRequest) {
  try {
    if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string | null = null
    let authOrgId: string | null = null
    try {
      const { auth } = await import('@clerk/nextjs/server')
      const authResult = auth()
      userId = authResult.userId ?? null
      authOrgId = authResult.orgId ?? null
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { checkApiPermission, APP_ROLE_METADATA_KEY } = await import('@/lib/auth-role')

    const body = await request.json()
    const parsed = inviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, role: inviteRole, clerkOrgId: clerkOrgIdFromBody } = parsed.data
    const orgId = authOrgId || clerkOrgIdFromBody

    if (!orgId) {
      return NextResponse.json(
        { error: 'Aucune organisation sélectionnée' },
        { status: 400 }
      )
    }

    const forbidden = await checkApiPermission(userId, orgId, 'users:invite')
    if (forbidden) return forbidden

    const { clerkClient } = await import('@clerk/nextjs/server')
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
    const { logger } = await import('@/lib/logger')
    logger.error('[POST /api/organizations/invite]', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors de l\'invitation'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
