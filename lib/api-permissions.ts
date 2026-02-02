/**
 * Helpers pour vérifier les permissions côté API (server-side).
 * À utiliser dans les routes API pour rejeter les requêtes non autorisées (403).
 */

import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth-role'
import type { Permission } from '@/lib/roles'

const FORBIDDEN_MESSAGE = "Vous n'avez pas la permission d'effectuer cette action."

/**
 * Vérifie que l'utilisateur a la permission. Si non, retourne une réponse 403.
 * @returns null si autorisé, NextResponse 403 sinon
 */
export async function requirePermissionOr403(
  userId: string,
  clerkOrgId: string,
  permission: Permission
): Promise<NextResponse | null> {
  const role = await requirePermission(userId, clerkOrgId, permission)
  if (role) return null
  return NextResponse.json(
    { error: 'Forbidden', details: FORBIDDEN_MESSAGE },
    { status: 403 }
  )
}
