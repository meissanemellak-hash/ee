import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ForecastListSkeleton() {
  return (
    <div className="space-y-3 list-none p-0 m-0" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="rounded-xl border shadow-sm bg-card p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
