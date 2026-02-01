'use client'

import { useState } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { exportToCsv } from '@/lib/utils'
import { Store, Plus, Edit, Trash2, TrendingUp, Bell, MapPin, Upload, Download, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
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
import { useRestaurants, useDeleteRestaurant } from '@/lib/react-query/hooks/use-restaurants'
import { useUserRole } from '@/lib/react-query/hooks/use-user-role'
import { permissions } from '@/lib/roles'
import { RestaurantListSkeleton } from '@/components/ui/skeletons/restaurant-list-skeleton'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/pagination'

interface Restaurant {
  id: string
  name: string
  address: string | null
  timezone: string
  _count?: {
    sales: number
    alerts: number
  }
}

export default function RestaurantsPage() {
  const { organization, isLoaded } = useOrganization()
  const { data: roleData } = useUserRole()
  const currentRole = roleData ?? 'admin'
  const canDelete = permissions.canDeleteRestaurant(currentRole)
  const canCreate = permissions.canCreateRestaurant(currentRole)
  const canEdit = permissions.canEditRestaurant(currentRole)

  const [page, setPage] = useState(1)
  const limit = 12
  const { data, isLoading, error, refetch } = useRestaurants(page, limit)
  const restaurants = (data?.restaurants || []) as Restaurant[]
  const deleteRestaurant = useDeleteRestaurant()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [restaurantToDelete, setRestaurantToDelete] = useState<Restaurant | null>(null)

  const handleDelete = async () => {
    if (!restaurantToDelete) return
    deleteRestaurant.mutate(restaurantToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        setRestaurantToDelete(null)
      },
    })
  }

  const openDeleteDialog = (restaurant: Restaurant) => {
    setRestaurantToDelete(restaurant)
    setDeleteDialogOpen(true)
  }

  const handleExportCsv = () => {
    const csvData = restaurants.map((r) => ({
      nom: r.name,
      adresse: r.address ?? '',
      fuseau: r.timezone,
    }))
    const filename = `restaurants_${new Date().toISOString().slice(0, 10)}.csv`
    exportToCsv(csvData, filename)
  }

  if (!isLoaded) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Liste des restaurants en cours de chargement">
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Restaurants' }]} className="mb-4" />
          <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-6 border-b border-border/60">
            <div>
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-5 w-72" />
            </div>
            <Skeleton className="h-10 w-40 shrink-0" />
          </header>
          <RestaurantListSkeleton />
        </div>
      </main>
    )
  }

  if (!organization?.id) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <header className="pb-6 border-b border-border/60">
            <h1 className="text-3xl font-bold tracking-tight">Restaurants</h1>
            <p className="text-muted-foreground mt-1.5">
              Gérez vos établissements et suivez leurs performances
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm bg-card/95">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Store className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Aucune organisation active</h2>
              <p className="text-muted-foreground">
                Veuillez sélectionner une organisation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-6 border-b border-border/60">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Restaurants</h1>
              <p className="text-muted-foreground mt-1.5">
                Gérez vos établissements et suivez leurs performances
              </p>
            </div>
            <Button asChild className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0 shrink-0" disabled>
              <Link href="/dashboard/restaurants/new">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un restaurant
              </Link>
            </Button>
          </header>
          <RestaurantListSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <header className="pb-6 border-b border-border/60">
            <h1 className="text-3xl font-bold tracking-tight">Restaurants</h1>
            <p className="text-muted-foreground mt-1.5">
              Gérez vos établissements et suivez leurs performances
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-red-800 dark:text-red-400">
                Une erreur s’est produite lors du chargement des restaurants. Vérifiez votre connexion et réessayez.
              </p>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="border-red-300 dark:border-red-800 text-red-800 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
              >
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/25">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Restaurants' }]} className="mb-4" />
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-6 border-b border-border/60">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Restaurants
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">
              Gérez vos établissements et suivez leurs performances
            </p>
            {data && data.total > 0 && (
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {data.total} établissement{data.total > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shadow-sm" aria-label="Import et export">
                  <Download className="mr-2 h-4 w-4" />
                  Import / export
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCsv} disabled={restaurants.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter CSV
                </DropdownMenuItem>
                {canCreate && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/restaurants/import">
                      <Upload className="mr-2 h-4 w-4" />
                      Importer CSV
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {canCreate && (
              <Button
                asChild
                className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0"
              >
                <Link href="/dashboard/restaurants/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un restaurant
                </Link>
              </Button>
            )}
          </div>
        </header>

      {restaurants.length === 0 ? (
        <Card className="rounded-xl border shadow-sm bg-card/95 backdrop-blur-sm">
          <CardContent className="py-16 px-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center mb-5">
              <Store className="h-8 w-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Aucun restaurant pour l’instant</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-2">
              Créez votre premier établissement pour activer le suivi des ventes, l’inventaire et les alertes.
            </p>
            <ul className="text-sm text-muted-foreground max-w-sm mx-auto mb-8 text-left list-disc list-inside space-y-1">
              <li>Suivi des ventes et chiffre d’affaires</li>
              <li>Gestion des stocks et seuils d’alerte</li>
              <li>Tableau de bord par restaurant</li>
            </ul>
            <div className="flex flex-wrap justify-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" aria-label="Import et export">
                    <Download className="mr-2 h-4 w-4" />
                    Import / export
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem onClick={handleExportCsv} disabled={restaurants.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Exporter CSV
                  </DropdownMenuItem>
                  {canCreate && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/restaurants/import">
                        <Upload className="mr-2 h-4 w-4" />
                        Importer CSV
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {canCreate && (
                <Button asChild className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0" aria-label="Ajouter un restaurant">
                  <Link href="/dashboard/restaurants/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un restaurant
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <section
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          aria-label="Liste des restaurants"
        >
          {restaurants.map((restaurant) => (
            <Card
              key={restaurant.id}
              className="group rounded-xl border shadow-sm bg-card hover:shadow-lg hover:border-teal-200/80 dark:hover:border-teal-800/60 transition-all duration-200"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Store className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg truncate">{restaurant.name}</CardTitle>
                    </div>
                    {restaurant.address && (
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{restaurant.address}</span>
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                        aria-label={`Modifier ${restaurant.name}`}
                      >
                        <Link href={`/dashboard/restaurants/${restaurant.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog(restaurant)}
                        aria-label={`Supprimer ${restaurant.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Statistiques (Style Sequence) */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3.5 rounded-xl bg-teal-50/80 dark:bg-teal-900/20 border border-teal-100/80 dark:border-teal-900/30">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <span className="text-xs text-muted-foreground">Ventes</span>
                    </div>
                    <div className="text-xl font-bold text-teal-700 dark:text-teal-400">
                      {restaurant._count?.sales || 0}
                    </div>
                  </div>
                  <div className={`p-3.5 rounded-xl border ${
                    (restaurant._count?.alerts || 0) > 0
                      ? 'bg-orange-50/80 dark:bg-orange-900/20 border-orange-100/80 dark:border-orange-900/30'
                      : 'bg-muted/50 dark:bg-gray-800/50 border-border/80 dark:border-gray-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Bell className={`h-4 w-4 ${
                        (restaurant._count?.alerts || 0) > 0
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`} />
                      <span className="text-xs text-muted-foreground">Alertes</span>
                    </div>
                    <div className={`text-xl font-bold ${
                      (restaurant._count?.alerts || 0) > 0
                        ? 'text-orange-700 dark:text-orange-400'
                        : 'text-gray-700 dark:text-gray-400'
                    }`}>
                      {restaurant._count?.alerts || 0}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-300 dark:hover:border-teal-700"
                  asChild
                >
                  <Link href={`/dashboard/restaurants/${restaurant.id}`}>
                    Voir les détails
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <nav
            className="flex justify-center pt-8"
            aria-label="Pagination des restaurants"
          >
            <Pagination
              currentPage={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </nav>
        )}
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce restaurant ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le restaurant &quot;{restaurantToDelete?.name}&quot; et toutes ses données (ventes, inventaire, alertes) seront définitivement supprimés.
              {restaurantToDelete && (restaurantToDelete._count?.sales || 0) > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Ce restaurant contient {restaurantToDelete._count?.sales ?? 0} vente(s) enregistrée(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRestaurant.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteRestaurant.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRestaurant.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
