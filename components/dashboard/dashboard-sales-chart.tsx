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

type SalesChartPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

interface DashboardSalesChartProps {
  restaurantId?: string | null
}

export function DashboardSalesChart({ restaurantId }: DashboardSalesChartProps) {
  const { organization, isLoaded } = useOrganization()
  const [chartData, setChartData] = useState<SalesChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<SalesChartPeriod>('weekly')

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
        if (restaurantId) params.append('restaurantId', restaurantId)

        const endDate = new Date()
        const startDate = new Date()
        if (period === 'daily') {
          startDate.setDate(startDate.getDate() - 7)
        } else if (period === 'weekly') {
          startDate.setDate(startDate.getDate() - 12 * 7)
        } else if (period === 'monthly') {
          startDate.setMonth(startDate.getMonth() - 12)
        } else {
          startDate.setFullYear(startDate.getFullYear() - 3)
        }

        params.append('startDate', startDate.toISOString().split('T')[0])
        params.append('endDate', endDate.toISOString().split('T')[0])

        const response = await fetch(`/api/sales/analyze?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des données')
        }

        const data = await response.json()
        const rawDays = data.salesByDay || []
        const rawByDate = new Map<string, { revenue: number; sales: number }>()
        rawDays.forEach((day: { date: string; quantity: number; revenue: number }) => {
          rawByDate.set(day.date, { revenue: day.revenue, sales: day.quantity })
        })

        let formattedData: SalesChartData[] = []

        if (period === 'daily') {
          // Afficher les 7 derniers jours (y compris jours sans vente)
          const days: SalesChartData[] = []
          for (let i = 6; i >= 0; i--) {
            const d = new Date(endDate)
            d.setDate(d.getDate() - i)
            const dateKey = d.toISOString().split('T')[0]
            const point = rawByDate.get(dateKey) ?? { revenue: 0, sales: 0 }
            days.push({
              date: formatDateLabel(dateKey),
              revenue: point.revenue,
              sales: point.sales,
            })
          }
          formattedData = days
        } else if (period === 'weekly') {
          const weeklyMap = new Map<string, { revenue: number; sales: number }>()
          rawDays.forEach((day: { date: string; quantity: number; revenue: number }) => {
            const d = new Date(day.date + 'T12:00:00')
            const dayOfWeek = d.getDay()
            const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
            const monday = new Date(d.getFullYear(), d.getMonth(), diff)
            const weekKey = toLocalDateString(monday)
            const existing = weeklyMap.get(weekKey) || { revenue: 0, sales: 0 }
            weeklyMap.set(weekKey, {
              revenue: existing.revenue + day.revenue,
              sales: existing.sales + day.quantity,
            })
          })
          // 12 dernières semaines : 3 points (1 point = 4 semaines agrégées)
          const currentMonday = new Date(endDate)
          currentMonday.setDate(endDate.getDate() - endDate.getDay() + (endDate.getDay() === 0 ? -6 : 1))
          const weekKeys: string[] = []
          const oneWeekMs = 7 * 24 * 60 * 60 * 1000
          for (let i = 11; i >= 0; i--) {
            const m = new Date(currentMonday.getTime() - i * oneWeekMs)
            weekKeys.push(toLocalDateString(m))
          }
          const fourWeekBuckets: SalesChartData[] = []
          for (let b = 0; b < 3; b++) {
            let revenue = 0
            let sales = 0
            for (let w = 0; w < 4; w++) {
              const key = weekKeys[b * 4 + w]
              const point = weeklyMap.get(key) ?? { revenue: 0, sales: 0 }
              revenue += point.revenue
              sales += point.sales
            }
            const startMonday = weekKeys[b * 4]
            const endSunday = new Date(weekKeys[b * 4 + 3] + 'T12:00:00')
            endSunday.setDate(endSunday.getDate() + 6)
            fourWeekBuckets.push({
              date: formatFourWeeksLabel(startMonday, toLocalDateString(endSunday)),
              revenue,
              sales,
            })
          }
          formattedData = fourWeekBuckets
        } else if (period === 'monthly') {
          const monthlyMap = new Map<string, { revenue: number; sales: number }>()
          rawDays.forEach((day: { date: string; quantity: number; revenue: number }) => {
            const monthKey = day.date.slice(0, 7)
            const existing = monthlyMap.get(monthKey) || { revenue: 0, sales: 0 }
            monthlyMap.set(monthKey, {
              revenue: existing.revenue + day.revenue,
              sales: existing.sales + day.quantity,
            })
          })
          // Afficher les 12 derniers mois (y compris mois sans vente)
          const months: SalesChartData[] = []
          for (let i = 11; i >= 0; i--) {
            const d = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1)
            const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            const point = monthlyMap.get(ym) ?? { revenue: 0, sales: 0 }
            months.push({
              date: formatMonthLabel(ym),
              revenue: point.revenue,
              sales: point.sales,
            })
          }
          formattedData = months
        } else {
          const yearlyMap = new Map<string, { revenue: number; sales: number }>()
          rawDays.forEach((day: { date: string; quantity: number; revenue: number }) => {
            const yearKey = day.date.slice(0, 4)
            const existing = yearlyMap.get(yearKey) || { revenue: 0, sales: 0 }
            yearlyMap.set(yearKey, {
              revenue: existing.revenue + day.revenue,
              sales: existing.sales + day.quantity,
            })
          })
          // Afficher les 3 dernières années (y compris années sans vente)
          const years: SalesChartData[] = []
          const currentYear = endDate.getFullYear()
          for (let i = 2; i >= 0; i--) {
            const y = String(currentYear - i)
            const point = yearlyMap.get(y) ?? { revenue: 0, sales: 0 }
            years.push({
              date: formatYearLabel(y),
              revenue: point.revenue,
              sales: point.sales,
            })
          }
          formattedData = years
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
  }, [organization?.id, isLoaded, period, restaurantId])

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

// Date en YYYY-MM-DD (heure locale, pour clés cohérentes)
function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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

// Formater une plage de 4 semaines pour l'affichage (ex: "18 Nov - 15 Déc")
function formatFourWeeksLabel(startMonday: string, endSunday: string): string {
  try {
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    const start = new Date(startMonday + 'T00:00:00')
    const end = new Date(endSunday + 'T00:00:00')
    const d1 = start.getDate()
    const m1 = monthNames[start.getMonth()]
    const d2 = end.getDate()
    const m2 = monthNames[end.getMonth()]
    if (m1 === m2) return `${d1}-${d2} ${m1}`
    return `${d1} ${m1} - ${d2} ${m2}`
  } catch (error) {
    return startMonday
  }
}

// Formater la semaine pour l'affichage (ex: "18-24 Jan" = lundi à dimanche)
function formatWeekLabel(dateString: string): string {
  try {
    const monday = new Date(dateString + 'T00:00:00')
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    const d1 = monday.getDate()
    const m1 = monthNames[monday.getMonth()]
    const d2 = sunday.getDate()
    const m2 = monthNames[sunday.getMonth()]
    if (m1 === m2) {
      return `${d1}-${d2} ${m1}`
    }
    return `${d1} ${m1} - ${d2} ${m2}`
  } catch (error) {
    return dateString
  }
}

// Formater le mois pour l'affichage (ex: "Jan 2025")
function formatMonthLabel(ym: string): string {
  try {
    const [y, m] = ym.split('-')
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    const month = monthNames[parseInt(m, 10) - 1] ?? ym
    return `${month} ${y}`
  } catch (error) {
    return ym
  }
}

// Formater l'année pour l'affichage (ex: "2024")
function formatYearLabel(y: string): string {
  return y
}
