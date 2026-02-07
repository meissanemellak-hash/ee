import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrganization } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'
import { translateApiError } from '@/lib/translate-api-error'

export interface OrgMember {
  userId: string
  email: string | null
  firstName: string | null
  lastName: string | null
  clerkRole: string
  role: 'admin' | 'manager' | 'staff'
}

export function useOrganizationMembers() {
  const { organization } = useOrganization()

  return useQuery({
    queryKey: ['organization-members', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { members: [] }

      const response = await fetch(
        `/api/organizations/members?clerkOrgId=${organization.id}`
      )
      if (!response.ok) {
        if (response.status === 403) {
          return { members: [], forbidden: true }
        }
        throw new Error('Failed to load members')
      }
      const data = await response.json()
      return { members: data.members as OrgMember[] }
    },
    enabled: !!organization?.id,
  })
}

export function useInviteMember() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: { email: string; role: 'admin' | 'manager' | 'staff' }) => {
      const response = await fetch('/api/organizations/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          clerkOrgId: organization?.id,
        }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Erreur lors de l\'invitation')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', organization?.id] })
      toast({
        title: 'Invitation envoyée',
        description: 'L\'invitation a été envoyée par email.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: translateApiError(error.message),
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string
      role: 'admin' | 'manager' | 'staff'
    }) => {
      const response = await fetch(`/api/organizations/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, clerkOrgId: organization?.id }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Erreur lors de la mise à jour')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', organization?.id] })
      toast({
        title: 'Rôle mis à jour',
        description: 'Le rôle a été modifié.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: translateApiError(error.message),
        variant: 'destructive',
      })
    },
  })
}
