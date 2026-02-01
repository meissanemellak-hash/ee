'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Upload, FileText, CheckCircle2, XCircle, Loader2, ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import Papa from 'papaparse'
import { useImportRestaurants } from '@/lib/react-query/hooks/use-restaurants'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

interface CSVRow {
  nom?: string
  name?: string
  adresse?: string
  address?: string
  fuseau?: string
  timezone?: string
  [key: string]: string | undefined
}

/** Modèle CSV pour l'import des restaurants (UTF-8 avec BOM, colonnes en français) */
const RESTAURANTS_CSV_TEMPLATE =
  '\uFEFFnom,adresse,fuseau\nRestaurant Paris Centre,12 rue de la Paix 75002 Paris,Europe/Paris\nRestaurant Lyon,5 place Bellecour 69002 Lyon,Europe/Paris\nRestaurant Marseille,1 Canebière 13001 Marseille,Europe/Paris'

export default function ImportRestaurantsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CSVRow[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const importRestaurants = useImportRestaurants()

  const handleDownloadTemplate = useCallback(() => {
    const blob = new Blob([RESTAURANTS_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'modele_import_restaurants.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast({
      title: 'Modèle téléchargé',
      description: 'Le fichier modele_import_restaurants.csv a été téléchargé. Remplissez-le puis importez-le ci-dessous.',
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
          setPreview(results.data.slice(0, 10) as CSVRow[])
        },
        error: (error) => {
          toast({
            title: 'Erreur de lecture',
            description: error.message,
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
            setPreview(results.data.slice(0, 10) as CSVRow[])
          },
          error: (error) => {
            toast({
              title: 'Erreur de lecture',
              description: error.message,
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
    importRestaurants.mutate(
      { file },
      {
        onSuccess: () => {
          router.push('/dashboard/restaurants')
        },
      }
    )
  }

  if (!isLoaded) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Chargement de votre organisation...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isLoaded && !organization?.id) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <header className="pb-6 border-b border-border/60">
            <h1 className="text-3xl font-bold tracking-tight">Importer des restaurants</h1>
            <p className="text-muted-foreground mt-1.5">
              Importez vos restaurants depuis un fichier CSV
            </p>
          </header>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-16 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Aucune organisation active</h2>
              <p className="text-muted-foreground">
                Veuillez sélectionner une organisation pour importer des restaurants.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/restaurants">Retour aux restaurants</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Importer des restaurants depuis un fichier CSV">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'Restaurants', href: '/dashboard/restaurants' }, { label: 'Import' }]} />
        <header className="flex items-center gap-4 pb-6 border-b border-border/60">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild aria-label="Retour à la liste des restaurants">
            <Link href="/dashboard/restaurants">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0" aria-hidden>
                <Upload className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Importer des restaurants</h1>
            </div>
            <p className="text-muted-foreground">
              Importez vos établissements depuis un fichier CSV
            </p>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Configuration</CardTitle>
              <CardDescription className="mt-1">
                Sélectionnez le fichier CSV à importer. Les restaurants seront créés dans votre organisation.
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
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <label htmlFor="file-upload" className="cursor-pointer block space-y-2">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                      <p className="font-medium">
                        Glissez-déposez un fichier CSV ou cliquez pour sélectionner
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Format attendu : nom, adresse, fuseau
                      </p>
                    </label>
                  )}
                </div>
              </div>

              {errors.length > 0 && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4" role="alert">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                      Erreurs détectées ({errors.length})
                    </p>
                  </div>
                  <ul className="text-xs text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
                    {errors.slice(0, 5).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {errors.length > 5 && <li>... et {errors.length - 5} autres erreurs</li>}
                  </ul>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!file || importRestaurants.isPending}
                className="w-full shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0"
              >
                {importRestaurants.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Importer les restaurants
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Prévisualisation</CardTitle>
              <CardDescription className="mt-1">
                Aperçu des 10 premières lignes du fichier CSV
              </CardDescription>
            </CardHeader>
            <CardContent>
              {preview.length > 0 ? (
                <div className="space-y-2">
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm" role="table" aria-label="Aperçu des données CSV">
                      <thead className="bg-muted/50 dark:bg-gray-800/50 border-b border-border">
                        <tr>
                          {Object.keys(preview[0]).map((key) => (
                            <th key={key} className="px-3 py-2 text-left font-semibold">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, i) => (
                          <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 dark:hover:bg-gray-800/30 transition-colors">
                            {Object.values(row).map((value, j) => (
                              <td key={j} className="px-3 py-2">
                                {value || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground" role="status">
                    Affichage des 10 premières lignes
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center mb-5">
                    <FileText className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Aucun fichier sélectionné</h3>
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez un fichier CSV pour voir la prévisualisation
                  </p>
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
                  Votre fichier CSV doit contenir les colonnes suivantes (en français ci-dessous). Les noms en anglais (name, address, timezone) sont aussi acceptés. Téléchargez le modèle pour partir d&apos;un fichier prêt à remplir.
                </CardDescription>
              </div>
              <Button
                type="button"
                className="shrink-0 rounded-xl bg-teal-600 hover:bg-teal-700 text-white border-0 shadow-sm"
                onClick={handleDownloadTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger le modèle CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Colonnes attendues :</p>
              <div className="rounded-xl bg-muted/30 dark:bg-gray-800/30 border border-border p-4 font-mono text-xs">
                <ul className="space-y-1 list-none p-0 m-0">
                  <li><strong>nom</strong> : Nom du restaurant (obligatoire, unique dans l&apos;organisation)</li>
                  <li><strong>adresse</strong> : Adresse de l&apos;établissement (optionnel)</li>
                  <li><strong>fuseau</strong> : Fuseau horaire (optionnel, défaut : Europe/Paris)</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                Le modèle téléchargeable contient ces colonnes et trois lignes d&apos;exemple. Remplissez-le avec vos données puis importez-le.
              </p>
              <div className="rounded-xl border border-teal-200/60 dark:border-teal-800/40 p-4 bg-teal-50/50 dark:bg-teal-900/10">
                <p className="text-xs font-semibold mb-2 text-teal-800 dark:text-teal-300">Exemple :</p>
                <pre className="text-xs bg-muted/50 dark:bg-gray-800/50 p-3 rounded-lg border border-border overflow-x-auto" aria-hidden>
{`nom,adresse,fuseau
Restaurant Paris Centre,12 rue de la Paix 75002 Paris,Europe/Paris
Restaurant Lyon,5 place Bellecour 69002 Lyon,Europe/Paris`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
