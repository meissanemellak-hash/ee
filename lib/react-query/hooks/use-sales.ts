import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrganization } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'

export interface Sale {
  id: string
  restaurantId: string
  productId: string
  quantity: number
  amount: number
  saleDate: string
  saleHour: number
  restaurant: {
    id: string
    name: string
  }
  product: {
    id: string
    name: string
    unitPrice: number
  }
  createdAt: string
  updatedAt: string
}

export interface SalesResponse {
  sales: Sale[]
  total: number
  page?: number
  limit?: number
  totalPages?: number
}

export function useSales(page: number = 1, limit: number = 50, filters?: {
  restaurantId?: string
  productId?: string
  startDate?: string
  endDate?: string
}) {
  const { organization } = useOrganization()

  return useQuery({
    queryKey: ['sales', organization?.id, page, limit, filters],
    queryFn: async () => {
      if (!organization?.id) return { sales: [], total: 0, page: 1, limit, totalPages: 0 }
      
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      queryParams.append('page', page.toString())
      queryParams.append('limit', limit.toString())
      
      if (filters?.restaurantId && filters.restaurantId !== 'all') {
        queryParams.append('restaurantId', filters.restaurantId)
      }
      if (filters?.productId && filters.productId !== 'all') {
        queryParams.append('productId', filters.productId)
      }
      if (filters?.startDate) queryParams.append('startDate', filters.startDate)
      if (filters?.endDate) queryParams.append('endDate', filters.endDate)
      
      const response = await fetch(`/api/sales?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales')
      }
      
      const data = await response.json()
      
      // Support des deux formats : nouveau (avec pagination) et ancien (tableau simple)
      if (data.sales && Array.isArray(data.sales)) {
        return {
          sales: data.sales,
          total: data.total || data.sales.length,
          page: data.page || page,
          limit: data.limit || limit,
          totalPages: data.totalPages || Math.ceil((data.total || data.sales.length) / (data.limit || limit)),
        }
      }
      
      // Format ancien (tableau simple)
      if (Array.isArray(data)) {
        return {
          sales: data,
          total: data.length,
          page,
          limit,
          totalPages: Math.ceil(data.length / limit),
        }
      }
      
      return {
        sales: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      }
    },
    enabled: !!organization?.id,
  })
}

export interface SalesAnalysis {
  totalSales: number
  totalRevenue: number
  averagePerDay: number
  topProducts: Array<{
    productId: string
    productName: string
    quantity: number
    revenue: number
  }>
  salesByHour: Array<{
    hour: number
    quantity: number
    revenue: number
  }>
  salesByDay: Array<{
    date: string
    quantity: number
    revenue: number
  }>
}

export function useSalesAnalyze(filters?: {
  restaurantId?: string
  startDate?: string
  endDate?: string
}) {
  const { organization } = useOrganization()

  return useQuery({
    queryKey: ['salesAnalyze', organization?.id, filters],
    queryFn: async () => {
      if (!organization?.id) {
        return {
          totalSales: 0,
          totalRevenue: 0,
          averagePerDay: 0,
          topProducts: [],
          salesByHour: [],
          salesByDay: [],
        } as SalesAnalysis
      }

      const params = new URLSearchParams()
      params.append('clerkOrgId', organization.id)
      if (filters?.restaurantId && filters.restaurantId !== 'all') {
        params.append('restaurantId', filters.restaurantId)
      }
      if (filters?.startDate) params.append('startDate', filters.startDate)
      if (filters?.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/api/sales/analyze?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Erreur lors du chargement de l\'analyse')
      }

      return response.json() as Promise<SalesAnalysis>
    },
    enabled: !!organization?.id,
  })
}

export function useSale(id: string | undefined) {
  const { organization } = useOrganization()

  return useQuery({
    queryKey: ['sale', id, organization?.id],
    queryFn: async () => {
      if (!id || !organization?.id) return null
      
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/sales/${id}?${queryParams.toString()}`)
      
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch sale')
      }
      
      return response.json() as Promise<Sale>
    },
    enabled: !!id && !!organization?.id,
  })
}

export function useCreateSale() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      restaurantId: string
      productId: string
      quantity: number
      amount: number
      saleDate: string
      saleHour: number
    }) => {
      if (!organization?.id) throw new Error('No organization selected')
      
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, clerkOrgId: organization.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create sale')
      }

      return response.json() as Promise<Sale>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', organization?.id] })
      toast({
        title: 'Vente créée',
        description: 'La vente a été créée avec succès.',
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

export function useUpdateSale() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Sale> }) => {
      if (!organization?.id) throw new Error('No organization selected')
      
      const response = await fetch(`/api/sales/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, clerkOrgId: organization.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Failed to update sale')
      }

      return response.json() as Promise<Sale>
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['sale', variables.id, organization?.id] })
      toast({
        title: 'Vente modifiée',
        description: 'La vente a été modifiée avec succès.',
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

export function useDeleteSale() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error('No organization selected')

      const url = new URL(`/api/sales/${id}`, window.location.origin)
      url.searchParams.set('clerkOrgId', organization.id)

      const response = await fetch(url.toString(), {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete sale')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', organization?.id] })
      toast({
        title: 'Vente supprimée',
        description: 'La vente a été supprimée avec succès.',
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

export function useImportSales() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      file: File
      restaurantId: string
    }) => {
      if (!organization?.id) throw new Error('No organization selected')

      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('restaurantId', data.restaurantId)
      formData.append('clerkOrgId', organization.id)

      const response = await fetch('/api/sales/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        const message = result.details || result.error || 'Erreur lors de l\'import'
        throw new Error(message)
      }

      return result as Promise<{
        success: boolean
        imported: number
        errors?: string[]
      }>
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales', organization?.id] })
      toast({
        title: 'Import réussi',
        description: `${data.imported} ventes importées avec succès${data.errors ? ` (${data.errors.length} erreurs)` : ''}`,
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
