'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Lightbulb, TrendingUp, Package, CheckCircle2, XCircle, RefreshCw, Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

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

interface RecommendationDetails {
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
}

export default function RecommendationsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [restaurants, setRestaurants] = useState<Array<{ id: string; name: string }>>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Charger les restaurants
  useEffect(() => {
    fetch('/api/restaurants')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRestaurants(data)
        }
      })
  }, [])

  // Charger les recommandations
  const loadRecommendations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedRestaurant !== 'all') params.append('restaurantId', selectedRestaurant)
      if (selectedType !== 'all') params.append('type', selectedType)
      if (selectedStatus !== 'all') params.append('status', selectedStatus)

      const response = await fetch(`/api/recommendations?${params.toString()}`)
      const data = await response.json()
      // S'assurer que data est toujours un tableau
      setRecommendations(Array.isArray(data) ? data : [])
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les recommandations',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecommendations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurant, selectedType, selectedStatus])

  const handleGenerate = async (restaurantId?: string) => {
    if (!restaurantId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un restaurant',
        variant: 'destructive',
      })
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/recommendations/bom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId,
          shrinkPct: 0.1,
          days: 7,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la génération')
      }

      const result = await response.json()

      toast({
        title: 'Recommandations générées',
        description: `${Array.isArray(result.recommendations) ? result.recommendations.length : 0} recommandations créées. Économies estimées: ${formatCurrency(result.estimatedSavings || 0)}`,
      })

      loadRecommendations()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/recommendations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      toast({
        title: 'Recommandation mise à jour',
        description: `Statut changé en ${status === 'accepted' ? 'accepté' : 'rejeté'}`,
      })

      loadRecommendations()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      })
    }
  }

  // S'assurer que recommendations est toujours un tableau
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : []

  const calculateTotalSavings = () => {
    // Pour les recommandations BOM, extraire les économies depuis les détails
    // Pour l'instant, on utilise une estimation basée sur le nombre de recommandations
    const pendingRecs = safeRecommendations.filter((r) => r.status === 'pending')
    return pendingRecs.length * 500 // Estimation simplifiée
  }
  
  const filteredRecommendations = safeRecommendations.filter((rec) => {
    if (selectedRestaurant !== 'all' && rec.restaurantId !== selectedRestaurant) return false
    if (selectedType !== 'all' && rec.type !== selectedType) return false
    if (selectedStatus !== 'all' && rec.status !== selectedStatus) return false
    return true
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Recommandations</h1>
          <p className="text-muted-foreground">
            Recommandations actionnables pour optimiser vos opérations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => loadRecommendations()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recommandations en attente
            </CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeRecommendations.filter((r) => r.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Nécessitent une action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Économies estimées
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(calculateTotalSavings())}
            </div>
            <p className="text-xs text-muted-foreground">
              Sur les recommandations en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total recommandations
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeRecommendations.length}</div>
            <p className="text-xs text-muted-foreground">
              Toutes périodes confondues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Restaurant</label>
              <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                <SelectTrigger>
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
                <SelectTrigger>
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
                <SelectTrigger>
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

      {/* Génération de recommandations */}
      <Card>
        <CardHeader>
          <CardTitle>Générer de nouvelles recommandations</CardTitle>
          <CardDescription>
            Créez des recommandations BOM pour un restaurant spécifique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select
              value={selectedRestaurant === 'all' ? '' : selectedRestaurant}
              onValueChange={(value) => setSelectedRestaurant(value || 'all')}
            >
              <SelectTrigger className="flex-1">
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
              disabled={generating || selectedRestaurant === 'all'}
            >
              {generating ? (
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

      {/* Liste des recommandations */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredRecommendations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Aucune recommandation trouvée avec ces filtres.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecommendations.map((recommendation) => {
            const details = recommendation.data as RecommendationDetails
            const isExpanded = expandedId === recommendation.id

            return (
              <Card key={recommendation.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {recommendation.type === 'ORDER' ? (
                          <Package className="h-5 w-5" />
                        ) : (
                          <TrendingUp className="h-5 w-5" />
                        )}
                        {recommendation.type === 'ORDER' ? 'Recommandation de commande' : 'Recommandation de staffing'}
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
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          recommendation.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : recommendation.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {recommendation.priority}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          recommendation.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : recommendation.status === 'dismissed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-orange-100 text-orange-800'
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
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Accepter
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(recommendation.id, 'dismissed')}
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
