'use client'

import { useState } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, TrendingUp, Calendar, Store, Package, Trash2, Sparkles, X } from 'lucide-react'
import Link from 'next/link'
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
  const { data, isLoading, error, refetch } = useForecasts({
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
      <div className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Chargement de votre organisation...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isLoaded && !organization?.id) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <header className="pb-6 border-b border-border/60">
            <h1 className="text-3xl font-bold tracking-tight">Prévisions</h1>
            <p className="text-muted-foreground mt-1.5">
              Prévisions de ventes et analyses prédictives
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-16 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Aucune organisation active</h2>
              <p className="text-muted-foreground">
                Veuillez sélectionner une organisation pour accéder aux prévisions.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/forecasts">Retour aux prévisions</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <header className="pb-6 border-b border-border/60">
            <h1 className="text-3xl font-bold tracking-tight">Prévisions</h1>
            <p className="text-muted-foreground mt-1.5">
              Prévisions de ventes et analyses prédictives
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-red-800 dark:text-red-400">
                Une erreur s’est produite lors du chargement des prévisions. Vérifiez votre connexion et réessayez.
              </p>
              <Button variant="outline" onClick={() => refetch()} className="border-red-300 dark:border-red-800 text-red-800 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20">
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Prévisions de ventes">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <header className="pb-6 border-b border-border/60">
          <h1 className="text-3xl font-bold tracking-tight">Prévisions</h1>
          <p className="text-muted-foreground mt-1.5">
            Prévisions de ventes et analyses prédictives
          </p>
          {data && data.forecasts && (
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {data.forecasts.length} prévision{data.forecasts.length !== 1 ? 's' : ''} trouvée{data.forecasts.length !== 1 ? 's' : ''}
            </p>
          )}
        </header>

        <Card className="rounded-xl border shadow-sm border-2 border-teal-200/80 dark:border-teal-900/30 bg-teal-50/50 dark:bg-teal-900/10">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm" aria-hidden>
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              Générer des prévisions
            </CardTitle>
            <CardDescription className="mt-1">
              Créez des prévisions de ventes pour un restaurant et une date spécifiques
            </CardDescription>
            <div className="mt-3 p-3 rounded-xl bg-teal-100/50 dark:bg-teal-900/20 border border-teal-200/80 dark:border-teal-900/30">
              <p className="text-xs text-teal-800 dark:text-teal-300">
                💡 Les prévisions se basent sur l’historique des ventes des jours précédant la date sélectionnée. Plus vous avez de ventes historiques, plus les prévisions seront précises.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4" role="group" aria-label="Formulaire de génération de prévisions">
              <div className="space-y-2">
                <Label htmlFor="forecast-restaurant">Restaurant *</Label>
                <Select
                  value={selectedRestaurant === 'all' ? '' : selectedRestaurant}
                  onValueChange={(value) => setSelectedRestaurant(value || 'all')}
                >
                  <SelectTrigger id="forecast-restaurant" className="bg-muted/50 dark:bg-gray-900 border-border" aria-label="Sélectionner un restaurant">
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
                <Label htmlFor="forecast-date">Date de prévision *</Label>
                <Input
                  id="forecast-date"
                  type="date"
                  value={forecastDate}
                  onChange={(e) => setForecastDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-muted/50 dark:bg-gray-900 border-border"
                  aria-label="Date de prévision"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="forecast-method">Méthode</Label>
                <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                  <SelectTrigger id="forecast-method" className="bg-muted/50 dark:bg-gray-900 border-border" aria-label="Méthode de prévision">
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
                  className="w-full shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0"
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

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Prévisions totales</CardTitle>
              <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{forecasts.length}</div>
              <p className="text-xs text-muted-foreground mt-2">Prévisions enregistrées</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quantité prévue</CardTitle>
              <Package className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{totalForecasted.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-2">Unités prévues</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Confiance moyenne</CardTitle>
              <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{(avgConfidence * 100).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground mt-2">Niveau de confiance</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold">Liste des prévisions</CardTitle>
                <CardDescription className="mt-1">
                  {data?.forecasts ? `${data.forecasts.length} prévision${data.forecasts.length !== 1 ? 's' : ''} trouvée${data.forecasts.length !== 1 ? 's' : ''}` : 'Chargement...'}
                  {hasActiveFilters && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (filtrée{data?.forecasts && data.forecasts.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-end gap-2 flex-wrap" role="search" aria-label="Filtres liste prévisions">
                <div className="space-y-1.5">
                  <Label htmlFor="list-forecast-restaurant" className="text-xs text-muted-foreground">Restaurant</Label>
                  <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                    <SelectTrigger id="list-forecast-restaurant" className="w-[160px] h-9 text-sm bg-muted/50 dark:bg-gray-800 border-border" aria-label="Filtrer par restaurant">
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
                  <Label htmlFor="list-forecast-start" className="text-xs text-muted-foreground">Date début</Label>
                  <Input
                    id="list-forecast-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-[140px] h-9 text-sm bg-muted/50 dark:bg-gray-800 border-border"
                    aria-label="Date de début"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="list-forecast-end" className="text-xs text-muted-foreground">Date fin</Label>
                  <Input
                    id="list-forecast-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-[140px] h-9 text-sm bg-muted/50 dark:bg-gray-800 border-border"
                    aria-label="Date de fin"
                  />
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 text-xs shadow-sm" aria-label="Réinitialiser les filtres">
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
            ) : forecasts.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center mb-5">
                  <TrendingUp className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {hasActiveFilters ? 'Aucune prévision trouvée' : 'Aucune prévision pour l’instant'}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-2">
                  {hasActiveFilters
                    ? 'Aucune prévision ne correspond à vos critères. Modifiez les filtres ou générez des prévisions.'
                    : 'Utilisez le formulaire ci-dessus pour générer des prévisions de ventes.'}
                </p>
              </div>
            ) : (
              <ul className="space-y-3 list-none p-0 m-0" aria-label="Liste des prévisions">
                {forecasts.map((forecast) => (
                  <li
                    key={forecast.id}
                    className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 dark:bg-gray-800/30 border-border hover:bg-muted/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
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
                            Méthode: {forecast.method === 'moving_average' ? 'Moyenne mobile' : 'Saisonnalité'} • Confiance: {forecast.confidence ? `${(forecast.confidence * 100).toFixed(0)}%` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <p className="font-bold text-teal-700 dark:text-teal-400 text-sm">
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
                        aria-label={`Supprimer la prévision ${forecast.product.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette prévision ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. La prévision sera définitivement supprimée.
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
    </main>
  )
}
