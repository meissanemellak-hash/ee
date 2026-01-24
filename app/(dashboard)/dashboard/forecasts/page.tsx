import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ForecastsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Prévisions</h1>
          <p className="text-muted-foreground">
            Prévisions de ventes et analyses prédictives
          </p>
        </div>
        <Button>Générer des prévisions</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prévisions à venir</CardTitle>
          <CardDescription>
            Visualisez les prévisions de ventes pour vos restaurants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Les prévisions seront affichées ici une fois générées.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
