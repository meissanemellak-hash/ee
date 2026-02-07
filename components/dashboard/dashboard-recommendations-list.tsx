'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ApplyRecommendationButton } from './apply-recommendation-button'
import { formatCurrency } from '@/lib/utils'

export interface DashboardRecommendationItem {
  id: string
  type: string
  restaurantName: string
  message: string
  estimatedSavings: number
  priority: string
}

interface DashboardRecommendationsListProps {
  recommendations: DashboardRecommendationItem[]
}

export function DashboardRecommendationsList({
  recommendations,
}: DashboardRecommendationsListProps) {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())

  const handleApplied = useCallback((id: string) => {
    setHiddenIds((prev) => new Set(prev).add(id))
  }, [])

  const visible = recommendations.filter((rec) => !hiddenIds.has(rec.id))

  if (visible.length === 0) {
    return (
      <Card className="rounded-xl border shadow-sm bg-card">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Aucune recommandation en attente. Tout est optimisé !
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {visible.map((rec) => (
        <Card key={rec.id} className="relative rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{rec.restaurantName}</CardTitle>
                <CardDescription className="mt-2">{rec.message}</CardDescription>
              </div>
              {rec.priority === 'high' && (
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                  Priorité
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                {rec.type === 'ORDER' && (
                  <>
                    <p className="text-sm font-medium text-teal-600">
                      ROI estimé : x{Math.round(rec.estimatedSavings / 500)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Économie : {formatCurrency(rec.estimatedSavings)}
                    </p>
                  </>
                )}
                {rec.type === 'STAFFING' && null}
              </div>
              <ApplyRecommendationButton
                recommendationId={rec.id}
                recommendationType={rec.type as 'ORDER' | 'STAFFING'}
                onApplied={handleApplied}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
