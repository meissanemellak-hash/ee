import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" role="main" aria-label="Dashboard en cours de chargement">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
        <header className="pb-6 border-b border-border/60">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </header>

        {/* Hero card */}
        <Card className="rounded-xl border-0 shadow-lg overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Skeleton className="h-4 w-56 mb-3" />
                <Skeleton className="h-14 w-40 mb-3" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </CardContent>
        </Card>

        {/* 3 KPI cards */}
        <section className="grid gap-4 md:grid-cols-3" aria-hidden>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-xl border shadow-sm bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-24 mb-2" />
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Chart section */}
        <section aria-hidden>
          <div className="flex items-center justify-between mb-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-9 w-20 rounded-md" />
              ))}
            </div>
          </div>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="p-6 pt-6">
              <Skeleton className="h-[280px] w-full rounded-lg" />
            </CardContent>
          </Card>
        </section>

        {/* Recommendations section */}
        <section aria-hidden>
          <div className="flex items-center justify-between mb-4">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-12">
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Recent activity / Table */}
        <section aria-hidden>
          <div className="mb-4">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg mb-3 last:mb-0" />
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
