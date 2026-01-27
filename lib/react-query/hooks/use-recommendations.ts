import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrganization } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'

export interface Recommendation {
  id: string
  restaurantId: string
  type: string
  data: any
  priority: string
  status: string
  createdAt: string
  restaurant: {
    id: string
    name: string
  }
}

export interface RecommendationDetails {
  restaurantId: string
  restaurantName: string
  period: {
    start: string
    end: string
  }
  ingredients: Array<{
    ingredientId: string
    ingredientName: string
    neededQuantity: number
    currentStock: number
    quantityToOrder: number
    packSize: number | null
    numberOfPacks: number | null
    supplierName: string | null
  }>
  assumptions: {
    shrinkPct: number
    forecastDays: number
  }
  estimatedSavings?: number
}

export function useRecommendations(filters?: {
  restaurantId?: string
  type?: string
  status?: string
}) {
  const { organization } = useOrganization()

  return useQuery({
    queryKey: ['recommendations', organization?.id, filters],
    queryFn: async () => {
      if (!organization?.id) return []
      
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      
      if (filters?.restaurantId && filters.restaurantId !== 'all') {
        queryParams.append('restaurantId', filters.restaurantId)
      }
      if (filters?.type && filters.type !== 'all') {
        queryParams.append('type', filters.type)
      }
      if (filters?.status && filters.status !== 'all') {
        queryParams.append('status', filters.status)
      }
      
      const response = await fetch(`/api/recommendations?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }
      
      const data = await response.json()
      return Array.isArray(data) ? data : []
    },
    enabled: !!organization?.id,
  })
}

export function useGenerateBOMRecommendations() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      restaurantId: string
      shrinkPct?: number
      days?: number
    }) => {
      if (!organization?.id) throw new Error('No organization selected')
      
      const response = await fetch('/api/recommendations/bom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, clerkOrgId: organization.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Failed to generate recommendations')
      }

      return response.json() as Promise<{
        recommendations: Recommendation[]
        estimatedSavings?: number
        details?: { reason?: string }
      }>
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['recommendations', organization?.id] })
      
      const recommendationsCount = Array.isArray(result.recommendations) ? result.recommendations.length : 0
      
      if (recommendationsCount === 0) {
        const reason = result.details?.reason || 'Aucune recommandation générée. Vérifiez que vous avez des produits avec des recettes et des ventes historiques.'
        toast({
          title: 'Aucune recommandation générée',
          description: reason,
          variant: 'default',
        })
      } else {
        toast({
          title: 'Recommandations générées',
          description: `${recommendationsCount} recommandation${recommendationsCount > 1 ? 's' : ''} créée${recommendationsCount > 1 ? 's' : ''}. Économies estimées: ${formatCurrency(result.estimatedSavings || 0)}`,
        })
      }
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

export function useUpdateRecommendationStatus() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (!organization?.id) throw new Error('No organization selected')
      
      const response = await fetch(`/api/recommendations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, clerkOrgId: organization.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Failed to update recommendation')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recommendations', organization?.id] })
      
      toast({
        title: 'Recommandation mise à jour',
        description: variables.status === 'accepted' 
          ? 'Recommandation acceptée. Redirection vers le dashboard...'
          : 'Statut changé en rejeté',
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
