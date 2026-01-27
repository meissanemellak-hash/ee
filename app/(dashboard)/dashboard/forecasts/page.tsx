'use client'

import { useState, useMemo } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, TrendingUp, Calendar, Store, Package, Trash2, Sparkles, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useForecasts, useGenerateForecasts, useDeleteForecast } from '@/lib/react-query/hooks/use-forecasts'
import { useRestaurants } from '@/lib/react-query/hooks/use-restaurants'
import { ForecastListSkeleton } from '@/components/ui/skeletons/forecast-list-skeleton'

interface Forecast {
  id: string
  forecastDate: string
  forecastedQuantity: number
  method: string
  confidence: number | null
  restaurant: {
    id: string
    name: string
  }
  product: {
    id: string
    name: string
    category: string | null
    unitPrice: number
  }
}

interface Restaurant {
  id: string
  name: string
}

export default function ForecastsPage() {
  const { organization, isLoaded } = useOrganization()
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all')
  const [selectedMethod, setSelectedMethod] = useState<string>('moving_average')
  const [forecastDate, setForecastDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 1)
    return date.toISOString().split('T')[0]
  })
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [forecastToDelete, setForecastToDelete] = useState<Forecast | null>(null)

  // Charger les restaurants pour les filtres
  const { data: restaurantsData } = useRestaurants(1, 100)
  const restaurants = restaurantsData?.restaurants || []

  // Charger les prévisions avec filtres
  const { data, isLoading, error } = useForecasts({
    restaurantId: selectedRestaurant,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const forecasts = data?.forecasts || []
  const generateForecasts = useGenerateForecasts()
  const deleteForecast = useDeleteForecast()

  // Calculer les statistiques
  const totalForecasted = forecasts.reduce((sum, f) => sum + f.forecastedQuantity, 0)
  const avgConfidence = forecasts.length > 0
    ? forecasts.reduce((sum, f) => sum + (f.confidence || 0), 0) / forecasts.length
    : 0
  const hasActiveFilters = selectedRestaurant !== 'all' || startDate || endDate

  const resetFilters = () => {
    setSelectedRestaurant('all')
    setStartDate('')
    setEndDate('')
  }

  const handleGenerate = async () => {
    if (!selectedRestaurant || selectedRestaurant === 'all') {
      return
    }

    if (!forecastDate) {
      return
    }

    generateForecasts.mutate({
      restaurantId: selectedRestaurant,
      forecastDate,
      method: selectedMethod,
    })
  }

  const handleDelete = async () => {
    if (!forecastToDelete) return
    deleteForecast.mutate(forecastToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        setForecastToDelete(null)
      },
    })
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
          <h1 className="text-3xl font-bold tracking-tight">Prévisions</h1>
          <p className="text-muted-foreground mt-1">
            Prévisions de ventes et analyses prédictives
          </p>
        </div>
      </div>

      {/* Génération de prévisions (Style Sequence) */}
      <Card className="border shadow-sm border-2 border-indigo-200 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-900/10">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            Générer des prévisions
          </CardTitle>
          <CardDescription className="mt-1">
            Créez des prévisions de ventes pour un restaurant et une date spécifiques
          </CardDescription>
          <div className="mt-3 p-3 bg-indigo-100/50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-900/30">
            <p className="text-xs text-indigo-800 dark:text-indigo-300">
              💡 Les prévisions se basent sur l&apos;historique des ventes des jours précédant la date sélectionnée. 
              Plus vous avez de ventes historiques, plus les prévisions seront précises.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Restaurant *</Label>
              <Select 
                value={selectedRestaurant === 'all' ? '' : selectedRestaurant} 
                onValueChange={(value) => setSelectedRestaurant(value || 'all')}
              >
                <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors">
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
            </div>

            <div className="space-y-2">
              <Label>Date de prévision *</Label>
              <Input
                type="date"
                value={forecastDate}
                onChange={(e) => setForecastDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label>Méthode</Label>
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moving_average">Moyenne mobile</SelectItem>
                  <SelectItem value="seasonality">Saisonnalité</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex items-end">
              <Button 
                onClick={handleGenerate} 
                disabled={generateForecasts.isPending || !selectedRestaurant || selectedRestaurant === 'all'}
                className="w-full shadow-sm"
              >
                {generateForecasts.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Générer
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques (Style Sequence) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prévisions totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{forecasts.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Prévisions enregistrées
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quantité prévue</CardTitle>
            <Package className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-600">{totalForecasted.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Unités prévues
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confiance moyenne</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{(avgConfidence * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              Niveau de confiance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des prévisions (Style Sequence) */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold">Liste des prévisions</CardTitle>
              <CardDescription className="mt-1">
                {forecasts.length} prévision{forecasts.length > 1 ? 's' : ''} trouvée{forecasts.length > 1 ? 's' : ''}
                {hasActiveFilters && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (filtrée{forecasts.length > 1 ? 's' : ''})
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-end gap-2 flex-wrap">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Restaurant</Label>
                <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                  <SelectTrigger className="w-[160px] h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors">
                    <SelectValue placeholder="Tous" />
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
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date début</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[140px] h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date fin</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[140px] h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
                />
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-9 text-xs shadow-sm"
                >
                  <X className="h-3 w-3 mr-1" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ForecastListSkeleton />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">
                Erreur lors du chargement des prévisions. Veuillez réessayer.
              </p>
            </div>
          ) : forecasts.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Aucune prévision trouvée</h3>
              <p className="text-muted-foreground mb-2">
                {hasActiveFilters
                  ? 'Aucune prévision ne correspond à vos critères de recherche.'
                  : 'Utilisez le formulaire ci-dessus pour générer des prévisions'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {forecasts.map((forecast) => (
                <div
                  key={forecast.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{forecast.product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Store className="h-3 w-3" />
                            <span className="truncate">{forecast.restaurant.name}</span>
                          </div>
                          <span className="text-muted-foreground">•</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(new Date(forecast.forecastDate))}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Méthode: {forecast.method === 'moving_average' ? 'Moyenne mobile' : 'Saisonnalité'} • 
                          Confiance: {forecast.confidence ? `${(forecast.confidence * 100).toFixed(0)}%` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                        {forecast.forecastedQuantity.toFixed(0)} unités
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(forecast.forecastedQuantity * forecast.product.unitPrice)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        setForecastToDelete(forecast)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la prévision</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette prévision ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteForecast.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteForecast.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteForecast.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
