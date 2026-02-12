'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { useActiveRestaurant } from '@/hooks/use-active-restaurant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, CheckCircle2, RefreshCw, Filter, XCircle, Lightbulb, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDateTime } from '@/lib/utils'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { useAlerts, useAlertsCurrentState, useGenerateAlerts, useUpdateAlertStatus } from '@/lib/react-query/hooks/use-alerts'
import { useRestaurants } from '@/lib/react-query/hooks/use-restaurants'
import { useUserRole } from '@/lib/react-query/hooks/use-user-role'
import { permissions } from '@/lib/roles'
import { AlertListSkeleton } from '@/components/ui/skeletons/alert-list-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

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
  low: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
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
  OTHER: 'Autre',
}

export default function AlertsPage() {
  const { organization, isLoaded } = useOrganization()
  const searchParams = useSearchParams()
  const urlRestaurant = searchParams.get('restaurant')
  const { setActiveRestaurantId } = useActiveRestaurant()
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(() => urlRestaurant || 'all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('active')

  useEffect(() => {
    setSelectedRestaurant(urlRestaurant || 'all')
  }, [urlRestaurant])

  // Charger les restaurants pour les filtres
  const { data: restaurantsData } = useRestaurants(1, 100)
  const restaurants = restaurantsData?.restaurants || []

  // Charger les alertes avec filtres (resolved undefined = toutes)
  const { data: alerts = [], isLoading, error, refetch } = useAlerts({
    restaurantId: selectedRestaurant,
    type: selectedType,
    severity: selectedSeverity,
    resolved: statusFilter === 'all' ? undefined : statusFilter === 'resolved',
  })

  // État actuel dérivé de l'inventaire (une seule source de vérité, pas d'écart avec le gaspillage)
  const { data: currentState, isLoading: currentStateLoading } = useAlertsCurrentState(
    selectedRestaurant !== 'all' ? selectedRestaurant : null
  )

  const generateAlerts = useGenerateAlerts()
  const updateAlertStatus = useUpdateAlertStatus()

  // Synchronisation automatique : si l'état actuel (inventaire) signale des ruptures/surstocks
  // et qu'il n'y a aucune alerte active en base, on génère les alertes sans clic utilisateur.
  const hasAutoSyncedRef = useRef(false)
  useEffect(() => {
    if (selectedRestaurant === 'all') {
      hasAutoSyncedRef.current = false
      return
    }
    const hasCurrentStateIssues =
      currentState &&
      !currentStateLoading &&
      (currentState.shortages > 0 || currentState.overstocks > 0)
    const noActiveAlerts = !isLoading && alerts.length === 0
    const shouldAutoSync =
      statusFilter === 'active' &&
      hasCurrentStateIssues &&
      noActiveAlerts &&
      !generateAlerts.isPending &&
      !hasAutoSyncedRef.current
    if (shouldAutoSync) {
      hasAutoSyncedRef.current = true
      generateAlerts.mutate({ restaurantId: selectedRestaurant, createTest: false })
    }
  }, [
    selectedRestaurant,
    statusFilter,
    currentState,
    currentStateLoading,
    isLoading,
    alerts.length,
    generateAlerts.isPending,
  ])
  useEffect(() => {
    if (selectedRestaurant === 'all') hasAutoSyncedRef.current = false
  }, [selectedRestaurant])

  const { data: roleData } = useUserRole()
  const currentRole = roleData ?? 'staff'
  const canResolve = permissions.canResolveAlert(currentRole)

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
      if (alert.type === 'OVERSTAFFING' || alert.type === 'UNDERSTAFFING') return false
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
            <h1 className="text-3xl font-bold tracking-tight">Alertes</h1>
            <p className="text-muted-foreground mt-1.5">
              Alertes nécessitant votre attention
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-16 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Aucune organisation active</h2>
              <p className="text-muted-foreground">
                Veuillez sélectionner une organisation pour accéder aux alertes.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/alerts">Retour aux alertes</Link>
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
            <h1 className="text-3xl font-bold tracking-tight">Alertes</h1>
            <p className="text-muted-foreground mt-1.5">
              Alertes nécessitant votre attention
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-red-800 dark:text-red-400">
                Une erreur s’est produite lors du chargement des alertes. Vérifiez votre connexion et réessayez.
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
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Alertes">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Alertes' }]} className="mb-4" />
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-6 border-b border-border/60">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alertes</h1>
            <p className="text-muted-foreground mt-1.5">
              Alertes nécessitant votre attention
            </p>
            {alerts.length >= 0 && (
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {alerts.length} alerte{alerts.length !== 1 ? 's' : ''}
              </p>
            )}
            {selectedRestaurant === 'all' && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Sélectionnez un restaurant pour voir l&apos;état actuel (ruptures / surstocks) en temps réel.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              className="shadow-sm"
              aria-label="Actualiser la liste des alertes"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            {selectedRestaurant !== 'all' && (
              <Button
                onClick={() => handleGenerateAlerts(false)}
                disabled={generateAlerts.isPending || isLoading}
                className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0"
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
            )}
          </div>
        </header>

        {selectedRestaurant !== 'all' && (
          <Card className="rounded-xl border shadow-sm bg-card border-teal-200 dark:border-teal-800/50 bg-teal-50/30 dark:bg-teal-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                État actuel (d&apos;après l&apos;inventaire)
              </CardTitle>
              <CardDescription className="mt-1">
                Reflète l&apos;inventaire en temps réel. Les alertes sont synchronisées automatiquement à l&apos;ouverture de la page. La liste des alertes ci-dessous peut aussi contenir des «&nbsp;risque de rupture&nbsp;» basées sur les prévisions (ex. demain). Le total d&apos;alertes peut être supérieur au nombre de ruptures affichées dans l&apos;état actuel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentStateLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Chargement de l&apos;état actuel…</span>
                </div>
              ) : currentState ? (
                <>
                  <div className="flex flex-wrap gap-4">
                    <span className="text-sm">
                      <strong className="text-red-700 dark:text-red-400">{currentState.shortages}</strong> rupture{currentState.shortages !== 1 ? 's' : ''} imminente{currentState.shortages !== 1 ? 's' : ''}
                    </span>
                    <span className="text-sm">
                      <strong className="text-amber-700 dark:text-amber-400">{currentState.overstocks}</strong> surstock{currentState.overstocks !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {currentState.shortages === 0 && currentState.overstocks === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Aucune rupture ni surstock détecté selon les seuils actuels.
                    </p>
                  )}
                </>
              ) : null}
            </CardContent>
          </Card>
        )}

        <Card className="rounded-xl border shadow-sm bg-card border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Comment agir
            </CardTitle>
            <CardDescription className="mt-1">
              Consultez les <Link href="/dashboard/recommendations" className="text-teal-600 dark:text-teal-400 font-medium hover:underline inline-flex items-center gap-1">Recommandations <ArrowRight className="h-3.5 w-3.5" /></Link> pour les actions proposées : commandes en cas de rupture de stock, effectifs. Pour un surstock, ajustez les quantités dans l&apos;Inventaire ou évitez de commander cet ingrédient jusqu&apos;à descente du stock.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-5">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              <AlertTriangle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-9 w-16 mb-2" /> : <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{stats.total}</div>}
              <p className="text-xs text-muted-foreground mt-2">Alertes</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Critiques</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-9 w-16 mb-2" /> : <div className="text-3xl font-bold text-red-700 dark:text-red-400">{stats.critical}</div>}
              <p className="text-xs text-muted-foreground mt-2">Non résolues</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Élevées</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-9 w-16 mb-2" /> : <div className="text-3xl font-bold text-orange-700 dark:text-orange-400">{stats.high}</div>}
              <p className="text-xs text-muted-foreground mt-2">Non résolues</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Moyennes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-9 w-16 mb-2" /> : <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{stats.medium}</div>}
              <p className="text-xs text-muted-foreground mt-2">Non résolues</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Résolues</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-9 w-16 mb-2" /> : <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{stats.resolved}</div>}
              <p className="text-xs text-muted-foreground mt-2">Cette période</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl border shadow-sm bg-card" role="search" aria-label="Filtres alertes">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              Filtres
            </CardTitle>
            <CardDescription className="mt-1">
              Filtrez les alertes par restaurant, type, sévérité ou statut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="alert-filter-restaurant">Restaurant</Label>
                <Select
                value={selectedRestaurant}
                onValueChange={(v) => {
                  setSelectedRestaurant(v)
                  setActiveRestaurantId(v === 'all' ? null : v)
                }}
              >
                  <SelectTrigger id="alert-filter-restaurant" className="bg-muted/50 dark:bg-gray-800 border-border" aria-label="Filtrer par restaurant">
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
                <Label htmlFor="alert-filter-type">Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger id="alert-filter-type" className="bg-muted/50 dark:bg-gray-800 border-border" aria-label="Filtrer par type">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="OVERSTOCK">Surstock</SelectItem>
                    <SelectItem value="SHORTAGE">Rupture de stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="alert-filter-severity">Sévérité</Label>
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger id="alert-filter-severity" className="bg-muted/50 dark:bg-gray-800 border-border" aria-label="Filtrer par sévérité">
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
                <Label htmlFor="alert-filter-status">Statut</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value: 'all' | 'active' | 'resolved') => setStatusFilter(value)}
                >
                  <SelectTrigger id="alert-filter-status" className="bg-muted/50 dark:bg-gray-800 border-border" aria-label="Filtrer par statut (tous, actives ou résolues)">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actives</SelectItem>
                    <SelectItem value="resolved">Résolues</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <AlertListSkeleton />
        ) : filteredAlerts.length === 0 ? (
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center mb-5">
                <AlertTriangle className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {statusFilter === 'resolved' ? 'Aucune alerte résolue' : statusFilter === 'active' ? 'Aucune alerte active' : 'Aucune alerte'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {statusFilter === 'resolved'
                  ? 'Aucune alerte résolue trouvée avec ces filtres.'
                  : statusFilter === 'active'
                    ? (selectedRestaurant !== 'all' && currentState && (currentState.shortages > 0 || currentState.overstocks > 0))
                      ? 'Des ruptures ou surstocks sont détectés dans l\'inventaire. La synchronisation des alertes est automatique ; la liste se met à jour en quelques secondes.'
                      : 'Aucune alerte active. Tout va bien !'
                    : 'Aucune alerte trouvée avec ces filtres.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <section className="space-y-4" aria-label="Liste des alertes">
          {filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`rounded-xl border shadow-sm bg-card hover:shadow-md transition-shadow duration-200 ${
                alert.resolved ? 'opacity-60' : ''
              } ${
                alert.severity === 'critical'
                  ? 'border-l-4 border-l-red-500'
                  : alert.severity === 'high'
                  ? 'border-l-4 border-l-orange-500'
                  : alert.severity === 'medium'
                  ? 'border-l-4 border-l-yellow-500'
                  : 'border-l-4 border-l-teal-500'
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        alert.severity === 'critical'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : alert.severity === 'high'
                          ? 'bg-orange-100 dark:bg-orange-900/30'
                          : alert.severity === 'medium'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30'
                          : 'bg-teal-100 dark:bg-teal-900/30'
                      }`}>
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            alert.severity === 'critical'
                              ? 'text-red-600 dark:text-red-400'
                              : alert.severity === 'high'
                              ? 'text-orange-600 dark:text-orange-400'
                              : alert.severity === 'medium'
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-teal-600 dark:text-teal-400'
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
                          : 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
                      }`}
                    >
                      {severityLabels[alert.severity as keyof typeof severityLabels] ||
                        alert.severity}
                    </span>
                    {alert.resolved && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
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
                  {canResolve && (
                    <div className="ml-4 flex-shrink-0">
                      {alert.resolved ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(alert.id, false)}
                        disabled={updateAlertStatus.isPending}
                        className="shadow-sm"
                        aria-label="Réactiver cette alerte"
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
                        className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0"
                        aria-label={`Résoudre l’alerte : ${alert.message.slice(0, 50)}${alert.message.length > 50 ? '…' : ''}`}
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
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          </section>
        )}
      </div>
    </main>
  )
}
