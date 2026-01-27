'use client'

import { UserButton, OrganizationSwitcher } from '@clerk/nextjs'
import { MobileSidebar } from './mobile-sidebar'
import { HeaderActivationHandler } from './header-activation-handler'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function Header() {

  return (
    <>
      <HeaderActivationHandler />
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-white dark:bg-gray-900 px-6 shadow-sm backdrop-blur-sm bg-opacity-95">
        <MobileSidebar />
        <div className="flex flex-1 items-center gap-4">
          {/* Barre de recherche (Style Sequence Premium) */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="pl-9 w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
            />
          </div>
          
          {/* Sélecteur d'organisation Clerk - Solution native et fiable */}
          <div className="hidden sm:block">
            <OrganizationSwitcher
              hidePersonal
              appearance={{
                elements: {
                  organizationSwitcherTrigger: 'px-3 py-2 text-sm border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                  organizationPreview: 'px-3 py-2',
                },
              }}
            />
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
