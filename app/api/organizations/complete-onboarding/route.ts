import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/organizations/complete-onboarding
 * Marque l'onboarding comme terminé pour l'organisation courante
 */
export async function POST() {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organization = await getCurrentOrganization()
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    await prisma.organization.update({
      where: { id: organization.id },
      data: { onboardingCompletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/organizations/complete-onboarding] Erreur:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
