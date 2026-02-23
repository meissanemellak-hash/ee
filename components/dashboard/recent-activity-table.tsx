'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Loader2, ArrowRight, Euro, CheckCircle2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import { useToast } from '@/hooks/use-toast'
import { translateApiError } from '@/lib/translate-api-error'

interface Activity {
  id: string
  type: 'sale' | 'recommendation_accepted' | 'alert_created' | 'alert_resolved'
  title: string
  description: string
  restaurantName: string
  amount?: number
  date: string
  icon: string
  /** Sévérité pour les alertes (alignée avec la page Alertes) */
  severity?: string
}

interface RecentActivityTableProps {
  restaurantId?: string | null
}

const AUTO_REFRESH_INTERVAL_MS = 60 * 1000 // 60 secondes

export function RecentActivityTable({ restaurantId }: RecentActivityTableProps) {
  const { organization, isLoaded } = useOrganization()
  const { toast } = useToast()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const isInitialLoad = useRef(true)
  const mountTime = useRef(Date.now())
  const retryCount = useRef(0)
  const retryScheduled = useRef(false)

  const fetchActivities = useCallback(async (isRefresh = false) => {
    if (!organization?.id) return
    retryScheduled.current = false
    if (!isRefresh) setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.append('clerkOrgId', organization.id)
      if (restaurantId) params.append('restaurantId', restaurantId)

      const response = await fetch(`/api/activity/recent?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = errorData.error || errorData.details || 'Impossible de charger les activités.'
        setError(message)
        const isFirstLoad = isInitialLoad.current && Date.now() - mountTime.current < 4000
        const shouldRetry = isFirstLoad && retryCount.current < 2
        if (shouldRetry) {
          retryCount.current += 1
          retryScheduled.current = true
          setTimeout(() => fetchActivities(false), 1200)
        } else if (!isFirstLoad) {
          toast({
            title: 'Erreur de chargement',
            description: message,
            variant: 'destructive',
          })
        }
        setActivities([])
        return
      }

      const data = await response.json()
      if (data.activities && Array.isArray(data.activities)) {
        setActivities(data.activities)
      } else {
        setActivities([])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur inattendue s\'est produite.'
      setError(message)
      const isFirstLoad = isInitialLoad.current && Date.now() - mountTime.current < 4000
      const shouldRetry = isFirstLoad && retryCount.current < 2
      if (shouldRetry) {
        retryCount.current += 1
        retryScheduled.current = true
        setTimeout(() => fetchActivities(false), 1200)
      } else if (!isFirstLoad) {
        toast({
          title: 'Erreur de chargement',
          description: translateApiError(message),
          variant: 'destructive',
        })
      }
      setActivities([])
    } finally {
      if (isInitialLoad.current) isInitialLoad.current = false
      if (!retryScheduled.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [organization?.id, restaurantId, toast])

  useEffect(() => {
    if (!isLoaded || !organization?.id) {
      setLoading(false)
      return
    }
    fetchActivities(false)
  }, [isLoaded, organization?.id, fetchActivities])

  useEffect(() => {
    if (!isLoaded || !organization?.id) return
    const interval = setInterval(() => fetchActivities(true), AUTO_REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [isLoaded, organization?.id, fetchActivities])

  const getAlertSeverityConfig = (severity: string | undefined) => {
    switch (severity) {
      case 'critical':
        return {
          borderColor: 'border-l-red-500',
          bgColor: 'bg-red-50/50 dark:bg-red-900/10',
          textColor: 'text-red-700 dark:text-red-400',
          iconColor: 'text-red-600 dark:text-red-400',
        }
      case 'high':
        return {
          borderColor: 'border-l-orange-500',
          bgColor: 'bg-orange-50/50 dark:bg-orange-900/10',
          textColor: 'text-orange-700 dark:text-orange-400',
          iconColor: 'text-orange-600 dark:text-orange-400',
        }
      case 'medium':
        return {
          borderColor: 'border-l-yellow-500',
          bgColor: 'bg-yellow-50/50 dark:bg-yellow-900/10',
          textColor: 'text-yellow-700 dark:text-yellow-400',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
        }
      case 'low':
      default:
        return {
          borderColor: 'border-l-teal-500',
          bgColor: 'bg-teal-50/50 dark:bg-teal-900/10',
          textColor: 'text-teal-700 dark:text-teal-400',
          iconColor: 'text-teal-600 dark:text-teal-400',
        }
    }
  }

  const getActivityConfig = (activity: Activity) => {
    const type = activity.type
    switch (type) {
      case 'sale':
        return {
          borderColor: 'border-l-teal-500',
          bgColor: 'bg-teal-50/50 dark:bg-teal-900/10',
          textColor: 'text-teal-700 dark:text-teal-400',
          icon: Euro,
          iconColor: 'text-teal-600 dark:text-teal-400',
        }
      case 'recommendation_accepted':
        return {
          borderColor: 'border-l-teal-500',
          bgColor: 'bg-teal-50/50 dark:bg-teal-900/10',
          textColor: 'text-teal-700 dark:text-teal-400',
          icon: CheckCircle2,
          iconColor: 'text-teal-600 dark:text-teal-400',
        }
      case 'alert_created': {
        const severityConfig = getAlertSeverityConfig(activity.severity)
        return {
          ...severityConfig,
          icon: AlertTriangle,
        }
      }
      case 'alert_resolved': {
        const severityConfig = getAlertSeverityConfig(activity.severity)
        return {
          ...severityConfig,
          icon: CheckCircle,
        }
      }
      default:
        return {
          borderColor: 'border-l-gray-300',
          bgColor: 'bg-gray-50/50 dark:bg-gray-900/10',
          textColor: 'text-gray-700 dark:text-gray-400',
          icon: CheckCircle,
          iconColor: 'text-gray-600 dark:text-gray-400',
        }
    }
  }

  if (loading) {
    return (
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Activité récente</CardTitle>
          <CardDescription>Dernières actions et événements de votre organisation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Activité récente</CardTitle>
            <CardDescription className="mt-1">
              Dernières actions et événements de votre organisation
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchActivities(true)}
              disabled={refreshing}
              aria-label="Actualiser les activités"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="sr-only sm:not-sr-only sm:ml-2">Actualiser</span>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/sales">
                Voir tout <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm text-destructive mb-3" role="alert">
            {error}
          </p>
        )}
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.slice(0, 10).map((activity) => {
              const config = getActivityConfig(activity)
              const Icon = config.icon
              
              return (
                <div
                  key={activity.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border-l-4 ${config.borderColor} border-r border-t border-b ${config.bgColor} transition-all hover:shadow-md`}
                >
                  {/* Icône (Style Sequence) */}
                  <div className={`flex-shrink-0 ${config.iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h4 className={`font-semibold text-sm ${config.textColor}`}>
                            {activity.title}
                          </h4>
                          <span className="text-xs text-muted-foreground font-medium">
                            {activity.restaurantName}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.date), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                      </div>

                      {/* Montant (si disponible) - Style Sequence */}
                      {activity.amount !== undefined && activity.amount > 0 && (
                        <div className="flex-shrink-0">
                          <span className={`text-base font-bold ${config.textColor}`}>
                            {formatCurrency(activity.amount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">Aucune activité récente</p>
              <p className="text-xs mt-2">Les activités apparaîtront ici une fois générées</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
