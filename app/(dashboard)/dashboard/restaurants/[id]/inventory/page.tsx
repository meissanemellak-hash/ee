'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Edit, Save, X, Package, AlertTriangle, ArrowLeft, Warehouse, TrendingUp, CheckCircle2, Upload, Download, ChevronDown } from 'lucide-react'
import Link from 'next/link'
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
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { exportToCsv } from '@/lib/utils'
import { useRestaurant } from '@/lib/react-query/hooks/use-restaurants'
import { useIngredients } from '@/lib/react-query/hooks/use-ingredients'
import {
  useInventory,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  type InventoryItem,
} from '@/lib/react-query/hooks/use-inventory'
import { useUserRole } from '@/lib/react-query/hooks/use-user-role'
import { permissions } from '@/lib/roles'
import { Skeleton } from '@/components/ui/skeleton'
import { InventoryTable } from './inventory-table'

function InventoryPageSkeleton() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-hidden>
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <header className="flex items-center gap-4 pb-6 border-b border-border/60">
          <Skeleton className="h-9 w-9 rounded-md shrink-0" />
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </header>
        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-80" />
              </div>
              <Skeleton className="h-10 w-40 rounded-md" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const params = useParams()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const { data: roleData } = useUserRole()
  const currentRole = roleData ?? 'staff'
  const canEdit = permissions.canEditInventory(currentRole)
  const canImport = permissions.canImportInventory(currentRole)

  const restaurantId = params?.id as string | undefined

  const { data: restaurant, isLoading: loadingRestaurant, isError: errorRestaurant, refetch: refetchRestaurant } = useRestaurant(restaurantId)
  const { data: ingredientsData, isLoading: loadingIngredients, isError: errorIngredients, refetch: refetchIngredients } = useIngredients()
  const { data: inventory = [], isLoading: loadingInventory, isError: errorInventory, refetch: refetchInventory } = useInventory(restaurantId)

  const createInventory = useCreateInventoryItem()
  const updateInventory = useUpdateInventoryItem()
  const deleteInventory = useDeleteInventoryItem()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    ingredientId: '',
    currentStock: '',
    minThreshold: '',
    maxThreshold: '',
  })
  const hasToastedError = useRef(false)

  const ingredients = ingredientsData?.ingredients ?? []

  const hasQueryError = errorRestaurant || errorIngredients || errorInventory
  useEffect(() => {
    if (hasQueryError && !hasToastedError.current) {
      hasToastedError.current = true
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données.',
        variant: 'destructive',
      })
    }
    if (!hasQueryError) hasToastedError.current = false
  }, [hasQueryError, toast])

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
      OK: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800',
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

  const handleSave = (itemId?: string) => {
    if (!restaurantId || !organization?.id) return
    if (!formData.ingredientId || !formData.currentStock || !formData.minThreshold) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires.',
        variant: 'destructive',
      })
      return
    }
    const currentStock = parseFloat(formData.currentStock)
    const minThreshold = parseFloat(formData.minThreshold)
    const maxThreshold = formData.maxThreshold ? parseFloat(formData.maxThreshold) : null

    if (itemId) {
      updateInventory.mutate(
        {
          id: itemId,
          restaurantId,
          data: { currentStock, minThreshold, maxThreshold },
        },
        { onSuccess: handleCancel }
      )
    } else {
      createInventory.mutate(
        {
          restaurantId,
          ingredientId: formData.ingredientId,
          currentStock,
          minThreshold,
          maxThreshold,
        },
        { onSuccess: handleCancel }
      )
    }
  }

  const handleDelete = () => {
    if (!deletingId || !restaurantId) return
    deleteInventory.mutate(
      { id: deletingId, restaurantId },
      { onSuccess: () => setDeletingId(null) }
    )
  }

  const availableIngredients = Array.isArray(ingredients)
    ? (editingId
        ? ingredients
        : ingredients.filter((ing) => !inventory.some((inv) => inv.ingredientId === ing.id)))
    : []

  const loading = loadingRestaurant || loadingIngredients || loadingInventory

  const handleRetry = () => {
    refetchRestaurant()
    refetchIngredients()
    refetchInventory()
  }

  const handleExportCsv = () => {
    const csvData = inventory.map((item) => ({
      ingredient: item.ingredient.name,
      stock_actuel: item.currentStock,
      seuil_min: item.minThreshold,
      seuil_max: item.maxThreshold ?? '',
    }))
    const safeName = (restaurant?.name ?? restaurantId ?? 'export').replace(/[^a-zA-Z0-9_-]/g, '_')
    const filename = `inventaire_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`
    exportToCsv(csvData, filename)
  }

  if (!isLoaded || loading) {
    return <InventoryPageSkeleton />
  }

  if (isLoaded && !organization?.id) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">
                Aucune organisation active. Veuillez sélectionner une organisation pour gérer l’inventaire.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/restaurants">Retour aux restaurants</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (restaurantId && !loadingRestaurant && !restaurant) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Card className="rounded-xl border shadow-sm border-red-200/50 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">
                Restaurant introuvable ou supprimé. Retournez à la liste pour gérer l’inventaire d’un autre établissement.
              </p>
              <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white border-0">
                <Link href="/dashboard/restaurants">Retour aux restaurants</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (hasQueryError && (errorRestaurant || !restaurant)) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Card className="rounded-xl border shadow-sm border-red-200/50 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">
                Une erreur s’est produite lors du chargement des données. Vérifiez votre connexion et réessayez.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={handleRetry}>
                  Réessayer
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/dashboard/restaurants/${restaurantId}`}>Retour au restaurant</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return ( <>
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label={`Inventaire - ${restaurant?.name ?? 'Restaurant'}`}>
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Restaurants', href: '/dashboard/restaurants' },
            { label: restaurant?.name ?? '...', href: `/dashboard/restaurants/${restaurantId}` },
            { label: 'Inventaire' },
          ]}
        />
        <header className="flex items-center gap-4 pb-6 border-b border-border/60">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild aria-label="Retour au détail du restaurant">
            <Link href={`/dashboard/restaurants/${restaurantId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0" aria-hidden>
              <Warehouse className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight">Gestion de l’inventaire</h1>
              <p className="text-muted-foreground truncate">
                {restaurant ? restaurant.name : 'Chargement...'}
              </p>
            </div>
          </div>
        </header>

        <Card className="rounded-xl border shadow-sm bg-card">
        <CardHeader>
          <div>
            <div>
              <CardTitle id="inventory-title" className="text-lg font-semibold">Inventaire</CardTitle>
              <CardDescription className="mt-1">Gérez les stocks et les seuils d’alerte pour chaque ingrédient. Les champs marqués d’un * sont obligatoires.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Boutons en haut à droite du tableau */}
          {!showAddForm && (
            <div className="flex justify-end gap-2 mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="shadow-sm" aria-label="Import et export">
                    <Download className="h-4 w-4 mr-2" />
                    Import / export
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCsv} disabled={inventory.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter CSV
                  </DropdownMenuItem>
                  {canImport && (
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/restaurants/${restaurantId}/inventory/import`}>
                        <Upload className="h-4 w-4 mr-2" />
                        Importer CSV
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {canEdit && (
              <Button onClick={() => setShowAddForm(true)} className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0" aria-label="Ajouter un ingrédient à l'inventaire">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un ingrédient
              </Button>
              )}
            </div>
          )}
          {/* Formulaire d'ajout (Style Sequence) */}
          {showAddForm && canEdit && (
            <Card className="mb-6 rounded-xl border-2 border-teal-200 dark:border-teal-900/30 bg-teal-50/50 dark:bg-teal-900/10" aria-labelledby="add-ingredient-title">
              <CardHeader>
                <CardTitle id="add-ingredient-title" className="text-lg font-semibold flex items-center gap-2">
                  <Plus className="h-5 w-5 text-teal-600 dark:text-teal-400" aria-hidden />
                  Ajouter un ingrédient à l’inventaire
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
                        Tous vos ingrédients ont déjà un inventaire. Vous pouvez modifier un inventaire existant en cliquant sur l&apos;icône de modification.
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

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    onClick={() => handleSave()}
                    disabled={createInventory.isPending}
                    className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0"
                  >
                    {createInventory.isPending ? (
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
            <div className="text-center py-16 px-4" role="status" aria-label="Aucun inventaire configuré">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center mb-5">
                <Package className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Aucun inventaire configuré</h2>
              <p className="text-muted-foreground mb-2 max-w-md mx-auto">
                Aucun ingrédient n’est encore suivi pour ce restaurant. Ajoutez des lignes d’inventaire pour suivre les stocks et les seuils d’alerte.
              </p>
              <p className="text-sm text-muted-foreground">
                Cliquez sur « Ajouter un ingrédient » pour commencer.
              </p>
            </div>
          ) : (
            <InventoryTable
              inventory={inventory}
              ingredients={ingredients}
              editingId={editingId}
              formData={formData}
              setFormData={setFormData}
              getStatus={getStatus}
              getStatusColor={getStatusColor}
              getStatusLabel={getStatusLabel}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              setDeletingId={setDeletingId}
              updateMutation={updateInventory}
              canEdit={canEdit}
            />
          )}
        </CardContent>
      </Card>

        {/* Dialog de confirmation de suppression */}
        <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
          <AlertDialogContent className="rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette ligne d’inventaire ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. La ligne d’inventaire sera supprimée définitivement. Vous pourrez la recréer plus tard si besoin.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </main>
    </>
  )
}
