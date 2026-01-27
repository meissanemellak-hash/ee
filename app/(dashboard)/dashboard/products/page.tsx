'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Search, Plus, Edit, Trash2, Package } from 'lucide-react'
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
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Ne faire la requête que si l'organisation est chargée ET disponible
    if (isLoaded && organization?.id) {
      fetchProducts()
    } else if (isLoaded && !organization?.id) {
      // Si Clerk est chargé mais pas d'organisation, arrêter le chargement
      setLoading(false)
      toast({
        title: 'Aucune organisation',
        description: 'Veuillez sélectionner une organisation pour voir vos produits.',
        variant: 'destructive',
      })
    }
  }, [search, selectedCategory, isLoaded, organization?.id])

  const fetchProducts = async () => {
    // Double vérification avant de faire la requête
    if (!isLoaded || !organization?.id) {
      console.log('[ProductsPage] Organisation non disponible:', { isLoaded, orgId: organization?.id })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory)
      // Passer clerkOrgId depuis le client - CRITIQUE pour que l'API fonctionne
      params.append('clerkOrgId', organization.id)
      
      console.log('[ProductsPage] Fetching products with clerkOrgId:', organization.id)

      const response = await fetch(`/api/products?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des produits')
      }

      const data = await response.json()
      setProducts(data.products)
      setCategories(data.categories)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger les produits',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!productToDelete || !organization?.id) return

    try {
      setDeleting(true)
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/products/${productToDelete.id}?${queryParams.toString()}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Erreur lors de la suppression')
      }

      toast({
        title: 'Produit supprimé',
        description: `${productToDelete.name} a été supprimé avec succès.`,
      })

      setDeleteDialogOpen(false)
      setProductToDelete(null)
      fetchProducts()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer le produit',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteDialog = (product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Produits</h1>
          <p className="text-muted-foreground">
            Gérez vos produits et leurs prix
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un produit
          </Link>
        </Button>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
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

      {/* Liste des produits */}
      {!isLoaded ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Chargement de votre organisation...</p>
          </CardContent>
        </Card>
      ) : !organization?.id ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Aucune organisation active. Veuillez sélectionner une organisation.
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Chargement des produits...</p>
          </CardContent>
        </Card>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {search || (selectedCategory && selectedCategory !== 'all')
                ? 'Aucun produit ne correspond à vos critères.'
                : 'Aucun produit pour le moment. Créez votre premier produit pour commencer.'}
            </p>
            {!search && (!selectedCategory || selectedCategory === 'all') && (
              <Button asChild>
                <Link href="/dashboard/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un produit
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>
                      {product.category || 'Sans catégorie'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <Link href={`/dashboard/products/${product.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(product)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Prix unitaire:</span>
                    <span className="text-lg font-bold">{formatCurrency(product.unitPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ventes:</span>
                    <span className="font-medium">{product._count.sales}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ingrédients:</span>
                    <span className="font-medium">{product._count.productIngredients}</span>
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
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || (productToDelete?._count.sales ?? 0) > 0}
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
