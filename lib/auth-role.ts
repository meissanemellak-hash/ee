import { NextResponse } from 'next/server'
import type { Role } from './roles'
import { can, type Permission } from './roles'

/** Clé metadata Clerk pour notre rôle custom (manager vs staff) */
export const APP_ROLE_METADATA_KEY = 'appRole'

/**
 * Récupère le rôle de l'utilisateur dans l'organisation.
 * Clerk importé dynamiquement pour ne pas casser le build Next.
 */
export async function getCurrentUserRole(
  userId: string,
  clerkOrgId: string
): Promise<Role> {
  try {
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    const memberships = await client.users.getOrganizationMembershipList({
      userId,
    })
    const membership = memberships.data?.find(
      (m) => m.organization.id === clerkOrgId
    )
    if (!membership) return 'admin'

    const clerkRole = membership.role
    const appRole = (membership.publicMetadata as Record<string, unknown>)?.[
      APP_ROLE_METADATA_KEY
    ] as string | undefined

    if (clerkRole === 'org:admin' || clerkRole === 'admin') return 'admin'
    if (appRole === 'manager') return 'manager'
    if (appRole === 'staff') return 'staff'
    return 'manager'
  } catch {
    return 'admin'
  }
}

/**
 * Vérifie qu'un utilisateur a une permission, retourne 403 si non
 */
export async function requirePermission(
  userId: string,
  clerkOrgId: string,
  permission: Permission
): Promise<Role | null> {
  const role = await getCurrentUserRole(userId, clerkOrgId)
  if (can(role, permission)) return role
  return null
}

/**
 * Vérifie une permission pour une route API.
 * Retourne null si autorisé, ou une NextResponse 403 à retourner si non autorisé.
 */
export async function checkApiPermission(
  userId: string,
  clerkOrgId: string,
  permission: Permission
): Promise<NextResponse | null> {
  const role = await requirePermission(userId, clerkOrgId, permission)
  if (role) return null
  return NextResponse.json(
    {
      error: 'Accès refusé',
      details: 'Cette action est réservée aux managers et administrateurs. Contactez votre administrateur si vous avez besoin de ces droits.',
    },
    { status: 403 }
  )
}
