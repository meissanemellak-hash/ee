'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Restaurants',
    href: '/dashboard/restaurants',
    icon: Store,
  },
  {
    name: 'Produits',
    href: '/dashboard/products',
    icon: Package,
  },
  {
    name: 'Ingrédients',
    href: '/dashboard/ingredients',
    icon: Beaker,
  },
  {
    name: 'Ventes & Analyse',
    href: '/dashboard/sales',
    icon: BarChart3,
  },
  {
    name: 'Prévisions',
    href: '/dashboard/forecasts',
    icon: TrendingUp,
  },
  {
    name: 'Recommandations',
    href: '/dashboard/recommendations',
    icon: Lightbulb,
  },
  {
    name: 'Alertes',
    href: '/dashboard/alerts',
    icon: Bell,
  },
  {
    name: 'Rapports',
    href: '/dashboard/reports',
    icon: FileText,
  },
  {
    name: 'Paramètres',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">AI Operations</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
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
      <div className="border-t p-4">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Besoin d&apos;aide ?
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Consultez notre documentation
          </p>
        </div>
      </div>
    </div>
  )
}
