'use client'

import { useOrganization } from '@clerk/nextjs'
import { useRestaurants } from '@/lib/react-query/hooks/use-restaurants'
import { useActiveRestaurant } from '@/hooks/use-active-restaurant'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Store } from 'lucide-react'

export function RestaurantSwitcher() {
  const { organization, isLoaded } = useOrganization()
  const { data } = useRestaurants(1, 100)
  const { activeRestaurantId, setActiveRestaurantId } = useActiveRestaurant()
  const restaurants = data?.restaurants ?? []

  if (!isLoaded || !organization?.id) return null

  const value = activeRestaurantId || 'all'

  return (
    <Select
      value={value}
      onValueChange={(v) => setActiveRestaurantId(v === 'all' ? null : v)}
    >
      <SelectTrigger
        className="w-full min-w-0 max-w-[200px] h-9 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg gap-2 shadow-none"
        aria-label="Restaurant actif"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center text-gray-600 dark:text-gray-400 [&>svg]:shrink-0 [&>svg]:block [&>svg]:translate-y-1">
          <Store className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
        <span className="flex-1 min-w-0 text-left truncate text-sm font-normal text-gray-600 dark:text-gray-400">
          <SelectValue placeholder="Restaurant actif" />
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tous les restaurants</SelectItem>
        {restaurants.map((r) => (
          <SelectItem key={r.id} value={r.id}>
            {r.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
