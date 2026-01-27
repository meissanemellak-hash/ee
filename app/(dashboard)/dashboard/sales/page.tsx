'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Plus, Edit, Trash2, Calendar, Store, Package, BarChart3 } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface Sale {
  id: string
  quantity: number
  amount: number
  saleDate: string
  saleHour: number
  restaurant: {
    id: string
    name: string
  }
  product: {
    id: string
    name: string
    category: string | null
    unitPrice: number
  }
}

interface Restaurant {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
}

export default function SalesPage() {
  const { organization, isLoaded } = useOrganization()
  const [sales, setSales] = useState<Sale[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isLoaded && organization?.id) {
      fetchRestaurants()
      fetchProducts()
      fetchSales()
    } else if (isLoaded && !organization?.id) {
      setLoading(false)
      toast({
        title: 'Aucune organisation',
        description: 'Veuillez sélectionner une organisation pour voir vos ventes.',
        variant: 'destructive',
      })
    }
  }, [isLoaded, organization?.id])

  useEffect(() => {
    if (isLoaded && organization?.id) {
      fetchSales()
    }
  }, [selectedRestaurant, selectedProduct, startDate, endDate, isLoaded, organization?.id])

  const fetchRestaurants = async () => {
    if (!organization?.id) return

    try {
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/restaurants?${queryParams.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setRestaurants(data)
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error)
    }
  }

  const fetchProducts = async () => {
    if (!organization?.id) return

    try {
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/products?${queryParams.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchSales = async () => {
    if (!isLoaded || !organization?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('clerkOrgId', organization.id)
      
      if (selectedRestaurant && selectedRestaurant !== 'all') {
        params.append('restaurantId', selectedRestaurant)
      }
      
      if (selectedProduct && selectedProduct !== 'all') {
        params.append('productId', selectedProduct)
      }
      
      if (startDate) {
        params.append('startDate', startDate)
      }
      
      if (endDate) {
        params.append('endDate', endDate)
      }

      const response = await fetch(`/api/sales?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des ventes')
      }

      const data = await response.json()
      setSales(data)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger les ventes',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!saleToDelete || !organization?.id) return

    try {
      setDeleting(true)
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      
      const response = await fetch(`/api/sales/${saleToDelete.id}?${queryParams.toString()}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }

      toast({
        title: 'Vente supprimée',
        description: 'La vente a été supprimée avec succès.',
      })

      setDeleteDialogOpen(false)
      setSaleToDelete(null)
      fetchSales()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer la vente',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0)
  const totalQuantity = sales.reduce((sum, sale) => sum + sale.quantity, 0)

  if (!isLoaded || loading) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {!isLoaded ? 'Chargement de votre organisation...' : 'Chargement des ventes...'}
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
          <h1 className="text-3xl font-bold">Ventes</h1>
          <p className="text-muted-foreground">
            Gérez et consultez toutes vos ventes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/sales/import">
              Importer CSV
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/sales/analyze">
              <BarChart3 className="h-4 w-4 mr-2" />
              Voir l&apos;analyse
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/sales/new">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle vente
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total des ventes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d&apos;affaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantité totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
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
              <label className="text-sm font-medium">Produit</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les produits" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les produits</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date de début</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date de fin</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des ventes */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des ventes</CardTitle>
          <CardDescription>
            {sales.length} vente{sales.length > 1 ? 's' : ''} trouvée{sales.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Aucune vente trouvée</p>
              <Button asChild>
                <Link href="/dashboard/sales/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une vente
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{sale.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {sale.restaurant.name} • {formatDate(new Date(sale.saleDate))} à {sale.saleHour}h
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(sale.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantité: {sale.quantity}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <Link href={`/dashboard/sales/${sale.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSaleToDelete(sale)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la vente</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette vente ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
