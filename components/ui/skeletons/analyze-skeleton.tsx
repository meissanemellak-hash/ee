import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function AnalyzeSkeleton() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-hidden>
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <header className="pb-6 border-b border-border/60">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </header>

        <Card className="rounded-xl border shadow-sm bg-card p-6">
          <Skeleton className="h-6 w-24 mb-2" />
          <Skeleton className="h-4 w-56 mb-4" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-xl border shadow-sm bg-card p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-xl border shadow-sm bg-card p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2 p-3 rounded-xl border border-border">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </Card>
          <Card className="rounded-xl border shadow-sm bg-card p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2 p-3 rounded-xl border border-border">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="rounded-xl border shadow-sm bg-card p-6">
          <Skeleton className="h-6 w-36 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2 p-3 rounded-xl border border-border">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  )
}
