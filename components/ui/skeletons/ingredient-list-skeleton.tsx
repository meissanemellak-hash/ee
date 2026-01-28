import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function IngredientListSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="rounded-xl border shadow-sm bg-card">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
                  <Skeleton className="h-5 w-28" />
                </div>
                <Skeleton className="h-4 w-40 mt-2" />
              </div>
              <div className="flex gap-1 ml-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-[3.5rem] rounded-xl w-full" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-[3.5rem] rounded-xl" />
                <Skeleton className="h-[3.5rem] rounded-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
