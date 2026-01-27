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
    <div className="flex h-full w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm">
      {/* Logo/Brand (Style Sequence Premium) */}
      <div className="flex h-16 items-center border-b border-gray-200 dark:border-gray-800 px-6 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">AI Operations</h1>
        </div>
      </div>
      
      {/* Navigation (Style Sequence Premium) */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
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
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Besoin d&apos;aide ?
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Consultez notre documentation
          </p>
        </div>
      </div>
    </div>
  )
}
