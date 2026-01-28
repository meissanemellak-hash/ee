import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function RecommendationListSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="rounded-xl border shadow-sm bg-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-xl" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
