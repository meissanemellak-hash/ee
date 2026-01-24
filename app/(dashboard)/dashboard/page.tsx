import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const organization = await getCurrentOrganization()
  
  // Si l'organisation n'existe pas, afficher un message pour utiliser le mode démo
  if (!organization) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenue dans votre espace de gestion
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Organisation non configurée</CardTitle>
            <CardDescription>
              Pour commencer, vous devez créer une organisation ou charger des données de démonstration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Le mode démo vous permet de tester toutes les fonctionnalités avec des données réalistes :
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>3 restaurants</li>
              <li>30 produits avec recettes</li>
              <li>25 ingrédients</li>
              <li>90 jours de ventes</li>
              <li>Recommandations et alertes automatiques</li>
            </ul>
            <div className="pt-4">
              <Link href="/dashboard/demo">
                <Button>Charger les données de démonstration</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Récupérer les statistiques globales
  const restaurants = await prisma.restaurant.findMany({
    where: { organizationId: organization.id },
  })

  const totalSales = await prisma.sale.count({
    where: {
      restaurant: {
        organizationId: organization.id,
      },
      saleDate: {
        gte: new Date(new Date().setDate(new Date().getDate() - 30)),
      },
    },
  })

  const totalRevenue = await prisma.sale.aggregate({
    where: {
      restaurant: {
        organizationId: organization.id,
      },
      saleDate: {
        gte: new Date(new Date().setDate(new Date().getDate() - 30)),
      },
    },
    _sum: {
      amount: true,
    },
  })

  const activeAlerts = await prisma.alert.count({
    where: {
      restaurant: {
        organizationId: organization.id,
      },
      resolved: false,
      severity: {
        in: ['high', 'critical'],
      },
    },
  })

  const pendingRecommendations = await prisma.recommendation.count({
    where: {
      restaurant: {
        organizationId: organization.id,
      },
      status: 'pending',
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble de vos opérations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Restaurants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{restaurants.length}</div>
            <p className="text-xs text-muted-foreground">
              Établissements actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventes (30j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Chiffre d&apos;affaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue._sum.amount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Sur les 30 derniers jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertes actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent une attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recommandations en attente</CardTitle>
            <CardDescription>
              Actions recommandées pour optimiser vos opérations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRecommendations}</div>
            <p className="text-sm text-muted-foreground mt-2">
              <a href="/dashboard/recommendations" className="text-primary hover:underline">
                Voir toutes les recommandations →
              </a>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Restaurants</CardTitle>
            <CardDescription>
              Liste de vos établissements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {restaurants.slice(0, 5).map((restaurant) => (
                <div key={restaurant.id} className="flex justify-between items-center">
                  <span className="font-medium">{restaurant.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {restaurant.address || 'Aucune adresse'}
                  </span>
                </div>
              ))}
              {restaurants.length > 5 && (
                <p className="text-sm text-muted-foreground">
                  +{restaurants.length - 5} autres restaurants
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              <a href="/dashboard/restaurants" className="text-primary hover:underline">
                Gérer les restaurants →
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
