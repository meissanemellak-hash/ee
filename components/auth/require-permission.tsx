'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserRole } from '@/lib/react-query/hooks/use-user-role'
import { can, type Permission } from '@/lib/roles'
import { Skeleton } from '@/components/ui/skeleton'

interface RequirePermissionProps {
  permission: Permission
  redirectTo: string
  children: React.ReactNode
}

/**
 * Redirige si l'utilisateur n'a pas la permission.
 * Affiche un skeleton pendant le chargement du rôle.
 */
export function RequirePermission({ permission, redirectTo, children }: RequirePermissionProps) {
  const router = useRouter()
  const { data: role, isFetched } = useUserRole()

  useEffect(() => {
    if (!isFetched) return
    const roleToCheck = role ?? 'staff'
    if (!can(roleToCheck, permission)) {
      router.replace(redirectTo)
    }
  }, [isFetched, role, permission, redirectTo, router])

  if (!isFetched) {
    return <Skeleton className="min-h-[200px] w-full rounded-xl" />
  }

  const roleToCheck = role ?? 'staff'
  if (!can(roleToCheck, permission)) {
    return null
  }

  return <>{children}</>
}
