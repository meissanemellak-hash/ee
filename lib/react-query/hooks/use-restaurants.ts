import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrganization } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'
import { translateApiError } from '@/lib/translate-api-error'
import { getImportToastTitleAndErrorDetail } from '@/lib/utils'

export interface Restaurant {
  id: string
  name: string
  address: string | null
  timezone: string
  createdAt: string
  updatedAt: string
}

export interface RestaurantsResponse {
  restaurants: Restaurant[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface RestaurantDetailSale {
  id: string
  amount: number
  quantity: number
  saleDate: string
  product: { name: string }
}

export interface RestaurantDetail extends Restaurant {
  _count?: {
    sales: number
    alerts: number
    inventory: number
  }
  totalRevenue?: number
  recentSales?: RestaurantDetailSale[]
}

export function useRestaurants(page: number = 1, limit: number = 50) {
  const { organization } = useOrganization()

  return useQuery({
    queryKey: ['restaurants', organization?.id, page, limit],
    queryFn: async () => {
      if (!organization?.id) return { restaurants: [], total: 0, page: 1, limit, totalPages: 0 }

      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      queryParams.append('page', page.toString())
      queryParams.append('limit', limit.toString())

      const response = await fetch(`/api/restaurants?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch restaurants')
      }

      return response.json() as Promise<RestaurantsResponse>
    },
    enabled: !!organization?.id,
  })
}

export function useRestaurant(id: string | undefined) {
  const { organization } = useOrganization()

  return useQuery({
    queryKey: ['restaurant', id, organization?.id],
    queryFn: async () => {
      if (!id || !organization?.id) return null
      
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/restaurants/${id}?${queryParams.toString()}`)
      
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch restaurant')
      }
      
      return response.json() as Promise<RestaurantDetail | null>
    },
    enabled: !!id && !!organization?.id,
  })
}

export function useCreateRestaurant() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: { name: string; address?: string; timezone?: string }) => {
      if (!organization?.id) throw new Error('No organization selected')
      
      const response = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, clerkOrgId: organization.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create restaurant')
      }

      return response.json() as Promise<Restaurant>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants', organization?.id] })
      toast({
        title: 'Restaurant créé',
        description: 'Le restaurant a été créé avec succès.',
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

export function useUpdateRestaurant() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Restaurant> }) => {
      if (!organization?.id) throw new Error('No organization selected')
      
      const response = await fetch(`/api/restaurants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, clerkOrgId: organization.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Failed to update restaurant')
      }

      return response.json() as Promise<Restaurant>
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['restaurants', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['restaurant', variables.id, organization?.id] })
      toast({
        title: 'Restaurant modifié',
        description: 'Le restaurant a été modifié avec succès.',
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

export function useDeleteRestaurant() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error('No organization selected')
      
      const response = await fetch(`/api/restaurants/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkOrgId: organization.id }),
      })

      if (!response.ok) {
        const text = await response.text()
        let message = 'Failed to delete restaurant'
        try {
          if (text) {
            const error = JSON.parse(text) as { error?: string }
            if (error.error) message = error.error
          }
        } catch {
          if (response.statusText) message = response.statusText
        }
        throw new Error(message)
      }

      const text = await response.text()
      return text ? (JSON.parse(text) as { success: boolean }) : { success: true }
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['restaurants', organization?.id] })
      const previous = queryClient.getQueriesData<RestaurantsResponse>({
        queryKey: ['restaurants', organization?.id],
      })
      queryClient.setQueriesData<RestaurantsResponse>(
        { queryKey: ['restaurants', organization?.id] },
        (old) => {
          if (!old?.restaurants) return old
          const restaurants = old.restaurants.filter((r) => r.id !== id)
          return { ...old, restaurants, total: Math.max(0, (old.total ?? 0) - 1) }
        }
      )
      return { previous }
    },
    onError: (error: Error, _id, context: { previous?: [unknown, RestaurantsResponse | undefined][] } | undefined) => {
      if (context?.previous) {
        context.previous.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey as unknown[], data))
      }
      toast({
        title: 'Erreur',
        description: translateApiError(error.message),
        variant: 'destructive',
      })
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['restaurants', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['restaurant', id, organization?.id] })
      toast({
        title: 'Restaurant supprimé',
        description: 'Le restaurant a été supprimé avec succès.',
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants', organization?.id] })
    },
  })
}

export function useImportRestaurants() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: { file: File }) => {
      if (!organization?.id) throw new Error('Aucune organisation sélectionnée')

      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('clerkOrgId', organization.id)

      const response = await fetch('/api/restaurants/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        const message = result.details || result.error || 'Erreur lors de l\'import'
        throw new Error(typeof message === 'string' ? message : message[0] || result.error)
      }

      return result as {
        success: boolean
        imported: number
        errors?: string[]
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['restaurants', organization?.id] })
      const { title, errorDetail } = getImportToastTitleAndErrorDetail(data.errors)
      const description = errorDetail
        ? `${data.imported} restaurant${data.imported > 1 ? 's' : ''} importé${data.imported > 1 ? 's' : ''}, ${data.errors!.length} erreur${data.errors!.length > 1 ? 's' : ''} : ${errorDetail}`
        : `${data.imported} restaurant${data.imported > 1 ? 's' : ''} importé${data.imported > 1 ? 's' : ''} avec succès`
      toast({ title, description })
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
