import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrganization } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'
import { getImportToastTitleAndErrorDetail } from '@/lib/utils'

export interface InventoryItemIngredient {
  id: string
  name: string
  unit: string
  costPerUnit: number
}

export interface InventoryItem {
  id: string
  restaurantId: string
  ingredientId: string
  currentStock: number
  minThreshold: number
  maxThreshold: number | null
  lastUpdated: string
  ingredient: InventoryItemIngredient
}

export function useInventory(restaurantId: string | undefined) {
  const { organization } = useOrganization()

  return useQuery({
    queryKey: ['inventory', organization?.id, restaurantId],
    queryFn: async () => {
      if (!restaurantId || !organization?.id) return []
      const queryParams = new URLSearchParams()
      queryParams.append('restaurantId', restaurantId)
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/inventory?${queryParams.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch inventory')
      return response.json() as Promise<InventoryItem[]>
    },
    enabled: !!restaurantId && !!organization?.id,
  })
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      restaurantId: string
      ingredientId: string
      currentStock: number
      minThreshold: number
      maxThreshold?: number | null
    }) => {
      if (!organization?.id) throw new Error('No organization selected')
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, clerkOrgId: organization.id }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.details || err.error || 'Erreur lors de la création')
      }
      return response.json() as Promise<InventoryItem>
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', organization?.id, variables.restaurantId] })
      queryClient.invalidateQueries({ queryKey: ['restaurant', variables.restaurantId, organization?.id] })
      toast({
        title: 'Succès',
        description: 'Inventaire créé avec succès.',
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

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      id,
      restaurantId,
      data,
    }: {
      id: string
      restaurantId: string
      data: { currentStock?: number; minThreshold?: number; maxThreshold?: number | null }
    }) => {
      if (!organization?.id) throw new Error('No organization selected')
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, clerkOrgId: organization.id }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.details || err.error || 'Erreur lors de la mise à jour')
      }
      return response.json() as Promise<InventoryItem>
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', organization?.id, variables.restaurantId] })
      queryClient.invalidateQueries({ queryKey: ['restaurant', variables.restaurantId, organization?.id] })
      toast({
        title: 'Succès',
        description: 'Inventaire mis à jour avec succès.',
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

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      if (!organization?.id) throw new Error('No organization selected')
      const response = await fetch(`/api/inventory/${id}?clerkOrgId=${organization.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.details || err.error || 'Erreur lors de la suppression')
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', organization?.id, variables.restaurantId] })
      queryClient.invalidateQueries({ queryKey: ['restaurant', variables.restaurantId, organization?.id] })
      toast({
        title: 'Succès',
        description: 'Inventaire supprimé avec succès.',
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

export function useImportInventory(restaurantId: string | undefined) {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: { file: File }) => {
      if (!organization?.id) throw new Error('Aucune organisation sélectionnée')
      if (!restaurantId) throw new Error('Restaurant requis')

      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('restaurantId', restaurantId)
      formData.append('clerkOrgId', organization.id)

      const response = await fetch('/api/inventory/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        const message = result.details || result.error || 'Erreur lors de l\'import'
        throw new Error(typeof message === 'string' ? message : Array.isArray(message) ? message[0] || result.error : result.error)
      }

      return result as {
        success: boolean
        imported: number
        created?: number
        updated?: number
        errors?: string[]
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', organization?.id, restaurantId] })
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId, organization?.id] })
      const created = data.created ?? 0
      const updated = data.updated ?? 0
      const msg =
        updated > 0
          ? `${data.imported} ligne(s) importée(s) : ${created} créée(s), ${updated} mise(s) à jour`
          : `${data.imported} ligne(s) importée(s) avec succès`
      const { title, errorDetail } = getImportToastTitleAndErrorDetail(data.errors)
      const errorSuffix = errorDetail ? ` — ${data.errors!.length === 1 ? 'Erreur :' : 'Erreurs :'} ${errorDetail}` : ''
      toast({
        title,
        description: msg + errorSuffix,
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
