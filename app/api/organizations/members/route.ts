import { NextRequest, NextResponse } from 'next/server'
import type { Role } from '@/lib/roles'

export const dynamic = 'force-dynamic'

function mapMembershipToRole(
  clerkRole: string,
  publicMetadata: Record<string, unknown>,
  APP_ROLE_METADATA_KEY: string
): Role {
  if (clerkRole === 'org:admin' || clerkRole === 'admin') return 'admin'
  const appRole = publicMetadata[APP_ROLE_METADATA_KEY] as string | undefined
  if (appRole === 'manager') return 'manager'
  return 'staff'
}

/**
 * GET /api/organizations/members
 * Liste les membres de l'organisation avec leur rôle
 * Seul admin ou manager peut voir la liste (settings:view)
 */
export async function GET(request: NextRequest) {
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

    const { getCurrentUserRole, APP_ROLE_METADATA_KEY } = await import('@/lib/auth-role')
    const { clerkClient } = await import('@clerk/nextjs/server')

    const searchParams = request.nextUrl.searchParams
    const clerkOrgIdFromQuery = searchParams.get('clerkOrgId')
    const orgId = authOrgId || clerkOrgIdFromQuery

    if (!orgId) {
      return NextResponse.json(
        { error: 'Aucune organisation sélectionnée' },
        { status: 400 }
      )
    }

    const role = await getCurrentUserRole(userId, orgId)
    const canView = role === 'admin'
    if (!canView) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas accès à la liste des membres' },
        { status: 403 }
      )
    }

    const client = await clerkClient()
    const memberships =
      await client.organizations.getOrganizationMembershipList({
        organizationId: orgId,
      })

    const members = memberships.data?.map((m) => {
      const appRole = mapMembershipToRole(
        m.role,
        (m.publicMetadata as Record<string, unknown>) || {},
        APP_ROLE_METADATA_KEY
      )
      const mAny = m as { userId?: string; publicUserData?: { userId?: string; identifier?: string; firstName?: string; lastName?: string } }
      const uid = mAny.userId ?? mAny.publicUserData?.userId
      return {
        userId: uid,
        email: mAny.publicUserData?.identifier ?? null,
        firstName: mAny.publicUserData?.firstName ?? null,
        lastName: mAny.publicUserData?.lastName ?? null,
        clerkRole: m.role,
        role: appRole,
      }
    }).filter((m) => m.userId) ?? []

    return NextResponse.json({ members })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('[GET /api/organizations/members]', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors du chargement'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
