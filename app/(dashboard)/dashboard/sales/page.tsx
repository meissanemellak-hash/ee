import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SalesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analyse des ventes</h1>
          <p className="text-muted-foreground">
            Visualisez et analysez vos données de ventes
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sales/import">Importer des ventes</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Import de données</CardTitle>
            <CardDescription>
              Importez vos ventes depuis un fichier CSV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/sales/import">Importer un CSV</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analyse</CardTitle>
            <CardDescription>
              Visualisez vos ventes par jour, heure, restaurant et produit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/dashboard/sales/analyze">Voir l&apos;analyse</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
