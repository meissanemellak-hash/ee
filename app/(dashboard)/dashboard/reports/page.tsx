'use client'

import { useState } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, FileText, Download, TrendingUp, Package, AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-react'
import Link from 'next/link'
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
import { useGenerateReport } from '@/lib/react-query/hooks/use-reports'
import { useRestaurants } from '@/lib/react-query/hooks/use-restaurants'

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

  // Dates par défaut (30 derniers jours)
  const [startDate, setStartDate] = useState<string>(() => {
    const start = new Date()
    start.setDate(start.getDate() - 30)
    return start.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0])

  const [selectedReportType, setSelectedReportType] = useState<ReportType>('SUMMARY')
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all')

  const { data: restaurantsData } = useRestaurants(1, 100)
  const restaurants = restaurantsData?.restaurants || []

  const generateReport = useGenerateReport()
  const report = generateReport.data ?? null

  const handleGenerateReport = () => {
    if (!organization?.id) return

    const filters: { restaurantId?: string; startDate?: string; endDate?: string } = {}
    if (selectedRestaurant !== 'all') filters.restaurantId = selectedRestaurant
    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate

    generateReport.mutate({ reportType: selectedReportType, filters })
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
      <div className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Chargement de votre organisation...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isLoaded && !organization?.id) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <header className="pb-6 border-b border-border/60">
            <h1 className="text-3xl font-bold tracking-tight">Rapports</h1>
            <p className="text-muted-foreground mt-1.5">
              Rapports et analyses détaillées de votre activité
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-16 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Aucune organisation active</h2>
              <p className="text-muted-foreground">
                Veuillez sélectionner une organisation pour générer des rapports.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/reports">Retour aux rapports</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Rapports">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <header className="pb-6 border-b border-border/60">
          <h1 className="text-3xl font-bold tracking-tight">Rapports</h1>
          <p className="text-muted-foreground mt-1.5">
            Rapports et analyses détaillées de votre activité
          </p>
        </header>

        <Card className="rounded-xl border shadow-sm border-2 border-teal-200/80 dark:border-teal-900/30 bg-teal-50/50 dark:bg-teal-900/10">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm" aria-hidden>
                <FileText className="h-4 w-4 text-white" />
              </div>
              Générer un rapport
            </CardTitle>
            <CardDescription className="mt-1">
              Sélectionnez le type de rapport et configurez les filtres (période, restaurant).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Type de rapport</Label>
              <Select value={selectedReportType} onValueChange={(value) => setSelectedReportType(value as ReportType)}>
                <SelectTrigger id="report-type" className="bg-muted/50 dark:bg-gray-900 border-border" aria-label="Type de rapport">
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
              <Label htmlFor="report-restaurant">Restaurant</Label>
              <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                <SelectTrigger id="report-restaurant" className="bg-muted/50 dark:bg-gray-900 border-border" aria-label="Restaurant pour le rapport">
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
              <Label htmlFor="report-start">Date de début</Label>
              <Input
                id="report-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-muted/50 dark:bg-gray-900 border-border"
                aria-label="Date de début"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-end">Date de fin</Label>
              <Input
                id="report-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-muted/50 dark:bg-gray-900 border-border"
                aria-label="Date de fin"
              />
            </div>
          </div>

          <Button
            onClick={handleGenerateReport}
            disabled={generateReport.isPending}
            className="w-full shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0"
          >
            {generateReport.isPending ? (
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

        {report && (
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
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
                <Button variant="outline" onClick={handleExportCSV} className="shadow-sm shrink-0" aria-label="Exporter le rapport en CSV">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter CSV
                </Button>
              </div>
            </CardHeader>
          <CardContent>
            {report.type === 'SALES' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="rounded-xl border shadow-sm bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total ventes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{report.summary.totalSales}</div>
                      <p className="text-xs text-muted-foreground mt-2">unités vendues</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border shadow-sm bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Revenu total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{formatCurrency(report.summary.totalRevenue)}</div>
                      <p className="text-xs text-muted-foreground mt-2">sur la période</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border shadow-sm bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Moyenne par jour</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{report.summary.averagePerDay}</div>
                      <p className="text-xs text-muted-foreground mt-2">unités/jour</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Top produits</h3>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm" role="table" aria-label="Top produits du rapport ventes">
                      <thead className="bg-muted/50 dark:bg-gray-800/50 border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Produit</th>
                          <th className="px-4 py-3 text-right font-semibold">Quantité</th>
                          <th className="px-4 py-3 text-right font-semibold">Revenu</th>
                          <th className="px-4 py-3 text-right font-semibold">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.summary.topProducts.map((product, i) => (
                          <tr key={product.productId} className="border-b border-border last:border-0 hover:bg-muted/30 dark:hover:bg-gray-800/30 transition-colors">
                            <td className="px-4 py-3 font-medium">{product.productName}</td>
                            <td className="px-4 py-3 text-right">{product.quantity}</td>
                            <td className="px-4 py-3 text-right font-semibold text-teal-700 dark:text-teal-400">{formatCurrency(product.revenue)}</td>
                            <td className="px-4 py-3 text-right">{product.percentage.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Ventes par jour</h3>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm" role="table" aria-label="Ventes par jour">
                      <thead className="bg-muted/50 dark:bg-gray-800/50 border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Date</th>
                          <th className="px-4 py-3 text-right font-semibold">Ventes</th>
                          <th className="px-4 py-3 text-right font-semibold">Revenu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.dailyBreakdown.map((day, i) => (
                          <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 dark:hover:bg-gray-800/30 transition-colors">
                            <td className="px-4 py-3">{new Date(day.date).toLocaleDateString('fr-FR')}</td>
                            <td className="px-4 py-3 text-right">{day.sales}</td>
                            <td className="px-4 py-3 text-right font-semibold text-teal-700 dark:text-teal-400">{formatCurrency(day.revenue)}</td>
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
                  <Card className="rounded-xl border shadow-sm bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Restaurants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{report.summary.totalRestaurants}</div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border shadow-sm bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Produits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{report.summary.totalProducts}</div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border shadow-sm bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total ventes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{report.summary.totalSales}</div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border shadow-sm bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Revenu moyen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{formatCurrency(report.summary.averageRevenuePerRestaurant)}</div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Performance par restaurant</h3>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm" role="table" aria-label="Performance par restaurant">
                      <thead className="bg-muted/50 dark:bg-gray-800/50 border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Restaurant</th>
                          <th className="px-4 py-3 text-right font-semibold">Ventes</th>
                          <th className="px-4 py-3 text-right font-semibold">Revenu</th>
                          <th className="px-4 py-3 text-left font-semibold">Top produit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.restaurants.map((restaurant) => (
                          <tr key={restaurant.restaurantId} className="border-b border-border last:border-0 hover:bg-muted/30 dark:hover:bg-gray-800/30 transition-colors">
                            <td className="px-4 py-3 font-medium">{restaurant.restaurantName}</td>
                            <td className="px-4 py-3 text-right">{restaurant.sales}</td>
                            <td className="px-4 py-3 text-right font-semibold text-teal-700 dark:text-teal-400">{formatCurrency(restaurant.revenue)}</td>
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
                      <div className="rounded-xl border border-border p-6 text-center text-muted-foreground">
                        <p>Aucun ingrédient trouvé pour ce restaurant.</p>
                        <p className="text-sm mt-2">Créez des ingrédients dans la section "Ingrédients" pour les voir apparaître ici.</p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border overflow-hidden">
                        <table className="w-full text-sm" role="table" aria-label="Inventaire par ingrédient">
                          <thead className="bg-muted/50 dark:bg-gray-800/50 border-b border-border">
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
                              <tr key={ing.ingredientId} className="border-b border-border last:border-0 hover:bg-muted/30 dark:hover:bg-gray-800/30 transition-colors">
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
                                          : 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
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
                  <Card className="rounded-xl border shadow-sm bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{report.summary.totalRecommendations}</div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border shadow-sm bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Acceptées</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{report.summary.accepted}</div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border shadow-sm bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{report.summary.pending}</div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border shadow-sm bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Économies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{formatCurrency(report.summary.totalEstimatedSavings)}</div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Recommandations</h3>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm" role="table" aria-label="Liste des recommandations">
                      <thead className="bg-muted/50 dark:bg-gray-800/50 border-b border-border">
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
                          <tr key={rec.id} className="border-b border-border last:border-0 hover:bg-muted/30 dark:hover:bg-gray-800/30 transition-colors">
                            <td className="px-4 py-3">{rec.type}</td>
                            <td className="px-4 py-3 font-medium">{rec.restaurantName}</td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                                  rec.priority === 'high'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                    : rec.priority === 'medium'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                                    : 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
                                }`}
                              >
                                {rec.priority}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                                  rec.status === 'accepted'
                                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
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
                            <td className="px-4 py-3 text-right font-semibold text-teal-700 dark:text-teal-400">{formatCurrency(rec.estimatedSavings)}</td>
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
                  <Card className="rounded-xl border shadow-sm bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{report.summary.totalAlerts}</div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border shadow-sm bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Critiques</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-700 dark:text-red-400">{report.summary.critical}</div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border shadow-sm bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Élevées</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-700 dark:text-orange-400">{report.summary.high}</div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border shadow-sm bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Moyennes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{report.summary.medium}</div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border shadow-sm bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Résolues</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{report.summary.resolved}</div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Alertes</h3>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm" role="table" aria-label="Liste des alertes">
                      <thead className="bg-muted/50 dark:bg-gray-800/50 border-b border-border">
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
                          <tr key={alert.id} className="border-b border-border last:border-0 hover:bg-muted/30 dark:hover:bg-gray-800/30 transition-colors">
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
                                    : 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
                                }`}
                              >
                                {severityLabels[alert.severity] || alert.severity}
                              </span>
                            </td>
                            <td className="px-4 py-3">{alert.message}</td>
                            <td className="px-4 py-3 text-center">
                              {alert.resolved ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
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
                  <Card className="rounded-xl border shadow-sm bg-card">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">Ventes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Total ventes</p>
                        <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">{report.sales.totalSales}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Revenu total</p>
                        <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">{formatCurrency(report.sales.totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Moyenne par jour</p>
                        <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">{formatCurrency(report.sales.averagePerDay)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-xl border shadow-sm bg-card">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">Recommandations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">{report.recommendations.total}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Acceptées</p>
                        <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">{report.recommendations.accepted}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Économies estimées</p>
                        <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">{formatCurrency(report.recommendations.estimatedSavings)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-xl border shadow-sm bg-card">
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
                        <p className="text-2xl font-bold text-red-700 dark:text-red-400">{report.alerts.critical}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Résolues</p>
                        <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">{report.alerts.resolved}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Top produits</h3>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm" role="table" aria-label="Top produits du rapport récapitulatif">
                      <thead className="bg-muted/50 dark:bg-gray-800/50 border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Produit</th>
                          <th className="px-4 py-3 text-right font-semibold">Quantité</th>
                          <th className="px-4 py-3 text-right font-semibold">Revenu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.topProducts.map((product) => (
                          <tr key={product.productId} className="border-b border-border last:border-0 hover:bg-muted/30 dark:hover:bg-gray-800/30 transition-colors">
                            <td className="px-4 py-3 font-medium">{product.productName}</td>
                            <td className="px-4 py-3 text-right">{product.quantity}</td>
                            <td className="px-4 py-3 text-right font-semibold text-teal-700 dark:text-teal-400">{formatCurrency(product.revenue)}</td>
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
    </main>
  )
}
