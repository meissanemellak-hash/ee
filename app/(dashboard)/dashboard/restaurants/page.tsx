import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function RestaurantsPage() {
  const organization = await getCurrentOrganization()

  if (!organization) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Restaurants</h1>
          <p className="text-muted-foreground">
            Gérez vos établissements
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Aucune organisation configurée. Utilisez le mode démo pour générer des données de test.
            </p>
            <Button asChild>
              <Link href="/dashboard/demo">Charger les données de démonstration</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const restaurants = await prisma.restaurant.findMany({
    where: { organizationId: organization.id },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          sales: true,
          alerts: {
            where: {
              resolved: false,
            },
          },
        },
      },
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Restaurants</h1>
          <p className="text-muted-foreground">
            Gérez vos établissements
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/restaurants/new">Ajouter un restaurant</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {restaurants.map((restaurant) => (
          <Card key={restaurant.id}>
            <CardHeader>
              <CardTitle>{restaurant.name}</CardTitle>
              <CardDescription>
                {restaurant.address || 'Aucune adresse'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ventes totales:</span>
                  <span className="font-medium">{restaurant._count.sales}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Alertes actives:</span>
                  <span className={`font-medium ${restaurant._count.alerts > 0 ? 'text-destructive' : ''}`}>
                    {restaurant._count.alerts}
                  </span>
                </div>
                <div className="pt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/dashboard/restaurants/${restaurant.id}`}>
                      Voir les détails
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {restaurants.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Aucun restaurant pour le moment. Créez votre premier restaurant pour commencer.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/restaurants/new">Ajouter un restaurant</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
