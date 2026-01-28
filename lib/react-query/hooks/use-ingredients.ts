import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrganization } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'

export interface Ingredient {
  id: string
  name: string
  unit: string
  costPerUnit: number
  packSize: number | null
  supplierName: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    productIngredients: number
    inventory: number
  }
}

export interface IngredientsResponse {
  ingredients: Ingredient[]
  units: string[]
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

export function useIngredients(filters?: {
  search?: string
  unit?: string
}) {
  const { organization } = useOrganization()

  return useQuery({
    queryKey: ['ingredients', organization?.id, filters],
    queryFn: async () => {
      if (!organization?.id) return { ingredients: [], units: [] }
      
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      
      if (filters?.search) queryParams.append('search', filters.search)
      if (filters?.unit && filters.unit !== 'all') {
        queryParams.append('unit', filters.unit)
      }
      
      const response = await fetch(`/api/ingredients?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch ingredients')
      }
      
      const data = await response.json()
      
      // Support des deux formats : nouveau (avec pagination) et ancien (sans pagination)
      if (data.ingredients && Array.isArray(data.ingredients)) {
        return {
          ingredients: data.ingredients,
          units: data.units || [],
          total: data.total || data.ingredients.length,
          page: data.page || 1,
          limit: data.limit || 50,
          totalPages: data.totalPages || 1,
        }
      }
      
      return {
        ingredients: [],
        units: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      }
    },
    enabled: !!organization?.id,
  })
}

export function useIngredient(id: string | undefined) {
  const { organization } = useOrganization()

  return useQuery({
    queryKey: ['ingredient', id, organization?.id],
    queryFn: async () => {
      if (!id || !organization?.id) return null
      
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/ingredients/${id}?${queryParams.toString()}`)
      
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch ingredient')
      }
      
      const data = await response.json() as { ingredient: Ingredient }
      return data.ingredient
    },
    enabled: !!id && !!organization?.id,
  })
}

export function useCreateIngredient() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      name: string
      unit: string
      costPerUnit: number
      packSize?: number | null
      supplierName?: string | null
    }) => {
      if (!organization?.id) throw new Error('No organization selected')
      
      const response = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, clerkOrgId: organization.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Failed to create ingredient')
      }

      const result = await response.json() as { ingredient: Ingredient }
      return result.ingredient
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients', organization?.id] })
      toast({
        title: 'Ingrédient créé',
        description: 'L\'ingrédient a été créé avec succès.',
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

export function useUpdateIngredient() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Ingredient> }) => {
      if (!organization?.id) throw new Error('No organization selected')
      
      const response = await fetch(`/api/ingredients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, clerkOrgId: organization.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Failed to update ingredient')
      }

      const result = await response.json() as { ingredient: Ingredient }
      return result.ingredient
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ingredients', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['ingredient', variables.id, organization?.id] })
      toast({
        title: 'Ingrédient modifié',
        description: 'L\'ingrédient a été modifié avec succès.',
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

export function useDeleteIngredient() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error('No organization selected')
      
      const response = await fetch(`/api/ingredients/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkOrgId: organization.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Failed to delete ingredient')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients', organization?.id] })
      toast({
        title: 'Ingrédient supprimé',
        description: 'L\'ingrédient a été supprimé avec succès.',
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
