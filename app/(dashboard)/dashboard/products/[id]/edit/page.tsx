'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Trash2, Beaker } from 'lucide-react'
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
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
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
      <div>
        <h1 className="text-3xl font-bold">Modifier le produit</h1>
        <p className="text-muted-foreground">
          Modifiez les informations du produit
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du produit</CardTitle>
          <CardDescription>
            Modifiez les informations du produit
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
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Section Recette */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5" />
            Recette du produit
          </CardTitle>
          <CardDescription>
            Définissez les ingrédients nécessaires pour fabriquer ce produit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Liste des ingrédients actuels */}
          {loadingIngredients ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Chargement de la recette...</p>
            </div>
          ) : productIngredients.length > 0 ? (
            <div className="space-y-2">
              <Label>Ingrédients actuels</Label>
              <div className="space-y-2">
                {productIngredients.map((pi) => (
                  <div
                    key={pi.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{pi.ingredient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {pi.quantityNeeded} {pi.ingredient.unit} par produit
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setIngredientToDelete(pi)
                        setDeleteDialogOpen(true)
                      }}
                      disabled={saving || addingIngredient}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border rounded-lg">
              <Beaker className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Aucun ingrédient dans la recette
              </p>
            </div>
          )}

          {/* Formulaire d'ajout d'ingrédient */}
          {availableIngredients.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <Label>Ajouter un ingrédient</Label>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-xs">Ingrédient</Label>
                  <Select
                    value={newIngredient.ingredientId}
                    onValueChange={(value) =>
                      setNewIngredient({ ...newIngredient, ingredientId: value })
                    }
                    disabled={addingIngredient}
                  >
                    <SelectTrigger>
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
                  <Label className="text-xs">Quantité par produit</Label>
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
                  />
                </div>
                <div className="space-y-2 flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddIngredient}
                    disabled={addingIngredient || !newIngredient.ingredientId || !newIngredient.quantityNeeded}
                    className="w-full"
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
          )}

          {availableIngredients.length === 0 && productIngredients.length > 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Tous les ingrédients disponibles sont déjà dans la recette
              </p>
            </div>
          )}

          {ingredients.length === 0 && (
            <div className="text-center py-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">
                Aucun ingrédient disponible
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/ingredients/new')}
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
