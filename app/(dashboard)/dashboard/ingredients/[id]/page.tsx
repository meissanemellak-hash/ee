'use client'

import { useEffect, useRef, useMemo } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Beaker, ArrowLeft, Edit, Warehouse, Store, Package } from 'lucide-react'
import { useIngredientWithStock } from '@/lib/react-query/hooks/use-ingredients'
import { useRestaurants } from '@/lib/react-query/hooks/use-restaurants'
import { useUserRole } from '@/lib/react-query/hooks/use-user-role'
import { permissions } from '@/lib/roles'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export default function IngredientDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const id = params?.id as string | undefined
  const activeRestaurantId = searchParams.get('restaurant')
  const { data: roleData } = useUserRole()
  const currentRole = roleData ?? 'staff'
  const canEdit = permissions.canEditIngredient(currentRole)
  const { data: ingredient, isLoading, isError, error } = useIngredientWithStock(id)
  const { data: restaurantsData } = useRestaurants(1, 100)
  const restaurants = restaurantsData?.restaurants ?? []
  const activeRestaurant = useMemo(
    () => restaurants.find((r) => r.id === activeRestaurantId),
    [restaurants, activeRestaurantId]
  )
  const hasToastedError = useRef(false)

  useEffect(() => {
    if (isError && error && !hasToastedError.current) {
      hasToastedError.current = true
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger l\'ingrédient',
        variant: 'destructive',
      })
    }
    if (!isError) hasToastedError.current = false
  }, [isError, error, toast])

  if (!isLoaded) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Chargement de votre organisation...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isLoaded && !organization?.id) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-16 text-center space-y-4">
              <p className="text-muted-foreground">Aucune organisation active. Veuillez sélectionner une organisation.</p>
              <Button asChild variant="outline">
                <Link href="/dashboard/ingredients">Retour aux ingrédients</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isLoading && !ingredient) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Breadcrumbs items={[{ label: 'Ingrédients', href: '/dashboard/ingredients' }, { label: 'Introuvable' }]} />
          <Card className="rounded-xl border shadow-sm border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10">
            <CardContent className="py-12 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Beaker className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold">Ingrédient introuvable</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Cet ingrédient n’existe pas, a été supprimé ou vous n’y avez pas accès.
              </p>
              <Button asChild variant="outline" className="border-amber-300 dark:border-amber-800">
                <Link href="/dashboard/ingredients">Retour aux ingrédients</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </main>
    )
  }

  const allInventory = ingredient.inventory ?? []
  const inventoryList = activeRestaurantId
    ? allInventory.filter((inv) => inv.restaurant.id === activeRestaurantId)
    : allInventory

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label={`Détail de l'ingrédient ${ingredient.name}`}>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Ingrédients', href: '/dashboard/ingredients' },
            { label: ingredient.name },
          ]}
        />
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-6 border-b border-border/60">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild aria-label="Retour à la liste des ingrédients">
              <Link href="/dashboard/ingredients">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0">
                <Beaker className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight truncate">{ingredient.name}</h1>
                <p className="text-muted-foreground text-sm mt-0.5">{ingredient.unit}</p>
              </div>
            </div>
          </div>
          {canEdit && (
            <Button variant="outline" size="sm" className="shrink-0 rounded-xl border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300" asChild>
              <Link href={`/dashboard/ingredients/${ingredient.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Link>
            </Button>
          )}
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Informations</CardTitle>
              <CardDescription>Coût, pack et fournisseur</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-teal-50/80 dark:bg-teal-900/20 border border-teal-100/80 dark:border-teal-900/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Coût par unité</span>
                  <span className="text-xl font-bold text-teal-700 dark:text-teal-400">
                    {formatCurrency(ingredient.costPerUnit)}
                  </span>
                </div>
              </div>
              {ingredient.packSize != null && (
                <div className="flex justify-between items-center py-2 border-b border-border/80">
                  <span className="text-sm text-muted-foreground">Taille du pack</span>
                  <span className="text-sm font-medium">{ingredient.packSize} {ingredient.unit}</span>
                </div>
              )}
              {ingredient.supplierName && (
                <div className="flex justify-between items-center py-2 border-b border-border/80">
                  <span className="text-sm text-muted-foreground">Fournisseur</span>
                  <span className="text-sm font-medium truncate max-w-[200px]" title={ingredient.supplierName}>{ingredient.supplierName}</span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-2">
                <Package className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span className="text-sm text-muted-foreground">
                  Utilisé dans {ingredient._count?.productIngredients ?? 0} recette(s)
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                Stock par restaurant
              </CardTitle>
              <CardDescription>
                Quantités et seuils configurés pour cet ingrédient. La gestion complète de l&apos;inventaire se fait sur la page de chaque restaurant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryList.length === 0 ? (
                <div className="py-8 text-center space-y-4">
                  {activeRestaurantId ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Aucun stock pour <strong>{activeRestaurant?.name ?? 'ce restaurant'}</strong>.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ajoutez cet ingrédient à l&apos;inventaire de ce restaurant.
                      </p>
                      <Button variant="outline" size="sm" asChild className="rounded-xl border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20">
                        <Link href={`/dashboard/restaurants/${activeRestaurantId}/inventory?restaurant=${activeRestaurantId}`}>
                          <Warehouse className="h-4 w-4 mr-2" />
                          Ajouter à l&apos;inventaire
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Aucun stock configuré pour cet ingrédient.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        La gestion de l&apos;inventaire se fait par restaurant : ajoutez cet ingrédient à l&apos;inventaire depuis la page de chaque établissement.
                      </p>
                      <Button variant="outline" size="sm" asChild className="rounded-xl">
                        <Link href="/dashboard/restaurants">
                          <Store className="h-4 w-4 mr-2" />
                          Voir les restaurants
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm" role="table" aria-label="Stock de l'ingrédient par restaurant">
                      <thead className="bg-muted/50 dark:bg-gray-800/50 border-b border-border">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Restaurant</th>
                          <th className="px-3 py-2 text-right font-semibold">Stock actuel</th>
                          <th className="px-3 py-2 text-right font-semibold">Seuil min</th>
                          <th className="px-3 py-2 text-right font-semibold">Seuil max</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryList.map((inv) => (
                          <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 dark:hover:bg-gray-800/30 transition-colors">
                            <td className="px-3 py-2 font-medium">{inv.restaurant.name}</td>
                            <td className="px-3 py-2 text-right">{inv.currentStock} {ingredient.unit}</td>
                            <td className="px-3 py-2 text-right">{inv.minThreshold} {ingredient.unit}</td>
                            <td className="px-3 py-2 text-right">{inv.maxThreshold != null ? `${inv.maxThreshold} ${ingredient.unit}` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Gérer l&apos;inventaire :</span>
                    {inventoryList.map((inv) => (
                      <Button key={inv.id} variant="outline" size="sm" className="rounded-xl border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20" asChild>
                        <Link href={`/dashboard/restaurants/${inv.restaurant.id}/inventory?restaurant=${inv.restaurant.id}`}>
                          {inv.restaurant.name}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
