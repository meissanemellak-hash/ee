'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import {
  Search,
  Package,
  Beaker,
  Store,
  SearchX,
  HelpCircle,
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Lightbulb,
  Bell,
  FileText,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useProducts } from '@/lib/react-query/hooks/use-products'
import { useIngredients } from '@/lib/react-query/hooks/use-ingredients'

function isProduitsQuery(q: string) {
  return /^produits?$/i.test(q)
}
function isIngredientsQuery(q: string) {
  return /^ingr[eé]dients?$/i.test(q)
}
function isRestaurantsQuery(q: string) {
  return /^restaurants?$/i.test(q)
}
function isHelpQuery(q: string) {
  return /^(aide|help|documentation|doc|docs)$/i.test(q.trim())
}
function isGenericQuery(q: string) {
  return !!q && !isProduitsQuery(q) && !isIngredientsQuery(q) && !isRestaurantsQuery(q)
}

/** Sections du dashboard recherchables par nom */
const SEARCHABLE_SECTIONS: { test: (q: string) => boolean; label: string; description: string; href: string; icon: LucideIcon }[] = [
  { test: (q) => /^dashboard$/i.test(q.trim()), label: 'Dashboard', description: 'Vue d\'ensemble et indicateurs', href: '/dashboard', icon: LayoutDashboard },
  { test: (q) => /^ventes?$/i.test(q.trim()), label: 'Ventes & Analyse', description: 'Voir les ventes et l\'analyse', href: '/dashboard/sales', icon: BarChart3 },
  { test: (q) => /^pr[eé]visions?$/i.test(q.trim()), label: 'Prévisions', description: 'Prévisions de demande et commandes', href: '/dashboard/forecasts', icon: TrendingUp },
  { test: (q) => /^recommandations?$/i.test(q.trim()), label: 'Recommandations', description: 'Recommandations d\'achat et d\'effectifs', href: '/dashboard/recommendations', icon: Lightbulb },
  { test: (q) => /^alertes?$/i.test(q.trim()), label: 'Alertes', description: 'Alertes rupture et seuils', href: '/dashboard/alerts', icon: Bell },
  { test: (q) => /^rapports?$/i.test(q.trim()), label: 'Rapports', description: 'Générer et exporter des rapports', href: '/dashboard/reports', icon: FileText },
  { test: (q) => /^param[eè]tres?$/i.test(q.trim()), label: 'Paramètres', description: 'Organisation, facturation, préférences', href: '/dashboard/settings', icon: Settings },
]

function hasAnySectionMatch(q: string) {
  return (
    isHelpQuery(q) ||
    isProduitsQuery(q) ||
    isIngredientsQuery(q) ||
    isRestaurantsQuery(q) ||
    SEARCHABLE_SECTIONS.some((s) => s.test(q))
  )
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q')?.trim() ?? ''

  const isGeneric = isGenericQuery(q)
  const productsQuery = useProducts(1, 10, { search: q })
  const ingredientsQuery = useIngredients({ search: q })

  const totalProducts = productsQuery.data?.total ?? productsQuery.data?.products?.length ?? 0
  const totalIngredients = ingredientsQuery.data?.total ?? ingredientsQuery.data?.ingredients?.length ?? 0
  const hasResults = totalProducts > 0 || totalIngredients > 0
  const hasHelpMatch = isHelpQuery(q)
  const hasSectionMatch = hasAnySectionMatch(q)
  const isLoading = isGeneric && (productsQuery.isLoading || ingredientsQuery.isLoading)
  const noResults = isGeneric && !isLoading && !hasResults && !hasSectionMatch

  const matchesNavSection = SEARCHABLE_SECTIONS.some((s) => s.test(q))
  const showProduits = !q || isProduitsQuery(q) || (!isIngredientsQuery(q) && !isRestaurantsQuery(q) && !matchesNavSection)
  const showIngredients = !q || isIngredientsQuery(q) || (!isProduitsQuery(q) && !isRestaurantsQuery(q) && !matchesNavSection)
  const showRestaurants = !q || isRestaurantsQuery(q) || !matchesNavSection

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Recherche', href: '/dashboard/search' },
        ]}
      />
      <div className="mt-6">
        <h1 className="text-2xl font-bold text-foreground">Recherche</h1>
        <p className="text-muted-foreground mt-1">
          {q ? (
            <>Résultats pour « <strong className="text-foreground">{q}</strong> »</>
          ) : (
            'Saisissez un terme dans la barre de recherche puis validez avec Entrée.'
          )}
        </p>
      </div>

      {q && noResults && (
        <Card className="mt-6 rounded-xl border shadow-sm bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
              <SearchX className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Aucun résultat pour « {q} »</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Aucun produit ni ingrédient ne correspond à votre recherche. Essayez un autre terme ou parcourez les listes.
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              <Link
                href="/dashboard/products"
                className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
              >
                Voir les produits
              </Link>
              <span className="text-muted-foreground">·</span>
              <Link
                href="/dashboard/ingredients"
                className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
              >
                Voir les ingrédients
              </Link>
              <span className="text-muted-foreground">·</span>
              <Link
                href="/dashboard/aide"
                className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
              >
                Centre d&apos;aide
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {q && hasHelpMatch && (noResults || !hasResults) && (
        <Card className="mt-6 rounded-xl border shadow-sm bg-card">
          <CardContent className="pt-6">
            <Link
              href="/dashboard/aide"
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 hover:border-teal-300 dark:hover:border-teal-700"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
                <HelpCircle className="h-5 w-5 text-teal-600 dark:text-teal-400" aria-hidden />
              </div>
              <div>
                <span className="font-medium text-foreground">Centre d&apos;aide</span>
                <p className="text-sm text-muted-foreground">Consultez notre documentation et les guides d&apos;utilisation.</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      )}

      {q && (isLoading || hasResults || !hasHelpMatch || SEARCHABLE_SECTIONS.some((s) => s.test(q))) && (isLoading ? (
        <Card className="mt-6 rounded-xl border shadow-sm bg-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            Recherche en cours…
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6 rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5 text-teal-600 dark:text-teal-400" aria-hidden />
              Où rechercher ?
            </CardTitle>
            <CardDescription>
              {isGeneric && hasResults ? (
                <>
                  {totalProducts > 0 && totalIngredients > 0 && (
                    <strong className="text-foreground">{totalProducts} produit(s) et {totalIngredients} ingrédient(s)</strong>
                  )}
                  {totalProducts > 0 && totalIngredients === 0 && (
                    <strong className="text-foreground">{totalProducts} produit(s)</strong>
                  )}
                  {totalProducts === 0 && totalIngredients > 0 && (
                    <strong className="text-foreground">{totalIngredients} ingrédient(s)</strong>
                  )}
                  {' correspondent à « '}{q}{' ». '}
                  Cliquez sur une section pour afficher les résultats.
                </>
              ) : (
                <>Cliquez sur une section pour afficher les résultats filtrés par « {q} ».</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {showProduits && (
              <Link
                href={`/dashboard/products?search=${encodeURIComponent(q)}`}
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 hover:border-teal-300 dark:hover:border-teal-700"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
                  <Package className="h-5 w-5 text-teal-600 dark:text-teal-400" aria-hidden />
                </div>
                <div>
                  <span className="font-medium text-foreground">Produits</span>
                  <p className="text-sm text-muted-foreground">Rechercher dans le catalogue produits</p>
                </div>
              </Link>
            )}
            {showIngredients && (
              <Link
                href={`/dashboard/ingredients?search=${encodeURIComponent(q)}`}
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 hover:border-teal-300 dark:hover:border-teal-700"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
                  <Beaker className="h-5 w-5 text-teal-600 dark:text-teal-400" aria-hidden />
                </div>
                <div>
                  <span className="font-medium text-foreground">Ingrédients</span>
                  <p className="text-sm text-muted-foreground">Rechercher dans les ingrédients</p>
                </div>
              </Link>
            )}
            {showRestaurants && (
              <Link
                href="/dashboard/restaurants"
                className={`flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 hover:border-teal-300 dark:hover:border-teal-700 ${showProduits && showIngredients ? 'sm:col-span-2' : ''}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
                  <Store className="h-5 w-5 text-teal-600 dark:text-teal-400" aria-hidden />
                </div>
                <div>
                  <span className="font-medium text-foreground">Restaurants</span>
                  <p className="text-sm text-muted-foreground">Voir la liste des restaurants</p>
                </div>
              </Link>
            )}
            {hasHelpMatch && (
              <Link
                href="/dashboard/aide"
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 hover:border-teal-300 dark:hover:border-teal-700 sm:col-span-2"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
                  <HelpCircle className="h-5 w-5 text-teal-600 dark:text-teal-400" aria-hidden />
                </div>
                <div>
                  <span className="font-medium text-foreground">Centre d&apos;aide</span>
                  <p className="text-sm text-muted-foreground">Consultez notre documentation et les guides d&apos;utilisation.</p>
                </div>
              </Link>
            )}
            {SEARCHABLE_SECTIONS.map(
              (section) =>
                section.test(q) && (
                  <Link
                    key={section.href}
                    href={section.href}
                    className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 hover:border-teal-300 dark:hover:border-teal-700"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
                      <section.icon className="h-5 w-5 text-teal-600 dark:text-teal-400" aria-hidden />
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{section.label}</span>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                  </Link>
                )
            )}
          </CardContent>
        </Card>
      ) )}
    </div>
  )
}
