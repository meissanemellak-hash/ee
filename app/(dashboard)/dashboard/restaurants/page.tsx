'use client'

import { useState } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Store, Plus, Edit, Trash2, TrendingUp, Bell, MapPin } from 'lucide-react'
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
import { RestaurantListSkeleton } from '@/components/ui/skeletons/restaurant-list-skeleton'
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
  const [page, setPage] = useState(1)
  const limit = 12
  const { data, isLoading, error } = useRestaurants(page, limit)
  const restaurants = data?.restaurants || []
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

  if (!isLoaded) {
    return (
      <div className="p-6 space-y-6">
        <Card className="border shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Chargement de votre organisation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!organization?.id) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurants</h1>
          <p className="text-muted-foreground">
            Gérez vos établissements
          </p>
        </div>
        <Card className="border shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucune organisation active</h3>
            <p className="text-muted-foreground">
              Veuillez sélectionner une organisation.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Restaurants</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos établissements et suivez leurs performances
            </p>
          </div>
          <Button asChild className="shadow-sm" disabled>
            <Link href="/dashboard/restaurants/new">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un restaurant
            </Link>
          </Button>
        </div>
        <RestaurantListSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurants</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos établissements et suivez leurs performances
          </p>
        </div>
        <Card className="border shadow-sm border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
          <CardContent className="py-12 text-center">
            <p className="text-red-800 dark:text-red-400">
              Erreur lors du chargement des restaurants. Veuillez réessayer.
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
          <h1 className="text-3xl font-bold tracking-tight">Restaurants</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos établissements et suivez leurs performances
          </p>
        </div>
        <Button asChild className="shadow-sm">
          <Link href="/dashboard/restaurants/new">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un restaurant
          </Link>
        </Button>
      </div>

      {restaurants.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun restaurant</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Créez votre premier restaurant pour commencer à suivre vos ventes et optimiser vos opérations.
            </p>
            <Button asChild className="shadow-sm">
              <Link href="/dashboard/restaurants/new">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un restaurant
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id} className="border shadow-sm hover:shadow-md transition-shadow duration-200">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <Link href={`/dashboard/restaurants/${restaurant.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => openDeleteDialog(restaurant)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Statistiques (Style Sequence) */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-900/30">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <span className="text-xs text-muted-foreground">Ventes</span>
                    </div>
                    <div className="text-xl font-bold text-teal-700 dark:text-teal-400">
                      {restaurant._count?.sales || 0}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border ${
                    (restaurant._count?.alerts || 0) > 0
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800'
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
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/dashboard/restaurants/${restaurant.id}`}>
                    Voir les détails
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center pt-6">
          <Pagination
            currentPage={page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le restaurant ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{restaurantToDelete?.name}&quot; ?
              {restaurantToDelete && (restaurantToDelete._count?.sales || 0) > 0 && (
                <span className="block mt-2 text-destructive">
                  ⚠️ Ce restaurant a {restaurantToDelete._count.sales} vente(s) associée(s). 
                  La suppression supprimera également toutes les données associées (ventes, stocks, alertes, etc.).
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
