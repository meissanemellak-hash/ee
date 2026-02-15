import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
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
    /** 'forecast' = besoin issu des prévisions ; 'threshold' = basé sur le seuil min (pas de prévision ou rupture) */
    recommendationSource?: 'forecast' | 'threshold'
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

type RecommendationsFilters = {
  restaurantId?: string
  type?: string
  status?: string
}

/** Options pour préchargement (sidebar). */
export function recommendationsQueryOptions(organizationId: string | undefined, filters?: RecommendationsFilters) {
  return {
    queryKey: ['recommendations', organizationId, filters] as QueryKey,
    queryFn: async (): Promise<Recommendation[]> => {
      if (!organizationId) return []
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organizationId)
      if (filters?.restaurantId && filters.restaurantId !== 'all') {
        queryParams.append('restaurantId', filters.restaurantId)
      }
      if (filters?.type && filters.type !== 'all') queryParams.append('type', filters.type)
      if (filters?.status !== undefined && filters?.status !== null) {
        queryParams.append('status', filters.status)
      }
      const response = await fetch(`/api/recommendations?${queryParams.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch recommendations')
      const data = await response.json()
      return Array.isArray(data) ? data : []
    },
  }
}

export function useRecommendations(filters?: RecommendationsFilters) {
  const { organization } = useOrganization()
  return useQuery({
    ...recommendationsQueryOptions(organization?.id, filters),
    enabled: !!organization?.id,
    placeholderData: (previousData) => previousData,
    staleTime: 20_000,
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
        recommendationCreated?: boolean
      }>
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['recommendations', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['recommendations-last-generated', organization?.id] })
      void queryClient.refetchQueries({ queryKey: ['recommendations', organization?.id] })
      void queryClient.refetchQueries({ queryKey: ['recommendations-last-generated', organization?.id] })

      // BOM : une seule recommandation (carte) est créée en base, même si elle contient plusieurs ingrédients
      const hasRecommendations = Array.isArray(result.recommendations) && result.recommendations.length > 0
      const recommendationsCount = hasRecommendations ? 1 : 0
      const created = result.recommendationCreated === true

      if (!created && hasRecommendations) {
        toast({
          title: 'Aucune nouvelle recommandation',
          description: 'Une recommandation pour cette période a déjà été rejetée. Aucune nouvelle n’a été créée.',
          variant: 'default',
        })
      } else if (!created || recommendationsCount === 0) {
        const reason = result.details?.reason || 'Aucune recommandation générée. Vérifiez que vous avez des produits avec des recettes et des ventes historiques.'
        toast({
          title: 'Aucune recommandation générée',
          description: reason,
          variant: 'default',
        })
      } else {
        toast({
          title: 'Recommandations générées',
          description: `${recommendationsCount} recommandation${recommendationsCount > 1 ? 's' : ''} créée${recommendationsCount > 1 ? 's' : ''}. Coût estimé: ${formatCurrency((result as any).estimatedOrderCost ?? (result.details as { estimatedOrderCost?: number } | undefined)?.estimatedOrderCost ?? 0)} • Gain estimé: ${formatCurrency(result.estimatedSavings || 0)}`,
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
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recommendations', organization?.id] })
      void queryClient.refetchQueries({ queryKey: ['recommendations', organization?.id] })
      const rawCount = result.recommendations?.length ?? 0
      // Pour le staffing, une seule recommandation (un tableau avec plusieurs créneaux) est affichée
      const count = variables?.type === 'STAFFING' && rawCount > 0 ? 1 : rawCount
      const alreadyDismissed = (result as { alreadyDismissedForPeriod?: boolean }).alreadyDismissedForPeriod === true
      if (alreadyDismissed) {
        toast({
          title: 'Aucune nouvelle recommandation',
          description: 'Une recommandation pour cette période a déjà été rejetée. Aucune nouvelle n’a été créée.',
          variant: 'default',
        })
      } else if (count === 0) {
        toast({
          title: 'Aucune recommandation générée',
        })
      } else {
        toast({
          title: 'Recommandations générées',
          description: `${count} recommandation${count > 1 ? 's' : ''} ${variables?.type === 'STAFFING' ? 'd\'effectifs' : 'de commande'} créée${count > 1 ? 's' : ''}.`,
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
    mutationFn: async (params?: { shrinkPct?: number; days?: number; type?: 'ORDER' | 'STAFFING'; forecastDate?: string }) => {
      if (!organization?.id) throw new Error('No organization selected')
      const body: Record<string, unknown> = {
        clerkOrgId: organization.id,
        shrinkPct: params?.shrinkPct ?? 0.1,
        days: params?.days ?? 7,
      }
      if (params?.type) body.type = params.type
      if (params?.forecastDate) body.forecastDate = params.forecastDate
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
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recommendations', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['recommendations-last-generated', organization?.id] })
      void queryClient.refetchQueries({ queryKey: ['recommendations', organization?.id] })
      void queryClient.refetchQueries({ queryKey: ['recommendations-last-generated', organization?.id] })
      const total = result.generated
      const isStaffing = variables?.type === 'STAFFING'
      if (total === 0 && (!result.byRestaurant || result.byRestaurant.length === 0)) {
        toast({
          title: 'Aucune recommandation générée',
          description: (result as { message?: string }).message || (isStaffing ? 'Aucun restaurant ou pas assez de ventes par créneau.' : 'Aucun restaurant ou stocks suffisants.'),
        })
      } else {
        const label = isStaffing ? 'd\'effectifs' : 'de commande'
        toast({
          title: 'Génération terminée',
          description: `${total} recommandation${total !== 1 ? 's' : ''} ${label} créée${total !== 1 ? 's' : ''} pour ${result.byRestaurant?.length ?? 0} restaurant(s).`,
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
    onSuccess: (updatedRecommendation: Recommendation | undefined, variables) => {
      if (updatedRecommendation) {
        queryClient.setQueriesData(
          { queryKey: ['recommendations', organization?.id] },
          (old: Recommendation[] | undefined) => {
            if (!Array.isArray(old)) return old
            return old.map((r) => (r.id === updatedRecommendation.id ? updatedRecommendation : r))
          }
        )
        // Remise en attente : la recommandation n'était pas dans le cache "pending", on invalide pour qu'elle apparaisse
        if (variables.status === 'pending') {
          queryClient.invalidateQueries({ queryKey: ['recommendations', organization?.id] })
        }
      }
      if (variables.status === 'accepted' && updatedRecommendation?.type === 'STAFFING') {
        const raw = updatedRecommendation.data as unknown
        const data = Array.isArray(raw) ? raw : null
        const restaurantId = updatedRecommendation.restaurantId
        if (organization?.id && restaurantId && data && data.length > 0) {
          const first = data[0] as { date?: string; timeSlot?: string; recommendedStaff?: number }
          const dateStr =
            first.date && /^\d{4}-\d{2}-\d{2}$/.test(String(first.date))
              ? String(first.date)
              : new Date().toISOString().slice(0, 10)
          const slots = data.map((item: { timeSlot?: string; recommendedStaff?: number }) => ({
            slotLabel: item.timeSlot ?? '',
            plannedCount: Math.max(0, Math.floor(Number(item.recommendedStaff)) || 0),
          })).filter((s: { slotLabel: string }) => s.slotLabel)
          if (slots.length > 0) {
            queryClient.setQueryData(
              ['planned-staffing', organization.id, restaurantId, dateStr],
              { restaurantId, date: dateStr, slots }
            )
          }
        }
        queryClient.invalidateQueries({ queryKey: ['planned-staffing', organization?.id] })
        queryClient.invalidateQueries({ queryKey: ['alerts', organization?.id] })
        queryClient.invalidateQueries({ queryKey: ['alerts-current-state', organization?.id] })
      }
      toast({
        title: 'Recommandation mise à jour',
        description: variables.status === 'accepted'
          ? (updatedRecommendation?.type === 'STAFFING' ? "Recommandation d'effectifs acceptée. L'effectif prévu a été mis à jour." : "Recommandation acceptée. L'inventaire a été mis à jour avec les quantités commandées.")
          : variables.status === 'pending'
            ? 'Recommandation remise en attente.'
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
