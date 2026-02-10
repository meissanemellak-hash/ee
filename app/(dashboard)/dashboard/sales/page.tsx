'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { useActiveRestaurant } from '@/hooks/use-active-restaurant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { formatCurrency, formatDate, exportToCsv } from '@/lib/utils'
import { Plus, Edit, Trash2, Calendar, Store, BarChart3, Loader2, TrendingUp, Euro, ShoppingCart, Download, ChevronDown, Upload } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { useQueryClient } from '@tanstack/react-query'
import { useSales, useDeleteSale, getSalesListQueryOptions, getSaleQueryOptions } from '@/lib/react-query/hooks/use-sales'
import { useUserRole } from '@/lib/react-query/hooks/use-user-role'
import { permissions } from '@/lib/roles'
import { useRestaurants } from '@/lib/react-query/hooks/use-restaurants'
import { useProducts } from '@/lib/react-query/hooks/use-products'
import { SaleListSkeleton } from '@/components/ui/skeletons/sale-list-skeleton'
import { Skeleton } from '@/components/ui/skeleton'
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
  const searchParams = useSearchParams()
  const { setActiveRestaurantId } = useActiveRestaurant()
  const urlRestaurant = searchParams.get('restaurant')

  const [page, setPage] = useState(1)
  const limit = 20
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(() => urlRestaurant || 'all')
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null)

  // Synchroniser le filtre restaurant avec l'URL (sélecteur header)
  useEffect(() => {
    setSelectedRestaurant(urlRestaurant || 'all')
  }, [urlRestaurant])

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setPage(1)
  }, [selectedRestaurant, selectedProduct, startDate, endDate])

  // Charger les restaurants et produits pour les filtres
  const { data: restaurantsData } = useRestaurants(1, 100)
  const { data: productsData } = useProducts(1, 100)
  const restaurants = (restaurantsData?.restaurants || []) as Restaurant[]
  const products = (productsData?.products || []) as Product[]

  const queryClient = useQueryClient()
  const salesFilters = {
    restaurantId: selectedRestaurant,
    productId: selectedProduct,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }
  const { data, isLoading, error, refetch } = useSales(page, limit, salesFilters)

  const sales = (data?.sales || []) as Sale[]
  const totalPages = data?.totalPages ?? 0
  const deleteSale = useDeleteSale()

  // Prefetch page suivante pour une navigation plus fluide (Phase 2 UX)
  useEffect(() => {
    if (!organization?.id || !data || page >= totalPages || totalPages <= 1) return
    queryClient.prefetchQuery(
      getSalesListQueryOptions(organization.id, page + 1, limit, salesFilters)
    )
  }, [organization?.id, data, page, totalPages, limit, queryClient, selectedRestaurant, selectedProduct, startDate, endDate])

  const { data: roleData } = useUserRole()
  const currentRole = roleData ?? 'staff'
  const canCreate = permissions.canCreateSale(currentRole)
  const canEdit = permissions.canEditSale(currentRole)
  const canDelete = permissions.canDeleteSale(currentRole)
  const canImportSales = permissions.canImportSales(currentRole)

  // Chiffre d'affaires : total sur toutes les ventes (filtres appliqués) si l'API le fournit, sinon somme de la page courante
  const totalRevenueFromApi = data?.totalRevenue
  const totalRevenuePage = sales.reduce(
    (sum, sale) => sum + sale.quantity * (sale.product?.unitPrice ?? sale.amount / sale.quantity),
    0
  )
  const totalRevenue = typeof totalRevenueFromApi === 'number' ? totalRevenueFromApi : totalRevenuePage
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

  const handleExportCsv = () => {
    const csvData = sales.map((s) => ({
      restaurant: s.restaurant.name,
      product: s.product.name,
      quantity: s.quantity,
      amount: s.amount,
      date: s.saleDate,
      hour: s.saleHour,
    }))
    const filename = `ventes_${new Date().toISOString().slice(0, 10)}.csv`
    exportToCsv(csvData, filename)
  }

  if (!isLoaded) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Liste des ventes en cours de chargement">
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Ventes & Analyse' }]} className="mb-4" />
          <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-6 border-b border-border/60">
            <div>
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-5 w-72" />
            </div>
          </header>
          <SaleListSkeleton />
        </div>
      </main>
    )
  }

  if (!organization?.id) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <header className="pb-6 border-b border-border/60">
            <h1 className="text-3xl font-bold tracking-tight">Ventes</h1>
            <p className="text-muted-foreground mt-1.5">
              Gérez et consultez toutes vos ventes
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm bg-card/95">
            <CardContent className="py-16 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Aucune organisation active</h2>
              <p className="text-muted-foreground">
                Veuillez sélectionner une organisation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <header className="pb-6 border-b border-border/60">
            <h1 className="text-3xl font-bold tracking-tight">Ventes</h1>
            <p className="text-muted-foreground mt-1.5">
              Gérez et consultez toutes vos ventes
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-red-800 dark:text-red-400">
                Une erreur s’est produite lors du chargement des ventes. Vérifiez votre connexion et réessayez.
              </p>
              <Button variant="outline" onClick={() => refetch()} className="border-red-300 dark:border-red-800 text-red-800 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20">
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Liste des ventes">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Ventes & Analyse' }]} className="mb-4" />
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-6 border-b border-border/60">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ventes</h1>
            <p className="text-muted-foreground mt-1.5">
              Gérez et consultez toutes vos ventes
            </p>
            {data && data.total >= 0 && (
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {data.total} vente{data.total !== 1 ? 's' : ''} trouvée{data.total !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shadow-sm" aria-label="Import, export et analyse">
                  <Download className="h-4 w-4 mr-2" />
                  Import / export
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCsv} disabled={sales.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter CSV
                </DropdownMenuItem>
                {canImportSales && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/sales/import">
                      <Upload className="h-4 w-4 mr-2" />
                      Importer CSV
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/sales/analyze">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Voir l&apos;analyse
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canCreate && (
              <Button asChild className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0">
                <Link href="/dashboard/sales/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle vente
                </Link>
              </Button>
            )}
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total des ventes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{sales.length}</div>
              <p className="text-xs text-muted-foreground mt-2">Transactions (cette page)</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Chiffre d&apos;affaires</CardTitle>
              <Euro className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {typeof totalRevenueFromApi === 'number' ? 'Chiffre d\'affaires (filtres appliqués)' : 'Revenus (page affichée)'}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quantité totale</CardTitle>
              <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{totalQuantity}</div>
              <p className="text-xs text-muted-foreground mt-2">Unités vendues (cette page)</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl border shadow-sm bg-card" role="search" aria-label="Filtres ventes">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Filtres</CardTitle>
            <CardDescription className="mt-1">
              Filtrez vos ventes par restaurant, produit ou période
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="sales-filter-restaurant">Restaurant</Label>
                <Select
                  value={selectedRestaurant}
                  onValueChange={(v) => {
                    setSelectedRestaurant(v)
                    setActiveRestaurantId(v === 'all' ? null : v)
                  }}
                >
                  <SelectTrigger id="sales-filter-restaurant" className="bg-muted/50 dark:bg-gray-800 border-border" aria-label="Filtrer par restaurant">
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
                <Label htmlFor="sales-filter-product">Produit</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger id="sales-filter-product" className="bg-muted/50 dark:bg-gray-800 border-border" aria-label="Filtrer par produit">
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
                <Label htmlFor="sales-filter-start">Date de début</Label>
                <Input
                  id="sales-filter-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-muted/50 dark:bg-gray-800 border-border"
                  aria-label="Date de début"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales-filter-end">Date de fin</Label>
                <Input
                  id="sales-filter-end"
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

        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Liste des ventes</CardTitle>
            <CardDescription className="mt-1">
              {isLoading ? 'Chargement...' : data ? `${data.total} vente${data.total !== 1 ? 's' : ''} trouvée${data.total !== 1 ? 's' : ''}` : 'Aucune vente'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SaleListSkeleton />
            ) : sales.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center mb-5">
                  <ShoppingCart className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {selectedRestaurant !== 'all' || selectedProduct !== 'all' || startDate || endDate
                    ? 'Aucune vente trouvée'
                    : 'Aucune vente pour l’instant'}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-2">
                  {selectedRestaurant !== 'all' || selectedProduct !== 'all' || startDate || endDate
                    ? 'Aucune vente ne correspond à vos critères. Modifiez les filtres ou créez une vente.'
                    : 'Enregistrez vos ventes pour suivre le chiffre d’affaires et analyser les tendances.'}
                </p>
                {(selectedRestaurant === 'all' && selectedProduct === 'all' && !startDate && !endDate) && (
                  <Button asChild className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0">
                    <Link href="/dashboard/sales/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer une vente
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <ul className="space-y-3 list-none p-0 m-0" aria-label="Liste des ventes">
                {sales.map((sale) => (
                  <li
                    key={sale.id}
                    className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 dark:bg-gray-800/30 border-border hover:bg-muted/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
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
                        <p className="font-bold text-teal-700 dark:text-teal-400">{formatCurrency(sale.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {sale.quantity} unité{sale.quantity > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {canEdit && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild aria-label={`Modifier la vente ${sale.product.name}`}>
                            <Link
                              href={`/dashboard/sales/${sale.id}/edit`}
                              onMouseEnter={() => organization?.id && queryClient.prefetchQuery(getSaleQueryOptions(organization.id, sale.id))}
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              setSaleToDelete(sale)
                              setDeleteDialogOpen(true)
                            }}
                            aria-label={`Supprimer la vente ${sale.product.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {data && data.totalPages > 1 && (
          <nav className="flex justify-center pt-8" aria-label="Pagination des ventes">
            <Pagination
              currentPage={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </nav>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette vente ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. La vente sera définitivement supprimée.
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
    </main>
  )
}
