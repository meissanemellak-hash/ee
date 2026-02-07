import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrganization } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'
import { translateApiError } from '@/lib/translate-api-error'

export interface Alert {
  id: string
  restaurantId: string
  type: string
  severity: string
  message: string
  resolved: boolean
  resolvedAt: string | null
  createdAt: string
  restaurant: {
    id: string
    name: string
  }
}

export function useAlerts(filters?: {
  restaurantId?: string
  type?: string
  severity?: string
  resolved?: boolean
}) {
  const { organization } = useOrganization()

  return useQuery({
    queryKey: ['alerts', organization?.id, filters],
    queryFn: async () => {
      if (!organization?.id) return []
      
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      
      if (filters?.restaurantId && filters.restaurantId !== 'all') {
        queryParams.append('restaurantId', filters.restaurantId)
      }
      if (filters?.type && filters.type !== 'all') {
        queryParams.append('type', filters.type)
      }
      if (filters?.severity && filters.severity !== 'all') {
        queryParams.append('severity', filters.severity)
      }
      if (filters?.resolved !== undefined) {
        queryParams.append('resolved', filters.resolved.toString())
      }
      
      const response = await fetch(`/api/alerts?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch alerts')
      }
      
      const data = await response.json()
      return Array.isArray(data) ? data : []
    },
    enabled: !!organization?.id,
  })
}

export function useGenerateAlerts() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      restaurantId: string
      createTest?: boolean
    }) => {
      if (!organization?.id) throw new Error('No organization selected')
      
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, clerkOrgId: organization.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Failed to generate alerts')
      }

      return response.json() as Promise<{
        success: boolean
        alertsCreated: number
        message: string
      }>
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['alerts', organization?.id] })
      
      toast({
        title: variables.createTest ? 'Alertes de test créées' : 'Alertes générées',
        description: data.message || (variables.createTest 
          ? '3 alertes de test ont été créées avec succès.'
          : 'Les alertes ont été vérifiées et générées avec succès.'),
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

export function useUpdateAlertStatus() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, resolved }: { id: string; resolved: boolean }) => {
      if (!organization?.id) throw new Error('No organization selected')
      
      const response = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved, clerkOrgId: organization.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Failed to update alert')
      }

      return response.json() as Promise<Alert>
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['alerts', organization?.id] })
      
      toast({
        title: 'Alerte mise à jour',
        description: variables.resolved ? 'Alerte marquée comme résolue' : 'Alerte réactivée',
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
