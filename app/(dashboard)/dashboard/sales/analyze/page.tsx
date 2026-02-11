'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { useActiveRestaurant } from '@/hooks/use-active-restaurant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, TrendingUp, Package, Euro, Calendar, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSalesAnalyze } from '@/lib/react-query/hooks/use-sales'
import { useRestaurants } from '@/lib/react-query/hooks/use-restaurants'
import { AnalyzeSkeleton } from '@/components/ui/skeletons/analyze-skeleton'

export default function SalesAnalyzePage() {
  const { organization, isLoaded } = useOrganization()
  const searchParams = useSearchParams()
  const urlRestaurant = searchParams.get('restaurant')
  const { setActiveRestaurantId } = useActiveRestaurant()
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(() => urlRestaurant || 'all')
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])

  const { data: restaurantsData } = useRestaurants(1, 100)
  const restaurants = restaurantsData?.restaurants || []

  useEffect(() => {
    setSelectedRestaurant(urlRestaurant || 'all')
  }, [urlRestaurant])

  const { data: analysis, isLoading, error, refetch } = useSalesAnalyze({
    restaurantId: selectedRestaurant,
    startDate,
    endDate,
  })

  // Fonction pour générer un graphique en barres simple (Style Sequence)
  const BarChart = ({ data, dataKey, labelKey, maxValue }: { 
    data: any[], 
    dataKey: string, 
    labelKey: string,
    maxValue: number 
  }) => {
    if (!data || data.length === 0) {
      return <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>
    }

    return (
      <div className="space-y-3" role="list" aria-label="Données du graphique">
        {data.map((item, index) => {
          const value = item[dataKey]
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
          return (
            <div key={index} role="listitem" className="space-y-2 p-3 rounded-xl bg-muted/30 dark:bg-gray-800/30 border border-border">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">{item[labelKey]}h</span>
                <span className="font-bold text-teal-700 dark:text-teal-400 text-sm">{formatCurrency(value)}</span>
              </div>
              <div className="w-full bg-muted dark:bg-gray-700 rounded-full h-2" aria-hidden>
                <div
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 h-2 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
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
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <header className="pb-6 border-b border-border/60">
            <h1 className="text-3xl font-bold tracking-tight">Analyse des ventes</h1>
            <p className="text-muted-foreground mt-1.5">
              Visualisez et analysez vos données de ventes
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-16 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Aucune organisation active</h2>
              <p className="text-muted-foreground">
                Veuillez sélectionner une organisation pour accéder à l’analyse.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/sales">Retour aux ventes</Link>
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
            <h1 className="text-3xl font-bold tracking-tight">Analyse des ventes</h1>
            <p className="text-muted-foreground mt-1.5">
              Visualisez et analysez vos données de ventes
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-red-800 dark:text-red-400">
                Une erreur s’est produite lors du chargement de l’analyse. Vérifiez votre connexion et réessayez.
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

  if (isLoading) {
    return <AnalyzeSkeleton />
  }

  if (!analysis) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <header className="pb-6 border-b border-border/60">
            <h1 className="text-3xl font-bold tracking-tight">Analyse des ventes</h1>
            <p className="text-muted-foreground mt-1.5">
              Visualisez et analysez vos données de ventes
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-16 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center mb-5">
                <BarChart3 className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Aucune donnée pour cette période</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Aucune vente trouvée pour la période sélectionnée. Modifiez les filtres ou enregistrez des ventes.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const maxRevenue = Math.max(
    ...(analysis.salesByHour.map(s => s.revenue)),
    ...(analysis.salesByDay.map(s => s.revenue)),
    1
  )

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Analyse des ventes">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'Ventes & Analyse', href: '/dashboard/sales' }, { label: 'Analyse' }]} />
        <header className="pb-6 border-b border-border/60">
          <h1 className="text-3xl font-bold tracking-tight">Analyse des ventes</h1>
          <p className="text-muted-foreground mt-1.5">
            Visualisez et analysez vos données de ventes en détail
          </p>
        </header>

        <Card className="rounded-xl border shadow-sm bg-card" role="search" aria-label="Filtres analyse">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Filtres</CardTitle>
            <CardDescription className="mt-1">
              Filtrez l’analyse par restaurant et période
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="analyze-restaurant">Restaurant</Label>
                <Select
                  value={selectedRestaurant}
                  onValueChange={(v) => {
                    setSelectedRestaurant(v)
                    setActiveRestaurantId(v === 'all' ? null : v)
                  }}
                >
                  <SelectTrigger id="analyze-restaurant" className="bg-muted/50 dark:bg-gray-800 border-border" aria-label="Filtrer par restaurant">
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
                <Label htmlFor="analyze-start">Date de début</Label>
                <Input
                  id="analyze-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-muted/50 dark:bg-gray-800 border-border"
                  aria-label="Date de début"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="analyze-end">Date de fin</Label>
                <Input
                  id="analyze-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-muted/50 dark:bg-gray-800 border-border"
                  aria-label="Date de fin"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ventes totales</CardTitle>
              <Package className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{analysis.totalSales}</div>
              <p className="text-xs text-muted-foreground mt-2">Total des ventes</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Chiffre d&apos;affaires</CardTitle>
              <Euro className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{formatCurrency(analysis.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-2">Revenus totaux</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Moyenne par jour</CardTitle>
              <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{analysis.averagePerDay.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-2">Unités/jour</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Période</CardTitle>
              <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">
                {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Jours</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Top produits</CardTitle>
              <CardDescription className="mt-1">
                Produits les plus vendus par revenus
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8" role="status">Aucune donnée</p>
              ) : (
                <ul className="space-y-4 list-none p-0 m-0" aria-label="Top produits par revenus">
                  {analysis.topProducts.map((product, index) => {
                    const maxProductRevenue = Math.max(...analysis.topProducts.map(p => p.revenue), 1)
                    const percentage = (product.revenue / maxProductRevenue) * 100
                    return (
                      <li key={product.productId} className="space-y-2 p-3 rounded-xl bg-muted/30 dark:bg-gray-800/30 border border-border">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground" aria-hidden>#{index + 1}</span>
                            <span className="font-semibold text-sm">{product.productName}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-teal-700 dark:text-teal-400 text-sm">
                              {formatCurrency(product.revenue)}
                            </span>
                            <p className="text-xs text-muted-foreground">{product.quantity} unités</p>
                          </div>
                        </div>
                        <div className="w-full bg-muted dark:bg-gray-700 rounded-full h-2" aria-hidden>
                          <div
                            className="bg-gradient-to-r from-teal-500 to-emerald-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Ventes par heure</CardTitle>
              <CardDescription className="mt-1">
                Répartition des ventes sur la journée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={analysis.salesByHour}
                dataKey="revenue"
                labelKey="hour"
                maxValue={maxRevenue}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Ventes par jour</CardTitle>
            <CardDescription className="mt-1">
              Évolution des ventes sur la période sélectionnée
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysis.salesByDay.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8" role="status">Aucune donnée</p>
            ) : (
              <ul className="space-y-3 list-none p-0 m-0" aria-label="Ventes par jour">
                {analysis.salesByDay.map((day) => {
                  const percentage = (day.revenue / maxRevenue) * 100
                  return (
                    <li key={day.date} className="space-y-2 p-3 rounded-xl bg-muted/30 dark:bg-gray-800/30 border border-border">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm">{formatDate(new Date(day.date))}</span>
                        <div className="text-right">
                          <span className="font-bold text-teal-700 dark:text-teal-400 text-sm">
                            {formatCurrency(day.revenue)}
                          </span>
                          <p className="text-xs text-muted-foreground">{day.quantity} unités</p>
                        </div>
                      </div>
                      <div className="w-full bg-muted dark:bg-gray-700 rounded-full h-2" aria-hidden>
                        <div
                          className="bg-gradient-to-r from-teal-500 to-emerald-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
