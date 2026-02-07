'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { translateApiError } from '@/lib/translate-api-error'
import { Upload, FileText, CheckCircle2, XCircle, Loader2, ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import Papa from 'papaparse'
import { useRestaurant } from '@/lib/react-query/hooks/use-restaurants'
import { useImportInventory } from '@/lib/react-query/hooks/use-inventory'
import { useUserRole } from '@/lib/react-query/hooks/use-user-role'
import { permissions } from '@/lib/roles'
import { Skeleton } from '@/components/ui/skeleton'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

const INVENTORY_CSV_TEMPLATE =
  '\uFEFFingrédient,stock_actuel,seuil_min,seuil_max\nOignon,40000,50000,35000\nViande,5000,3000,10000\ntomate,2000,1000,5000'

export default function ImportInventoryPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const restaurantId = params?.id as string | undefined

  const { data: restaurant, isLoading: loadingRestaurant } = useRestaurant(restaurantId)
  const importInventory = useImportInventory(restaurantId)
  const { data: roleData, isFetched: roleFetched } = useUserRole()
  const currentRole = roleData ?? 'staff'
  const canImport = permissions.canImportInventory(currentRole)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const handleDownloadTemplate = useCallback(() => {
    const blob = new Blob([INVENTORY_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'modele_import_inventaire.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast({
      title: 'Modèle téléchargé',
      description: 'Remplissez le fichier avec les ingrédients et stocks, puis importez-le.',
    })
  }, [toast])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (!selectedFile) return
      if (!selectedFile.name.endsWith('.csv')) {
        toast({
          title: 'Format invalide',
          description: 'Veuillez sélectionner un fichier CSV',
          variant: 'destructive',
        })
        return
      }
      setFile(selectedFile)
      setPreview([])
      setErrors([])
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setErrors(results.errors.map((e) => `Ligne ${e.row}: ${e.message}`))
          }
          setPreview(results.data.slice(0, 10) as Record<string, string>[])
        },
        error: (error) => {
          toast({
            title: 'Erreur de lecture',
            description: translateApiError(error.message),
            variant: 'destructive',
          })
        },
      })
    },
    [toast]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile && droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile)
        setPreview([])
        setErrors([])
        Papa.parse(droppedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              setErrors(results.errors.map((e) => `Ligne ${e.row}: ${e.message}`))
            }
            setPreview(results.data.slice(0, 10) as Record<string, string>[])
          },
          error: (error) => {
            toast({
              title: 'Erreur de lecture',
              description: translateApiError(error.message),
              variant: 'destructive',
            })
          },
        })
      } else {
        toast({
          title: 'Format invalide',
          description: 'Veuillez déposer un fichier CSV',
          variant: 'destructive',
        })
      }
    },
    [toast]
  )

  const handleSubmit = () => {
    if (!file) {
      toast({
        title: 'Fichier manquant',
        description: 'Veuillez sélectionner un fichier CSV',
        variant: 'destructive',
      })
      return
    }
    if (!restaurantId) {
      toast({
        title: 'Restaurant manquant',
        description: 'Impossible de déterminer le restaurant.',
        variant: 'destructive',
      })
      return
    }
    importInventory.mutate(
      { file },
      {
        onSuccess: () => {
          router.push(`/dashboard/restaurants/${restaurantId}/inventory`)
        },
      }
    )
  }

  if (!isLoaded || !organization?.id) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Chargement...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!restaurantId || (loadingRestaurant && !restaurant)) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">Restaurant introuvable.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/dashboard/restaurants">Retour aux restaurants</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (!roleFetched || !canImport) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <header className="pb-6 border-b border-border/60">
            <h1 className="text-3xl font-bold tracking-tight">Import d&apos;inventaire</h1>
          </header>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-16 text-center space-y-4">
              <p className="text-muted-foreground">
                Vous n&apos;avez pas accès à cette page. L&apos;import est réservé aux managers et administrateurs.
              </p>
              <Button asChild variant="outline">
                <Link href={restaurantId ? `/dashboard/restaurants/${restaurantId}/inventory` : '/dashboard/restaurants'}>
                  Retour à l&apos;inventaire
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Importer l'inventaire depuis un fichier CSV">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Restaurants', href: '/dashboard/restaurants' },
            { label: restaurant?.name ?? '...', href: `/dashboard/restaurants/${restaurantId}` },
            { label: 'Inventaire', href: `/dashboard/restaurants/${restaurantId}/inventory` },
            { label: 'Import' },
          ]}
        />
        <header className="flex items-center gap-4 pb-6 border-b border-border/60">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild aria-label="Retour à l'inventaire">
            <Link href={`/dashboard/restaurants/${restaurantId}/inventory`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0" aria-hidden>
                <Upload className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Importer l&apos;inventaire</h1>
            </div>
            <p className="text-muted-foreground">
              {restaurant ? restaurant.name : 'Chargement...'} — Colonnes : ingrédient, stock_actuel, seuil_min, seuil_max
            </p>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Configuration</CardTitle>
              <CardDescription className="mt-1">
                Sélectionnez le fichier CSV à importer. Les ingrédients doivent exister dans votre catalogue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Fichier CSV *</Label>
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      document.getElementById('file-upload')?.click()
                    }
                  }}
                  aria-label="Glisser-déposer un fichier CSV ou cliquer pour sélectionner"
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-teal-500 dark:hover:border-teal-600 transition-colors cursor-pointer bg-muted/30 dark:bg-gray-800/30"
                >
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    aria-label="Sélectionner un fichier CSV"
                  />
                  {file ? (
                    <div className="space-y-2" onClick={() => document.getElementById('file-upload')?.click()}>
                      <CheckCircle2 className="h-12 w-12 text-teal-600 dark:text-teal-400 mx-auto" />
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  ) : (
                    <label htmlFor="file-upload" className="cursor-pointer block space-y-2">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                      <p className="font-medium">Glissez-déposez un fichier CSV ou cliquez pour sélectionner</p>
                      <p className="text-sm text-muted-foreground">ingrédient, stock_actuel, seuil_min, seuil_max</p>
                    </label>
                  )}
                </div>
              </div>

              {errors.length > 0 && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4" role="alert">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300">Erreurs détectées ({errors.length})</p>
                  </div>
                  <ul className="text-xs text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
                    {errors.slice(0, 5).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {errors.length > 5 && <li>... et {errors.length - 5} autres</li>}
                  </ul>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!file || importInventory.isPending}
                className="w-full shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0"
              >
                {importInventory.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Importer l&apos;inventaire
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Prévisualisation</CardTitle>
              <CardDescription className="mt-1">Aperçu des 10 premières lignes</CardDescription>
            </CardHeader>
            <CardContent>
              {preview.length > 0 ? (
                <div className="space-y-2">
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm" role="table" aria-label="Aperçu CSV">
                      <thead className="bg-muted/50 dark:bg-gray-800/50 border-b border-border">
                        <tr>
                          {Object.keys(preview[0]).map((key) => (
                            <th key={key} className="px-3 py-2 text-left font-semibold">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, i) => (
                          <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 dark:hover:bg-gray-800/30">
                            {Object.values(row).map((value, j) => (
                              <td key={j} className="px-3 py-2">{value || '-'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground">Affichage des 10 premières lignes</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-8 w-8 text-teal-600 dark:text-teal-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-1">Aucun fichier sélectionné</h3>
                  <p className="text-sm text-muted-foreground">Sélectionnez un CSV pour voir l&apos;aperçu</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold">Format CSV attendu</CardTitle>
                <CardDescription className="mt-1">
                  Colonnes : ingrédient, stock_actuel, seuil_min, seuil_max (optionnel). Les ingrédients doivent exister.
                </CardDescription>
              </div>
              <Button type="button" className="shrink-0 rounded-xl bg-teal-600 hover:bg-teal-700 text-white border-0 shadow-sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger le modèle CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-muted/30 dark:bg-gray-800/30 border border-border p-4 font-mono text-xs space-y-2">
              <p><strong>ingrédient</strong> : Nom de l&apos;ingrédient (doit exister)</p>
              <p><strong>stock_actuel</strong> : Stock actuel (nombre)</p>
              <p><strong>seuil_min</strong> : Seuil minimum d&apos;alerte</p>
              <p><strong>seuil_max</strong> : Seuil maximum (optionnel)</p>
            </div>
            <div className="mt-4 rounded-xl border border-teal-200/60 dark:border-teal-800/40 p-4 bg-teal-50/50 dark:bg-teal-900/10">
              <p className="text-xs font-semibold mb-2 text-teal-800 dark:text-teal-300">Exemple :</p>
              <pre className="text-xs bg-muted/50 dark:bg-gray-800/50 p-3 rounded-lg border border-border overflow-x-auto" aria-hidden>
                {`ingrédient,stock_actuel,seuil_min,seuil_max
Oignon,40000,50000,35000
Viande,5000,3000,10000`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
