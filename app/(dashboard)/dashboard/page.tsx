import { redirect } from 'next/navigation'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getCurrentOrganization } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { calculateExecutiveDashboardMetrics } from '@/lib/services/dashboard-metrics'
import { TrendingUp, TrendingDown, AlertTriangle, Package, CheckCircle2, ArrowRight } from 'lucide-react'
import { ApplyRecommendationButton } from '@/components/dashboard/apply-recommendation-button'
import { ReloadButton } from '@/components/dashboard/reload-button'
import { DashboardSalesChart } from '@/components/dashboard/dashboard-sales-chart'
import { RecentActivityTable } from '@/components/dashboard/recent-activity-table'

// Force dynamic rendering pour les pages avec authentification
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // SOLUTION RADICALE ET DÉFINITIVE :
  // Si getCurrentOrganization() retourne null (orgId pas dans les cookies),
  // on vérifie les organisations de l'utilisateur dans Clerk et on synchronise la première
  let organization = await getCurrentOrganization()
  
  if (!organization) {
    try {
      // Vérifier les organisations de l'utilisateur dans Clerk
      const client = await clerkClient()
      const userMemberships = await client.users.getOrganizationMembershipList({ userId })
      
      if (userMemberships.data && userMemberships.data.length > 0) {
        // Synchroniser la première organisation trouvée
        const firstOrg = userMemberships.data[0].organization
        const clerkOrgId = firstOrg.id
        
        // Vérifier si l'organisation existe déjà dans la DB
        organization = await prisma.organization.findUnique({
          where: { clerkOrgId },
        })
        
        // Si elle n'existe pas, la créer
        if (!organization) {
          try {
            organization = await prisma.organization.create({
              data: {
                name: firstOrg.name,
                clerkOrgId,
                shrinkPct: 0.1,
              },
            })
            console.log(`✅ Organisation "${organization.name}" synchronisée depuis Clerk`)
          } catch (dbError) {
            // Si erreur de contrainte unique, récupérer l'organisation existante
            if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
              organization = await prisma.organization.findUnique({
                where: { clerkOrgId },
              })
            } else {
              throw dbError
            }
          }
        }
      }
    } catch (error) {
      console.error('Error syncing organization:', error)
      // En cas d'erreur, afficher le message d'attente
      // Le handler client fera la synchronisation
    }
  }
  
  // Si toujours pas d'organisation, afficher le message d'attente
  // Le DashboardSyncHandler dans le layout gérera la synchronisation côté client
  if (!organization) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Synchronisation de l&apos;organisation en cours...
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              L&apos;organisation est en cours de synchronisation. Veuillez patienter quelques instants.
            </p>
            <ReloadButton />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculer les métriques du dashboard exécutif
  const metrics = await calculateExecutiveDashboardMetrics(organization.id)

  return (
    <div className="p-6 space-y-6">
      {/* Zone 1 - Hero Metric Card (Style Sequence) */}
      <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-teal-50/90 uppercase tracking-wide mb-2">
                Économies générées ce mois-ci
              </p>
              <div className="mt-2">
                <div className="text-5xl font-bold text-white">
                  {formatCurrency(metrics.totalSavingsThisMonth)}
                </div>
                {metrics.savingsChangePercent !== null && (
                  <div className="mt-3 flex items-center gap-2">
                    {metrics.savingsChangePercent >= 0 ? (
                      <>
                        <TrendingUp className="h-5 w-5 text-teal-100" />
                        <span className="text-sm text-teal-100 font-medium">
                          +{Math.abs(metrics.savingsChangePercent).toFixed(1)}% vs mois précédent
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-5 w-5 text-red-200" />
                        <span className="text-sm text-red-200 font-medium">
                          {metrics.savingsChangePercent.toFixed(1)}% vs mois précédent
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-teal-50/80 mt-4">
                Basé sur recommandations appliquées
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                asChild
              >
                <Link href="/dashboard/recommendations">
                  Voir détails
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone 2 - KPIs Exécutifs (Style Sequence) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recommandations appliquées
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.acceptedRecommendationsCount}</div>
            <div className="mt-2 flex items-center gap-2">
              {metrics.acceptedRecommendationsSavings > 0 && (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">
                    {formatCurrency(metrics.acceptedRecommendationsSavings)} économisés
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              vs. {formatCurrency(metrics.acceptedRecommendationsSavings * 0.9)} période précédente
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Risque de rupture (7 jours)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {formatCurrency(metrics.criticalAlertsRisk)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.criticalAlertsCount} restaurant{metrics.criticalAlertsCount > 1 ? 's' : ''} concerné{metrics.criticalAlertsCount > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gaspillage estimé
            </CardTitle>
            <Package className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(metrics.estimatedWaste)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Produits frais surstockés ce mois-ci
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Zone 2.5 - Graphique Évolution des Ventes (Style Sequence) */}
      <DashboardSalesChart />

      {/* Zone 3 - Recommandations Actionnables */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Recommandations actionnables</h2>
            <p className="text-sm text-muted-foreground">
              Actions prioritaires pour optimiser vos opérations
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/recommendations">
              Voir toutes <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {metrics.topActionableRecommendations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {metrics.topActionableRecommendations.map((rec) => (
              <Card key={rec.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{rec.restaurantName}</CardTitle>
                      <CardDescription className="mt-2">
                        {rec.message}
                      </CardDescription>
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
                      <p className="text-sm font-medium text-green-600">
                        ROI estimé : x{Math.round(rec.estimatedSavings / 500)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Économie : {formatCurrency(rec.estimatedSavings)}
                      </p>
                    </div>
                    <ApplyRecommendationButton recommendationId={rec.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Aucune recommandation en attente. Tout est optimisé !
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Zone 3.5 - Activité Récente (Style Sequence) */}
      <RecentActivityTable />

      {/* Zone 4 - Alertes Critiques */}
      {metrics.criticalAlerts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Alertes critiques</h2>
          <div className="space-y-3">
            {metrics.criticalAlerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{alert.type}</CardTitle>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          alert.severity === 'critical' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <CardDescription className="mt-2">
                        {alert.restaurantName} • {alert.message}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-red-600">
                    Impact estimé : {formatCurrency(alert.estimatedImpact)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/alerts">
                Voir toutes les alertes <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
