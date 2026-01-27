'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Trash2, Beaker, Package, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
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

interface Product {
  id: string
  name: string
  category: string | null
  unitPrice: number
}

interface Ingredient {
  id: string
  name: string
  unit: string
  costPerUnit: number
}

interface ProductIngredient {
  id: string
  ingredientId: string
  quantityNeeded: number
  ingredient: {
    id: string
    name: string
    unit: string
    costPerUnit: number
  }
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unitPrice: '',
  })
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [productIngredients, setProductIngredients] = useState<ProductIngredient[]>([])
  const [loadingIngredients, setLoadingIngredients] = useState(true)
  const [newIngredient, setNewIngredient] = useState({
    ingredientId: '',
    quantityNeeded: '',
  })
  const [addingIngredient, setAddingIngredient] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ingredientToDelete, setIngredientToDelete] = useState<ProductIngredient | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (params.id && isLoaded && organization?.id) {
      fetchProduct()
      fetchIngredients()
      fetchProductIngredients()
    }
  }, [params.id, isLoaded, organization?.id])

  const fetchProduct = async () => {
    if (!organization?.id) {
      return
    }

    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/products/${params.id}?${queryParams.toString()}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'Produit introuvable',
            description: 'Le produit que vous recherchez n\'existe pas.',
            variant: 'destructive',
          })
          router.push('/dashboard/products')
          return
        }
        throw new Error('Erreur lors du chargement du produit')
      }

      const data = await response.json()
      setProduct(data.product)
      setFormData({
        name: data.product.name,
        category: data.product.category || '',
        unitPrice: data.product.unitPrice.toString(),
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger le produit',
        variant: 'destructive',
      })
      router.push('/dashboard/products')
    } finally {
      setLoading(false)
    }
  }

  const fetchIngredients = async () => {
    if (!organization?.id) return

    try {
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/ingredients?${queryParams.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setIngredients(data.ingredients || [])
      }
    } catch (error) {
      console.error('Error fetching ingredients:', error)
    }
  }

  const fetchProductIngredients = async () => {
    if (!organization?.id || !params.id) return

    try {
      setLoadingIngredients(true)
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/products/${params.id}/ingredients?${queryParams.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setProductIngredients(data)
      }
    } catch (error) {
      console.error('Error fetching product ingredients:', error)
    } finally {
      setLoadingIngredients(false)
    }
  }

  const handleAddIngredient = async () => {
    if (!newIngredient.ingredientId || !newIngredient.quantityNeeded) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un ingrédient et saisir une quantité',
        variant: 'destructive',
      })
      return
    }

    if (!organization?.id) {
      toast({
        title: 'Erreur',
        description: 'Aucune organisation active.',
        variant: 'destructive',
      })
      return
    }

    setAddingIngredient(true)

    try {
      const quantity = parseFloat(newIngredient.quantityNeeded)
      
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error('La quantité doit être un nombre positif')
      }

      const response = await fetch(`/api/products/${params.id}/ingredients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredientId: newIngredient.ingredientId,
          quantityNeeded: quantity,
          clerkOrgId: organization.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Erreur lors de l\'ajout')
      }

      toast({
        title: 'Ingrédient ajouté',
        description: 'L\'ingrédient a été ajouté à la recette avec succès.',
      })

      setNewIngredient({ ingredientId: '', quantityNeeded: '' })
      fetchProductIngredients()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      })
    } finally {
      setAddingIngredient(false)
    }
  }

  const handleDeleteIngredient = async () => {
    if (!ingredientToDelete || !organization?.id) return

    try {
      setDeleting(true)
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      
      const response = await fetch(
        `/api/products/${params.id}/ingredients/${ingredientToDelete.ingredientId}?${queryParams.toString()}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }

      toast({
        title: 'Ingrédient supprimé',
        description: 'L\'ingrédient a été retiré de la recette avec succès.',
      })

      setDeleteDialogOpen(false)
      setIngredientToDelete(null)
      fetchProductIngredients()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer l\'ingrédient',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  // Filtrer les ingrédients déjà ajoutés
  const availableIngredients = ingredients.filter(
    (ing) => !productIngredients.some((pi) => pi.ingredientId === ing.id)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const unitPrice = parseFloat(formData.unitPrice)
      
      if (isNaN(unitPrice) || unitPrice <= 0) {
        throw new Error('Le prix doit être un nombre positif')
      }

      if (!organization?.id) {
        toast({
          title: 'Erreur',
          description: 'Aucune organisation active. Veuillez sélectionner une organisation.',
          variant: 'destructive',
        })
        return
      }

      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          category: formData.category.trim() || null,
          unitPrice,
          clerkOrgId: organization.id, // Passer l'orgId depuis le client
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Erreur lors de la modification')
      }

      const data = await response.json()
      
      toast({
        title: 'Produit modifié',
        description: `${data.product.name} a été modifié avec succès.`,
      })

      router.push('/dashboard/products')
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Card className="border shadow-sm">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Chargement du produit...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header (Style Sequence) */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Modifier le produit</h1>
            <p className="text-muted-foreground">
              Modifiez les informations et la recette du produit
            </p>
          </div>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Informations du produit</CardTitle>
          <CardDescription className="mt-1">
            Modifiez les informations de base du produit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Burger Classique"
                required
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Burger, Boisson, Dessert..."
                disabled={saving}
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
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Prix de vente unitaire du produit en euros.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={saving} className="shadow-sm">
                {saving ? (
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
                disabled={saving}
                className="shadow-sm"
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Section Recette (Style Sequence) */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
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
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{pi.ingredient.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {pi.quantityNeeded} {pi.ingredient.unit} par produit
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400"
                      onClick={() => {
                        setIngredientToDelete(pi)
                        setDeleteDialogOpen(true)
                      }}
                      disabled={saving || addingIngredient}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <Beaker className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">Aucun ingrédient dans la recette</p>
              <p className="text-xs text-muted-foreground">
                Ajoutez des ingrédients ci-dessous pour définir la recette
              </p>
            </div>
          )}

          {/* Formulaire d'ajout d'ingrédient (Style Sequence) */}
          {availableIngredients.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-800">
              <div className="p-4 rounded-lg bg-purple-50/50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-900/30">
                <Label className="text-sm font-semibold mb-3 block">Ajouter un ingrédient</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Ingrédient</Label>
                    <Select
                      value={newIngredient.ingredientId}
                      onValueChange={(value) =>
                        setNewIngredient({ ...newIngredient, ingredientId: value })
                      }
                      disabled={addingIngredient}
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
                      disabled={addingIngredient}
                      className="bg-white dark:bg-gray-900"
                    />
                  </div>
                  <div className="space-y-2 flex items-end">
                    <Button
                      type="button"
                      onClick={handleAddIngredient}
                      disabled={addingIngredient || !newIngredient.ingredientId || !newIngredient.quantityNeeded}
                      className="w-full shadow-sm"
                    >
                      {addingIngredient ? (
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
            <div className="text-center py-6 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
              <p className="text-sm text-muted-foreground">
                Tous les ingrédients disponibles sont déjà dans la recette
              </p>
            </div>
          )}

          {ingredients.length === 0 && (
            <div className="text-center py-8 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <Beaker className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-2">Aucun ingrédient disponible</p>
              <p className="text-xs text-muted-foreground mb-4">
                Créez d'abord des ingrédients pour pouvoir les ajouter à la recette
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/ingredients/new')}
                className="shadow-sm"
              >
                Créer un ingrédient
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;ingrédient</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer &quot;{ingredientToDelete?.ingredient.name}&quot; de la recette ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteIngredient}
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
