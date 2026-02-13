'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Trash2, Beaker, Package, ArrowLeft, Save } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  useProduct,
  useUpdateProduct,
  useProductIngredients,
  useAddProductIngredient,
  useRemoveProductIngredient,
  type ProductIngredientItem,
} from '@/lib/react-query/hooks/use-products'
import { useIngredients } from '@/lib/react-query/hooks/use-ingredients'
import { Skeleton } from '@/components/ui/skeleton'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { formatRecipeQuantity } from '@/lib/utils'
import { getCompatibleUnits } from '@/lib/units'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const id = params?.id as string | undefined

  const { data: product, isLoading: loadingProduct, isError: errorProduct } = useProduct(id)
  const { data: ingredientsData } = useIngredients()
  const { data: productIngredients = [], isLoading: loadingIngredients } = useProductIngredients(id)
  const updateProduct = useUpdateProduct()
  const addIngredient = useAddProductIngredient()
  const removeIngredient = useRemoveProductIngredient()

  const [formData, setFormData] = useState({ name: '', category: '', unitPrice: '' })
  const [newIngredient, setNewIngredient] = useState({ ingredientId: '', quantityNeeded: '', unit: '' })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ingredientToDelete, setIngredientToDelete] = useState<ProductIngredientItem | null>(null)
  const hasRedirected = useRef(false)

  const ingredients = (ingredientsData?.ingredients ?? []) as { id: string; name: string; unit: string }[]

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        unitPrice: product.unitPrice.toString(),
      })
    }
  }, [product])

  useEffect(() => {
    if (id && errorProduct && !product && !hasRedirected.current) {
      hasRedirected.current = true
      toast({
        title: 'Produit introuvable',
        description: 'Le produit que vous recherchez n’existe pas ou a été supprimé.',
        variant: 'destructive',
      })
    }
  }, [id, errorProduct, product, toast])

  const availableIngredients = ingredients.filter(
    (ing) => !productIngredients.some((pi) => pi.ingredientId === ing.id)
  )

  const handleAddIngredient = () => {
    if (!newIngredient.ingredientId || !newIngredient.quantityNeeded || !id) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un ingrédient et saisir une quantité',
        variant: 'destructive',
      })
      return
    }
    const quantity = parseFloat(newIngredient.quantityNeeded)
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: 'Erreur',
        description: 'La quantité doit être un nombre positif',
        variant: 'destructive',
      })
      return
    }
    addIngredient.mutate(
      {
        productId: id,
        ingredientId: newIngredient.ingredientId,
        quantityNeeded: quantity,
        unit: newIngredient.unit || undefined,
      },
      { onSuccess: () => setNewIngredient({ ingredientId: '', quantityNeeded: '', unit: '' }) }
    )
  }

  const handleDeleteIngredient = () => {
    if (!ingredientToDelete || !id) return
    removeIngredient.mutate(
      { productId: id, ingredientId: ingredientToDelete.ingredientId },
      { onSuccess: () => { setDeleteDialogOpen(false); setIngredientToDelete(null) } }
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization?.id || !id) {
      toast({
        title: 'Erreur',
        description: 'Aucune organisation active. Veuillez sélectionner une organisation.',
        variant: 'destructive',
      })
      return
    }
    const unitPrice = parseFloat(formData.unitPrice)
    if (isNaN(unitPrice) || unitPrice <= 0) {
      toast({
        title: 'Erreur',
        description: 'Le prix doit être un nombre positif',
        variant: 'destructive',
      })
      return
    }
    updateProduct.mutate(
      {
        id,
        data: {
          name: formData.name.trim(),
          category: formData.category.trim() || null,
          unitPrice,
        },
      },
      { onSuccess: () => router.push('/dashboard/products') }
    )
  }

  if (!isLoaded) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Chargement de votre organisation...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (isLoaded && !organization?.id) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">
                Aucune organisation active. Veuillez sélectionner une organisation.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/products">Retour aux produits</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (id && !loadingProduct && (errorProduct || !product)) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Card className="rounded-xl border shadow-sm border-red-200/50 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">
                Produit introuvable ou supprimé. Retournez à la liste pour modifier un autre produit.
              </p>
              <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white border-0">
                <Link href="/dashboard/products">Retour aux produits</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (loadingProduct) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-hidden>
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <header className="flex items-center gap-4 pb-6 border-b border-border/60">
            <Skeleton className="h-9 w-9 rounded-md shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-64" />
            </div>
          </header>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </CardContent>
          </Card>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label={`Modifier le produit ${product?.name ?? ''}`}>
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Produits', href: '/dashboard/products' },
            { label: product?.name ?? '...' },
            { label: 'Édition' },
          ]}
        />
        <header className="flex items-center gap-4 pb-6 border-b border-border/60">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild aria-label="Retour à la liste des produits">
            <Link href="/dashboard/products" className="hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0" aria-hidden>
              <Package className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight">Modifier le produit</h1>
              <p className="text-muted-foreground truncate">
                Modifiez les informations et la recette de {formData.name || 'ce produit'}
              </p>
            </div>
          </div>
        </header>

        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Informations du produit</CardTitle>
            <CardDescription className="mt-1">
              Les champs marqués d’un * sont obligatoires. Enregistrez pour appliquer les modifications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" aria-describedby="edit-form-desc" noValidate>
            <p id="edit-form-desc" className="sr-only">
              Formulaire de modification du produit : nom, catégorie et prix unitaire.
            </p>
            <div className="space-y-2">
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Burger Classique"
                required
                disabled={updateProduct.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Burger, Boisson, Dessert..."
                disabled={updateProduct.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Optionnel. Permet de regrouper vos produits par catégorie.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice">Prix unitaire (€) *</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                placeholder="12.50"
                required
                disabled={updateProduct.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Prix de vente unitaire du produit en euros.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                type="submit"
                disabled={updateProduct.isPending}
                className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0"
              >
                {updateProduct.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={updateProduct.isPending}
                className="shadow-sm"
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-xl border shadow-sm bg-card" aria-labelledby="recipe-title">
        <CardHeader>
          <CardTitle id="recipe-title" className="text-lg font-semibold flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm" aria-hidden>
              <Beaker className="h-4 w-4 text-white" />
            </div>
            Recette du produit
          </CardTitle>
          <CardDescription className="mt-1">
            Définissez les ingrédients nécessaires pour fabriquer ce produit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Liste des ingrédients actuels (Style Sequence) */}
          {loadingIngredients ? (
            <div className="text-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Chargement de la recette...</p>
            </div>
          ) : productIngredients.length > 0 ? (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Ingrédients actuels</Label>
              <div className="space-y-2">
                {productIngredients.map((pi) => (
                  <div
                    key={pi.id}
                    className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/30 dark:bg-gray-800/50 hover:bg-muted/50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{pi.ingredient.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {(() => {
                          const recipeUnit = pi.unit ?? pi.ingredient.unit
                          const { value, unit } = formatRecipeQuantity(
                            pi.quantityNeeded,
                            recipeUnit
                          )
                          return `${value} ${unit} par produit`
                        })()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400"
                      onClick={() => {
                        setIngredientToDelete(pi)
                        setDeleteDialogOpen(true)
                      }}
                      disabled={updateProduct.isPending || addIngredient.isPending}
                      aria-label={`Retirer ${pi.ingredient.name} de la recette`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border border-border rounded-xl bg-muted/30 dark:bg-gray-800/50" role="status" aria-label="Aucun ingrédient dans la recette">
              <div className="mx-auto w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-3">
                <Beaker className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-sm font-medium mb-1">Aucun ingrédient dans la recette</p>
              <p className="text-xs text-muted-foreground">
                Ajoutez des ingrédients ci-dessous pour définir la recette
              </p>
            </div>
          )}

          {availableIngredients.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-border">
              <div className="p-4 rounded-xl bg-teal-50/50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-900/30" aria-labelledby="add-ingredient-label">
                <Label id="add-ingredient-label" className="text-sm font-semibold mb-3 block">Ajouter un ingrédient</Label>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Ingrédient</Label>
                    <Select
                      value={newIngredient.ingredientId}
                      onValueChange={(value) => {
                        const ing = availableIngredients.find((i) => i.id === value)
                        setNewIngredient({
                          ...newIngredient,
                          ingredientId: value,
                          unit: ing ? ing.unit : '',
                        })
                      }}
                      disabled={addIngredient.isPending}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-900">
                        <SelectValue placeholder="Sélectionner un ingrédient" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableIngredients.map((ingredient) => (
                          <SelectItem key={ingredient.id} value={ingredient.id}>
                            {ingredient.name} ({ingredient.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Quantité par produit</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newIngredient.quantityNeeded}
                      onChange={(e) =>
                        setNewIngredient({ ...newIngredient, quantityNeeded: e.target.value })
                      }
                      placeholder="0.00"
                      disabled={addIngredient.isPending}
                      className="bg-white dark:bg-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Unité</Label>
                    <Select
                      value={newIngredient.unit}
                      onValueChange={(v) => setNewIngredient({ ...newIngredient, unit: v })}
                      disabled={addIngredient.isPending || !newIngredient.ingredientId}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-900">
                        <SelectValue placeholder="Unité" />
                      </SelectTrigger>
                      <SelectContent>
                        {(newIngredient.ingredientId
                          ? getCompatibleUnits(
                              availableIngredients.find((i) => i.id === newIngredient.ingredientId)?.unit ?? 'unité'
                            )
                          : []
                        ).map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Unité de l&apos;ingrédient en recette</p>
                  </div>
                  <div className="space-y-2 flex items-end">
                    <Button
                      type="button"
                      onClick={handleAddIngredient}
                      disabled={addIngredient.isPending || !newIngredient.ingredientId || !newIngredient.quantityNeeded}
                      className="w-full shadow-sm bg-teal-600 hover:bg-teal-700 text-white border-0"
                    >
                      {addIngredient.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Ajout...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Ajouter
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {availableIngredients.length === 0 && productIngredients.length > 0 && (
            <div className="text-center py-6 border border-border rounded-xl bg-muted/30 dark:bg-gray-800/50">
              <p className="text-sm text-muted-foreground">
                Tous les ingrédients disponibles sont déjà dans la recette
              </p>
            </div>
          )}

          {ingredients.length === 0 && (
            <div className="text-center py-8 border border-border rounded-xl bg-muted/30 dark:bg-gray-800/50">
              <div className="mx-auto w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-3">
                <Beaker className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-sm font-medium mb-2">Aucun ingrédient disponible</p>
              <p className="text-xs text-muted-foreground mb-4">
                Créez d’abord des ingrédients pour pouvoir les ajouter à la recette
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/ingredients/new')}
                className="shadow-sm border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20"
              >
                Créer un ingrédient
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Retirer cet ingrédient de la recette ?</AlertDialogTitle>
              <AlertDialogDescription>
                L’ingrédient &quot;{ingredientToDelete?.ingredient.name}&quot; sera retiré de la recette. Cette action est irréversible. Vous pourrez l’ajouter à nouveau plus tard si besoin.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={removeIngredient.isPending}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteIngredient}
                disabled={removeIngredient.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {removeIngredient.isPending ? (
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
