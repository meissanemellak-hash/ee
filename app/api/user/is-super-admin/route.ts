import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()

/**
 * GET /api/user/is-super-admin
 * Retourne { isSuperAdmin: boolean } pour afficher ou non les options réservées au super-admin (ex. lien de paiement).
 */
export async function GET() {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ isSuperAdmin: false }, { status: 200 })
  }

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase()
  const isSuperAdmin = !!SUPER_ADMIN_EMAIL && email === SUPER_ADMIN_EMAIL

  return NextResponse.json({ isSuperAdmin })
}
