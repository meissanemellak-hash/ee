import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrganization } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'

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

export function useProducts(
  page: number = 1,
  limit: number = 50,
  filters?: {
    search?: string
    category?: string
  }
) {
  const { organization } = useOrganization()

  return useQuery({
    queryKey: ['products', organization?.id, page, limit, filters],
    queryFn: async () => {
      if (!organization?.id) return { products: [], total: 0, categories: [] }
      
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      queryParams.append('page', page.toString())
      queryParams.append('limit', limit.toString())
      
      if (filters?.search) queryParams.append('search', filters.search)
      if (filters?.category && filters.category !== 'all') {
        queryParams.append('category', filters.category)
      }
      
      const response = await fetch(`/api/products?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      const data = await response.json()
      
      // Support des deux formats : nouveau (avec pagination) et ancien (sans pagination)
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
      
      return {
        products: [],
        total: 0,
        categories: [],
        page,
        limit,
        totalPages: 0,
      }
    },
    enabled: !!organization?.id,
  })
}

export function useProduct(id: string | undefined) {
  const { organization } = useOrganization()

  return useQuery({
    queryKey: ['product', id, organization?.id],
    queryFn: async () => {
      if (!id || !organization?.id) return null
      
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/products/${id}?${queryParams.toString()}`)
      
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch product')
      }
      
      return response.json() as Promise<Product>
    },
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
        throw new Error(error.error || 'Failed to create product')
      }

      return response.json() as Promise<Product>
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
        description: error.message,
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

      return response.json() as Promise<Product>
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['product', variables.id, organization?.id] })
      toast({
        title: 'Produit modifié',
        description: 'Le produit a été modifié avec succès.',
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
