'use client'

import { useState, useMemo } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, CheckCircle2, RefreshCw, Filter, XCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDateTime } from '@/lib/utils'
import { useAlerts, useGenerateAlerts, useUpdateAlertStatus } from '@/lib/react-query/hooks/use-alerts'
import { useRestaurants } from '@/lib/react-query/hooks/use-restaurants'
import { AlertListSkeleton } from '@/components/ui/skeletons/alert-list-skeleton'

interface Alert {
  id: string
  restaurantId: string
  type: string
  severity: string
  message: string
  resolved: boolean
  resolvedAt: string | null
  createdAt: string
  restaurant: {
    id: string
    name: string
  }
}

const severityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

const severityLabels = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée',
  critical: 'Critique',
}

const typeLabels: Record<string, string> = {
  OVERSTOCK: 'Surstock',
  SHORTAGE: 'Rupture de stock',
  OVERSTAFFING: 'Sur-effectif',
  UNDERSTAFFING: 'Sous-effectif',
  OTHER: 'Autre',
}

export default function AlertsPage() {
  const { organization, isLoaded } = useOrganization()
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [showResolved, setShowResolved] = useState<boolean>(false)

  // Charger les restaurants pour les filtres
  const { data: restaurantsData } = useRestaurants(1, 100)
  const restaurants = restaurantsData?.restaurants || []

  // Charger les alertes avec filtres
  const { data: alerts = [], isLoading, error, refetch } = useAlerts({
    restaurantId: selectedRestaurant,
    type: selectedType,
    severity: selectedSeverity,
    resolved: showResolved,
  })

  const generateAlerts = useGenerateAlerts()
  const updateAlertStatus = useUpdateAlertStatus()

  // Calculer les statistiques
  const stats = useMemo(() => ({
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical' && !a.resolved).length,
    high: alerts.filter((a) => a.severity === 'high' && !a.resolved).length,
    medium: alerts.filter((a) => a.severity === 'medium' && !a.resolved).length,
    low: alerts.filter((a) => a.severity === 'low' && !a.resolved).length,
    resolved: alerts.filter((a) => a.resolved).length,
  }), [alerts])

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (selectedRestaurant !== 'all' && alert.restaurantId !== selectedRestaurant) return false
      if (selectedType !== 'all' && alert.type !== selectedType) return false
      if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity) return false
      return true
    })
  }, [alerts, selectedRestaurant, selectedType, selectedSeverity])

  const handleGenerateAlerts = (createTest: boolean = false) => {
    if (selectedRestaurant === 'all') {
      return
    }
    
    generateAlerts.mutate({
      restaurantId: selectedRestaurant,
      createTest,
    })
  }

  const handleResolve = (alertId: string, resolved: boolean) => {
    updateAlertStatus.mutate({ id: alertId, resolved })
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
          <h1 className="text-3xl font-bold tracking-tight">Alertes</h1>
          <p className="text-muted-foreground mt-1">
            Alertes nécessitant votre attention
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            className="shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          {selectedRestaurant !== 'all' && (
            <>
              <Button
                onClick={() => handleGenerateAlerts(false)}
                disabled={generateAlerts.isPending || isLoading}
                className="shadow-sm"
              >
                {generateAlerts.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Générer les alertes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleGenerateAlerts(true)}
                disabled={generateAlerts.isPending || isLoading}
                className="shadow-sm"
              >
                {generateAlerts.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Alertes de test
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Statistiques (Style Sequence) */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-2">Alertes</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground mt-2">Non résolues</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Élevées</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.high}</div>
            <p className="text-xs text-muted-foreground mt-2">Non résolues</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Moyennes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.medium}</div>
            <p className="text-xs text-muted-foreground mt-2">Non résolues</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Résolues</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground mt-2">Cette période</p>
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
            Filtrez les alertes par restaurant, type, sévérité ou statut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
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
                  <SelectItem value="OVERSTOCK">Surstock</SelectItem>
                  <SelectItem value="SHORTAGE">Rupture de stock</SelectItem>
                  <SelectItem value="OVERSTAFFING">Sur-effectif</SelectItem>
                  <SelectItem value="UNDERSTAFFING">Sous-effectif</SelectItem>
                  <SelectItem value="OTHER">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sévérité</label>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors">
                  <SelectValue placeholder="Toutes les sévérités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sévérités</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select
                value={showResolved ? 'resolved' : 'active'}
                onValueChange={(value) => setShowResolved(value === 'resolved')}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="resolved">Résolues</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des alertes (Style Sequence) */}
      {isLoading ? (
        <AlertListSkeleton />
      ) : error ? (
        <Card className="border shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-red-600 dark:text-red-400">
              Erreur lors du chargement des alertes. Veuillez réessayer.
            </p>
          </CardContent>
        </Card>
      ) : filteredAlerts.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {showResolved ? 'Aucune alerte résolue' : 'Aucune alerte active'}
            </h3>
            <p className="text-muted-foreground">
              {showResolved
                ? 'Aucune alerte résolue trouvée avec ces filtres.'
                : 'Aucune alerte active. Tout va bien !'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`border shadow-sm hover:shadow-md transition-shadow duration-200 ${
                alert.resolved ? 'opacity-60' : ''
              } ${
                alert.severity === 'critical' 
                  ? 'border-l-4 border-l-red-500' 
                  : alert.severity === 'high'
                  ? 'border-l-4 border-l-orange-500'
                  : alert.severity === 'medium'
                  ? 'border-l-4 border-l-yellow-500'
                  : 'border-l-4 border-l-blue-500'
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        alert.severity === 'critical'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : alert.severity === 'high'
                          ? 'bg-orange-100 dark:bg-orange-900/30'
                          : alert.severity === 'medium'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30'
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            alert.severity === 'critical'
                              ? 'text-red-600 dark:text-red-400'
                              : alert.severity === 'high'
                              ? 'text-orange-600 dark:text-orange-400'
                              : alert.severity === 'medium'
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }`}
                        />
                      </div>
                      <span className="truncate">{typeLabels[alert.type] || alert.type}</span>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {alert.restaurant.name} • {formatDateTime(alert.createdAt)}
                      {alert.resolved && alert.resolvedAt && (
                        <> • Résolue le {formatDateTime(alert.resolvedAt)}</>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                        alert.severity === 'critical'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                          : alert.severity === 'high'
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
                          : alert.severity === 'medium'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {severityLabels[alert.severity as keyof typeof severityLabels] ||
                        alert.severity}
                    </span>
                    {alert.resolved && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                        <CheckCircle2 className="h-3 w-3" />
                        Résolue
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-start gap-4">
                  <p className="flex-1 text-sm">{alert.message}</p>
                  <div className="ml-4 flex-shrink-0">
                    {alert.resolved ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(alert.id, false)}
                        disabled={updateAlertStatus.isPending}
                        className="shadow-sm"
                      >
                        {updateAlertStatus.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Réactiver
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleResolve(alert.id, true)}
                        disabled={updateAlertStatus.isPending}
                        className="shadow-sm"
                      >
                        {updateAlertStatus.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Résoudre
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
