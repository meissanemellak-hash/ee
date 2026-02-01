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

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeRestaurantId = searchParams.get('restaurant')

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
              <h1 className="text-xl font-bold text-primary">AI Operations</h1>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto"
                onClick={() => setOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navigation.map((item) => {
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
