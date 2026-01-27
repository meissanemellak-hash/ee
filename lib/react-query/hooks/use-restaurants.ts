import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrganization } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'

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
      
      return response.json() as Promise<Restaurant>
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
        description: error.message,
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
        description: error.message,
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
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete restaurant')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants', organization?.id] })
      toast({
        title: 'Restaurant supprimé',
        description: 'Le restaurant a été supprimé avec succès.',
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
