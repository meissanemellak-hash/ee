import { useQuery } from '@tanstack/react-query'
import { useOrganization } from '@clerk/nextjs'

export type Role = 'admin' | 'manager' | 'staff'

export function useUserRole() {
  const { organization, isLoaded } = useOrganization()

  return useQuery({
    queryKey: ['user-role', organization?.id],
    queryFn: async (): Promise<Role> => {
      if (!organization?.id) return 'admin'

      const response = await fetch(
        `/api/user/role?clerkOrgId=${organization.id}`
      )
      if (!response.ok) {
        return 'admin'
      }
      const data = await response.json()
      return (data.role as Role) || 'admin'
    },
    enabled: isLoaded && !!organization?.id,
  })
}
