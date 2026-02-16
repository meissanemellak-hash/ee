import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()

/**
 * GET /api/user/is-super-admin
 * Retourne { isSuperAdmin: boolean } pour afficher ou non les options réservées au super-admin (ex. lien de paiement).
 */
export async function GET() {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL) {
    return NextResponse.json({ isSuperAdmin: false }, { status: 200 })
  }
  let userId: string | null = null
  try {
    const { auth } = await import('@clerk/nextjs/server')
    userId = auth().userId ?? null
  } catch {
    return NextResponse.json({ isSuperAdmin: false }, { status: 200 })
  }
  if (!userId) {
    return NextResponse.json({ isSuperAdmin: false }, { status: 200 })
  }

  const { currentUser } = await import('@clerk/nextjs/server')
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase()
  const isSuperAdmin = !!SUPER_ADMIN_EMAIL && email === SUPER_ADMIN_EMAIL

  return NextResponse.json({ isSuperAdmin })
}
