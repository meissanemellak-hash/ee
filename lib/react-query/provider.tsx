'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Temps pendant lequel les données sont considérées fraîches (pas de refetch au remount)
            staleTime: 10 * 60 * 1000, // 10 min : navigation plus fluide, moins de requêtes
            // Garder les données en cache même si non utilisées
            gcTime: 15 * 60 * 1000, // 15 min
            // Retry automatique en cas d'erreur réseau
            retry: 1,
            // Refetch quand la fenêtre reprend le focus
            refetchOnWindowFocus: false,
            // Refetch quand reconnecté au réseau
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry automatique pour les mutations
            retry: 1,
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
