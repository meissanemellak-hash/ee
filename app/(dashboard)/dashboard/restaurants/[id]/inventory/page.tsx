'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Edit, Save, X, Package, AlertTriangle, ArrowLeft, Warehouse, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react'
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

interface InventoryItem {
  id: string
  restaurantId: string
  ingredientId: string
  currentStock: number
  minThreshold: number
  maxThreshold: number | null
  lastUpdated: string
  ingredient: {
    id: string
    name: string
    unit: string
    costPerUnit: number
  }
}

interface Ingredient {
  id: string
  name: string
  unit: string
  costPerUnit: number
}

interface Restaurant {
  id: string
  name: string
}

export default function InventoryPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Formulaire d'ajout/modification
  const [formData, setFormData] = useState({
    ingredientId: '',
    currentStock: '',
    minThreshold: '',
    maxThreshold: '',
  })

  const restaurantId = params.id as string

  useEffect(() => {
    if (isLoaded && organization?.id && restaurantId) {
      loadData()
    }
  }, [isLoaded, organization?.id, restaurantId])

  const loadData = async () => {
    if (!organization?.id) return

    setLoading(true)
    try {
      // Charger le restaurant
      const restaurantRes = await fetch(`/api/restaurants/${restaurantId}?clerkOrgId=${organization.id}`)
      if (restaurantRes.ok) {
        const restaurantData = await restaurantRes.json()
        setRestaurant(restaurantData)
      }

      // Charger les ingrédients de l'organisation
      const ingredientsRes = await fetch(`/api/ingredients?clerkOrgId=${organization.id}`)
      if (ingredientsRes.ok) {
        const responseData = await ingredientsRes.json()
        // L'API retourne { ingredients: [...], units: [...] }
        const ingredientsList = responseData.ingredients || responseData
        // S'assurer que c'est un tableau
        const ingredientsArray = Array.isArray(ingredientsList) ? ingredientsList : []
        console.log('[Inventory] Ingrédients chargés:', ingredientsArray.length)
        setIngredients(ingredientsArray)
      } else {
        console.error('[Inventory] Erreur lors du chargement des ingrédients:', ingredientsRes.status)
        setIngredients([])
      }

      // Charger les inventaires
      await loadInventory()
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadInventory = async () => {
    if (!organization?.id) return

    try {
      const response = await fetch(`/api/inventory?restaurantId=${restaurantId}&clerkOrgId=${organization.id}`)
      if (response.ok) {
        const data = await response.json()
        setInventory(data)
      } else {
        throw new Error('Failed to load inventory')
      }
    } catch (error) {
      console.error('Error loading inventory:', error)
    }
  }

  const getStatus = (item: InventoryItem): 'OK' | 'LOW' | 'CRITICAL' | 'OVERSTOCK' => {
    if (item.currentStock < item.minThreshold) {
      const percentage = (item.currentStock / item.minThreshold) * 100
      return percentage < 20 ? 'CRITICAL' : 'LOW'
    } else if (item.maxThreshold && item.currentStock > item.maxThreshold) {
      return 'OVERSTOCK'
    }
    return 'OK'
  }

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      OK: 'OK',
      LOW: 'Faible',
      CRITICAL: 'Critique',
      OVERSTOCK: 'Surstock',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      OK: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
      LOW: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800',
      CRITICAL: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
      OVERSTOCK: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
    }
    return colors[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id)
    setFormData({
      ingredientId: item.ingredientId,
      currentStock: item.currentStock.toString(),
      minThreshold: item.minThreshold.toString(),
      maxThreshold: item.maxThreshold?.toString() || '',
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setShowAddForm(false)
    setFormData({
      ingredientId: '',
      currentStock: '',
      minThreshold: '',
      maxThreshold: '',
    })
  }

  const handleSave = async (itemId?: string) => {
    if (!organization?.id) return

    if (!formData.ingredientId || !formData.currentStock || !formData.minThreshold) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires.',
        variant: 'destructive',
      })
      return
    }

    setSaving(itemId || 'new')

    try {
      const payload = {
        restaurantId,
        ingredientId: formData.ingredientId,
        currentStock: parseFloat(formData.currentStock),
        minThreshold: parseFloat(formData.minThreshold),
        maxThreshold: formData.maxThreshold ? parseFloat(formData.maxThreshold) : null,
        clerkOrgId: organization.id,
      }

      let response
      if (itemId) {
        // Mise à jour
        response = await fetch(`/api/inventory/${itemId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...payload,
            clerkOrgId: organization.id,
          }),
        })
      } else {
        // Création
        response = await fetch('/api/inventory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || 'Erreur lors de la sauvegarde')
      }

      await loadInventory()
      handleCancel()

      toast({
        title: 'Succès',
        description: itemId ? 'Inventaire mis à jour avec succès.' : 'Inventaire créé avec succès.',
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      })
    } finally {
      setSaving(null)
    }
  }

  const handleDelete = async () => {
    if (!deletingId || !organization?.id) return

    setSaving(deletingId)

    try {
      const response = await fetch(`/api/inventory/${deletingId}?clerkOrgId=${organization.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || 'Erreur lors de la suppression')
      }

      await loadInventory()
      setDeletingId(null)

      toast({
        title: 'Succès',
        description: 'Inventaire supprimé avec succès.',
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      })
    } finally {
      setSaving(null)
    }
  }

  // Ingrédients disponibles (ceux qui n'ont pas encore d'inventaire)
  // Si on est en mode édition, on montre tous les ingrédients, sinon seulement ceux sans inventaire
  const availableIngredients = Array.isArray(ingredients) 
    ? (editingId 
        ? ingredients // En mode édition, montrer tous les ingrédients
        : ingredients.filter(
            (ing) => !inventory.some((inv) => inv.ingredientId === ing.id)
          )
      )
    : []

  // Debug: afficher les infos dans la console
  useEffect(() => {
    if (showAddForm) {
      console.log('[Inventory] Formulaire d\'ajout ouvert')
      console.log('[Inventory] Total ingrédients:', ingredients.length)
      console.log('[Inventory] Inventaires existants:', inventory.length)
      console.log('[Inventory] Ingrédients disponibles:', availableIngredients.length)
    }
  }, [showAddForm, ingredients.length, inventory.length, availableIngredients.length])

  if (!isLoaded || loading) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement de l'inventaire...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header (Style Sequence) */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/restaurants/${restaurantId}`}>
          <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Warehouse className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion de l'inventaire</h1>
            <p className="text-muted-foreground">
              {restaurant ? `Restaurant: ${restaurant.name}` : 'Chargement...'}
            </p>
          </div>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold">Inventaire</CardTitle>
              <CardDescription className="mt-1">
                Gérez les stocks et les seuils d'alerte pour chaque ingrédient
              </CardDescription>
            </div>
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)} className="shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un ingrédient
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Formulaire d'ajout (Style Sequence) */}
          {showAddForm && (
            <Card className="mb-6 border-2 border-teal-200 dark:border-teal-900/30 bg-teal-50/50 dark:bg-teal-900/10">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Plus className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  Ajouter un ingrédient à l'inventaire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Ingrédient *</Label>
                    <Select
                      value={formData.ingredientId}
                      onValueChange={(value) => {
                        if (value !== 'no-ingredients') {
                          setFormData({ ...formData, ingredientId: value })
                        }
                      }}
                      disabled={availableIngredients.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          availableIngredients.length === 0
                            ? (Array.isArray(ingredients) && ingredients.length === 0
                                ? 'Aucun ingrédient disponible'
                                : 'Tous les ingrédients ont un inventaire')
                            : 'Sélectionner un ingrédient'
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {availableIngredients.length > 0 ? (
                          availableIngredients.map((ing) => (
                            <SelectItem key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-ingredients" disabled>
                            {Array.isArray(ingredients) && ingredients.length === 0
                              ? 'Aucun ingrédient disponible. Créez d\'abord des ingrédients.'
                              : 'Tous les ingrédients ont déjà un inventaire configuré.'}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {availableIngredients.length === 0 && Array.isArray(ingredients) && ingredients.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Tous vos ingrédients ont déjà un inventaire. Vous pouvez modifier un inventaire existant en cliquant sur l'icône de modification.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Stock actuel *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Seuil minimum *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.minThreshold}
                      onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Seuil maximum (optionnel)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.maxThreshold}
                      onChange={(e) => setFormData({ ...formData, maxThreshold: e.target.value })}
                      placeholder="Optionnel"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleSave()}
                    disabled={saving === 'new'}
                    className="shadow-sm"
                  >
                    {saving === 'new' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleCancel} className="shadow-sm">
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Liste des inventaires (Style Sequence) */}
          {inventory.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Aucun inventaire configuré</h3>
              <p className="text-muted-foreground mb-2">Aucun inventaire configuré pour ce restaurant.</p>
              <p className="text-sm text-muted-foreground">Cliquez sur "Ajouter un ingrédient" pour commencer.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Ingrédient</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Stock actuel</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Seuil min</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Seuil max</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Statut</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Dernière mise à jour</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                <tbody>
                  {inventory.map((item) => {
                    const isEditing = editingId === item.id
                    const status = getStatus(item)
                    const currentFormData = isEditing ? formData : {
                      ingredientId: item.ingredientId,
                      currentStock: item.currentStock.toString(),
                      minThreshold: item.minThreshold.toString(),
                      maxThreshold: item.maxThreshold?.toString() || '',
                    }

                    return (
                      <tr 
                        key={item.id} 
                        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                          isEditing ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''
                        }`}
                      >
                        <td className="px-4 py-4">
                          {isEditing ? (
                            <Select
                              value={currentFormData.ingredientId}
                              onValueChange={(value) => setFormData({ ...formData, ingredientId: value })}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.isArray(ingredients) && ingredients.map((ing) => (
                                  <SelectItem key={ing.id} value={ing.id}>
                                    {ing.name} ({ing.unit})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{item.ingredient.name}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={currentFormData.currentStock}
                              onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                              className="w-28"
                            />
                          ) : (
                            <span className="font-medium">{item.currentStock} {item.ingredient.unit}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={currentFormData.minThreshold}
                              onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
                              className="w-28"
                            />
                          ) : (
                            <span className="text-muted-foreground">{item.minThreshold} {item.ingredient.unit}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={currentFormData.maxThreshold}
                              onChange={(e) => setFormData({ ...formData, maxThreshold: e.target.value })}
                              className="w-28"
                              placeholder="Optionnel"
                            />
                          ) : (
                            <span className="text-muted-foreground">
                              {item.maxThreshold ? `${item.maxThreshold} ${item.ingredient.unit}` : '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {!isEditing && (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                              {status === 'OK' && <CheckCircle2 className="h-3 w-3" />}
                              {status === 'LOW' && <AlertTriangle className="h-3 w-3" />}
                              {status === 'CRITICAL' && <AlertTriangle className="h-3 w-3" />}
                              {status === 'OVERSTOCK' && <TrendingUp className="h-3 w-3" />}
                              {getStatusLabel(status)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground text-sm">
                          {new Date(item.lastUpdated).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleSave(item.id)}
                                  disabled={saving === item.id}
                                  className="shadow-sm"
                                >
                                  {saving === item.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancel}
                                  className="shadow-sm"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(item)}
                                  className="hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-300 dark:hover:border-teal-700"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setDeletingId(item.id)}
                                  className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'inventaire ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'inventaire sera supprimé définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
