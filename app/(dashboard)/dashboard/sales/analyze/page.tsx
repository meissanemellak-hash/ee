'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, TrendingUp, Package, DollarSign, Calendar } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SalesAnalysis } from '@/types'

interface Restaurant {
  id: string
  name: string
}

export default function SalesAnalyzePage() {
  const { organization, isLoaded } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [analysis, setAnalysis] = useState<SalesAnalysis | null>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all')
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (isLoaded && organization?.id) {
      fetchRestaurants()
      fetchAnalysis()
    } else if (isLoaded) {
      setLoading(false)
    }
  }, [isLoaded, organization?.id])

  useEffect(() => {
    if (isLoaded && organization?.id) {
      fetchAnalysis()
    }
  }, [selectedRestaurant, startDate, endDate, isLoaded, organization?.id])

  const fetchRestaurants = async () => {
    if (!organization?.id) return

    try {
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/restaurants?${queryParams.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setRestaurants(data)
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error)
    }
  }

  const fetchAnalysis = async () => {
    if (!isLoaded || !organization?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('clerkOrgId', organization.id)
      
      if (selectedRestaurant && selectedRestaurant !== 'all') {
        params.append('restaurantId', selectedRestaurant)
      }
      
      if (startDate) {
        params.append('startDate', startDate)
      }
      
      if (endDate) {
        params.append('endDate', endDate)
      }

      const response = await fetch(`/api/sales/analyze?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de l\'analyse')
      }

      const data = await response.json()
      setAnalysis(data)
    } catch (error) {
      console.error('Error fetching analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour générer un graphique en barres simple
  const BarChart = ({ data, dataKey, labelKey, maxValue }: { 
    data: any[], 
    dataKey: string, 
    labelKey: string,
    maxValue: number 
  }) => {
    if (!data || data.length === 0) {
      return <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>
    }

    return (
      <div className="space-y-2">
        {data.map((item, index) => {
          const value = item[dataKey]
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item[labelKey]}</span>
                <span className="text-muted-foreground">{formatCurrency(value)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (!isLoaded || loading) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {!isLoaded ? 'Chargement de votre organisation...' : 'Chargement de l\'analyse...'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const maxRevenue = Math.max(
    ...(analysis.salesByHour.map(s => s.revenue)),
    ...(analysis.salesByDay.map(s => s.revenue)),
    1
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analyse des ventes</h1>
          <p className="text-muted-foreground">
            Visualisez et analysez vos données de ventes
          </p>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Restaurant</Label>
              <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les restaurants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les restaurants</SelectItem>
                  {restaurants.map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date de début</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes totales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              Unités vendues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d&apos;affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analysis.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Revenus totaux
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne par jour</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.averagePerDay.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Unités/jour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Période</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))}
            </div>
            <p className="text-xs text-muted-foreground">
              Jours
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top produits */}
        <Card>
          <CardHeader>
            <CardTitle>Top produits</CardTitle>
            <CardDescription>
              Produits les plus vendus par revenus
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysis.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>
            ) : (
              <div className="space-y-4">
                {analysis.topProducts.map((product, index) => {
                  const maxProductRevenue = Math.max(...analysis.topProducts.map(p => p.revenue), 1)
                  const percentage = (product.revenue / maxProductRevenue) * 100
                  return (
                    <div key={product.productId} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">
                          #{index + 1} {product.productName}
                        </span>
                        <span className="text-muted-foreground">
                          {formatCurrency(product.revenue)} ({product.quantity} unités)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ventes par heure */}
        <Card>
          <CardHeader>
            <CardTitle>Ventes par heure</CardTitle>
            <CardDescription>
              Répartition des ventes sur la journée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={analysis.salesByHour}
              dataKey="revenue"
              labelKey="hour"
              maxValue={maxRevenue}
            />
          </CardContent>
        </Card>
      </div>

      {/* Ventes par jour */}
      <Card>
        <CardHeader>
          <CardTitle>Ventes par jour</CardTitle>
          <CardDescription>
            Évolution des ventes sur la période sélectionnée
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analysis.salesByDay.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>
          ) : (
            <div className="space-y-4">
              {analysis.salesByDay.map((day) => {
                const percentage = (day.revenue / maxRevenue) * 100
                return (
                  <div key={day.date} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{formatDate(new Date(day.date))}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(day.revenue)} ({day.quantity} unités)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
