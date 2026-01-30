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
    <div className="flex items-center gap-2">
      <Store className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
      <Select
        value={value}
        onValueChange={(v) => setActiveRestaurantId(v === 'all' ? null : v)}
      >
        <SelectTrigger
          className="w-full min-w-0 max-w-full border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
          aria-label="Restaurant actif"
        >
          <SelectValue placeholder="Restaurant actif" />
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
    </div>
  )
}
