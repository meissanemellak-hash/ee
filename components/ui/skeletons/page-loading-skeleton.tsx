import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton minimal pour les transitions de route : léger et rapide à afficher.
 * Utilisé par loading.tsx pour donner un retour visuel immédiat au clic.
 */
export function PageLoadingSkeleton() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25 p-6 lg:p-8" role="main" aria-busy="true" aria-label="Chargement">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="pb-4 border-b border-border/60">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </header>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </main>
  )
}
