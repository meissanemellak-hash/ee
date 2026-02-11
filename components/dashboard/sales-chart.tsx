'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { Calendar, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SalesChartData {
  date: string
  revenue: number
  sales: number
}

export type SalesChartPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

interface SalesChartProps {
  data: SalesChartData[]
  period?: SalesChartPeriod
  onPeriodChange?: (period: SalesChartPeriod) => void
}

const PERIOD_LABELS: Record<SalesChartPeriod, string> = {
  daily: '7 derniers jours',
  weekly: '12 dernières semaines',
  monthly: '12 derniers mois',
  yearly: '3 dernières années',
}

export function SalesChart({ data, period = 'weekly', onPeriodChange }: SalesChartProps) {
  // Formater les données pour le graphique
  const chartData = data.map((item) => ({
    date: item.date,
    revenue: Math.round(item.revenue * 100) / 100,
    sales: item.sales,
  }))

  // Calculer les totaux pour affichage
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)
  const totalSales = data.reduce((sum, item) => sum + item.sales, 0)

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Évolution des ventes</CardTitle>
            <CardDescription className="mt-1">
              Revenus (€) et quantité totale vendue {PERIOD_LABELS[period]}
            </CardDescription>
          </div>
          {onPeriodChange && (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Période du graphique">
              <Button
                variant={period === 'daily' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPeriodChange('daily')}
                className={period === 'daily' ? 'bg-teal-600 hover:bg-teal-700 text-white' : undefined}
                aria-pressed={period === 'daily'}
              >
                Par jour
              </Button>
              <Button
                variant={period === 'weekly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPeriodChange('weekly')}
                className={period === 'weekly' ? 'bg-teal-600 hover:bg-teal-700 text-white' : undefined}
                aria-pressed={period === 'weekly'}
              >
                Par semaine
              </Button>
              <Button
                variant={period === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPeriodChange('monthly')}
                className={period === 'monthly' ? 'bg-teal-600 hover:bg-teal-700 text-white' : undefined}
                aria-pressed={period === 'monthly'}
              >
                Par mois
              </Button>
              <Button
                variant={period === 'yearly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPeriodChange('yearly')}
                className={period === 'yearly' ? 'bg-teal-600 hover:bg-teal-700 text-white' : undefined}
                aria-pressed={period === 'yearly'}
              >
                Par année
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="space-y-4">
            {/* Statistiques rapides */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Revenus totaux</p>
                <p className="text-lg font-semibold text-teal-700 dark:text-teal-400">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Quantité totale vendue</p>
                <p className="text-lg font-semibold text-teal-700 dark:text-teal-400">
                  {totalSales.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Graphique (Style Sequence) */}
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 44, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    yAxisId="revenue"
                    orientation="left"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      if (value >= 1000) {
                        return `€${(value / 1000).toFixed(1)}k`
                      }
                      return `€${value}`
                    }}
                  />
                  <YAxis
                    yAxisId="sales"
                    orientation="right"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      padding: '12px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue') {
                        return [formatCurrency(value), 'Revenus']
                      }
                      return [value.toLocaleString(), 'Quantité totale vendue']
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '8px' }}
                    formatter={(value) => (value === 'revenue' ? 'Revenus (€)' : 'Quantité totale vendue')}
                  />
                  <Line
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={{ fill: '#14b8a6', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }}
                    name="revenue"
                  />
                  <Line
                    yAxisId="sales"
                    type="monotone"
                    dataKey="sales"
                    stroke="#64748b"
                    strokeWidth={2}
                    dot={{ fill: '#64748b', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#64748b', stroke: '#fff', strokeWidth: 2 }}
                    name="sales"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune donnée de vente disponible</p>
              <p className="text-sm mt-2">Les ventes apparaîtront ici une fois importées</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
