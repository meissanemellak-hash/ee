import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentOrganization, ensureOrganizationInDb } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/onboarding/status
 * Retourne { completed: boolean } pour l'organisation courante.
 * Utilisé par la page Dashboard (méthode B) pour rediriger vers l'onboarding si besoin.
 */
export async function GET() {
  const { userId, orgId } = auth()
  if (!userId) {
    return NextResponse.json({ completed: true }, { status: 200 })
  }

  let organization = await getCurrentOrganization()
  if (!organization && orgId) {
    try {
      organization = await ensureOrganizationInDb(orgId)
    } catch {
      // Garder null
    }
  }

  const completed = !!organization?.onboardingCompletedAt
  return NextResponse.json({ completed })
}
