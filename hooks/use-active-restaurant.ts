'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const RESTAURANT_PARAM = 'restaurant'

/**
 * Hook pour lire et mettre à jour le restaurant actif via l'URL (?restaurant=xxx).
 * Utilisé par le sélecteur dans le header et par les pages pour filtrer les données.
 */
export function useActiveRestaurant() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeRestaurantId = searchParams.get(RESTAURANT_PARAM) || null

  const setActiveRestaurantId = useCallback(
    (restaurantId: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (restaurantId) {
        params.set(RESTAURANT_PARAM, restaurantId)
      } else {
        params.delete(RESTAURANT_PARAM)
      }
      const query = params.toString()
      const url = query ? `${pathname || ''}?${query}` : pathname || '/dashboard'
      router.push(url, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  return { activeRestaurantId, setActiveRestaurantId }
}
