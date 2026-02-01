'use client'

import { useState } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { formatCurrency, exportToCsv } from '@/lib/utils'
import { Search, Plus, Edit, Trash2, Beaker, Loader2, Package, TrendingUp, Building2, Download, ChevronDown, Upload } from 'lucide-react'
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
import { useIngredients, useDeleteIngredient } from '@/lib/react-query/hooks/use-ingredients'
import { IngredientListSkeleton } from '@/components/ui/skeletons/ingredient-list-skeleton'
import { Skeleton } from '@/components/ui/skeleton'
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
  const searchParams = useSearchParams()
  const activeRestaurantId = searchParams.get('restaurant')
  const [search, setSearch] = useState('')
  const [selectedUnit, setSelectedUnit] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ingredientToDelete, setIngredientToDelete] = useState<Ingredient | null>(null)
  
  // Debounce la recherche pour éviter trop de requêtes
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, error, refetch } = useIngredients({
    search: debouncedSearch,
    unit: selectedUnit,
    restaurantId: activeRestaurantId || undefined,
  })

  const ingredients = (data?.ingredients || []) as Ingredient[]
  const units = (data?.units || []) as string[]
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

  const handleExportCsv = () => {
    const csvData = ingredients.map((i) => ({
      nom: i.name,
      unite: i.unit,
      cout_unitaire: i.costPerUnit,
      taille_pack: i.packSize ?? '',
      fournisseur: i.supplierName ?? '',
    }))
    const filename = `ingredients_${new Date().toISOString().slice(0, 10)}.csv`
    exportToCsv(csvData, filename)
  }

  if (!isLoaded) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Liste des ingrédients en cours de chargement">
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Ingrédients' }]} className="mb-4" />
          <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-6 border-b border-border/60">
            <div>
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-5 w-72" />
            </div>
          </header>
          <IngredientListSkeleton />
        </div>
      </main>
    )
  }

  if (!organization?.id) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <header className="pb-6 border-b border-border/60">
            <h1 className="text-3xl font-bold tracking-tight">Ingrédients</h1>
            <p className="text-muted-foreground mt-1.5">
              Gérez vos ingrédients, leurs coûts et fournisseurs
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm bg-card/95">
            <CardContent className="py-16 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Beaker className="h-8 w-8 text-muted-foreground" />
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
            <h1 className="text-3xl font-bold tracking-tight">Ingrédients</h1>
            <p className="text-muted-foreground mt-1.5">
              Gérez vos ingrédients, leurs coûts et fournisseurs
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-red-800 dark:text-red-400">
                Une erreur s’est produite lors du chargement des ingrédients. Vérifiez votre connexion et réessayez.
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
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Liste des ingrédients">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Ingrédients' }]} className="mb-4" />
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-6 border-b border-border/60">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ingrédients</h1>
            <p className="text-muted-foreground mt-1.5">
              Gérez vos ingrédients, leurs coûts et fournisseurs
            </p>
            {data && data.ingredients.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {data.ingredients.length} ingrédient{data.ingredients.length > 1 ? 's' : ''}
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
                <DropdownMenuItem onClick={handleExportCsv} disabled={ingredients.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter CSV
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/ingredients/import">
                    <Upload className="mr-2 h-4 w-4" />
                    Importer CSV
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0">
              <Link href="/dashboard/ingredients/new">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un ingrédient
              </Link>
            </Button>
          </div>
        </header>

        <Card className="rounded-xl border shadow-sm bg-card">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4" role="search" aria-label="Filtres ingrédients">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden />
                  <Input
                    placeholder="Rechercher un ingrédient..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-muted/50 dark:bg-gray-800 border-border focus:bg-background dark:focus:bg-gray-900 transition-colors"
                    aria-label="Rechercher un ingrédient"
                  />
                </div>
              </div>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger className="w-full sm:w-[200px] bg-muted/50 dark:bg-gray-800 border-border" aria-label="Filtrer par unité">
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

        {isLoading ? (
          <IngredientListSkeleton />
        ) : ingredients.length === 0 ? (
          <Card className="rounded-xl border shadow-sm bg-card/95 backdrop-blur-sm">
            <CardContent className="py-16 px-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center mb-5">
                <Beaker className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {search || (selectedUnit && selectedUnit !== 'all')
                  ? 'Aucun ingrédient trouvé'
                  : 'Aucun ingrédient pour l’instant'}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-2">
                {search || (selectedUnit && selectedUnit !== 'all')
                  ? 'Aucun ingrédient ne correspond à vos critères. Modifiez la recherche ou les filtres.'
                  : 'Créez votre premier ingrédient pour gérer les coûts, les recettes et l’inventaire.'}
              </p>
              {!search && (!selectedUnit || selectedUnit === 'all') && (
                <>
                  <ul className="text-sm text-muted-foreground max-w-sm mx-auto mb-8 text-left list-disc list-inside space-y-1">
                    <li>Coût par unité et fournisseur</li>
                    <li>Utilisation dans les recettes produits</li>
                    <li>Suivi des stocks par restaurant</li>
                  </ul>
                  <Button asChild className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0">
                    <Link href="/dashboard/ingredients/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter un ingrédient
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Liste des ingrédients">
              {ingredients.map((ingredient) => (
                <Card
                  key={ingredient.id}
                  className="group rounded-xl border shadow-sm bg-card hover:shadow-lg hover:border-teal-200/80 dark:hover:border-teal-800/60 transition-all duration-200"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Beaker className="h-5 w-5 text-white" />
                          </div>
                          <CardTitle className="text-lg truncate">{ingredient.name}</CardTitle>
                        </div>
                        <CardDescription className="flex items-center gap-1.5 mt-1">
                          <span>{ingredient.unit}</span>
                          {ingredient.supplierName && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1 min-w-0">
                                <Building2 className="h-3 w-3 flex-shrink-0" aria-hidden />
                                <span className="truncate">{ingredient.supplierName}</span>
                              </div>
                            </>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild aria-label={`Modifier ${ingredient.name}`}>
                          <Link href={`/dashboard/ingredients/${ingredient.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(ingredient)}
                          aria-label={`Supprimer ${ingredient.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-teal-50/80 dark:bg-teal-900/20 border border-teal-100/80 dark:border-teal-900/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Coût par unité</span>
                          <span className="text-xl font-bold text-teal-700 dark:text-teal-400">
                            {formatCurrency(ingredient.costPerUnit)}
                          </span>
                        </div>
                      </div>
                      {ingredient.packSize && (
                        <div className="p-3.5 rounded-xl bg-muted/50 dark:bg-gray-800/50 border border-border/80">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Taille du pack</span>
                            <span className="text-sm font-semibold text-muted-foreground">
                              {ingredient.packSize} {ingredient.unit}
                            </span>
                          </div>
                        </div>
                      )}
                        <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-muted/50 dark:bg-gray-800/50 border border-border/80">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                            <span className="text-xs text-muted-foreground">Recettes</span>
                          </div>
                          <div className="text-lg font-bold text-teal-700 dark:text-teal-400">
                            {ingredient._count.productIngredients}
                          </div>
                        </div>
                        <div className="p-3.5 rounded-xl bg-muted/50 dark:bg-gray-800/50 border border-border/80">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                            <span className="text-xs text-muted-foreground">Stocks</span>
                          </div>
                          <div className="text-lg font-bold text-teal-700 dark:text-teal-400">
                            {ingredient._count.inventory}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full mt-3 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl"
                        asChild
                      >
                        <Link href={activeRestaurantId ? `/dashboard/ingredients/${ingredient.id}?restaurant=${activeRestaurantId}` : `/dashboard/ingredients/${ingredient.id}`}>
                          Voir détail
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>
          </>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cet ingrédient ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. L’ingrédient &quot;{ingredientToDelete?.name}&quot; sera définitivement supprimé.
                {ingredientToDelete && ingredientToDelete._count.productIngredients > 0 && (
                  <span className="block mt-2 text-destructive font-medium">
                    Cet ingrédient est utilisé dans {ingredientToDelete._count.productIngredients} recette(s). Vous devrez d’abord le retirer des recettes.
                  </span>
                )}
                {ingredientToDelete && ingredientToDelete._count.inventory > 0 && (
                  <span className="block mt-2 text-destructive font-medium">
                    Cet ingrédient a {ingredientToDelete._count.inventory} stock(s) associé(s). Vous devrez d’abord supprimer ces stocks.
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
    </main>
  )
}
