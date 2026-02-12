import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
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

type AlertsFilters = {
  restaurantId?: string
  type?: string
  severity?: string
  resolved?: boolean
}

/** Options de requête pour préchargement au survol du menu (sidebar). */
export function alertsQueryOptions(organizationId: string | undefined, filters?: AlertsFilters) {
  return {
    queryKey: ['alerts', organizationId, filters] as QueryKey,
    queryFn: async (): Promise<Alert[]> => {
      if (!organizationId) return []
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organizationId)
      if (filters?.restaurantId && filters.restaurantId !== 'all') {
        queryParams.append('restaurantId', filters.restaurantId)
      }
      if (filters?.type && filters.type !== 'all') queryParams.append('type', filters.type)
      if (filters?.severity && filters.severity !== 'all') queryParams.append('severity', filters.severity)
      if (filters?.resolved !== undefined) queryParams.append('resolved', filters.resolved.toString())
      const response = await fetch(`/api/alerts?${queryParams.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch alerts')
      const data = await response.json()
      return Array.isArray(data) ? data : []
    },
  }
}

export function useAlerts(filters?: AlertsFilters) {
  const { organization } = useOrganization()
  return useQuery({
    ...alertsQueryOptions(organization?.id, filters),
    enabled: !!organization?.id,
    placeholderData: (previousData) => previousData,
    staleTime: 20_000,
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
      queryClient.invalidateQueries({ queryKey: ['alerts-current-state', organization?.id] })

      toast({
        title: variables.createTest ? 'Alertes de test créées' : 'Alertes mises à jour',
        description: data.message || (variables.createTest 
          ? '3 alertes de test ont été créées avec succès.'
          : 'Les alertes ont été recalculées à partir de l’inventaire actuel.'),
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

export interface AlertsCurrentState {
  shortages: number
  overstocks: number
  items: Array<{ type: 'SHORTAGE' | 'OVERSTOCK'; ingredientName: string; message: string; severity?: string }>
}

/** Options pour préchargement état actuel (sidebar). */
export function alertsCurrentStateQueryOptions(organizationId: string | undefined, restaurantId: string | null) {
  return {
    queryKey: ['alerts-current-state', organizationId, restaurantId] as QueryKey,
    queryFn: async (): Promise<AlertsCurrentState> => {
      if (!organizationId || !restaurantId || restaurantId === 'all') {
        return { shortages: 0, overstocks: 0, items: [] }
      }
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organizationId)
      queryParams.append('restaurantId', restaurantId)
      const response = await fetch(`/api/alerts/current-state?${queryParams.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch alerts current state')
      const data = await response.json()
      return {
        shortages: data.shortages ?? 0,
        overstocks: data.overstocks ?? 0,
        items: Array.isArray(data.items) ? data.items : [],
      }
    },
  }
}

export function useAlertsCurrentState(restaurantId: string | null) {
  const { organization } = useOrganization()
  return useQuery({
    ...alertsCurrentStateQueryOptions(organization?.id, restaurantId),
    enabled: !!organization?.id && !!restaurantId && restaurantId !== 'all',
    placeholderData: (previousData) => previousData,
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
    onSuccess: (updatedAlert, variables) => {
      queryClient.setQueriesData(
        { queryKey: ['alerts', organization?.id] },
        (old: Alert[] | undefined) => {
          if (!Array.isArray(old)) return old
          return old.map((a) => (a.id === updatedAlert.id ? updatedAlert : a))
        }
      )
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
