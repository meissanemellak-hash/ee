'use client'

import { UserButton, useOrganization, useOrganizationList } from '@clerk/nextjs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { MobileSidebar } from './mobile-sidebar'

export function Header() {
  const { organization, isLoaded: orgLoaded } = useOrganization()
  const { setActive, userMemberships, isLoaded: orgListLoaded } = useOrganizationList()

  const organizationList = userMemberships?.data?.map((membership) => membership.organization) || []

  const handleOrganizationChange = (orgId: string) => {
    if (setActive) {
      setActive({ organization: orgId })
    }
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-6">
      <MobileSidebar />
      <div className="flex flex-1 items-center gap-4">
        {/* Sélecteur d'organisation */}
        <div className="flex items-center gap-2">
          {orgListLoaded && orgLoaded ? (
            <>
              {organizationList && organizationList.length > 1 ? (
                <Select
                  value={organization?.id || ''}
                  onValueChange={handleOrganizationChange}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sélectionner une organisation" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizationList.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="px-3 py-2 text-sm font-medium">
                  {organization?.name || 'Organisation'}
                </div>
              )}
            </>
          ) : (
            <Skeleton className="h-10 w-[200px]" />
          )}
        </div>
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
  )
}
