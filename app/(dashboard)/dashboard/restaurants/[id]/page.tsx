import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Edit, Trash2, TrendingUp, Bell, Package } from 'lucide-react'
import { DeleteRestaurantButton } from '@/components/restaurants/delete-restaurant-button'

// Force dynamic rendering pour les pages avec authentification
export const dynamic = 'force-dynamic'

export default async function RestaurantDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const organization = await getCurrentOrganization()

  if (!organization) {
    redirect('/dashboard')
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: {
      id: params.id,
      organizationId: organization.id,
    },
    include: {
      _count: {
        select: {
          sales: true,
          alerts: {
            where: {
              resolved: false,
            },
          },
          inventory: true,
        },
      },
    },
  })

  if (!restaurant) {
    notFound()
  }

  // Statistiques récentes
  const recentSales = await prisma.sale.findMany({
    where: {
      restaurantId: restaurant.id,
      saleDate: {
        gte: new Date(new Date().setDate(new Date().getDate() - 7)),
      },
    },
    include: {
      product: true,
    },
    orderBy: {
      saleDate: 'desc',
    },
    take: 10,
  })

  const totalRevenue = recentSales.reduce((sum, sale) => sum + sale.amount, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{restaurant.name}</h1>
          <p className="text-muted-foreground">
            {restaurant.address || 'Aucune adresse'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/restaurants/${restaurant.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Link>
          </Button>
          <DeleteRestaurantButton restaurantId={restaurant.id} restaurantName={restaurant.name} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventes totales
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{restaurant._count.sales}</div>
            <p className="text-xs text-muted-foreground">
              Toutes périodes confondues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Chiffre d&apos;affaires (7j)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              }).format(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Sur les 7 derniers jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertes actives
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{restaurant._count.alerts}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent une attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Articles en stock
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{restaurant._count.inventory}</div>
            <p className="text-xs text-muted-foreground">
              Ingrédients suivis
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Fuseau horaire:</span>
              <span className="text-sm font-medium">{restaurant.timezone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Créé le:</span>
              <span className="text-sm font-medium">{formatDate(restaurant.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ventes récentes</CardTitle>
            <CardDescription>
              Les 10 dernières ventes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentSales.length > 0 ? (
              <div className="space-y-2">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium">{sale.product.name}</span>
                      <span className="text-muted-foreground ml-2">
                        x{sale.quantity}
                      </span>
                    </div>
                    <span className="font-medium">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(sale.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune vente récente
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
