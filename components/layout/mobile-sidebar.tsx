'use client'

import { useState } from 'react'
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
  Bell,
  Settings,
  FileText,
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

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeRestaurantId = searchParams.get('restaurant')
  const { data: role, isLoading: roleLoading } = useUserRole()
  const currentRole = role ?? 'staff'
  const visibleNav = roleLoading || role === undefined
    ? navigation
    : navigation.filter((item) => canView(item.permission, currentRole))

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r lg:hidden">
            <div className="flex h-16 items-center border-b px-6">
              <h2 className="text-xl font-bold text-primary">AI Operations</h2>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto"
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {visibleNav.map((item) => {
                // Dashboard: actif uniquement sur /dashboard exact
                const isActive = item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname?.startsWith(item.href + '/')
                const Icon = item.icon
                const href = activeRestaurantId ? `${item.href}${item.href.includes('?') ? '&' : '?'}restaurant=${activeRestaurantId}` : item.href
                return (
                  <Link
                    key={item.name}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
