'use client'

import { useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Edit, TrendingUp, Bell, Package, Warehouse, Store, MapPin } from 'lucide-react'
import { DeleteRestaurantButton } from '@/components/restaurants/delete-restaurant-button'
import { useToast } from '@/hooks/use-toast'
import { useRestaurant } from '@/lib/react-query/hooks/use-restaurants'
import { useUserRole } from '@/lib/react-query/hooks/use-user-role'
import { permissions } from '@/lib/roles'
import { Skeleton } from '@/components/ui/skeleton'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

function RestaurantDetailSkeleton() {
  return (
    <div className="p-6 space-y-6" aria-hidden>
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
          <div className="space-y-2 min-w-0">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </header>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-xl border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-xl border shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-28" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-10 w-full rounded" />
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function RestaurantDetailPage() {
  const params = useParams()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const { data: roleData } = useUserRole()
  const currentRole = roleData ?? 'staff'
  const canEdit = permissions.canEditRestaurant(currentRole)
  const canDelete = permissions.canDeleteRestaurant(currentRole)

  const id = params?.id as string | undefined
  const { data: restaurant, isLoading, isError, error, refetch } = useRestaurant(id)
  const hasToastedError = useRef(false)

  useEffect(() => {
    if (isError && error && !hasToastedError.current) {
      hasToastedError.current = true
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger les données',
        variant: 'destructive',
      })
    }
    if (!isError) hasToastedError.current = false
  }, [isError, error, toast])

  if (!isLoaded) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Chargement de votre organisation...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isLoaded && !organization?.id) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <Card className="rounded-xl border shadow-sm bg-card/95">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">
                Aucune organisation active. Veuillez sélectionner une organisation.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/restaurants">Retour aux restaurants</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <RestaurantDetailSkeleton />
  }

  if (isError || !restaurant) {
    const isNotFound = !restaurant && !isLoading
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Card className="rounded-xl border shadow-sm border-red-200/50 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">
                {isNotFound
                  ? 'Restaurant introuvable ou supprimé. Vérifiez le lien ou retournez à la liste.'
                  : 'Une erreur s’est produite lors du chargement. Vérifiez votre connexion et réessayez.'}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {!isNotFound && (
                  <Button variant="outline" onClick={() => refetch()}>
                    Réessayer
                  </Button>
                )}
                <Button asChild variant={isNotFound ? 'default' : 'outline'} className={isNotFound ? 'bg-teal-600 hover:bg-teal-700 text-white border-0' : ''}>
                  <Link href="/dashboard/restaurants">Retour aux restaurants</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label={`Détail du restaurant ${restaurant.name}`}>
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Restaurants', href: '/dashboard/restaurants' },
            { label: restaurant.name },
          ]}
        />
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-6 border-b border-border/60">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm" aria-hidden>
                <Store className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl font-bold tracking-tight truncate">{restaurant.name}</h1>
                {restaurant.address && (
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden />
                    <span className="truncate">{restaurant.address}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2 shrink-0" aria-label="Actions du restaurant">
            {canEdit && (
            <Button variant="outline" asChild className="shadow-sm border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20" aria-label={`Modifier ${restaurant.name}`}>
              <Link href={`/dashboard/restaurants/${restaurant.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Link>
            </Button>
            )}
            {canDelete && (
              <DeleteRestaurantButton restaurantId={restaurant.id} restaurantName={restaurant.name} />
            )}
          </nav>
        </header>

        {/* KPIs */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" aria-label="Indicateurs clés">
        <Card className="rounded-xl border shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ventes totales
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{restaurant._count?.sales || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Toutes périodes confondues
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chiffre d&apos;affaires (7j)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              }).format(restaurant.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Sur les 7 derniers jours
            </p>
          </CardContent>
        </Card>

        <Card className={`rounded-xl border shadow-sm bg-card hover:shadow-md transition-shadow ${
          (restaurant._count?.alerts || 0) > 0 ? 'border-orange-200 dark:border-orange-900/30' : ''
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertes actives
            </CardTitle>
            <Bell className={`h-4 w-4 ${
              (restaurant._count?.alerts || 0) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'
            }`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              (restaurant._count?.alerts || 0) > 0 ? 'text-orange-700 dark:text-orange-400' : ''
            }`}>
              {restaurant._count?.alerts || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Nécessitent une attention
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Articles en stock
            </CardTitle>
            <Package className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{restaurant._count?.inventory || 0}</div>
            <p className="text-xs text-muted-foreground mt-2 mb-3">
              Ingrédients suivis
            </p>
            <Button asChild variant="outline" size="sm" className="w-full shadow-sm border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20">
              <Link href={`/dashboard/restaurants/${restaurant.id}/inventory?restaurant=${restaurant.id}`}>
                <Warehouse className="h-4 w-4 mr-2" />
                Gérer l&apos;inventaire
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-xl border shadow-sm bg-card hover:shadow-md transition-shadow" aria-labelledby="info-title">
          <CardHeader>
            <CardTitle id="info-title" className="text-lg font-semibold">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/80">
              <span className="text-sm text-muted-foreground">Fuseau horaire</span>
              <span className="text-sm font-medium">{restaurant.timezone}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Créé le</span>
              <span className="text-sm font-medium">{formatDate(new Date(restaurant.createdAt))}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm" aria-labelledby="sales-title">
          <CardHeader>
            <CardTitle id="sales-title" className="text-lg font-semibold">Ventes récentes</CardTitle>
            <CardDescription>
              Les 10 dernières ventes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {restaurant.recentSales && restaurant.recentSales.length > 0 ? (
              <ul className="space-y-3" aria-label="Liste des ventes récentes">
                {restaurant.recentSales.map((sale) => (
                  <li
                    key={sale.id}
                    className="flex justify-between items-center p-3 rounded-lg bg-muted/50 dark:bg-gray-800/50 hover:bg-muted/80 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div>
                      <span className="font-medium text-sm">{sale.product.name}</span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        x{sale.quantity}
                      </span>
                    </div>
                    <span className="font-semibold text-teal-600 dark:text-teal-400">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(sale.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Aucune vente enregistrée pour l’instant
                </p>
                <Button variant="link" size="sm" asChild className="text-teal-600 dark:text-teal-400">
                  <Link href="/dashboard/sales/new">Enregistrer une vente</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </main>
  )
}
