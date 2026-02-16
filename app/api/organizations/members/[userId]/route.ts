import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'manager', 'staff']),
  clerkOrgId: z.string().optional(),
})

/**
 * PATCH /api/organizations/members/[userId]
 * Met à jour le rôle d'un membre
 * Seul un admin peut modifier les rôles
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let currentUserId: string | null = null
    let authOrgId: string | null = null
    try {
      const { auth } = await import('@clerk/nextjs/server')
      const authResult = auth()
      currentUserId = authResult.userId ?? null
      authOrgId = authResult.orgId ?? null
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { checkApiPermission, APP_ROLE_METADATA_KEY } = await import('@/lib/auth-role')
    const { clerkClient } = await import('@clerk/nextjs/server')

    const body = await request.json()
    const parsed = updateRoleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { role: newRole, clerkOrgId: clerkOrgIdFromBody } = parsed.data
    const orgId = authOrgId || clerkOrgIdFromBody

    if (!orgId) {
      return NextResponse.json(
        { error: 'Aucune organisation sélectionnée' },
        { status: 400 }
      )
    }

    const forbidden = await checkApiPermission(currentUserId, orgId, 'users:invite')
    if (forbidden) return forbidden

    const targetUserId = params.userId
    if (!targetUserId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    const client = await clerkClient()

    if (newRole === 'admin') {
      await client.organizations.updateOrganizationMembership({
        organizationId: orgId,
        userId: targetUserId,
        role: 'org:admin',
      })
      await client.organizations.updateOrganizationMembershipMetadata({
        organizationId: orgId,
        userId: targetUserId,
        publicMetadata: { [APP_ROLE_METADATA_KEY]: null },
      })
    } else {
      await client.organizations.updateOrganizationMembership({
        organizationId: orgId,
        userId: targetUserId,
        role: 'org:member',
      })
      await client.organizations.updateOrganizationMembershipMetadata({
        organizationId: orgId,
        userId: targetUserId,
        publicMetadata: {
          [APP_ROLE_METADATA_KEY]: newRole,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Rôle mis à jour en ${newRole}`,
      role: newRole,
    })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('[PATCH /api/organizations/members/[userId]]', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
