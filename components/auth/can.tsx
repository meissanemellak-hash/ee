'use client'

import { useUserRole } from '@/lib/react-query/hooks/use-user-role'
import { can, type Permission } from '@/lib/roles'

interface CanProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Affiche les children uniquement si l'utilisateur a la permission.
 * Sinon affiche fallback (ou rien).
 */
export function Can({ permission, children, fallback = null }: CanProps) {
  const { data: role } = useUserRole()
  if (!can(role, permission)) return <>{fallback}</>
  return <>{children}</>
}
