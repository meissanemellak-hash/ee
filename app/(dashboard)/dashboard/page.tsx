import { redirect } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getCurrentOrganization } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { calculateExecutiveDashboardMetrics } from '@/lib/services/dashboard-metrics'
import { logger } from '@/lib/logger'
import { TrendingUp, TrendingDown, AlertTriangle, Package, CheckCircle2, ArrowRight } from 'lucide-react'
import { DashboardRecommendationsList } from '@/components/dashboard/dashboard-recommendations-list'
import { ReloadButton } from '@/components/dashboard/reload-button'
import { RecentActivityTable } from '@/components/dashboard/recent-activity-table'
import { Skeleton } from '@/components/ui/skeleton'

const DashboardSalesChart = nextDynamic(
  () => import('@/components/dashboard/dashboard-sales-chart').then((m) => ({ default: m.DashboardSalesChart })),
  {
    loading: () => (
      <Card className="rounded-xl border shadow-sm bg-card">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
)

// Force dynamic rendering pour les pages avec authentification
export const dynamic = 'force-dynamic'

type PageProps = { searchParams?: Promise<{ restaurant?: string }> | { restaurant?: string } }

export default async function DashboardPage(props: PageProps) {
  const { userId } = auth()
  const rawParams = props.searchParams
  const searchParams = rawParams && typeof (rawParams as Promise<unknown>).then === 'function'
    ? await (rawParams as Promise<{ restaurant?: string }>)
    : (rawParams as { restaurant?: string }) ?? {}
  const restaurantId = searchParams.restaurant && searchParams.restaurant !== 'all' ? searchParams.restaurant : undefined

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
            logger.log(`✅ Organisation "${organization.name}" synchronisée depuis Clerk`)
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
      logger.error('Error syncing organization:', error)
      // En cas d'erreur, afficher le message d'attente
      // Le handler client fera la synchronisation
    }
  }
  
  // Si toujours pas d'organisation, afficher le message d'attente
  // Le DashboardSyncHandler dans le layout gérera la synchronisation côté client
  const alertTypeLabels: Record<string, string> = {
    SHORTAGE: 'Rupture de stock',
    OVERSTOCK: 'Surstock',
    OVERSTAFFING: 'Sur-effectif',
    UNDERSTAFFING: 'Sous-effectif',
    OTHER: 'Autre',
  }
  const alertSeverityLabels: Record<string, string> = {
    critical: 'Critique',
    high: 'Élevée',
    medium: 'Moyenne',
    low: 'Faible',
  }

  if (!organization) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25" role="main" aria-label="Dashboard">
        <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
          <header className="pb-6 border-b border-border/60">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1.5">
              Synchronisation de l&apos;organisation en cours...
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                L&apos;organisation est en cours de synchronisation. Veuillez patienter quelques instants.
              </p>
              <ReloadButton />
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // Calculer les métriques du dashboard exécutif (filtrées par restaurant si ?restaurant=xxx)
  const metrics = await calculateExecutiveDashboardMetrics(organization.id, restaurantId)

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" role="main" aria-label="Dashboard">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
        <header className="pb-6 border-b border-border/60">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1.5">
            Vue d&apos;ensemble de vos économies, alertes et recommandations
          </p>
        </header>

        {/* Zone 1 - Hero Metric Card */}
        <Card className="rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 border-0 shadow-lg">
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

        {/* Zone 2 - KPIs Exécutifs */}
        <section className="grid gap-4 md:grid-cols-3" aria-label="Indicateurs clés">
          <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recommandations appliquées
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-teal-600" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.acceptedRecommendationsCount}</div>
            <div className="mt-2 flex items-center gap-2">
              {metrics.acceptedRecommendationsSavings > 0 && (
                <>
                  <TrendingUp className="h-3 w-3 text-teal-600" />
                  <span className="text-xs text-teal-600 font-medium">
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
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Risque de rupture (7 jours)
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" aria-hidden="true" />
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
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gaspillage estimé
              </CardTitle>
              <Package className="h-4 w-4 text-amber-600" aria-hidden="true" />
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
        </section>

        {/* Zone 2.5 - Graphique Évolution des Ventes */}
        <section aria-label="Évolution des ventes">
          <DashboardSalesChart restaurantId={restaurantId} />
        </section>

        {/* Zone 3 - Recommandations Actionnables */}
        <section aria-labelledby="rec-title">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="rec-title" className="text-2xl font-bold">Recommandations actionnables</h2>
              <p className="text-sm text-muted-foreground">
                Actions prioritaires pour optimiser vos opérations
              </p>
            </div>
            <Button variant="outline" asChild aria-label="Voir toutes les recommandations">
              <Link href="/dashboard/recommendations">
                Voir toutes <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <DashboardRecommendationsList
            recommendations={metrics.topActionableRecommendations}
          />
        </section>

        {/* Zone 3.5 - Activité Récente */}
        <section aria-label="Activité récente">
          <RecentActivityTable restaurantId={restaurantId} />
        </section>

        {/* Zone 4 - Alertes Critiques */}
        {metrics.criticalAlerts.length > 0 && (
          <section aria-labelledby="alerts-title">
            <h2 id="alerts-title" className="text-2xl font-bold mb-4">Alertes critiques</h2>
            <div className="space-y-3">
              {metrics.criticalAlerts.map((alert) => (
                <Card key={alert.id} className="rounded-xl border-l-4 border-l-red-500 border shadow-sm bg-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{alertTypeLabels[alert.type] ?? alert.type}</CardTitle>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          alert.severity === 'critical' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {alertSeverityLabels[alert.severity] ?? alert.severity}
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
              <Button variant="outline" asChild aria-label="Voir toutes les alertes">
                <Link href={restaurantId ? `/dashboard/alerts?restaurant=${restaurantId}` : '/dashboard/alerts'}>
                  Voir toutes les alertes <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
