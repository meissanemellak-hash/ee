import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import { useOrganization } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'
import { translateApiError } from '@/lib/translate-api-error'

export interface Forecast {
  id: string
  restaurantId: string
  productId: string
  forecastDate: string
  forecastedQuantity: number
  method: string
  confidence: number | null
  createdAt: string
  restaurant: {
    id: string
    name: string
  }
  product: {
    id: string
    name: string
    category: string | null
    unitPrice: number
  }
}

export interface ForecastsResponse {
  forecasts: Forecast[]
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

type ForecastsFilters = {
  restaurantId?: string
  productId?: string
  startDate?: string
  endDate?: string
  method?: string
}

/** Options pour préchargement (sidebar). */
export function forecastsQueryOptions(organizationId: string | undefined, filters?: ForecastsFilters) {
  return {
    queryKey: ['forecasts', organizationId, filters] as QueryKey,
    queryFn: async (): Promise<ForecastsResponse> => {
      if (!organizationId) return { forecasts: [] }
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organizationId)
      if (filters?.restaurantId && filters.restaurantId !== 'all') {
        queryParams.append('restaurantId', filters.restaurantId)
      }
      if (filters?.productId) queryParams.append('productId', filters.productId)
      if (filters?.startDate) queryParams.append('startDate', filters.startDate)
      if (filters?.endDate) queryParams.append('endDate', filters.endDate)
      if (filters?.method) queryParams.append('method', filters.method)
      const response = await fetch(`/api/forecasts?${queryParams.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch forecasts')
      const data = await response.json()
      if (data.forecasts && Array.isArray(data.forecasts)) {
        return {
          forecasts: data.forecasts,
          total: data.total || data.forecasts.length,
          page: data.page || 1,
          limit: data.limit || 50,
          totalPages: data.totalPages || 1,
        }
      }
      if (Array.isArray(data)) {
        return { forecasts: data, total: data.length, page: 1, limit: 50, totalPages: 1 }
      }
      return { forecasts: [], total: 0, page: 1, limit: 50, totalPages: 0 }
    },
  }
}

export function useForecasts(filters?: ForecastsFilters) {
  const { organization } = useOrganization()
  return useQuery({
    ...forecastsQueryOptions(organization?.id, filters),
    enabled: !!organization?.id,
    placeholderData: (previousData) => previousData,
    staleTime: 20_000,
  })
}

export function useGenerateForecasts() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      restaurantId: string
      forecastDate?: string
      startDate?: string
      endDate?: string
      method: string
    }) => {
      if (!organization?.id) throw new Error('No organization selected')
      
      const response = await fetch('/api/forecasts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, clerkOrgId: organization.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Failed to generate forecasts')
      }

      return response.json() as Promise<{ forecasts: Forecast[] }>
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['forecasts', organization?.id] })
      await queryClient.refetchQueries({ queryKey: ['forecasts', organization?.id] })
      const count = data.forecasts?.length ?? 0
      toast({
        title: 'Prévisions générées',
        description: count > 0 ? `${count} prévision(s) générée(s) avec succès.` : 'Aucune prévision générée.',
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

export function useDeleteForecast() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error('No organization selected')

      const url = new URL(`/api/forecasts/${id}`, window.location.origin)
      url.searchParams.set('clerkOrgId', organization.id)

      const response = await fetch(url.toString(), {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Failed to delete forecast')
      }

      return response.json()
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['forecasts', organization?.id] })
      const previous = queryClient.getQueriesData<{ forecasts: Forecast[] }>({
        queryKey: ['forecasts', organization?.id],
      })
      queryClient.setQueriesData(
        { queryKey: ['forecasts', organization?.id] },
        (old: { forecasts: Forecast[] } | undefined) => {
          if (!old?.forecasts) return old
          return { ...old, forecasts: old.forecasts.filter((f) => f.id !== id) }
        }
      )
      return { previous }
    },
    onError: (error: Error, _id, context: { previous?: [unknown, unknown][] } | undefined) => {
      if (context?.previous) {
        context.previous.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey as unknown[], data))
      }
      toast({
        title: 'Erreur',
        description: translateApiError(error.message),
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      toast({
        title: 'Prévision supprimée',
        description: 'La prévision a été supprimée avec succès.',
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['forecasts', organization?.id] })
    },
  })
}
