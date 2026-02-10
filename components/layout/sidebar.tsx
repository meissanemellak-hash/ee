'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useOrganization } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Store,
  Package,
  Beaker,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Bell,
  Settings,
  FileText,
} from 'lucide-react'
import { useUserRole } from '@/lib/react-query/hooks/use-user-role'
import { permissions } from '@/lib/roles'
import { alertsQueryOptions, alertsCurrentStateQueryOptions } from '@/lib/react-query/hooks/use-alerts'
import { forecastsQueryOptions } from '@/lib/react-query/hooks/use-forecasts'
import { recommendationsQueryOptions } from '@/lib/react-query/hooks/use-recommendations'
import { getSalesListQueryOptions } from '@/lib/react-query/hooks/use-sales'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard:view' as const },
  { name: 'Restaurants', href: '/dashboard/restaurants', icon: Store, permission: 'restaurants:view' as const },
  { name: 'Produits', href: '/dashboard/products', icon: Package, permission: 'products:view' as const },
  { name: 'Ingrédients', href: '/dashboard/ingredients', icon: Beaker, permission: 'ingredients:view' as const },
  { name: 'Ventes & Analyse', href: '/dashboard/sales', icon: BarChart3, permission: 'sales:view' as const },
  { name: 'Prévisions', href: '/dashboard/forecasts', icon: TrendingUp, permission: 'forecasts:view' as const },
  { name: 'Recommandations', href: '/dashboard/recommendations', icon: Lightbulb, permission: 'recommendations:view' as const },
  { name: 'Alertes', href: '/dashboard/alerts', icon: Bell, permission: 'alerts:view' as const },
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

export function Sidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeRestaurantId = searchParams.get('restaurant')
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  const orgId = organization?.id
  const { data: role, isLoading: roleLoading } = useUserRole()
  const currentRole = role ?? 'staff'
  // Afficher tous les liens (dont Paramètres) pendant le chargement du rôle pour éviter le délai visuel
  const visibleNav = roleLoading || role === undefined
    ? navigation
    : navigation.filter((item) => canView(item.permission, currentRole))

  const handleLinkMouseEnter = (item: (typeof navigation)[0]) => {
    if (!orgId) return
    const restaurantId = activeRestaurantId || 'all'
    if (item.href === '/dashboard/sales') {
      void queryClient.prefetchQuery(getSalesListQueryOptions(orgId, 1, 50, { restaurantId }))
    } else if (item.href === '/dashboard/alerts') {
      void queryClient.prefetchQuery(alertsQueryOptions(orgId, { restaurantId }))
      void queryClient.prefetchQuery(alertsCurrentStateQueryOptions(orgId, activeRestaurantId || null))
    } else if (item.href === '/dashboard/forecasts') {
      void queryClient.prefetchQuery(forecastsQueryOptions(orgId, { restaurantId }))
    } else if (item.href === '/dashboard/recommendations') {
      void queryClient.prefetchQuery(recommendationsQueryOptions(orgId, { restaurantId, status: 'pending' }))
    }
  }

  return (
    <div className="flex h-full w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm">
      {/* Logo/Brand (Style Sequence Premium) */}
      <div className="flex h-16 items-center border-b border-gray-200 dark:border-gray-800 px-6 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">IA</span>
          </div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white tracking-tight whitespace-nowrap">IA Restaurant Manager</h1>
        </div>
      </div>
      
      {/* Navigation (Style Sequence Premium) */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {visibleNav.map((item) => {
          // Dashboard: actif uniquement sur /dashboard exact (pas sur /dashboard/products, etc.)
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
              onMouseEnter={() => handleLinkMouseEnter(item)}
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
      
      {/* Help Section (Style Sequence) */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <Link
          href="/dashboard/aide"
          prefetch={true}
          className="block rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          aria-label="Accéder au centre d'aide"
        >
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Besoin d&apos;aide ?
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Consultez notre documentation
          </p>
        </Link>
      </div>
    </div>
  )
}
