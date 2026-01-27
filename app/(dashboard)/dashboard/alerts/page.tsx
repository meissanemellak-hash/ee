'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertTriangle, CheckCircle2, RefreshCw, Filter, XCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDateTime } from '@/lib/utils'

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
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [restaurants, setRestaurants] = useState<Array<{ id: string; name: string }>>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [showResolved, setShowResolved] = useState<boolean>(false)
  const [resolving, setResolving] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  // Charger les restaurants
  useEffect(() => {
    if (isLoaded && organization?.id) {
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      fetch(`/api/restaurants?${queryParams.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setRestaurants(data)
          }
        })
        .catch((error) => {
          console.error('Error fetching restaurants:', error)
        })
    } else if (isLoaded) {
      setLoading(false)
    }
  }, [isLoaded, organization?.id])

  // Charger les alertes
  const loadAlerts = async () => {
    if (!isLoaded || !organization?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('clerkOrgId', organization.id)
      if (selectedRestaurant !== 'all') params.append('restaurantId', selectedRestaurant)
      if (selectedType !== 'all') params.append('type', selectedType)
      if (selectedSeverity !== 'all') params.append('severity', selectedSeverity)
      params.append('resolved', showResolved.toString())

      const response = await fetch(`/api/alerts?${params.toString()}`)
      const data = await response.json()
      setAlerts(Array.isArray(data) ? data : [])
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les alertes',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded && organization?.id) {
      loadAlerts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurant, selectedType, selectedSeverity, showResolved, isLoaded, organization?.id])

  const handleGenerateAlerts = async (createTest: boolean = false) => {
    if (!organization?.id) {
      toast({
        title: 'Erreur',
        description: 'Aucune organisation active.',
        variant: 'destructive',
      })
      return
    }

    if (selectedRestaurant === 'all') {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un restaurant spécifique pour générer les alertes.',
        variant: 'destructive',
      })
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: selectedRestaurant,
          clerkOrgId: organization.id,
          createTest,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la génération des alertes')
      }

      const data = await response.json()

      toast({
        title: createTest ? 'Alertes de test créées' : 'Alertes générées',
        description: data.message || (createTest 
          ? '3 alertes de test ont été créées avec succès.'
          : 'Les alertes ont été vérifiées et générées avec succès.'),
      })

      loadAlerts()
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

  const handleResolve = async (alertId: string, resolved: boolean) => {
    if (!organization?.id) {
      toast({
        title: 'Erreur',
        description: 'Aucune organisation active.',
        variant: 'destructive',
      })
      return
    }

    setResolving(alertId)
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolved,
          clerkOrgId: organization.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      toast({
        title: 'Alerte mise à jour',
        description: resolved ? 'Alerte marquée comme résolue' : 'Alerte réactivée',
      })

      loadAlerts()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      })
    } finally {
      setResolving(null)
    }
  }

  // Calculer les statistiques
  const stats = {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical' && !a.resolved).length,
    high: alerts.filter((a) => a.severity === 'high' && !a.resolved).length,
    medium: alerts.filter((a) => a.severity === 'medium' && !a.resolved).length,
    low: alerts.filter((a) => a.severity === 'low' && !a.resolved).length,
    resolved: alerts.filter((a) => a.resolved).length,
  }

  const filteredAlerts = alerts.filter((alert) => {
    if (selectedRestaurant !== 'all' && alert.restaurantId !== selectedRestaurant) return false
    if (selectedType !== 'all' && alert.type !== selectedType) return false
    if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity) return false
    return true
  })

  if (!isLoaded || loading) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {!isLoaded ? 'Chargement de votre organisation...' : 'Chargement des alertes...'}
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
          <h1 className="text-3xl font-bold">Alertes</h1>
          <p className="text-muted-foreground">
            Alertes nécessitant votre attention
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => loadAlerts()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          {selectedRestaurant !== 'all' && (
            <>
              <Button
                onClick={handleGenerateAlerts}
                disabled={generating || loading}
              >
                {generating ? (
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
                disabled={generating || loading}
              >
                {generating ? (
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

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Alertes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">Non résolues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Élevées</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
            <p className="text-xs text-muted-foreground">Non résolues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyennes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
            <p className="text-xs text-muted-foreground">Non résolues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Résolues</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">Cette période</p>
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
          <div className="grid gap-4 md:grid-cols-4">
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
                <SelectTrigger>
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
                <SelectTrigger>
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

      {/* Liste des alertes */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {showResolved
                ? 'Aucune alerte résolue trouvée.'
                : 'Aucune alerte active. Tout va bien !'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className={alert.resolved ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle
                        className={`h-5 w-5 ${
                          alert.severity === 'critical'
                            ? 'text-red-600'
                            : alert.severity === 'high'
                            ? 'text-orange-600'
                            : alert.severity === 'medium'
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                        }`}
                      />
                      {typeLabels[alert.type] || alert.type}
                    </CardTitle>
                    <CardDescription>
                      {alert.restaurant.name} • {formatDateTime(alert.createdAt)}
                      {alert.resolved && alert.resolvedAt && (
                        <> • Résolue le {formatDateTime(alert.resolvedAt)}</>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        severityColors[alert.severity as keyof typeof severityColors] ||
                        severityColors.medium
                      }`}
                    >
                      {severityLabels[alert.severity as keyof typeof severityLabels] ||
                        alert.severity}
                    </span>
                    {alert.resolved && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        Résolue
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-start">
                  <p className="flex-1">{alert.message}</p>
                  <div className="ml-4">
                    {alert.resolved ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(alert.id, false)}
                        disabled={resolving === alert.id}
                      >
                        {resolving === alert.id ? (
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
                        disabled={resolving === alert.id}
                      >
                        {resolving === alert.id ? (
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
