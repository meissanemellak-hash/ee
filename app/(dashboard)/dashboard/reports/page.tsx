'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, FileText, Download, RefreshCw, Filter, TrendingUp, Package, AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { Report, ReportType } from '@/lib/services/reports'

const severityLabels: Record<string, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée',
  critical: 'Critique',
}

const typeLabels: Record<string, string> = {
  OVERSTOCK: 'Surstock',
  SHORTAGE: 'Rupture de stock',
  OVERSTAFFING: 'Sur-effectif',
  UNDERSTAFFING: 'Sous-effectif',
  OTHER: 'Autre',
  ORDER: 'Commande',
  STAFFING: 'Effectif',
}

const priorityLabels: Record<string, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée',
}

const statusLabels: Record<string, string> = {
  accepted: 'Acceptée',
  pending: 'En attente',
  dismissed: 'Rejetée',
}

export default function ReportsPage() {
  const { organization, isLoaded } = useOrganization()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState<Report | null>(null)
  const [restaurants, setRestaurants] = useState<Array<{ id: string; name: string }>>([])
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('SUMMARY')
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Initialiser les dates par défaut (30 derniers jours)
  useEffect(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    
    setEndDate(end.toISOString().split('T')[0])
    setStartDate(start.toISOString().split('T')[0])
  }, [])

  // Charger les restaurants
  useEffect(() => {
    if (isLoaded && organization?.id) {
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      fetch(`/api/restaurants?${queryParams.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setRestaurants(data)
          }
        })
        .catch((error) => {
          console.error('Error fetching restaurants:', error)
        })
    }
  }, [isLoaded, organization?.id])

  const handleGenerateReport = async () => {
    if (!organization?.id) {
      toast({
        title: 'Erreur',
        description: 'Aucune organisation active.',
        variant: 'destructive',
      })
      return
    }

    setGenerating(true)
    try {
      const filters: any = {}
      if (selectedRestaurant !== 'all') {
        filters.restaurantId = selectedRestaurant
      }
      if (startDate) {
        filters.startDate = startDate
      }
      if (endDate) {
        filters.endDate = endDate
      }

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: selectedReportType,
          filters,
          clerkOrgId: organization.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || 'Erreur lors de la génération')
      }

      const data = await response.json()
      setReport(data)

      toast({
        title: 'Rapport généré',
        description: 'Le rapport a été généré avec succès.',
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleExportCSV = () => {
    if (!report) return

    let csvContent = ''

    switch (report.type) {
      case 'SALES':
        csvContent = 'Date,Ventes,Revenu\n'
        report.dailyBreakdown.forEach((day) => {
          csvContent += `${day.date},${day.sales},${day.revenue}\n`
        })
        break
      case 'PERFORMANCE':
        csvContent = 'Restaurant,Ventes,Revenu\n'
        report.restaurants.forEach((r) => {
          csvContent += `${r.restaurantName},${r.sales},${r.revenue}\n`
        })
        break
      case 'INVENTORY':
        csvContent = 'Restaurant,Ingrédient,Stock actuel,Seuil min,Seuil max,Statut\n'
        const statusLabelsInventory: Record<string, string> = {
          OK: 'OK',
          LOW: 'Faible',
          CRITICAL: 'Critique',
          OVERSTOCK: 'Surstock',
        }
        report.restaurants.forEach((restaurant) => {
          restaurant.ingredients.forEach((ing) => {
            const statusLabel = statusLabelsInventory[ing.status] || ing.status
            csvContent += `${restaurant.restaurantName},${ing.ingredientName},${ing.currentStock},${ing.minThreshold},${ing.maxThreshold || 'N/A'},${statusLabel}\n`
          })
        })
        break
      case 'RECOMMENDATIONS':
        csvContent = 'Type,Restaurant,Priorité,Statut,Économies estimées,Date\n'
        report.recommendations.forEach((rec) => {
          const typeLabel = typeLabels[rec.type] || rec.type
          const priorityLabel = priorityLabels[rec.priority] || rec.priority
          const statusLabel = statusLabels[rec.status] || rec.status
          csvContent += `${typeLabel},${rec.restaurantName},${priorityLabel},${statusLabel},${rec.estimatedSavings},${new Date(rec.createdAt).toLocaleDateString('fr-FR')}\n`
        })
        break
      case 'ALERTS':
        csvContent = 'Type,Sévérité,Restaurant,Message,Statut,Date\n'
        report.alerts.forEach((alert) => {
          const typeLabel = typeLabels[alert.type] || alert.type
          const severityLabel = severityLabels[alert.severity] || alert.severity
          const statusLabel = alert.resolved ? 'Résolue' : 'En cours'
          csvContent += `${typeLabel},${severityLabel},${alert.restaurantName},"${alert.message}",${statusLabel},${new Date(alert.createdAt).toLocaleDateString('fr-FR')}\n`
        })
        break
      case 'SUMMARY':
        csvContent = 'Métrique,Valeur\n'
        csvContent += `Total ventes,${report.sales.totalSales}\n`
        csvContent += `Revenu total,${report.sales.totalRevenue}\n`
        csvContent += `Revenu moyen/jour,${report.sales.averagePerDay}\n`
        csvContent += `Recommandations totales,${report.recommendations.total}\n`
        csvContent += `Recommandations acceptées,${report.recommendations.accepted}\n`
        csvContent += `Économies estimées,${report.recommendations.estimatedSavings}\n`
        csvContent += `Alertes totales,${report.alerts.total}\n`
        csvContent += `Alertes critiques,${report.alerts.critical}\n`
        break
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `rapport-${selectedReportType.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Export réussi',
      description: 'Le rapport a été exporté en CSV.',
    })
  }

  const getReportTypeLabel = (type: ReportType): string => {
    const labels: Record<ReportType, string> = {
      SALES: 'Rapport de ventes',
      PERFORMANCE: 'Rapport de performance',
      INVENTORY: 'Rapport d\'inventaire',
      RECOMMENDATIONS: 'Rapport de recommandations',
      ALERTS: 'Rapport d\'alertes',
      SUMMARY: 'Rapport récapitulatif',
    }
    return labels[type]
  }

  const getReportTypeDescription = (type: ReportType): string => {
    const descriptions: Record<ReportType, string> = {
      SALES: 'Analyse détaillée des ventes par période, produit et heure',
      PERFORMANCE: 'Performance globale des restaurants et produits',
      INVENTORY: 'État des stocks et inventaires par restaurant',
      RECOMMENDATIONS: 'Historique et impact des recommandations',
      ALERTS: 'Synthèse des alertes et leur résolution',
      SUMMARY: 'Vue d\'ensemble complète de votre activité',
    }
    return descriptions[type]
  }

  if (!isLoaded) {
    return (
      <div className="p-6 space-y-6">
        <Card className="border shadow-sm">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Chargement de votre organisation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header (Style Sequence) */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapports</h1>
          <p className="text-muted-foreground mt-1">
            Rapports et analyses détaillées de votre activité
          </p>
        </div>
      </div>

      {/* Sélection du type de rapport (Style Sequence) */}
      <Card className="border shadow-sm border-2 border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            Générer un rapport
          </CardTitle>
          <CardDescription className="mt-1">
            Sélectionnez le type de rapport et configurez les filtres
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Type de rapport</Label>
            <Select value={selectedReportType} onValueChange={(value) => setSelectedReportType(value as ReportType)}>
              <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <SelectValue placeholder="Sélectionner un type de rapport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUMMARY">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Rapport récapitulatif</div>
                      <div className="text-xs text-muted-foreground">Vue d'ensemble complète</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="SALES">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Rapport de ventes</div>
                      <div className="text-xs text-muted-foreground">Analyse détaillée des ventes</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="PERFORMANCE">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Rapport de performance</div>
                      <div className="text-xs text-muted-foreground">Performance des restaurants</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="INVENTORY">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Rapport d'inventaire</div>
                      <div className="text-xs text-muted-foreground">État des stocks</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="RECOMMENDATIONS">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Rapport de recommandations</div>
                      <div className="text-xs text-muted-foreground">Historique des recommandations</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="ALERTS">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Rapport d'alertes</div>
                      <div className="text-xs text-muted-foreground">Synthèse des alertes</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getReportTypeDescription(selectedReportType)}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Restaurant</Label>
              <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
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
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
              />
            </div>
          </div>

          <Button
            onClick={handleGenerateReport}
            disabled={generating}
            className="w-full shadow-sm"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Générer le rapport
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Affichage du rapport (Style Sequence) */}
      {report && (
        <Card className="border shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg font-semibold">{getReportTypeLabel(report.type)}</CardTitle>
                <CardDescription className="mt-1">
                  {report.type !== 'INVENTORY' && 'period' in report
                    ? `Période: ${report.period.start} - ${report.period.end}`
                    : report.type === 'INVENTORY'
                    ? `Généré le: ${new Date(report.generatedAt).toLocaleDateString('fr-FR')}`
                    : ''}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleExportCSV} className="shadow-sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {report.type === 'SALES' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total ventes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{report.summary.totalSales}</div>
                      <p className="text-xs text-muted-foreground mt-2">unités vendues</p>
                    </CardContent>
                  </Card>
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Revenu total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{formatCurrency(report.summary.totalRevenue)}</div>
                      <p className="text-xs text-muted-foreground mt-2">sur la période</p>
                    </CardContent>
                  </Card>
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Moyenne par jour</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-600">{report.summary.averagePerDay}</div>
                      <p className="text-xs text-muted-foreground mt-2">unités/jour</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Top produits</h3>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Produit</th>
                          <th className="px-4 py-3 text-right font-semibold">Quantité</th>
                          <th className="px-4 py-3 text-right font-semibold">Revenu</th>
                          <th className="px-4 py-3 text-right font-semibold">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.summary.topProducts.map((product, i) => (
                          <tr key={product.productId} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3 font-medium">{product.productName}</td>
                            <td className="px-4 py-3 text-right">{product.quantity}</td>
                            <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">{formatCurrency(product.revenue)}</td>
                            <td className="px-4 py-3 text-right">{product.percentage.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Ventes par jour</h3>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Date</th>
                          <th className="px-4 py-3 text-right font-semibold">Ventes</th>
                          <th className="px-4 py-3 text-right font-semibold">Revenu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.dailyBreakdown.map((day, i) => (
                          <tr key={i} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3">{new Date(day.date).toLocaleDateString('fr-FR')}</td>
                            <td className="px-4 py-3 text-right">{day.sales}</td>
                            <td className="px-4 py-3 text-right font-semibold text-teal-600 dark:text-teal-400">{formatCurrency(day.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {report.type === 'PERFORMANCE' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Restaurants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{report.summary.totalRestaurants}</div>
                    </CardContent>
                  </Card>
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Produits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">{report.summary.totalProducts}</div>
                    </CardContent>
                  </Card>
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total ventes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-600">{report.summary.totalSales}</div>
                    </CardContent>
                  </Card>
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Revenu moyen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{formatCurrency(report.summary.averageRevenuePerRestaurant)}</div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Performance par restaurant</h3>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Restaurant</th>
                          <th className="px-4 py-3 text-right font-semibold">Ventes</th>
                          <th className="px-4 py-3 text-right font-semibold">Revenu</th>
                          <th className="px-4 py-3 text-left font-semibold">Top produit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.restaurants.map((restaurant) => (
                          <tr key={restaurant.restaurantId} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3 font-medium">{restaurant.restaurantName}</td>
                            <td className="px-4 py-3 text-right">{restaurant.sales}</td>
                            <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">{formatCurrency(restaurant.revenue)}</td>
                            <td className="px-4 py-3">
                              {restaurant.topProduct ? (
                                <span>
                                  {restaurant.topProduct.productName} ({restaurant.topProduct.quantity})
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {report.type === 'INVENTORY' && (
              <div className="space-y-6">
                {report.restaurants.map((restaurant) => (
                  <div key={restaurant.restaurantId}>
                    <h3 className="text-lg font-semibold mb-4">{restaurant.restaurantName}</h3>
                    {restaurant.ingredients.length === 0 ? (
                      <div className="rounded-lg border p-6 text-center text-muted-foreground">
                        <p>Aucun ingrédient trouvé pour ce restaurant.</p>
                        <p className="text-sm mt-2">Créez des ingrédients dans la section "Ingrédients" pour les voir apparaître ici.</p>
                      </div>
                    ) : (
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold">Ingrédient</th>
                              <th className="px-4 py-3 text-right font-semibold">Stock actuel</th>
                              <th className="px-4 py-3 text-right font-semibold">Seuil min</th>
                              <th className="px-4 py-3 text-right font-semibold">Seuil max</th>
                              <th className="px-4 py-3 text-center font-semibold">Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {restaurant.ingredients.map((ing) => (
                              <tr key={ing.ingredientId} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-4 py-3 font-medium">
                                  {ing.ingredientName}
                                  {ing.notConfigured && (
                                    <span className="ml-2 text-xs text-muted-foreground">(non configuré)</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {ing.notConfigured ? (
                                    <span className="text-muted-foreground">-</span>
                                  ) : (
                                    `${ing.currentStock} ${ing.unit}`
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {ing.notConfigured ? (
                                    <span className="text-muted-foreground">-</span>
                                  ) : (
                                    `${ing.minThreshold} ${ing.unit}`
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {ing.notConfigured ? (
                                    <span className="text-muted-foreground">-</span>
                                  ) : ing.maxThreshold ? (
                                    `${ing.maxThreshold} ${ing.unit}`
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {ing.notConfigured ? (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                      Non configuré
                                    </span>
                                  ) : (
                                    <span
                                      className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                                        ing.status === 'CRITICAL'
                                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                          : ing.status === 'LOW'
                                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
                                          : ing.status === 'OVERSTOCK'
                                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                                      }`}
                                    >
                                      {ing.status === 'CRITICAL'
                                        ? 'Critique'
                                        : ing.status === 'LOW'
                                        ? 'Faible'
                                        : ing.status === 'OVERSTOCK'
                                        ? 'Surstock'
                                        : 'OK'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {report.type === 'RECOMMENDATIONS' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{report.summary.totalRecommendations}</div>
                    </CardContent>
                  </Card>
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Acceptées</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{report.summary.accepted}</div>
                    </CardContent>
                  </Card>
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-yellow-600">{report.summary.pending}</div>
                    </CardContent>
                  </Card>
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Économies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-600">{formatCurrency(report.summary.totalEstimatedSavings)}</div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Recommandations</h3>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Type</th>
                          <th className="px-4 py-3 text-left font-semibold">Restaurant</th>
                          <th className="px-4 py-3 text-center font-semibold">Priorité</th>
                          <th className="px-4 py-3 text-center font-semibold">Statut</th>
                          <th className="px-4 py-3 text-right font-semibold">Économies</th>
                          <th className="px-4 py-3 text-left font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.recommendations.map((rec) => (
                          <tr key={rec.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3">{rec.type}</td>
                            <td className="px-4 py-3 font-medium">{rec.restaurantName}</td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                                  rec.priority === 'high'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                    : rec.priority === 'medium'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                }`}
                              >
                                {rec.priority}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                                  rec.status === 'accepted'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                                    : rec.status === 'dismissed'
                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
                                }`}
                              >
                                {rec.status === 'accepted'
                                  ? 'Acceptée'
                                  : rec.status === 'dismissed'
                                  ? 'Rejetée'
                                  : 'En attente'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">{formatCurrency(rec.estimatedSavings)}</td>
                            <td className="px-4 py-3">{new Date(rec.createdAt).toLocaleDateString('fr-FR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {report.type === 'ALERTS' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-5">
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{report.summary.totalAlerts}</div>
                    </CardContent>
                  </Card>
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Critiques</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">{report.summary.critical}</div>
                    </CardContent>
                  </Card>
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Élevées</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">{report.summary.high}</div>
                    </CardContent>
                  </Card>
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Moyennes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-yellow-600">{report.summary.medium}</div>
                    </CardContent>
                  </Card>
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Résolues</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{report.summary.resolved}</div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Alertes</h3>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Type</th>
                          <th className="px-4 py-3 text-left font-semibold">Restaurant</th>
                          <th className="px-4 py-3 text-center font-semibold">Sévérité</th>
                          <th className="px-4 py-3 text-left font-semibold">Message</th>
                          <th className="px-4 py-3 text-center font-semibold">Statut</th>
                          <th className="px-4 py-3 text-left font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.alerts.map((alert) => (
                          <tr key={alert.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3">{typeLabels[alert.type] || alert.type}</td>
                            <td className="px-4 py-3 font-medium">{alert.restaurantName}</td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                                  alert.severity === 'critical'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                    : alert.severity === 'high'
                                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
                                    : alert.severity === 'medium'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                }`}
                              >
                                {severityLabels[alert.severity] || alert.severity}
                              </span>
                            </td>
                            <td className="px-4 py-3">{alert.message}</td>
                            <td className="px-4 py-3 text-center">
                              {alert.resolved ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Résolue
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                                  En cours
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">{new Date(alert.createdAt).toLocaleDateString('fr-FR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {report.type === 'SUMMARY' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">Ventes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Total ventes</p>
                        <p className="text-2xl font-bold">{report.sales.totalSales}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Revenu total</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(report.sales.totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Moyenne par jour</p>
                        <p className="text-2xl font-bold text-teal-600">{formatCurrency(report.sales.averagePerDay)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">Recommandations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold">{report.recommendations.total}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Acceptées</p>
                        <p className="text-2xl font-bold text-green-600">{report.recommendations.accepted}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Économies estimées</p>
                        <p className="text-2xl font-bold text-teal-600">{formatCurrency(report.recommendations.estimatedSavings)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">Alertes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold">{report.alerts.total}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Critiques</p>
                        <p className="text-2xl font-bold text-red-600">{report.alerts.critical}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Résolues</p>
                        <p className="text-2xl font-bold text-green-600">{report.alerts.resolved}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Top produits</h3>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Produit</th>
                          <th className="px-4 py-3 text-right font-semibold">Quantité</th>
                          <th className="px-4 py-3 text-right font-semibold">Revenu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.topProducts.map((product) => (
                          <tr key={product.productId} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3 font-medium">{product.productName}</td>
                            <td className="px-4 py-3 text-right">{product.quantity}</td>
                            <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">{formatCurrency(product.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
