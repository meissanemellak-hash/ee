'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Edit, Trash2, TrendingUp, Bell, Package, Loader2, Warehouse, Store, MapPin } from 'lucide-react'
import { DeleteRestaurantButton } from '@/components/restaurants/delete-restaurant-button'
import { useToast } from '@/hooks/use-toast'

interface Sale {
  id: string
  amount: number
  quantity: number
  saleDate: string
  product: {
    name: string
  }
}

interface Restaurant {
  id: string
  name: string
  address: string | null
  timezone: string
  createdAt: string
  _count?: {
    sales: number
    alerts: number
    inventory: number
  }
  recentSales?: Sale[]
  totalRevenue?: number
}

export default function RestaurantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id && isLoaded && organization?.id) {
      fetchRestaurant()
    } else if (isLoaded && !organization?.id) {
      setError('Aucune organisation active. Veuillez sélectionner une organisation.')
      setLoading(false)
    }
  }, [params.id, isLoaded, organization?.id])

  const fetchRestaurant = async () => {
    if (!organization?.id) return

    try {
      setLoading(true)
      setError(null)
      
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      
      const response = await fetch(`/api/restaurants/${params.id}?${queryParams.toString()}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Restaurant introuvable')
          toast({
            title: 'Restaurant introuvable',
            description: 'Le restaurant que vous recherchez n\'existe pas.',
            variant: 'destructive',
          })
          return
        }
        throw new Error('Erreur lors du chargement du restaurant')
      }

      const data = await response.json()
      setRestaurant(data)
    } catch (error) {
      console.error('Error fetching restaurant:', error)
      setError(error instanceof Error ? error.message : 'Impossible de charger les données')
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger les données',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {!isLoaded ? 'Chargement de votre organisation...' : 'Chargement du restaurant...'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {error || 'Restaurant introuvable. Veuillez rafraîchir la page.'}
            </p>
            <Button asChild>
              <Link href="/dashboard/restaurants">Retour aux restaurants</Link>
            </Button>
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
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <Store className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{restaurant.name}</h1>
              {restaurant.address && (
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />
                  {restaurant.address}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="shadow-sm">
            <Link href={`/dashboard/restaurants/${restaurant.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Link>
          </Button>
          <DeleteRestaurantButton restaurantId={restaurant.id} restaurantName={restaurant.name} />
        </div>
      </div>

      {/* KPIs (Style Sequence) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ventes totales
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{restaurant._count?.sales || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Toutes périodes confondues
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chiffre d&apos;affaires (7j)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
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

        <Card className={`border shadow-sm ${
          (restaurant._count?.alerts || 0) > 0 ? 'border-orange-200 dark:border-orange-900/30' : ''
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertes actives
            </CardTitle>
            <Bell className={`h-4 w-4 ${
              (restaurant._count?.alerts || 0) > 0 ? 'text-orange-600' : 'text-muted-foreground'
            }`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              (restaurant._count?.alerts || 0) > 0 ? 'text-orange-600' : ''
            }`}>
              {restaurant._count?.alerts || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Nécessitent une attention
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Articles en stock
            </CardTitle>
            <Package className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{restaurant._count?.inventory || 0}</div>
            <p className="text-xs text-muted-foreground mt-2 mb-3">
              Ingrédients suivis
            </p>
            <Button asChild variant="outline" size="sm" className="w-full shadow-sm">
              <Link href={`/dashboard/restaurants/${restaurant.id}/inventory`}>
                <Warehouse className="h-4 w-4 mr-2" />
                Gérer l'inventaire
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm text-muted-foreground">Fuseau horaire</span>
              <span className="text-sm font-medium">{restaurant.timezone}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Créé le</span>
              <span className="text-sm font-medium">{formatDate(new Date(restaurant.createdAt))}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Ventes récentes</CardTitle>
            <CardDescription>
              Les 10 dernières ventes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {restaurant.recentSales && restaurant.recentSales.length > 0 ? (
              <div className="space-y-3">
                {restaurant.recentSales.map((sale) => (
                  <div key={sale.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div>
                      <span className="font-medium text-sm">{sale.product.name}</span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        x{sale.quantity}
                      </span>
                    </div>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(sale.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucune vente récente
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
