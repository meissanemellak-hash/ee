import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import { useOrganization } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'
import { translateApiError } from '@/lib/translate-api-error'

export const PLANNED_STAFFING_SLOTS = ['08:00-12:00', '12:00-14:00', '14:00-18:00', '18:00-22:00'] as const

export interface PlannedStaffingSlot {
  slotLabel: string
  plannedCount: number
}

export interface PlannedStaffingResponse {
  restaurantId: string
  date: string
  slots: PlannedStaffingSlot[]
}

export function plannedStaffingQueryOptions(
  organizationId: string | undefined,
  restaurantId: string | null,
  date: string | null
) {
  return {
    queryKey: ['planned-staffing', organizationId, restaurantId, date] as QueryKey,
    queryFn: async (): Promise<PlannedStaffingResponse> => {
      const params = new URLSearchParams({
        restaurantId: restaurantId ?? '',
        date: date ?? '',
      })
      if (organizationId) params.set('clerkOrgId', organizationId)
      const res = await fetch(`/api/planned-staffing?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || res.statusText)
      }
      return res.json()
    },
    enabled: !!organizationId && !!restaurantId && !!date,
  }
}

export function usePlannedStaffing(restaurantId: string | null, date: string | null) {
  const { organization } = useOrganization()
  return useQuery(plannedStaffingQueryOptions(organization?.id, restaurantId, date))
}

export function useUpdatePlannedStaffing() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (params: {
      restaurantId: string
      date: string
      slots: PlannedStaffingSlot[]
    }) => {
      const body = organization?.id
        ? { ...params, clerkOrgId: organization.id }
        : params
      const res = await fetch('/api/planned-staffing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || res.statusText)
      }
      return res.json() as Promise<PlannedStaffingResponse>
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['planned-staffing', organization?.id, variables.restaurantId, variables.date],
      })
      queryClient.invalidateQueries({ queryKey: ['alerts', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['alerts-current-state', organization?.id] })
      toast({
        title: 'Effectif prévu enregistré',
        description: 'Les effectifs ont été mis à jour et les alertes recalculées.',
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
