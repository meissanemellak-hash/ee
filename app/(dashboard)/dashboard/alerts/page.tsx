import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'

const severityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

export default async function AlertsPage() {
  const organization = await getCurrentOrganization()

  if (!organization) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Alertes</h1>
          <p className="text-muted-foreground">
            Alertes nécessitant votre attention
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

  const alerts = await prisma.alert.findMany({
    where: {
      restaurant: {
        organizationId: organization.id,
      },
      resolved: false,
    },
    include: {
      restaurant: true,
    },
    orderBy: [
      { severity: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 50,
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alertes</h1>
        <p className="text-muted-foreground">
          Alertes nécessitant votre attention
        </p>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card key={alert.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{alert.type}</CardTitle>
                  <CardDescription>
                    {alert.restaurant.name} • {formatDateTime(alert.createdAt)}
                  </CardDescription>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    severityColors[alert.severity as keyof typeof severityColors] || severityColors.medium
                  }`}
                >
                  {alert.severity}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p>{alert.message}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {alerts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Aucune alerte active. Tout va bien !
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
