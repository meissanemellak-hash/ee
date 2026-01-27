'use client'

import { useState, useMemo } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Edit, Trash2, Calendar, Store, Package, BarChart3, Loader2, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSales, useDeleteSale } from '@/lib/react-query/hooks/use-sales'
import { useRestaurants } from '@/lib/react-query/hooks/use-restaurants'
import { useProducts } from '@/lib/react-query/hooks/use-products'
import { SaleListSkeleton } from '@/components/ui/skeletons/sale-list-skeleton'
import { Pagination } from '@/components/ui/pagination'

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
  const [page, setPage] = useState(1)
  const limit = 20
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null)

  // Réinitialiser la page quand les filtres changent
  useMemo(() => {
    setPage(1)
  }, [selectedRestaurant, selectedProduct, startDate, endDate])

  // Charger les restaurants et produits pour les filtres
  const { data: restaurantsData } = useRestaurants(1, 100)
  const { data: productsData } = useProducts(1, 100)
  const restaurants = restaurantsData?.restaurants || []
  const products = productsData?.products || []

  // Charger les ventes avec filtres
  const { data, isLoading, error } = useSales(page, limit, {
    restaurantId: selectedRestaurant,
    productId: selectedProduct,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const sales = data?.sales || []
  const deleteSale = useDeleteSale()

  // Calculer les statistiques depuis toutes les ventes (pas seulement la page actuelle)
  // Pour les stats, on pourrait faire une requête séparée, mais pour l'instant on calcule depuis la page
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0)
  const totalQuantity = sales.reduce((sum, sale) => sum + sale.quantity, 0)

  const handleDelete = async () => {
    if (!saleToDelete) return
    deleteSale.mutate(saleToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        setSaleToDelete(null)
      },
    })
  }

  if (!isLoaded) {
    return (
      <div className="p-6 space-y-6">
        <Card className="border shadow-sm">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Chargement de votre organisation...
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
          <h1 className="text-3xl font-bold tracking-tight">Ventes</h1>
          <p className="text-muted-foreground mt-1">
            Gérez et consultez toutes vos ventes
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild className="shadow-sm">
            <Link href="/dashboard/sales/import">
              Importer CSV
            </Link>
          </Button>
          <Button variant="outline" asChild className="shadow-sm">
            <Link href="/dashboard/sales/analyze">
              <BarChart3 className="h-4 w-4 mr-2" />
              Voir l&apos;analyse
            </Link>
          </Button>
          <Button asChild className="shadow-sm">
            <Link href="/dashboard/sales/new">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle vente
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistiques (Style Sequence) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total des ventes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{sales.length}</div>
            <p className="text-xs text-muted-foreground mt-2">Transactions</p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chiffre d&apos;affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-2">Revenus totaux</p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quantité totale</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalQuantity}</div>
            <p className="text-xs text-muted-foreground mt-2">Unités vendues</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres (Style Sequence) */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Filtres</CardTitle>
          <CardDescription className="mt-1">
            Filtrez vos ventes par restaurant, produit ou période
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Restaurant</label>
              <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors">
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
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors">
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
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date de fin</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des ventes (Style Sequence) */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Liste des ventes</CardTitle>
          <CardDescription className="mt-1">
            {isLoading ? 'Chargement...' : data ? `${data.total} vente${data.total > 1 ? 's' : ''} trouvée${data.total > 1 ? 's' : ''}` : 'Aucune vente'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SaleListSkeleton />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">
                Erreur lors du chargement des ventes. Veuillez réessayer.
              </p>
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Aucune vente trouvée</h3>
              <p className="text-muted-foreground mb-6">
                {selectedRestaurant !== 'all' || selectedProduct !== 'all' || startDate || endDate
                  ? 'Aucune vente ne correspond à vos critères de recherche.'
                  : 'Commencez par créer votre première vente.'}
              </p>
              <Button asChild className="shadow-sm">
                <Link href="/dashboard/sales/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une vente
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{sale.product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Store className="h-3 w-3" />
                            <span className="truncate">{sale.restaurant.name}</span>
                          </div>
                          <span className="text-muted-foreground">•</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(new Date(sale.saleDate))} à {sale.saleHour}h</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(sale.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.quantity} unité{sale.quantity > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                      >
                        <Link href={`/dashboard/sales/${sale.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          setSaleToDelete(sale)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la vente</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette vente ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSale.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteSale.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSale.isPending ? (
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
