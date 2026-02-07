import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUserRole } from '@/lib/auth-role'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/user/role
 * Récupère le rôle de l'utilisateur actuel dans l'organisation
 * Query: clerkOrgId (optionnel, sinon auth().orgId)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId: authOrgId } = auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
