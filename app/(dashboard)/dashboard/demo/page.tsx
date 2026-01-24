'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Database, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function DemoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleGenerateDemo = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/demo/generate', {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la génération')
      }

      toast({
        title: 'Données de démonstration créées',
        description: `${result.restaurants} restaurants, ${result.products} produits, ${result.ingredients} ingrédients et 90 jours de ventes générés.`,
      })

      // Rediriger vers le dashboard après un court délai
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDemo = async () => {
    setDeleting(true)

    try {
      const response = await fetch('/api/demo/delete', {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la suppression')
      }

      toast({
        title: 'Données supprimées',
        description: 'Toutes les données de démonstration ont été supprimées.',
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mode Démonstration</h1>
        <p className="text-muted-foreground">
          Générez des données de test pour explorer le système
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Générer les données de démonstration
            </CardTitle>
            <CardDescription>
              Créez automatiquement une organisation complète avec des données réalistes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">Les données générées incluent :</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>1 organisation de démonstration</li>
                <li>3 restaurants</li>
                <li>30 produits avec leurs recettes (BOM)</li>
                <li>25 ingrédients avec packs fournisseurs</li>
                <li>90 jours de ventes réalistes</li>
                <li>Stocks initiaux pour chaque restaurant</li>
                <li>Recommandations et alertes générées automatiquement</li>
              </ul>
            </div>

            <Button
              onClick={handleGenerateDemo}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Load demo data
                </>
              )}
            </Button>

            {loading && (
              <p className="text-xs text-muted-foreground text-center">
                Cette opération peut prendre quelques minutes...
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Supprimer les données de démonstration
            </CardTitle>
            <CardDescription>
              Supprime complètement toutes les données de démonstration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-destructive/10 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">
                    Action irréversible
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cette action supprimera définitivement toutes les données de démonstration,
                    y compris les restaurants, produits, ingrédients, ventes, recommandations et alertes.
                  </p>
                </div>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={deleting}
                  className="w-full"
                  size="lg"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer les données démo
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Toutes les données de démonstration seront
                    définitivement supprimées, y compris :
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>L&apos;organisation de démonstration</li>
                      <li>Tous les restaurants</li>
                      <li>Tous les produits et recettes</li>
                      <li>Tous les ingrédients</li>
                      <li>Toutes les ventes (90 jours)</li>
                      <li>Toutes les recommandations et alertes</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteDemo}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Supprimer définitivement
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>À propos du mode démonstration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm">
              Le mode démonstration vous permet de tester toutes les fonctionnalités du système
              avec des données réalistes sans avoir à configurer manuellement votre organisation.
            </p>
            <p className="text-sm text-muted-foreground">
              Une fois les données générées, vous pouvez :
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Explorer le dashboard avec des statistiques réelles</li>
              <li>Consulter les recommandations d&apos;ingrédients basées sur les recettes</li>
              <li>Analyser les ventes sur 90 jours</li>
              <li>Voir les alertes générées automatiquement</li>
              <li>Générer de nouvelles recommandations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
