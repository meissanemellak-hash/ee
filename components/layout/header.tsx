'use client'

import { UserButton, OrganizationSwitcher } from '@clerk/nextjs'
import { MobileSidebar } from './mobile-sidebar'
import { HeaderActivationHandler } from './header-activation-handler'

export function Header() {

  return (
    <>
      <HeaderActivationHandler />
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-6">
        <MobileSidebar />
        <div className="flex flex-1 items-center gap-4">
          {/* Sélecteur d'organisation Clerk - Solution native et fiable */}
          <OrganizationSwitcher
            hidePersonal
            appearance={{
              elements: {
                organizationSwitcherTrigger: 'px-3 py-2 text-sm',
                organizationPreview: 'px-3 py-2',
              },
            }}
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications (à implémenter plus tard) */}
          <div className="flex items-center gap-2">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-9 w-9',
                },
              }}
            />
          </div>
        </div>
      </header>
    </>
  )
}
