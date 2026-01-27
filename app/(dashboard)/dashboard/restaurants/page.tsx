'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Store, Plus, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
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
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [restaurantToDelete, setRestaurantToDelete] = useState<Restaurant | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isLoaded && organization?.id) {
      fetchRestaurants()
    } else if (isLoaded && !organization?.id) {
      setLoading(false)
      toast({
        title: 'Aucune organisation',
        description: 'Veuillez sélectionner une organisation pour voir vos restaurants.',
        variant: 'destructive',
      })
    }
  }, [isLoaded, organization?.id])

  const fetchRestaurants = async () => {
    if (!organization?.id) return

    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('clerkOrgId', organization.id)
      
      const response = await fetch(`/api/restaurants?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des restaurants')
      }

      const data = await response.json()
      setRestaurants(data)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger les restaurants',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!restaurantToDelete || !organization?.id) return

    try {
      setDeleting(true)
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/restaurants/${restaurantToDelete.id}?${queryParams.toString()}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }

      toast({
        title: 'Restaurant supprimé',
        description: `${restaurantToDelete.name} a été supprimé avec succès.`,
      })

      setDeleteDialogOpen(false)
      setRestaurantToDelete(null)
      fetchRestaurants()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer le restaurant',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteDialog = (restaurant: Restaurant) => {
    setRestaurantToDelete(restaurant)
    setDeleteDialogOpen(true)
  }

  if (!isLoaded) {
    return (
      <div className="p-6 space-y-6">
        <Card>
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
          <h1 className="text-3xl font-bold">Restaurants</h1>
          <p className="text-muted-foreground">
            Gérez vos établissements
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Aucune organisation active. Veuillez sélectionner une organisation.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Chargement des restaurants...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Restaurants</h1>
          <p className="text-muted-foreground">
            Gérez vos établissements
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/restaurants/new">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un restaurant
          </Link>
        </Button>
      </div>

      {restaurants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Aucun restaurant pour le moment. Créez votre premier restaurant pour commencer.
            </p>
            <Button asChild>
              <Link href="/dashboard/restaurants/new">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un restaurant
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle>{restaurant.name}</CardTitle>
                    <CardDescription>
                      {restaurant.address || 'Aucune adresse'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <Link href={`/dashboard/restaurants/${restaurant.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(restaurant)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ventes totales:</span>
                    <span className="font-medium">{restaurant._count?.sales || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Alertes actives:</span>
                    <span className={`font-medium ${(restaurant._count?.alerts || 0) > 0 ? 'text-destructive' : ''}`}>
                      {restaurant._count?.alerts || 0}
                    </span>
                  </div>
                  <div className="pt-4">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/dashboard/restaurants/${restaurant.id}`}>
                        Voir les détails
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
