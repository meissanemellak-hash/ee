'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

// Import conditionnel des devtools (optionnel)
let ReactQueryDevtools: any = null
if (process.env.NODE_ENV === 'development') {
  try {
    ReactQueryDevtools = require('@tanstack/react-query-devtools').ReactQueryDevtools
  } catch {
    // Devtools non installé, ce n'est pas grave
  }
}

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Temps de cache par défaut : 5 minutes
            staleTime: 5 * 60 * 1000,
            // Garder les données en cache même si non utilisées : 10 minutes
            gcTime: 10 * 60 * 1000,
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

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && ReactQueryDevtools && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
