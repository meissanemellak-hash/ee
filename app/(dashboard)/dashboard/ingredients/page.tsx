'use client'

import { useState, useMemo } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Search, Plus, Edit, Trash2, Beaker, Loader2, Package, TrendingUp, Building2 } from 'lucide-react'
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
import { useIngredients, useDeleteIngredient } from '@/lib/react-query/hooks/use-ingredients'
import { IngredientListSkeleton } from '@/components/ui/skeletons/ingredient-list-skeleton'
import { useDebounce } from '@/hooks/use-debounce'

interface Ingredient {
  id: string
  name: string
  unit: string
  costPerUnit: number
  packSize: number | null
  supplierName: string | null
  createdAt: string
  _count: {
    productIngredients: number
    inventory: number
  }
}

export default function IngredientsPage() {
  const { organization, isLoaded } = useOrganization()
  const [search, setSearch] = useState('')
  const [selectedUnit, setSelectedUnit] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ingredientToDelete, setIngredientToDelete] = useState<Ingredient | null>(null)
  
  // Debounce la recherche pour éviter trop de requêtes
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, error } = useIngredients({
    search: debouncedSearch,
    unit: selectedUnit,
  })

  const ingredients = data?.ingredients || []
  const units = data?.units || []
  const deleteIngredient = useDeleteIngredient()

  const handleDelete = async () => {
    if (!ingredientToDelete) return
    deleteIngredient.mutate(ingredientToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        setIngredientToDelete(null)
      },
    })
  }

  const openDeleteDialog = (ingredient: Ingredient) => {
    setIngredientToDelete(ingredient)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header (Style Sequence) */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ingrédients</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos ingrédients, leurs coûts et fournisseurs
          </p>
        </div>
        <Button asChild className="shadow-sm">
          <Link href="/dashboard/ingredients/new">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un ingrédient
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
                  placeholder="Rechercher un ingrédient..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
                />
              </div>
            </div>
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="w-full sm:w-[200px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <SelectValue placeholder="Toutes les unités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les unités</SelectItem>
                {units.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des ingrédients (Style Sequence) */}
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
              <Beaker className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucune organisation active</h3>
            <p className="text-muted-foreground">
              Veuillez sélectionner une organisation.
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <IngredientListSkeleton />
      ) : error ? (
        <Card className="border shadow-sm border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
          <CardContent className="py-12 text-center">
            <p className="text-red-800 dark:text-red-400">
              Erreur lors du chargement des ingrédients. Veuillez réessayer.
            </p>
          </CardContent>
        </Card>
      ) : ingredients.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Beaker className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {search || (selectedUnit && selectedUnit !== 'all')
                ? 'Aucun ingrédient trouvé'
                : 'Aucun ingrédient'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {search || (selectedUnit && selectedUnit !== 'all')
                ? 'Aucun ingrédient ne correspond à vos critères de recherche.'
                : 'Créez votre premier ingrédient pour commencer à gérer votre inventaire.'}
            </p>
            {!search && (!selectedUnit || selectedUnit === 'all') && (
              <Button asChild className="shadow-sm">
                <Link href="/dashboard/ingredients/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un ingrédient
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ingredients.map((ingredient) => (
            <Card key={ingredient.id} className="border shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                        <Beaker className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg truncate">{ingredient.name}</CardTitle>
                    </div>
                    <CardDescription className="flex items-center gap-1.5 mt-1">
                      <span>{ingredient.unit}</span>
                      {ingredient.supplierName && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{ingredient.supplierName}</span>
                          </div>
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <Link href={`/dashboard/ingredients/${ingredient.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => openDeleteDialog(ingredient)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Statistiques (Style Sequence) */}
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Coût par unité</span>
                      <span className="text-xl font-bold text-purple-700 dark:text-purple-400">
                        {formatCurrency(ingredient.costPerUnit)}
                      </span>
                    </div>
                  </div>
                  {ingredient.packSize && (
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Taille du pack</span>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-400">
                          {ingredient.packSize} {ingredient.unit}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-900/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        <span className="text-xs text-muted-foreground">Recettes</span>
                      </div>
                      <div className="text-lg font-bold text-teal-700 dark:text-teal-400">
                        {ingredient._count.productIngredients}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs text-muted-foreground">Stocks</span>
                      </div>
                      <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                        {ingredient._count.inventory}
                      </div>
                    </div>
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
            <AlertDialogTitle>Supprimer l'ingrédient ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{ingredientToDelete?.name}&quot; ?
              {ingredientToDelete && ingredientToDelete._count.productIngredients > 0 && (
                <span className="block mt-2 text-destructive">
                  ⚠️ Cet ingrédient est utilisé dans {ingredientToDelete._count.productIngredients} recette(s). 
                  Vous devrez d&apos;abord supprimer les recettes.
                </span>
              )}
              {ingredientToDelete && ingredientToDelete._count.inventory > 0 && (
                <span className="block mt-2 text-destructive">
                  ⚠️ Cet ingrédient a {ingredientToDelete._count.inventory} stock(s) associé(s). 
                  Vous devrez d&apos;abord supprimer les stocks.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteIngredient.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteIngredient.isPending || (ingredientToDelete?._count?.productIngredients ?? 0) > 0 || (ingredientToDelete?._count?.inventory ?? 0) > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteIngredient.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
