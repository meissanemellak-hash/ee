'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Loader2, ArrowRight, DollarSign, CheckCircle2, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale/fr'

interface Activity {
  id: string
  type: 'sale' | 'recommendation_accepted' | 'alert_created' | 'alert_resolved'
  title: string
  description: string
  restaurantName: string
  amount?: number
  date: string
  icon: string
}

export function RecentActivityTable() {
  const { organization, isLoaded } = useOrganization()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded || !organization?.id) {
      setLoading(false)
      return
    }

    const fetchActivities = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.append('clerkOrgId', organization.id)

        const response = await fetch(`/api/activity/recent?${params.toString()}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('[RecentActivityTable] API Error:', response.status, errorData)
          throw new Error(errorData.error || 'Erreur lors du chargement des activités')
        }

        const data = await response.json()
        console.log('[RecentActivityTable] API Response:', data)
        console.log('[RecentActivityTable] Activities loaded:', data.activities?.length || 0)
        
        if (data.activities && Array.isArray(data.activities)) {
          setActivities(data.activities)
        } else {
          console.warn('[RecentActivityTable] Invalid activities format:', data)
          setActivities([])
        }
      } catch (error) {
        console.error('[RecentActivityTable] Error fetching activities:', error)
        setActivities([])
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [organization?.id, isLoaded])

  const getActivityConfig = (type: Activity['type']) => {
    switch (type) {
      case 'sale':
        return {
          borderColor: 'border-l-teal-500',
          bgColor: 'bg-teal-50/50 dark:bg-teal-900/10',
          textColor: 'text-teal-700 dark:text-teal-400',
          icon: DollarSign,
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
      case 'alert_created':
        return {
          borderColor: 'border-l-orange-500',
          bgColor: 'bg-orange-50/50 dark:bg-orange-900/10',
          textColor: 'text-orange-700 dark:text-orange-400',
          icon: AlertTriangle,
          iconColor: 'text-orange-600 dark:text-orange-400',
        }
      case 'alert_resolved':
        return {
          borderColor: 'border-l-teal-500',
          bgColor: 'bg-teal-50/50 dark:bg-teal-900/10',
          textColor: 'text-teal-700 dark:text-teal-400',
          icon: CheckCircle,
          iconColor: 'text-teal-600 dark:text-teal-400',
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
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/sales">
              Voir tout <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.slice(0, 10).map((activity) => {
              const config = getActivityConfig(activity.type)
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
