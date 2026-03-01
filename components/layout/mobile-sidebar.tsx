'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Store,
  Package,
  Beaker,
  TrendingUp,
  BarChart3,
  Lightbulb,
  AlertTriangle,
  Settings,
  FileText,
  Users,
} from 'lucide-react'
import { useUserRole } from '@/lib/react-query/hooks/use-user-role'
import { permissions } from '@/lib/roles'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard:view' as const },
  { name: 'Restaurants', href: '/dashboard/restaurants', icon: Store, permission: 'restaurants:view' as const },
  { name: 'Produits', href: '/dashboard/products', icon: Package, permission: 'products:view' as const },
  { name: 'Ingrédients', href: '/dashboard/ingredients', icon: Beaker, permission: 'ingredients:view' as const },
  { name: 'Ventes & Analyse', href: '/dashboard/sales', icon: BarChart3, permission: 'sales:view' as const },
  { name: 'Prévisions', href: '/dashboard/forecasts', icon: TrendingUp, permission: 'forecasts:view' as const },
  { name: 'Recommandations', href: '/dashboard/recommendations', icon: Lightbulb, permission: 'recommendations:view' as const },
  { name: 'Effectifs', href: '/dashboard/effectifs', icon: Users, permission: 'alerts:view' as const },
  { name: 'Alertes', href: '/dashboard/alerts', icon: AlertTriangle, permission: 'alerts:view' as const },
  { name: 'Rapports', href: '/dashboard/reports', icon: FileText, permission: 'reports:view' as const },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings, permission: 'settings:view' as const },
]

function canView(permission: typeof navigation[0]['permission'], role: 'admin' | 'manager' | 'staff' | undefined): boolean {
  if (!role) return false
  switch (permission) {
    case 'dashboard:view': return permissions.canViewDashboard(role)
    case 'restaurants:view': return permissions.canViewRestaurants(role)
    case 'products:view': return permissions.canViewProducts(role)
    case 'ingredients:view': return permissions.canViewIngredients(role)
    case 'sales:view': return permissions.canViewSales(role)
    case 'forecasts:view': return permissions.canViewForecasts(role)
    case 'recommendations:view': return permissions.canViewRecommendations(role)
    case 'alerts:view': return permissions.canViewAlerts(role)
    case 'reports:view': return permissions.canViewReports(role)
    case 'settings:view': return permissions.canViewSettings(role)
    default: return false
  }
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeRestaurantId = searchParams.get('restaurant')
  const { data: role, isLoading: roleLoading } = useUserRole()
  const currentRole = role ?? 'staff'
  const visibleNav = roleLoading || role === undefined
    ? navigation
    : navigation.filter((item) => canView(item.permission, currentRole))

  // S’assurer que le menu est fermé au chargement
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
  }

  return (
    <>
      {/* Bouton hamburger rendu dans document.body pour être toujours au premier plan */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          className="lg:hidden fixed top-3 left-3 z-[9999] h-10 w-10 flex items-center justify-center rounded-lg border border-teal-500 bg-teal-500 text-white shadow-md hover:bg-teal-600 active:scale-95 transition-transform"
        >
          {open ? <X className="h-5 w-5 shrink-0" /> : <Menu className="h-5 w-5 shrink-0" />}
        </button>,
        document.body
      )}
      {/* Espace réservé dans le header pour l’alignement */}
      <div className="lg:hidden w-10 h-10 shrink-0" aria-hidden />

      {open && mounted && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/50 lg:hidden"
            onClick={() => handleOpenChange(false)}
            aria-hidden
          />
          {/* Panneau : hauteur dynamique mobile, marge safe en haut, contenu scrollable */}
          <div
            className="fixed left-0 top-0 bottom-0 z-[110] w-64 max-w-[85vw] flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl lg:hidden min-h-[100dvh] pt-[env(safe-area-inset-top,0px)]"
          >
            {/* En-tête — toujours visible en haut */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">IA</span>
                </div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-tight truncate">IA Restaurant Manager</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleOpenChange(false)}
                aria-label="Fermer le menu"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            {/* Zone scrollable : nav + aide */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-4 space-y-1">
                {visibleNav.map((item) => {
                  const isActive = item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname === item.href || pathname?.startsWith(item.href + '/')
                  const Icon = item.icon
                  const href = activeRestaurantId ? `${item.href}${item.href.includes('?') ? '&' : '?'}restaurant=${activeRestaurantId}` : item.href
                  return (
                    <Link
                      key={item.name}
                      href={href}
                      prefetch={true}
                      onClick={() => handleOpenChange(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                      )}
                    >
                      <Icon className={cn(
                        'h-5 w-5 flex-shrink-0',
                        isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'
                      )} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
              {/* Bloc Aide — en bas du panneau, toujours visible après scroll */}
              <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 p-4">
                <Link
                  href="/dashboard/aide"
                  prefetch={true}
                  onClick={() => handleOpenChange(false)}
                  className={cn(
                    'block rounded-lg p-3 transition-all duration-200 focus:outline-none',
                    pathname === '/dashboard/aide' || pathname?.startsWith('/dashboard/aide/')
                      ? 'bg-teal-50 dark:bg-teal-900/20 shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                  aria-label="Accéder au centre d'aide"
                >
                  <p className={cn(
                    'text-xs font-medium',
                    pathname === '/dashboard/aide' || pathname?.startsWith('/dashboard/aide/')
                      ? 'text-teal-700 dark:text-teal-400'
                      : 'text-gray-700 dark:text-gray-300'
                  )}>
                    Besoin d&apos;aide ?
                  </p>
                  <p className={cn(
                    'text-xs mt-1',
                    pathname === '/dashboard/aide' || pathname?.startsWith('/dashboard/aide/')
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-gray-600 dark:text-gray-400'
                  )}>
                    Consultez notre documentation
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
