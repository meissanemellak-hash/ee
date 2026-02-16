import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/user/role
 * Récupère le rôle de l'utilisateur actuel dans l'organisation
 * Query: clerkOrgId (optionnel, sinon auth().orgId)
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

    const { getCurrentUserRole } = await import('@/lib/auth-role')

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

    return NextResponse.json({ role })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('[GET /api/user/role]', error)
    return NextResponse.json(
      {
        error: 'Erreur lors du chargement du rôle',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
