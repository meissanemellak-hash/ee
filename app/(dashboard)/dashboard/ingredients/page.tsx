'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Search, Plus, Edit, Trash2, Beaker } from 'lucide-react'
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
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [units, setUnits] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUnit, setSelectedUnit] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ingredientToDelete, setIngredientToDelete] = useState<Ingredient | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Ne faire la requête que si l'organisation est chargée ET disponible
    if (isLoaded && organization?.id) {
      fetchIngredients()
    } else if (isLoaded && !organization?.id) {
      // Si Clerk est chargé mais pas d'organisation, arrêter le chargement
      setLoading(false)
      toast({
        title: 'Aucune organisation',
        description: 'Veuillez sélectionner une organisation pour voir vos ingrédients.',
        variant: 'destructive',
      })
    }
  }, [search, selectedUnit, isLoaded, organization?.id])

  const fetchIngredients = async () => {
    // Double vérification avant de faire la requête
    if (!isLoaded || !organization?.id) {
      console.log('[IngredientsPage] Organisation non disponible:', { isLoaded, orgId: organization?.id })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedUnit && selectedUnit !== 'all') params.append('unit', selectedUnit)
      // Passer clerkOrgId depuis le client - CRITIQUE pour que l'API fonctionne
      params.append('clerkOrgId', organization.id)
      
      console.log('[IngredientsPage] Fetching ingredients with clerkOrgId:', organization.id)

      const response = await fetch(`/api/ingredients?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des ingrédients')
      }

      const data = await response.json()
      setIngredients(data.ingredients)
      setUnits(data.units)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger les ingrédients',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!ingredientToDelete || !organization?.id) return

    try {
      setDeleting(true)
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/ingredients/${ingredientToDelete.id}?${queryParams.toString()}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Erreur lors de la suppression')
      }

      toast({
        title: 'Ingrédient supprimé',
        description: `${ingredientToDelete.name} a été supprimé avec succès.`,
      })

      setDeleteDialogOpen(false)
      setIngredientToDelete(null)
      fetchIngredients()
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

  const openDeleteDialog = (ingredient: Ingredient) => {
    setIngredientToDelete(ingredient)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ingrédients</h1>
          <p className="text-muted-foreground">
            Gérez vos ingrédients et leurs coûts
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/ingredients/new">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un ingrédient
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
                  placeholder="Rechercher un ingrédient..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="w-[200px]">
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

      {/* Liste des ingrédients */}
      {!isLoaded ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Chargement de votre organisation...</p>
          </CardContent>
        </Card>
      ) : !organization?.id ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Beaker className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Aucune organisation active. Veuillez sélectionner une organisation.
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Chargement des ingrédients...</p>
          </CardContent>
        </Card>
      ) : ingredients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Beaker className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {search || (selectedUnit && selectedUnit !== 'all')
                ? 'Aucun ingrédient ne correspond à vos critères.'
                : 'Aucun ingrédient pour le moment. Créez votre premier ingrédient pour commencer.'}
            </p>
            {!search && (!selectedUnit || selectedUnit === 'all') && (
              <Button asChild>
                <Link href="/dashboard/ingredients/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un ingrédient
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ingredients.map((ingredient) => (
            <Card key={ingredient.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle>{ingredient.name}</CardTitle>
                    <CardDescription>
                      {ingredient.unit}
                      {ingredient.supplierName && ` • ${ingredient.supplierName}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <Link href={`/dashboard/ingredients/${ingredient.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(ingredient)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Coût par unité:</span>
                    <span className="text-lg font-bold">{formatCurrency(ingredient.costPerUnit)}</span>
                  </div>
                  {ingredient.packSize && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taille du pack:</span>
                      <span className="font-medium">{ingredient.packSize} {ingredient.unit}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Recettes:</span>
                    <span className="font-medium">{ingredient._count.productIngredients}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stocks:</span>
                    <span className="font-medium">{ingredient._count.inventory}</span>
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
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || (ingredientToDelete?._count.productIngredients ?? 0) > 0 || (ingredientToDelete?._count.inventory ?? 0) > 0}
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
