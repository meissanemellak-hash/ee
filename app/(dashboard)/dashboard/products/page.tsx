'use client'

import { useState, useMemo } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Search, Plus, Edit, Trash2, Package, TrendingUp, Beaker, Tag, Loader2 } from 'lucide-react'
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
import { useProducts, useDeleteProduct } from '@/lib/react-query/hooks/use-products'
import { ProductListSkeleton } from '@/components/ui/skeletons/product-list-skeleton'
import { Pagination } from '@/components/ui/pagination'
import { useDebounce } from '@/hooks/use-debounce'

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
  const [page, setPage] = useState(1)
  const limit = 12
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  
  // Debounce la recherche pour éviter trop de requêtes
  const debouncedSearch = useDebounce(search, 300)

  // Réinitialiser la page quand les filtres changent
  useMemo(() => {
    setPage(1)
  }, [debouncedSearch, selectedCategory])

  const { data, isLoading, error } = useProducts(page, limit, {
    search: debouncedSearch,
    category: selectedCategory,
  })

  const products = data?.products || []
  const categories = data?.categories || []
  const deleteProduct = useDeleteProduct()

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

  return (
    <div className="p-6 space-y-6">
      {/* Header (Style Sequence) */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos produits, leurs prix et leurs ingrédients
          </p>
        </div>
        <Button asChild className="shadow-sm">
          <Link href="/dashboard/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un produit
          </Link>
        </Button>
      </div>

      {/* Filtres et recherche (Style Sequence) */}
      <Card className="border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
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

      {/* Liste des produits (Style Sequence) */}
      {!isLoaded ? (
        <Card className="border shadow-sm">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Chargement de votre organisation...</p>
          </CardContent>
        </Card>
      ) : !organization?.id ? (
        <Card className="border shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucune organisation active</h3>
            <p className="text-muted-foreground">
              Veuillez sélectionner une organisation.
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <ProductListSkeleton />
      ) : error ? (
        <Card className="border shadow-sm border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
          <CardContent className="py-12 text-center">
            <p className="text-red-800 dark:text-red-400">
              Erreur lors du chargement des produits. Veuillez réessayer.
            </p>
          </CardContent>
        </Card>
      ) : products.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {search || (selectedCategory && selectedCategory !== 'all')
                ? 'Aucun produit trouvé'
                : 'Aucun produit'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {search || (selectedCategory && selectedCategory !== 'all')
                ? 'Aucun produit ne correspond à vos critères de recherche.'
                : 'Créez votre premier produit pour commencer à gérer votre catalogue.'}
            </p>
            {!search && (!selectedCategory || selectedCategory === 'all') && (
              <Button asChild className="shadow-sm">
                <Link href="/dashboard/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un produit
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="border shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg truncate">{product.name}</CardTitle>
                    </div>
                    {product.category && (
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Tag className="h-3 w-3" />
                        <span className="truncate">{product.category}</span>
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
                      <Link href={`/dashboard/products/${product.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => openDeleteDialog(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Statistiques (Style Sequence) */}
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Prix unitaire</span>
                      </div>
                      <span className="text-xl font-bold text-green-700 dark:text-green-400">
                        {formatCurrency(product.unitPrice)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-900/30">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        <span className="text-xs text-muted-foreground">Ventes</span>
                      </div>
                      <div className="text-lg font-bold text-teal-700 dark:text-teal-400">
                        {product._count.sales}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Beaker className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs text-muted-foreground">Ingrédients</span>
                      </div>
                      <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                        {product._count.productIngredients}
                      </div>
                    </div>
                  </div>
                </div>
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
            <AlertDialogTitle>Supprimer le produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{productToDelete?.name}&quot; ?
              {productToDelete && productToDelete._count.sales > 0 && (
                <span className="block mt-2 text-destructive">
                  ⚠️ Ce produit a {productToDelete._count.sales} vente(s) associée(s). 
                  Vous devrez d&apos;abord supprimer les ventes.
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
  )
}
