'use client'

import { useState, useEffect } from 'react'
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
import { useToast } from '@/hooks/use-toast'

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
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [forecasts, setForecasts] = useState<Forecast[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
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
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isLoaded && organization?.id) {
      fetchRestaurants()
      fetchForecasts()
    } else if (isLoaded) {
      setLoading(false)
    }
  }, [isLoaded, organization?.id])

  useEffect(() => {
    if (isLoaded && organization?.id) {
      fetchForecasts()
    }
  }, [selectedRestaurant, startDate, endDate, isLoaded, organization?.id])

  const fetchRestaurants = async () => {
    if (!organization?.id) return

    try {
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/restaurants?${queryParams.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setRestaurants(data)
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error)
    }
  }

  const fetchForecasts = async () => {
    if (!isLoaded || !organization?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('clerkOrgId', organization.id)
      
      if (selectedRestaurant && selectedRestaurant !== 'all') {
        params.append('restaurantId', selectedRestaurant)
      }
      
      if (startDate) {
        params.append('startDate', startDate)
      }
      
      if (endDate) {
        params.append('endDate', endDate)
      }

      const response = await fetch(`/api/forecasts?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des prévisions')
      }

      const data = await response.json()
      setForecasts(data)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger les prévisions',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!organization?.id) {
      toast({
        title: 'Erreur',
        description: 'Aucune organisation active. Veuillez sélectionner une organisation.',
        variant: 'destructive',
      })
      return
    }

    if (!selectedRestaurant || selectedRestaurant === 'all') {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un restaurant',
        variant: 'destructive',
      })
      return
    }

    if (!forecastDate) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une date',
        variant: 'destructive',
      })
      return
    }

    setGenerating(true)

    try {
      const response = await fetch('/api/forecasts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: selectedRestaurant,
          forecastDate,
          method: selectedMethod,
          clerkOrgId: organization.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Erreur lors de la génération')
      }

      const data = await response.json()
      
      toast({
        title: 'Prévisions générées',
        description: `${data.forecasts.length} prévision(s) générée(s) avec succès.`,
      })

      fetchForecasts()
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

  const handleDelete = async () => {
    if (!forecastToDelete || !organization?.id) return

    try {
      setDeleting(true)
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      
      const response = await fetch(`/api/forecasts/${forecastToDelete.id}?${queryParams.toString()}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }

      toast({
        title: 'Prévision supprimée',
        description: 'La prévision a été supprimée avec succès.',
      })

      setDeleteDialogOpen(false)
      setForecastToDelete(null)
      fetchForecasts()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer la prévision',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const totalForecasted = forecasts.reduce((sum, f) => sum + f.forecastedQuantity, 0)
  const avgConfidence = forecasts.length > 0
    ? forecasts.reduce((sum, f) => sum + (f.confidence || 0), 0) / forecasts.length
    : 0

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = selectedRestaurant !== 'all' || startDate || endDate

  const resetFilters = () => {
    setSelectedRestaurant('all')
    setStartDate('')
    setEndDate('')
  }

  if (!isLoaded || loading) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {!isLoaded ? 'Chargement de votre organisation...' : 'Chargement des prévisions...'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Prévisions</h1>
          <p className="text-muted-foreground">
            Prévisions de ventes et analyses prédictives
          </p>
        </div>
      </div>

      {/* Génération de prévisions */}
      <Card>
        <CardHeader>
          <CardTitle>Générer des prévisions</CardTitle>
          <CardDescription>
            Créez des prévisions de ventes pour un restaurant et une date spécifiques
          </CardDescription>
          <CardDescription className="text-xs text-muted-foreground mt-2">
            💡 Les prévisions se basent sur l&apos;historique des ventes des jours précédant la date sélectionnée. 
            Plus vous avez de ventes historiques, plus les prévisions seront précises.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Restaurant *</Label>
              <Select 
                value={selectedRestaurant === 'all' ? '' : selectedRestaurant} 
                onValueChange={(value) => setSelectedRestaurant(value || 'all')}
              >
                <SelectTrigger>
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
              />
            </div>

            <div className="space-y-2">
              <Label>Méthode</Label>
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger>
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
                disabled={generating || !selectedRestaurant || selectedRestaurant === 'all'}
                className="w-full"
              >
                {generating ? (
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

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prévisions totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forecasts.length}</div>
            <p className="text-xs text-muted-foreground">
              Prévisions enregistrées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantité prévue</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalForecasted.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Unités prévues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confiance moyenne</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(avgConfidence * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Niveau de confiance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des prévisions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Liste des prévisions</CardTitle>
              <CardDescription>
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
                  <SelectTrigger className="w-[160px] h-9 text-sm">
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
                  className="w-[140px] h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date fin</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[140px] h-9 text-sm"
                />
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-9 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {forecasts.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Aucune prévision trouvée</p>
              <p className="text-sm text-muted-foreground">
                Utilisez le formulaire ci-dessus pour générer des prévisions
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {forecasts.map((forecast) => (
                <div
                  key={forecast.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{forecast.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {forecast.restaurant.name} • {formatDate(new Date(forecast.forecastDate))}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Méthode: {forecast.method === 'moving_average' ? 'Moyenne mobile (7 derniers jours avant cette date)' : 'Saisonnalité (même jour de la semaine sur 4 semaines)'} • 
                          Confiance: {forecast.confidence ? `${(forecast.confidence * 100).toFixed(0)}%` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{forecast.forecastedQuantity.toFixed(0)} unités</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(forecast.forecastedQuantity * forecast.product.unitPrice)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setForecastToDelete(forecast)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
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
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
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
