'use client'

import { useState, useMemo, useEffect } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useActiveRestaurant } from '@/hooks/use-active-restaurant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, Lightbulb, TrendingUp, Package, CheckCircle2, XCircle, RefreshCw, Filter, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { useRecommendations, useGenerateBOMRecommendations, useGenerateClassicRecommendations, useGenerateAllRecommendations, useUpdateRecommendationStatus, type RecommendationDetails } from '@/lib/react-query/hooks/use-recommendations'
import { useRestaurants } from '@/lib/react-query/hooks/use-restaurants'
import { useUserRole } from '@/lib/react-query/hooks/use-user-role'
import { permissions } from '@/lib/roles'
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
  const searchParams = useSearchParams()
  const urlRestaurant = searchParams.get('restaurant')
  const { setActiveRestaurantId } = useActiveRestaurant()
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(() => urlRestaurant || 'all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showGainExplanationCard, setShowGainExplanationCard] = useState(false)
  const [gainExplanationRecId, setGainExplanationRecId] = useState<string | null>(null)
  const [showStaffingExplanation, setShowStaffingExplanation] = useState(false)
  const [generationType, setGenerationType] = useState<'bom' | 'staffing'>('bom')

  useEffect(() => {
    setSelectedRestaurant(urlRestaurant || 'all')
  }, [urlRestaurant])

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
  const generateClassicRecommendations = useGenerateClassicRecommendations()
  const generateAllRecommendations = useGenerateAllRecommendations()
  const updateStatus = useUpdateRecommendationStatus()

  const { data: roleData } = useUserRole()
  const currentRole = roleData ?? 'staff'
  const canAccept = permissions.canAcceptRecommendation(currentRole)

  // Calculer les statistiques
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : []
  
  const calculateTotalOrderCost = () => {
    const pendingRecs = safeRecommendations.filter((r) => r.status === 'pending')
    return pendingRecs.reduce((total, rec) => {
      const data = rec.data as RecommendationDetails
      return total + (data?.estimatedOrderCost ?? 0)
    }, 0)
  }

  const calculateTotalSavings = () => {
    const pendingRecs = safeRecommendations.filter((r) => r.status === 'pending')
    return pendingRecs.reduce((total, rec) => {
      const data = rec.data as RecommendationDetails
      return total + (data?.estimatedSavings ?? 0)
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

    if (generationType === 'staffing') {
      generateClassicRecommendations.mutate({
        restaurantId,
        type: 'STAFFING',
      })
    } else {
      generateRecommendations.mutate({
        restaurantId,
        shrinkPct: 0.1,
        days: 7,
      })
    }
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
            <h1 className="text-3xl font-bold tracking-tight">Recommandations</h1>
            <p className="text-muted-foreground mt-1.5">
              Recommandations actionnables pour optimiser vos opérations
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-16 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Lightbulb className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Aucune organisation active</h2>
              <p className="text-muted-foreground">
                Veuillez sélectionner une organisation pour accéder aux recommandations.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/recommendations">Retour aux recommandations</Link>
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
            <h1 className="text-3xl font-bold tracking-tight">Recommandations</h1>
            <p className="text-muted-foreground mt-1.5">
              Recommandations actionnables pour optimiser vos opérations
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-red-800 dark:text-red-400">
                Une erreur s’est produite lors du chargement des recommandations. Vérifiez votre connexion et réessayez.
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
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Recommandations">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Recommandations' }]} className="mb-4" />
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-6 border-b border-border/60">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recommandations</h1>
            <p className="text-muted-foreground mt-1.5">
              Recommandations actionnables pour optimiser vos opérations
            </p>
            {safeRecommendations.length >= 0 && (
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {safeRecommendations.length} recommandation{safeRecommendations.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            className="shadow-sm shrink-0"
            aria-label="Actualiser la liste des recommandations"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recommandations en attente
              </CardTitle>
              <Lightbulb className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">
                {safeRecommendations.filter((r) => r.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Nécessitent une action</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Coût estimé des commandes (en attente)
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(calculateTotalOrderCost())}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Total des commandes recommandées</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                Gain estimé (en attente)
                <button
                  type="button"
                  onClick={() => setShowGainExplanationCard((v) => !v)}
                  className="inline-flex text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded focus:outline-none"
                  aria-label="Afficher l’explication du gain estimé"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </CardHeader>
            <CardContent>
              {showGainExplanationCard && (
                <p className="text-xs text-muted-foreground mb-2 p-2 rounded-md bg-muted/60 border border-border">
                  Valeur estimée des ruptures de stock et du gaspillage évités en commandant à point. Indicateur de bénéfice indirect, pas un gain en caisse.
                </p>
              )}
              <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">
                {formatCurrency(calculateTotalSavings())}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Ruptures / gaspillage évités (indicateur)</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total recommandations
              </CardTitle>
              <Package className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{safeRecommendations.length}</div>
              <p className="text-xs text-muted-foreground mt-2">Toutes périodes confondues</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl border shadow-sm bg-card" role="search" aria-label="Filtres recommandations">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              Filtres
            </CardTitle>
            <CardDescription className="mt-1">
              Filtrez les recommandations par restaurant, type ou statut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="rec-filter-restaurant">Restaurant</Label>
                <Select
                value={selectedRestaurant}
                onValueChange={(v) => {
                  setSelectedRestaurant(v)
                  setActiveRestaurantId(v === 'all' ? null : v)
                }}
              >
                  <SelectTrigger id="rec-filter-restaurant" className="bg-muted/50 dark:bg-gray-800 border-border" aria-label="Filtrer par restaurant">
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
                <Label htmlFor="rec-filter-type">Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger id="rec-filter-type" className="bg-muted/50 dark:bg-gray-800 border-border" aria-label="Filtrer par type">
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
                <Label htmlFor="rec-filter-status">Statut</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger id="rec-filter-status" className="bg-muted/50 dark:bg-gray-800 border-border" aria-label="Filtrer par statut">
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

        <Card className="rounded-xl border shadow-sm border-2 border-teal-200/80 dark:border-teal-900/30 bg-teal-50/50 dark:bg-teal-900/10">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm" aria-hidden>
                <Lightbulb className="h-4 w-4 text-white" />
              </div>
              Générer de nouvelles recommandations
            </CardTitle>
            <CardDescription className="mt-1">
              Créez des recommandations (commandes ou effectifs) pour un restaurant ou pour tous les restaurants
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showStaffingExplanation && (
              <p className="text-xs text-muted-foreground mb-3 p-2 rounded-md bg-muted/60 border border-border">
                Effectifs (staffing) : nombre de personnes recommandées par créneau horaire selon les ventes prévues. Règle utilisée : 1 personne pour 15 ventes par heure, minimum 2 par créneau. Aide à planifier les équipes.
              </p>
            )}
            <div className="flex gap-4 flex-wrap items-end">
              <div className="min-w-[200px] space-y-2">
                <Label htmlFor="rec-gen-type" className="inline-flex items-center gap-1.5">
                  Type de génération
                  <button
                    type="button"
                    onClick={() => setShowStaffingExplanation((v) => !v)}
                    className="inline-flex text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded focus:outline-none"
                    aria-label="Explication sur les types de recommandations (commandes / effectifs)"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </Label>
                <Select
                  value={generationType}
                  onValueChange={(v) => setGenerationType(v as 'bom' | 'staffing')}
                >
                  <SelectTrigger id="rec-gen-type" className="bg-muted/50 dark:bg-gray-900 border-border" aria-label="Type de génération">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bom">Commandes (BOM)</SelectItem>
                    <SelectItem value="staffing">Effectifs (Staffing)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px] space-y-2">
                <Label htmlFor="rec-gen-restaurant">Restaurant</Label>
                <Select
                  value={selectedRestaurant === 'all' ? '' : selectedRestaurant}
                  onValueChange={(value) => setSelectedRestaurant(value || 'all')}
                >
                  <SelectTrigger id="rec-gen-restaurant" className="bg-muted/50 dark:bg-gray-900 border-border" aria-label="Sélectionner un restaurant pour générer">
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
              <Button
                onClick={() => handleGenerate(selectedRestaurant !== 'all' ? selectedRestaurant : undefined)}
                disabled={(generationType === 'bom' ? generateRecommendations.isPending : generateClassicRecommendations.isPending) || selectedRestaurant === 'all'}
                className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0 shrink-0"
              >
                {(generationType === 'bom' ? generateRecommendations.isPending : generateClassicRecommendations.isPending) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Générer (1 restaurant)
                  </>
                )}
              </Button>
              <Button
                onClick={() => generateAllRecommendations.mutate(generationType === 'staffing' ? { type: 'STAFFING' } : {})}
                disabled={generateAllRecommendations.isPending || (generationType === 'bom' ? generateRecommendations.isPending : generateClassicRecommendations.isPending) || restaurants.length === 0}
                variant="outline"
                className="shrink-0 border-teal-600 text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20"
              >
                {generateAllRecommendations.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Générer pour tous les restaurants
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <RecommendationListSkeleton />
        ) : filteredRecommendations.length === 0 ? (
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center mb-5">
                <Lightbulb className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Aucune recommandation trouvée</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Aucune recommandation ne correspond à vos critères. Modifiez les filtres ou générez de nouvelles recommandations.
              </p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                Une génération automatique a lieu chaque jour (cron). S&apos;il n&apos;y a rien à recommander (stocks suffisants), aucune nouvelle suggestion n&apos;apparaît.
              </p>
            </CardContent>
          </Card>
        ) : (
          <section className="space-y-4" aria-label="Liste des recommandations">
          {filteredRecommendations.map((recommendation) => {
            const details = recommendation.data as RecommendationDetails
            const isExpanded = expandedId === recommendation.id

            return (
              <Card key={recommendation.id} className="rounded-xl border shadow-sm bg-card hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          recommendation.type === 'ORDER' 
                            ? 'bg-gradient-to-br from-teal-500 to-emerald-600' 
                            : 'bg-gradient-to-br from-teal-500 to-emerald-600'
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
                            : 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
                        }`}
                      >
                        {recommendation.priority === 'high'
                          ? 'Priorité haute'
                          : recommendation.priority === 'medium'
                          ? 'Priorité moyenne'
                          : recommendation.priority === 'low'
                          ? 'Priorité basse'
                          : `Priorité ${recommendation.priority}`}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                          recommendation.status === 'accepted'
                            ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
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
                      <div className="rounded-xl bg-muted/50 dark:bg-gray-800/30 p-4 border border-border">
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
                          {typeof details.estimatedOrderCost === 'number' && (
                            <div>
                              <span className="text-muted-foreground">Coût estimé de la commande:</span>
                              <p className="font-medium">{formatCurrency(details.estimatedOrderCost)}</p>
                            </div>
                          )}
                          {typeof details.estimatedSavings === 'number' && (
                            <div>
                              <span className="text-muted-foreground inline-flex items-center gap-1">
                                Gain estimé (ruptures/gaspillage évités):
                                <button
                                  type="button"
                                  onClick={() => setGainExplanationRecId((id) => (id === recommendation.id ? null : recommendation.id))}
                                  className="inline-flex text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded focus:outline-none"
                                  aria-label="Afficher l’explication du gain estimé"
                                >
                                  <HelpCircle className="h-3.5 w-3.5" />
                                </button>
                              </span>
                              <p className="font-medium text-teal-700 dark:text-teal-400">{formatCurrency(details.estimatedSavings)}</p>
                              {gainExplanationRecId === recommendation.id && (
                                <p className="text-xs text-muted-foreground mt-1 p-2 rounded-md bg-muted/60 border border-border">
                                  Valeur estimée des ruptures de stock et du gaspillage évités en passant cette commande. Bénéfice indirect, pas un gain en caisse.
                                </p>
                              )}
                            </div>
                          )}
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
                            aria-expanded={false}
                            aria-label="Voir les détails des ingrédients à commander"
                          >
                            Voir les détails
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-border overflow-hidden">
                            <table className="w-full text-sm" role="table" aria-label="Détail des ingrédients à commander">
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
                            aria-expanded={true}
                            aria-label="Masquer les détails"
                          >
                            Masquer les détails
                          </Button>
                        </div>
                      )}

                      {canAccept && (
                      <div className="flex gap-2 pt-4 border-t">
                        {recommendation.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(recommendation.id, 'accepted')}
                              className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0"
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
                      )}
                    </div>
                  )}

                  {recommendation.type === 'STAFFING' && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground">Effectifs recommandés par créneau</h4>
                      {Array.isArray(details) ? (
                        <div className="rounded-xl border border-border overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-muted/50 dark:bg-gray-800/50 border-b border-border">
                                <th className="text-left p-3 font-medium">Créneau</th>
                                <th className="text-left p-3 font-medium">Ventes prévues</th>
                                <th className="text-left p-3 font-medium">Effectif recommandé</th>
                                <th className="text-left p-3 font-medium hidden sm:table-cell">Raison</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(details as { date?: string; timeSlot?: string; expectedSales?: number; recommendedStaff?: number; reason?: string }[]).map((row, i) => (
                                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                                  <td className="p-3 font-medium">{row.timeSlot ?? '—'}</td>
                                  <td className="p-3">{row.expectedSales ?? '—'}</td>
                                  <td className="p-3 font-medium">{row.recommendedStaff ?? '—'}</td>
                                  <td className="p-3 text-muted-foreground hidden sm:table-cell min-w-[200px] max-w-md whitespace-normal break-words align-top" title={row.reason}>{row.reason ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Données de staffing: {JSON.stringify(details, null, 2)}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
          </section>
        )}
      </div>
    </main>
  )
}
