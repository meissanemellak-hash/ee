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
  restaurantId?: string | null
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
      if (filters?.restaurantId) queryParams.append('restaurantId', filters.restaurantId)
      
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

/** Ingredient avec les lignes d'inventaire par restaurant (pour la page détail) */
export interface IngredientWithInventory extends Ingredient {
  inventory?: Array<{
    id: string
    restaurantId: string
    currentStock: number
    minThreshold: number
    maxThreshold: number | null
    restaurant: { id: string; name: string }
  }>
}

export function useIngredientWithStock(id: string | undefined) {
  const { organization } = useOrganization()

  return useQuery({
    queryKey: ['ingredient', id, organization?.id, 'withInventory'],
    queryFn: async () => {
      if (!id || !organization?.id) return null
      
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      queryParams.append('withInventory', '1')
      const response = await fetch(`/api/ingredients/${id}?${queryParams.toString()}`)
      
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch ingredient')
      }
      
      const data = await response.json() as { ingredient: IngredientWithInventory }
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

export function useImportIngredients() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: { file: File }) => {
      if (!organization?.id) throw new Error('Aucune organisation sélectionnée')

      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('clerkOrgId', organization.id)

      const response = await fetch('/api/ingredients/import', {
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
      queryClient.invalidateQueries({ queryKey: ['ingredients', organization?.id] })
      toast({
        title: 'Import réussi',
        description: `${data.imported} ingrédient${data.imported > 1 ? 's' : ''} importé${data.imported > 1 ? 's' : ''} avec succès${data.errors?.length ? ` (${data.errors.length} erreur${data.errors.length > 1 ? 's' : ''})` : ''}`,
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
