'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { SalesChart } from './sales-chart'
import { Loader2 } from 'lucide-react'

interface SalesChartData {
  date: string
  revenue: number
  sales: number
}

export function DashboardSalesChart() {
  const { organization, isLoaded } = useOrganization()
  const [chartData, setChartData] = useState<SalesChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'weekly' | 'daily'>('weekly')

  useEffect(() => {
    if (!isLoaded || !organization?.id) {
      setLoading(false)
      return
    }

    const fetchSalesData = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.append('clerkOrgId', organization.id)
        
        // Calculer la période (7 derniers jours pour weekly, 30 pour daily)
        const endDate = new Date()
        const startDate = new Date()
        if (period === 'weekly') {
          startDate.setDate(startDate.getDate() - 7)
        } else {
          startDate.setDate(startDate.getDate() - 30)
        }
        
        params.append('startDate', startDate.toISOString().split('T')[0])
        params.append('endDate', endDate.toISOString().split('T')[0])

        const response = await fetch(`/api/sales/analyze?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des données')
        }

        const data = await response.json()
        
        // Transformer les données pour le graphique
        let formattedData: SalesChartData[] = []
        
        if (period === 'weekly') {
          // Grouper par semaine
          const weeklyMap = new Map<string, { revenue: number; sales: number }>()
          
          data.salesByDay?.forEach((day: { date: string; quantity: number; revenue: number }) => {
            const date = new Date(day.date)
            // Obtenir le lundi de la semaine
            const monday = new Date(date)
            const dayOfWeek = date.getDay()
            const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
            monday.setDate(diff)
            const weekKey = monday.toISOString().split('T')[0]
            
            const existing = weeklyMap.get(weekKey) || { revenue: 0, sales: 0 }
            weeklyMap.set(weekKey, {
              revenue: existing.revenue + day.revenue,
              sales: existing.sales + day.quantity,
            })
          })
          
          formattedData = Array.from(weeklyMap.entries())
            .map(([date, data]) => ({
              date: formatWeekLabel(date),
              revenue: data.revenue,
              sales: data.sales,
            }))
            .sort((a, b) => a.date.localeCompare(b.date))
        } else {
          // Utiliser les données quotidiennes directement
          formattedData = (data.salesByDay || []).map((day: { date: string; quantity: number; revenue: number }) => ({
            date: formatDateLabel(day.date),
            revenue: day.revenue,
            sales: day.quantity,
          }))
        }
        
        setChartData(formattedData)
      } catch (error) {
        console.error('Error fetching sales data:', error)
        setChartData([])
      } finally {
        setLoading(false)
      }
    }

    fetchSalesData()
  }, [organization?.id, isLoaded, period])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <SalesChart 
      data={chartData} 
      period={period}
      onPeriodChange={setPeriod}
    />
  )
}

// Formater la date pour l'affichage (ex: "18 Oct")
function formatDateLabel(dateString: string): string {
  try {
    const date = new Date(dateString + 'T00:00:00') // Ajouter l'heure pour éviter les problèmes de timezone
    const day = date.getDate()
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    const month = monthNames[date.getMonth()]
    return `${day} ${month}`
  } catch (error) {
    return dateString
  }
}

// Formater la semaine pour l'affichage (ex: "18 Oct")
function formatWeekLabel(dateString: string): string {
  try {
    const date = new Date(dateString + 'T00:00:00')
    const day = date.getDate()
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    const month = monthNames[date.getMonth()]
    return `${day} ${month}`
  } catch (error) {
    return dateString
  }
}
