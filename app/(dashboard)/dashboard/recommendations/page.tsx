'use client'

import { useState, useMemo } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Lightbulb, TrendingUp, Package, CheckCircle2, XCircle, RefreshCw, Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { useRecommendations, useGenerateBOMRecommendations, useUpdateRecommendationStatus, type RecommendationDetails } from '@/lib/react-query/hooks/use-recommendations'
import { useRestaurants } from '@/lib/react-query/hooks/use-restaurants'
import { RecommendationListSkeleton } from '@/components/ui/skeletons/recommendation-list-skeleton'

interface Recommendation {
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

export default function RecommendationsPage() {
  const { organization, isLoaded } = useOrganization()
  const router = useRouter()
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Charger les restaurants pour les filtres
  const { data: restaurantsData } = useRestaurants(1, 100)
  const restaurants = restaurantsData?.restaurants || []

  // Charger les recommandations avec filtres
  const { data: recommendations = [], isLoading, error, refetch } = useRecommendations({
    restaurantId: selectedRestaurant,
    type: selectedType,
    status: selectedStatus,
  })

  const generateRecommendations = useGenerateBOMRecommendations()
  const updateStatus = useUpdateRecommendationStatus()

  // Calculer les statistiques
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : []
  
  const calculateTotalSavings = () => {
    const pendingRecs = safeRecommendations.filter((r) => r.status === 'pending')
    
    return pendingRecs.reduce((total, rec) => {
      const data = rec.data as RecommendationDetails
      
      if (data?.estimatedSavings) {
        return total + data.estimatedSavings
      }
      
      if (data?.ingredients && Array.isArray(data.ingredients)) {
        const estimatedSavings = data.ingredients.reduce((acc: number, ing: any) => {
          const quantityToOrder = ing.quantityToOrder || 0
          return acc + (quantityToOrder > 0 ? 100 : 0)
        }, 0)
        return total + estimatedSavings
      }
      
      return total + 500
    }, 0)
  }
  
  const filteredRecommendations = useMemo(() => {
    return safeRecommendations.filter((rec) => {
      if (selectedRestaurant !== 'all' && rec.restaurantId !== selectedRestaurant) return false
      if (selectedType !== 'all' && rec.type !== selectedType) return false
      if (selectedStatus !== 'all' && rec.status !== selectedStatus) return false
      return true
    })
  }, [safeRecommendations, selectedRestaurant, selectedType, selectedStatus])

  const handleGenerate = (restaurantId?: string) => {
    if (!restaurantId || restaurantId === 'all') return
    
    generateRecommendations.mutate({
      restaurantId,
      shrinkPct: 0.1,
      days: 7,
    })
  }

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => {
          if (status === 'accepted') {
            setTimeout(() => {
              router.push('/dashboard')
            }, 1000)
          }
        },
      }
    )
  }

  if (!isLoaded) {
    return (
      <div className="p-6 space-y-6">
        <Card className="border shadow-sm">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Chargement de votre organisation...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header (Style Sequence) */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recommandations</h1>
          <p className="text-muted-foreground mt-1">
            Recommandations actionnables pour optimiser vos opérations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            className="shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques (Style Sequence) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recommandations en attente
            </CardTitle>
            <Lightbulb className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {safeRecommendations.filter((r) => r.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Nécessitent une action
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Économies estimées
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(calculateTotalSavings())}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Sur les recommandations en attente
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total recommandations
            </CardTitle>
            <Package className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-600">{safeRecommendations.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Toutes périodes confondues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres (Style Sequence) */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
          <CardDescription className="mt-1">
            Filtrez les recommandations par restaurant, type ou statut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Restaurant</label>
              <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors">
                  <SelectValue placeholder="Tous les restaurants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les restaurants</SelectItem>
                  {restaurants.map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="ORDER">Commandes</SelectItem>
                  <SelectItem value="STAFFING">Staffing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="accepted">Acceptées</SelectItem>
                  <SelectItem value="dismissed">Rejetées</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Génération de recommandations (Style Sequence) */}
      <Card className="border shadow-sm border-2 border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-white" />
            </div>
            Générer de nouvelles recommandations
          </CardTitle>
          <CardDescription className="mt-1">
            Créez des recommandations BOM pour un restaurant spécifique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select
              value={selectedRestaurant === 'all' ? '' : selectedRestaurant}
              onValueChange={(value) => setSelectedRestaurant(value || 'all')}
            >
              <SelectTrigger className="flex-1 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors">
                <SelectValue placeholder="Sélectionner un restaurant" />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => handleGenerate(selectedRestaurant !== 'all' ? selectedRestaurant : undefined)}
              disabled={generateRecommendations.isPending || selectedRestaurant === 'all'}
              className="shadow-sm"
            >
              {generateRecommendations.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Générer
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des recommandations (Style Sequence) */}
      {isLoading ? (
        <RecommendationListSkeleton />
      ) : error ? (
        <Card className="border shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-red-600 dark:text-red-400">
              Erreur lors du chargement des recommandations. Veuillez réessayer.
            </p>
          </CardContent>
        </Card>
      ) : filteredRecommendations.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Lightbulb className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucune recommandation trouvée</h3>
            <p className="text-muted-foreground">
              Aucune recommandation ne correspond à vos critères de recherche.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecommendations.map((recommendation) => {
            const details = recommendation.data as RecommendationDetails
            const isExpanded = expandedId === recommendation.id

            return (
              <Card key={recommendation.id} className="border shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          recommendation.type === 'ORDER' 
                            ? 'bg-gradient-to-br from-teal-500 to-emerald-600' 
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                          {recommendation.type === 'ORDER' ? (
                            <Package className="h-4 w-4 text-white" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <span className="truncate">
                          {recommendation.type === 'ORDER' ? 'Recommandation de commande' : 'Recommandation de staffing'}
                        </span>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {recommendation.restaurant.name} •{' '}
                        {details?.period && (
                          <>
                            {new Date(details.period.start).toLocaleDateString('fr-FR')} -{' '}
                            {new Date(details.period.end).toLocaleDateString('fr-FR')}
                          </>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                          recommendation.priority === 'high'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                            : recommendation.priority === 'medium'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        {recommendation.priority}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                          recommendation.status === 'accepted'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                            : recommendation.status === 'dismissed'
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
                        }`}
                      >
                        {recommendation.status === 'accepted'
                          ? 'Acceptée'
                          : recommendation.status === 'dismissed'
                          ? 'Rejetée'
                          : 'En attente'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {recommendation.type === 'ORDER' && details?.ingredients && (
                    <div className="space-y-4">
                      <div className="rounded-lg bg-muted p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Période:</span>
                            <p className="font-medium">
                              {new Date(details.period.start).toLocaleDateString('fr-FR')} -{' '}
                              {new Date(details.period.end).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Shrink:</span>
                            <p className="font-medium">{(details.assumptions.shrinkPct * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>

                      {!isExpanded ? (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {details.ingredients.length} ingrédients à commander
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedId(recommendation.id)}
                          >
                            Voir les détails
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="rounded-lg border">
                            <table className="w-full text-sm">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="px-4 py-2 text-left">Ingrédient</th>
                                  <th className="px-4 py-2 text-right">Stock actuel</th>
                                  <th className="px-4 py-2 text-right">Besoin</th>
                                  <th className="px-4 py-2 text-right">À commander</th>
                                  <th className="px-4 py-2 text-right">Pack</th>
                                  <th className="px-4 py-2 text-right">Fournisseur</th>
                                </tr>
                              </thead>
                              <tbody>
                                {details.ingredients.map((ing, i) => (
                                  <tr key={i} className="border-t">
                                    <td className="px-4 py-2 font-medium">{ing.ingredientName}</td>
                                    <td className="px-4 py-2 text-right">
                                      {ing.currentStock.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                      {ing.neededQuantity.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-2 text-right font-medium">
                                      {ing.quantityToOrder.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                      {ing.packSize
                                        ? `${ing.numberOfPacks} × ${ing.packSize}`
                                        : '-'}
                                    </td>
                                    <td className="px-4 py-2 text-right text-muted-foreground">
                                      {ing.supplierName || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedId(null)}
                          >
                            Masquer les détails
                          </Button>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 border-t">
                        {recommendation.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(recommendation.id, 'accepted')}
                              className="shadow-sm"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Accepter
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(recommendation.id, 'dismissed')}
                              className="shadow-sm"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rejeter
                            </Button>
                          </>
                        )}
                        {recommendation.status === 'accepted' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(recommendation.id, 'pending')}
                            className="shadow-sm"
                          >
                            Remettre en attente
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {recommendation.type === 'STAFFING' && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Données de staffing: {JSON.stringify(details, null, 2)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
