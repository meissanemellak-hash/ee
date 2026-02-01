import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { z } from 'zod'
import { getCurrentUserRole } from '@/lib/auth-role'
import { APP_ROLE_METADATA_KEY } from '@/lib/auth-role'

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'manager', 'staff']),
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
    const { userId: currentUserId, orgId } = auth()
    if (!currentUserId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = await getCurrentUserRole(currentUserId, orgId)
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Seul un administrateur peut modifier les rôles' },
        { status: 403 }
      )
    }

    const targetUserId = params.userId
    if (!targetUserId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    const body = await request.json()
    const parsed = updateRoleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { role: newRole } = parsed.data

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
    console.error('[PATCH /api/organizations/members/[userId]]', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
