import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rapports</h1>
          <p className="text-muted-foreground">
            Rapports et analyses détaillées
          </p>
        </div>
        <Button>Générer un rapport</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rapports disponibles</CardTitle>
          <CardDescription>
            Consultez et exportez vos rapports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Les rapports seront disponibles ici.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
