import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrganization } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'
import { translateApiError } from '@/lib/translate-api-error'
import { getImportToastTitleAndErrorDetail } from '@/lib/utils'

export interface Product {
  id: string
  name: string
  description: string | null
  unitPrice: number
  category: string | null
  createdAt: string
  updatedAt: string
}

export interface ProductsResponse {
  products: Product[]
  total: number
}

export type ProductsListFilters = {
  search?: string
  category?: string
  restaurantId?: string | null
}

/** Options de requête pour la liste produits (utilisées par useProducts et prefetch). */
export function getProductsListQueryOptions(
  organizationId: string | undefined,
  page: number,
  limit: number,
  filters?: ProductsListFilters
) {
  return {
    queryKey: ['products', organizationId, page, limit, filters] as const,
    queryFn: async () => {
      if (!organizationId) return { products: [], total: 0, categories: [] }
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organizationId)
      queryParams.append('page', page.toString())
      queryParams.append('limit', limit.toString())
      if (filters?.search) queryParams.append('search', filters.search)
      if (filters?.category && filters.category !== 'all') queryParams.append('category', filters.category)
      if (filters?.restaurantId) queryParams.append('restaurantId', filters.restaurantId)
      const response = await fetch(`/api/products?${queryParams.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      if (data.products && Array.isArray(data.products)) {
        return {
          products: data.products,
          total: data.total || data.products.length,
          categories: data.categories || [],
          page: data.page || page,
          limit: data.limit || limit,
          totalPages: data.totalPages || Math.ceil((data.total || data.products.length) / (data.limit || limit)),
        }
      }
      return { products: [], total: 0, categories: [], page, limit, totalPages: 0 }
    },
  }
}

export function useProducts(
  page: number = 1,
  limit: number = 50,
  filters?: ProductsListFilters
) {
  const { organization } = useOrganization()
  return useQuery({
    ...getProductsListQueryOptions(organization?.id, page, limit, filters),
    enabled: !!organization?.id,
  })
}

/** Options de requête pour un produit (utilisées par useProduct et prefetch au hover). */
export function getProductQueryOptions(organizationId: string | undefined, id: string | undefined) {
  return {
    queryKey: ['product', id, organizationId] as const,
    queryFn: async (): Promise<Product | null> => {
      if (!id || !organizationId) return null
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organizationId)
      const response = await fetch(`/api/products/${id}?${queryParams.toString()}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch product')
      }
      const data = await response.json() as { product: Product }
      return data.product
    },
  }
}

export function useProduct(id: string | undefined) {
  const { organization } = useOrganization()
  return useQuery({
    ...getProductQueryOptions(organization?.id, id),
    enabled: !!id && !!organization?.id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      name: string
      description?: string
      unitPrice: number
      category?: string
    }) => {
      if (!organization?.id) throw new Error('No organization selected')
      
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, clerkOrgId: organization.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Failed to create product')
      }

      const result = await response.json() as { product: Product }
      return result.product
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', organization?.id] })
      toast({
        title: 'Produit créé',
        description: 'Le produit a été créé avec succès.',
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

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      if (!organization?.id) throw new Error('No organization selected')
      
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, clerkOrgId: organization.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Failed to update product')
      }

      const result = await response.json() as { product: Product }
      return result.product
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['product', variables.id, organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['sales', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['salesAnalyze', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['restaurant'] })
      toast({
        title: 'Produit modifié',
        description: 'Le produit a été modifié avec succès.',
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

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error('No organization selected')
      
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkOrgId: organization.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete product')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', organization?.id] })
      toast({
        title: 'Produit supprimé',
        description: 'Le produit a été supprimé avec succès.',
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

export interface ProductIngredientItem {
  id: string
  ingredientId: string
  quantityNeeded: number
  unit?: string | null
  ingredient: {
    id: string
    name: string
    unit: string
    costPerUnit: number
  }
}

export function useProductIngredients(productId: string | undefined) {
  const { organization } = useOrganization()

  return useQuery({
    queryKey: ['product-ingredients', organization?.id, productId],
    queryFn: async () => {
      if (!productId || !organization?.id) return []
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/products/${productId}/ingredients?${queryParams.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch product ingredients')
      return response.json() as Promise<ProductIngredientItem[]>
    },
    enabled: !!productId && !!organization?.id,
  })
}

export function useAddProductIngredient() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      productId,
      ingredientId,
      quantityNeeded,
      unit,
    }: {
      productId: string
      ingredientId: string
      quantityNeeded: number
      unit?: string | null
    }) => {
      if (!organization?.id) throw new Error('No organization selected')
      const response = await fetch(`/api/products/${productId}/ingredients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientId,
          quantityNeeded,
          unit: unit ?? undefined,
          clerkOrgId: organization.id,
        }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || err.details || 'Erreur lors de l\'ajout')
      }
      return response.json() as Promise<ProductIngredientItem>
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['product-ingredients', organization?.id, variables.productId],
      })
      toast({
        title: 'Ingrédient ajouté',
        description: 'L\'ingrédient a été ajouté à la recette avec succès.',
      })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: translateApiError(error.message), variant: 'destructive' })
    },
  })
}

export function useRemoveProductIngredient() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      productId,
      ingredientId,
    }: {
      productId: string
      ingredientId: string
    }) => {
      if (!organization?.id) throw new Error('No organization selected')
      const response = await fetch(
        `/api/products/${productId}/ingredients/${ingredientId}?clerkOrgId=${organization.id}`,
        { method: 'DELETE' }
      )
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || err.details || 'Erreur lors de la suppression')
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['product-ingredients', organization?.id, variables.productId],
      })
      toast({
        title: 'Ingrédient supprimé',
        description: 'L\'ingrédient a été retiré de la recette avec succès.',
      })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: translateApiError(error.message), variant: 'destructive' })
    },
  })
}

export function useImportProducts() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: { file: File }) => {
      if (!organization?.id) throw new Error('Aucune organisation sélectionnée')

      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('clerkOrgId', organization.id)

      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        const raw = result.details || result.error || 'Erreur lors de l\'import'
        const message = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] || result.error : result.error
        const displayMessage =
          typeof message === 'string' && (message.startsWith('[') || message.startsWith('{'))
            ? 'Le fichier ne correspond pas au format attendu pour l\'import produits. Vérifiez les colonnes (nom, prix_unitaire) ou téléchargez le modèle sur la page.'
            : message
        throw new Error(displayMessage || result.error || 'Erreur lors de l\'import')
      }

      return result as {
        success: boolean
        imported: number
        errors?: string[]
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products', organization?.id] })
      toast({
        title: 'Import réussi',
        description: `${data.imported} produit${data.imported > 1 ? 's' : ''} importé${data.imported > 1 ? 's' : ''} avec succès${data.errors?.length ? ` (${data.errors.length} erreur${data.errors.length > 1 ? 's' : ''})` : ''}`,
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

export function useImportBom() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: { file: File }) => {
      if (!organization?.id) throw new Error('Aucune organisation sélectionnée')

      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('clerkOrgId', organization.id)

      const response = await fetch('/api/products/bom/import', {
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
      queryClient.invalidateQueries({ queryKey: ['products', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['product-ingredients', organization?.id] })
      const created = data.created ?? 0
      const updated = data.updated ?? 0
      const msg =
        updated > 0
          ? `${data.imported} recette(s) importée(s) : ${created} créée(s), ${updated} mise(s) à jour`
          : `${data.imported} recette(s) importée(s) avec succès`
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
        description: translateApiError(error.message),
        variant: 'destructive',
      })
    },
  })
}
