'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { formatCurrency, exportToCsv } from '@/lib/utils'
import { Search, Plus, Edit, Trash2, Package, TrendingUp, Beaker, Tag, Loader2, Download, ChevronDown, Upload, FileText } from 'lucide-react'
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
import { useProducts, useDeleteProduct, getProductsListQueryOptions } from '@/lib/react-query/hooks/use-products'
import { useUserRole } from '@/lib/react-query/hooks/use-user-role'
import { permissions } from '@/lib/roles'
import { ProductListSkeleton } from '@/components/ui/skeletons/product-list-skeleton'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/pagination'
import { useDebounce } from '@/hooks/use-debounce'
import { useActiveRestaurant } from '@/hooks/use-active-restaurant'

interface Product {
  id: string
  name: string
  category: string | null
  unitPrice: number
  createdAt: string
  _count: {
    sales: number
    productIngredients: number
  }
}

export default function ProductsPage() {
  const { organization, isLoaded } = useOrganization()
  const { data: roleData } = useUserRole()
  const currentRole = roleData ?? 'admin'
  const canCreate = permissions.canCreateProduct(currentRole)
  const canEdit = permissions.canEditProduct(currentRole)
  const canDelete = permissions.canDeleteProduct(currentRole)

  const { activeRestaurantId } = useActiveRestaurant()
  const [page, setPage] = useState(1)
  const limit = 12
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  
  // Debounce la recherche pour éviter trop de requêtes
  const debouncedSearch = useDebounce(search, 300)

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, selectedCategory, activeRestaurantId])

  const queryClient = useQueryClient()
  const filters = {
    search: debouncedSearch,
    category: selectedCategory,
    restaurantId: activeRestaurantId || undefined,
  }
  const { data, isLoading, error, refetch } = useProducts(page, limit, filters)

  const products = (data?.products || []) as Product[]
  const categories = (data?.categories || []) as string[]
  const totalPages = data?.totalPages ?? 0
  const deleteProduct = useDeleteProduct()

  // Prefetch page suivante pour une navigation plus fluide (Phase 2 UX)
  useEffect(() => {
    if (!organization?.id || !data || page >= totalPages || totalPages <= 1) return
    queryClient.prefetchQuery(
      getProductsListQueryOptions(organization.id, page + 1, limit, filters)
    )
  }, [organization?.id, data, page, totalPages, limit, queryClient, debouncedSearch, selectedCategory, activeRestaurantId])

  const handleDelete = async () => {
    if (!productToDelete) return
    deleteProduct.mutate(productToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        setProductToDelete(null)
      },
    })
  }

  const openDeleteDialog = (product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleExportCsv = () => {
    const csvData = products.map((p) => ({
      nom: p.name,
      categorie: p.category ?? '',
      prix_unitaire: p.unitPrice,
    }))
    const filename = `produits_${new Date().toISOString().slice(0, 10)}.csv`
    exportToCsv(csvData, filename)
  }

  if (!isLoaded) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Liste des produits en cours de chargement">
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Produits' }]} className="mb-4" />
          <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-6 border-b border-border/60">
            <div>
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-5 w-72" />
            </div>
          </header>
          <ProductListSkeleton />
        </div>
      </main>
    )
  }

  if (!organization?.id) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <header className="pb-6 border-b border-border/60">
            <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
            <p className="text-muted-foreground mt-1.5">
              Gérez vos produits, leurs prix et leurs ingrédients
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm bg-card/95">
            <CardContent className="py-16 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
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
            <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
            <p className="text-muted-foreground mt-1.5">
              Gérez vos produits, leurs prix et leurs ingrédients
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-red-800 dark:text-red-400">
                Une erreur s’est produite lors du chargement des produits. Vérifiez votre connexion et réessayez.
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
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Liste des produits">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Produits' }]} className="mb-4" />
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-6 border-b border-border/60">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
            <p className="text-muted-foreground mt-1.5">
              Gérez vos produits, leurs prix et leurs ingrédients
            </p>
            {data && data.total > 0 && (
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {data.total} produit{data.total > 1 ? 's' : ''}
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
                <DropdownMenuItem
                  onClick={handleExportCsv}
                  disabled={products.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exporter CSV
                </DropdownMenuItem>
                {canCreate && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/products/import">
                        <Upload className="mr-2 h-4 w-4" />
                        Importer CSV
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/products/import-bom">
                        <FileText className="mr-2 h-4 w-4" />
                        Importer recettes (BOM)
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {canCreate && (
              <Button asChild className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0">
                <Link href="/dashboard/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un produit
                </Link>
              </Button>
            )}
          </div>
        </header>

        <Card className="rounded-xl border shadow-sm bg-card">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4" role="search" aria-label="Filtres produits">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-muted/50 dark:bg-gray-800 border-border focus:bg-background dark:focus:bg-gray-900 transition-colors"
                    aria-label="Rechercher un produit"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[200px] bg-muted/50 dark:bg-gray-800 border-border" aria-label="Filtrer par catégorie">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <ProductListSkeleton />
        ) : products.length === 0 ? (
          <Card className="rounded-xl border shadow-sm bg-card/95 backdrop-blur-sm">
            <CardContent className="py-16 px-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center mb-5">
                <Package className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {search || (selectedCategory && selectedCategory !== 'all')
                  ? 'Aucun produit trouvé'
                  : 'Aucun produit pour l’instant'}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-2">
                {search || (selectedCategory && selectedCategory !== 'all')
                  ? 'Aucun produit ne correspond à vos critères. Modifiez la recherche ou les filtres.'
                  : 'Créez votre premier produit pour gérer votre catalogue, vos prix et vos recettes (ingrédients).'}
              </p>
              {!search && (!selectedCategory || selectedCategory === 'all') && (
                <>
                  <ul className="text-sm text-muted-foreground max-w-sm mx-auto mb-8 text-left list-disc list-inside space-y-1">
                    <li>Prix unitaire et catégorie</li>
                    <li>Recette (ingrédients et quantités)</li>
                    <li>Suivi des ventes par produit</li>
                  </ul>
                  {canCreate && (
                    <Button asChild className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0">
                      <Link href="/dashboard/products/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter un produit
                      </Link>
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Liste des produits">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="group rounded-xl border shadow-sm bg-card hover:shadow-lg hover:border-teal-200/80 dark:hover:border-teal-800/60 transition-all duration-200"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Package className="h-5 w-5 text-white" />
                          </div>
                          <CardTitle className="text-lg truncate">{product.name}</CardTitle>
                        </div>
                        {product.category && (
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Tag className="h-3 w-3 flex-shrink-0" aria-hidden />
                            <span className="truncate">{product.category}</span>
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        {canEdit && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild aria-label={`Modifier ${product.name}`}>
                            <Link
                              href={`/dashboard/products/${product.id}/edit`}
                              onMouseEnter={() => organization?.id && queryClient.prefetchQuery(getProductQueryOptions(organization.id, product.id))}
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
                            onClick={() => openDeleteDialog(product)}
                            aria-label={`Supprimer ${product.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-teal-50/80 dark:bg-teal-900/20 border border-teal-100/80 dark:border-teal-900/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Prix unitaire</span>
                          <span className="text-xl font-bold text-teal-700 dark:text-teal-400">
                            {formatCurrency(product.unitPrice)}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-muted/50 dark:bg-gray-800/50 border border-border/80">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                            <span className="text-xs text-muted-foreground">Ventes</span>
                          </div>
                          <div className="text-lg font-bold text-teal-700 dark:text-teal-400">
                            {product._count.sales}
                          </div>
                        </div>
                        <div className="p-3.5 rounded-xl bg-muted/50 dark:bg-gray-800/50 border border-border/80">
                          <div className="flex items-center gap-2 mb-1">
                            <Beaker className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                            <span className="text-xs text-muted-foreground">Ingrédients</span>
                          </div>
                          <div className="text-lg font-bold text-teal-700 dark:text-teal-400">
                            {product._count.productIngredients}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>

            {data && data.totalPages > 1 && (
              <nav className="flex justify-center pt-8" aria-label="Pagination des produits">
                <Pagination
                  currentPage={page}
                  totalPages={data.totalPages}
                  onPageChange={setPage}
                />
              </nav>
            )}
          </>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le produit &quot;{productToDelete?.name}&quot; sera définitivement supprimé.
                {productToDelete && productToDelete._count.sales > 0 && (
                  <span className="block mt-2 text-destructive font-medium">
                    Ce produit a {productToDelete._count.sales} vente(s) enregistrée(s). Vous devrez d’abord supprimer ou modifier ces ventes.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteProduct.isPending}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteProduct.isPending || (productToDelete?._count.sales ?? 0) > 0}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteProduct.isPending ? 'Suppression...' : 'Supprimer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  )
}
