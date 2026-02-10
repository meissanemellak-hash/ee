import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrganization } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'
import { translateApiError } from '@/lib/translate-api-error'
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
  /** Coût total estimé de la commande (€) */
  estimatedOrderCost?: number
  /** Gain estimé (ruptures/gaspillage évités, indicateur) */
  estimatedSavings?: number
  /** Ingrédients en surstock (lien avec les alertes) : ne pas commander */
  overstockIngredients?: Array<{
    ingredientId: string
    ingredientName: string
    currentStock: number
    maxThreshold: number
    unit: string | null
  }>
  reason?: string
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
      if (filters?.status !== undefined && filters?.status !== null) {
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

export function useRecommendationsLastGenerated(restaurantId?: string | null) {
  const { organization } = useOrganization()

  return useQuery({
    queryKey: ['recommendations-last-generated', organization?.id, restaurantId],
    queryFn: async (): Promise<{ lastGeneratedAt: string | null }> => {
      if (!organization?.id) return { lastGeneratedAt: null }
      const params = new URLSearchParams()
      params.append('clerkOrgId', organization.id)
      if (restaurantId && restaurantId !== 'all') params.append('restaurantId', restaurantId)
      const res = await fetch(`/api/recommendations/last-generated?${params.toString()}`)
      if (!res.ok) return { lastGeneratedAt: null }
      const data = await res.json()
      return { lastGeneratedAt: data.lastGeneratedAt ?? null }
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
      queryClient.invalidateQueries({ queryKey: ['recommendations-last-generated', organization?.id] })
      
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
          description: `${recommendationsCount} recommandation${recommendationsCount > 1 ? 's' : ''} créée${recommendationsCount > 1 ? 's' : ''}. Coût estimé: ${formatCurrency((result as any).estimatedOrderCost ?? result.details?.estimatedOrderCost ?? 0)} • Gain estimé: ${formatCurrency(result.estimatedSavings || 0)}`,
        })
      }
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

export function useGenerateClassicRecommendations() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      restaurantId: string
      type: 'ORDER' | 'STAFFING'
      forecastDate?: string
    }) => {
      if (!organization?.id) throw new Error('No organization selected')
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          clerkOrgId: organization.id,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Échec de la génération')
      }
      const result = await response.json()
      return result as { success: boolean; recommendations: unknown[] }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['recommendations', organization?.id] })
      const count = result.recommendations?.length ?? 0
      if (count === 0) {
        toast({
          title: 'Aucune recommandation générée',
          description: 'Pas assez de données (ventes par créneau horaire pour l’effectif, ou stocks suffisants pour les commandes).',
        })
      } else {
        toast({
          title: 'Recommandations générées',
          description: `${count} recommandation(s) créée(s).`,
        })
      }
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

export function useGenerateAllRecommendations() {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (params?: { shrinkPct?: number; days?: number; type?: 'ORDER' | 'STAFFING' }) => {
      if (!organization?.id) throw new Error('No organization selected')
      const body: Record<string, unknown> = {
        clerkOrgId: organization.id,
        shrinkPct: params?.shrinkPct ?? 0.1,
        days: params?.days ?? 7,
      }
      if (params?.type) body.type = params.type
      const response = await fetch('/api/recommendations/generate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Échec de la génération')
      }
      return response.json() as Promise<{
        success: boolean
        generated: number
        byRestaurant: { restaurantId: string; restaurantName: string; count: number }[]
        errors?: string[]
      }>
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['recommendations', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['recommendations-last-generated', organization?.id] })
      const total = result.generated
      if (total === 0 && (!result.byRestaurant || result.byRestaurant.length === 0)) {
        toast({
          title: 'Aucune recommandation générée',
          description: result.message || 'Aucun restaurant ou stocks suffisants.',
        })
      } else {
        toast({
          title: 'Génération terminée',
          description: `${total} recommandation${total !== 1 ? 's' : ''} créée${total !== 1 ? 's' : ''} pour ${result.byRestaurant?.length ?? 0} restaurant(s).`,
        })
      }
      if (result.errors?.length) {
        toast({
          title: 'Avertissements',
          description: result.errors.slice(0, 2).join(' • '),
          variant: 'destructive',
        })
      }
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
          ? 'Recommandation acceptée. L’inventaire a été mis à jour avec les quantités commandées.'
          : 'Statut changé en rejeté',
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
