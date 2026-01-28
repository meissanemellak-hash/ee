import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrganization } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'

export interface OrganizationData {
  id: string
  name: string
  shrinkPct: number
  clerkOrgId?: string
  createdAt: string
  updatedAt: string
}

export function useOrganizationData() {
  const { organization } = useOrganization()

  return useQuery({
    queryKey: ['organization', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null

      const response = await fetch(`/api/organizations?clerkOrgId=${organization.id}`)

      if (!response.ok) {
        throw new Error('Failed to load organization data')
      }

      return response.json() as Promise<OrganizationData>
    },
    enabled: !!organization?.id,
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      name: string
      shrinkPct: number
    }) => {
      if (!organization?.id) throw new Error('No organization selected')

      const response = await fetch('/api/organizations/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          shrinkPct: data.shrinkPct,
          clerkOrgId: organization.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        if (response.status === 403 && error.requiresAdmin) {
          throw new Error(error.details || error.error || 'Vous n\'avez pas les permissions nécessaires pour modifier le nom de l\'organisation.')
        }
        throw new Error(error.details || error.error || 'Erreur lors de la sauvegarde')
      }

      return response.json() as Promise<OrganizationData & {
        warning?: string
        clerkSync?: boolean
      }>
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization', organization?.id] })

      if (data.warning) {
        toast({
          title: '✅ Paramètres mis à jour',
          description: data.warning,
          variant: 'default',
        })
      } else if (data.clerkSync) {
        toast({
          title: '✅ Succès',
          description: 'Les paramètres de l\'organisation ont été mis à jour dans l\'application et synchronisés avec Clerk.',
          variant: 'default',
        })
      } else {
        toast({
          title: '✅ Succès',
          description: 'Les paramètres de l\'organisation ont été mis à jour avec succès.',
          variant: 'default',
        })
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useFixOrganizationId() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      correctClerkOrgId: string
      currentOrgId: string
    }) => {
      if (!organization?.id) throw new Error('No organization selected')

      const response = await fetch('/api/organizations/fix-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correctClerkOrgId: data.correctClerkOrgId,
          currentOrgId: data.currentOrgId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || 'Erreur lors de la correction de l\'ID')
      }

      return response.json() as Promise<{ message: string }>
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization', organization?.id] })
      toast({
        title: 'Succès',
        description: data.message || 'L\'ID de l\'organisation a été corrigé avec succès.',
        variant: 'default',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await fetch('/api/user/current')
      if (!response.ok) {
        throw new Error('Failed to load user data')
      }
      return response.json() as Promise<{ userId: string }>
    },
  })
}
