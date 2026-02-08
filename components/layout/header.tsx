'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton, OrganizationSwitcher } from '@clerk/nextjs'
import { MobileSidebar } from './mobile-sidebar'
import { HeaderActivationHandler } from './header-activation-handler'
import { RestaurantSwitcher } from './restaurant-switcher'
import { Search, X, Store } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function Header() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push(`/dashboard/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <>
      <HeaderActivationHandler />
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-white dark:bg-gray-900 px-6 shadow-sm backdrop-blur-sm bg-opacity-95">
        <MobileSidebar />
        <div className="flex flex-1 items-center gap-4">
          {/* Barre de recherche : bloc unique avec bouton teal */}
          <form onSubmit={handleSearch} className="flex flex-1 max-w-md h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500/50 transition-colors">
            <div className="relative flex-1 flex items-center min-w-0">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none shrink-0" aria-hidden />
              <Input
                type="search"
                placeholder="Produits, ingrédients…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="header-search-input h-full pl-9 pr-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none"
                aria-label="Rechercher dans l'application"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-muted-foreground"
                  aria-label="Effacer la recherche"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!query.trim()}
              className="h-full shrink-0 px-4 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 disabled:pointer-events-none transition-colors border-l border-teal-700/50 dark:border-teal-800"
              aria-label="Lancer la recherche"
            >
              Rechercher
            </button>
          </form>
          
          {/* Restaurant actif (filtre global) — rendu après montage pour éviter erreur d'hydratation (Select/Portal) */}
          <div className="min-w-0 max-w-[180px] sm:max-w-[220px]">
            {mounted ? (
              <RestaurantSwitcher />
            ) : (
              <div
                className="w-full min-w-0 max-w-[200px] h-9 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-2"
                aria-hidden
              >
                <Store className="h-4 w-4 shrink-0 text-gray-600 dark:text-gray-400" />
                <span className="flex-1 min-w-0 truncate text-sm text-gray-600 dark:text-gray-400">…</span>
              </div>
            )}
          </div>
          {/* Sélecteur d'organisation Clerk — rendu après montage pour éviter erreur d'hydratation (Portal) */}
          <div className="hidden sm:block min-w-0 max-w-[160px]">
            {mounted ? (
              <OrganizationSwitcher
                hidePersonal
                appearance={{
                  elements: {
                    organizationSwitcherTrigger: 'px-3 py-2 text-sm border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                    organizationPreview: 'px-3 py-2',
                  },
                }}
              />
            ) : (
              <div className="h-9 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 animate-pulse" aria-hidden />
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications (à implémenter plus tard) */}
          <div className="flex items-center gap-2">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-9 w-9 border-2 border-gray-200 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-400 transition-colors',
                },
              }}
            />
          </div>
        </div>
      </header>
    </>
  )
}
