'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Upload, FileText, CheckCircle2, XCircle, Loader2, ArrowLeft, Link } from 'lucide-react'
import Papa from 'papaparse'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CSVRow {
  restaurant?: string
  product?: string
  quantity?: string
  amount?: string
  date?: string
  hour?: string
  [key: string]: string | undefined
}

export default function ImportSalesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [restaurantId, setRestaurantId] = useState<string>('')
  const [restaurants, setRestaurants] = useState<Array<{ id: string; name: string }>>([])
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CSVRow[]>([])
  const [errors, setErrors] = useState<string[]>([])

  // Charger les restaurants
  useEffect(() => {
    fetch('/api/restaurants')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRestaurants(data)
        }
      })
      .catch(() => {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les restaurants',
          variant: 'destructive',
        })
      })
  }, [toast])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Lire et parser le CSV
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setErrors(results.errors.map((e) => `Ligne ${e.row}: ${e.message}`))
        }
        setPreview(results.data.slice(0, 10) as CSVRow[]) // Afficher les 10 premières lignes
      },
      error: (error) => {
        toast({
          title: 'Erreur de lecture',
          description: error.message,
          variant: 'destructive',
        })
      },
    })
  }, [toast])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile && droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile)
        setPreview([])
        setErrors([])

        // Lire et parser le CSV
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

  const handleSubmit = async () => {
    if (!file || !restaurantId) {
      toast({
        title: 'Champs manquants',
        description: 'Veuillez sélectionner un restaurant et un fichier CSV',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('restaurantId', restaurantId)

      const response = await fetch('/api/sales/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'import')
      }

      toast({
        title: 'Import réussi',
        description: `${result.imported} ventes importées avec succès${result.errors ? ` (${result.errors.length} erreurs)` : ''}`,
      })

      router.push('/dashboard/sales')
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

  return (
    <div className="p-6 space-y-6">
      {/* Header (Style Sequence) */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/sales" className="hover:opacity-80 transition-opacity">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Importer des ventes</h1>
          </div>
          <p className="text-muted-foreground">
            Importez vos ventes depuis un fichier CSV
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Configuration</CardTitle>
            <CardDescription className="mt-1">
              Sélectionnez le restaurant et le fichier CSV à importer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Restaurant *</label>
              <Select value={restaurantId} onValueChange={setRestaurantId}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors">
                  <SelectValue placeholder="Sélectionner un restaurant" />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fichier CSV *</label>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-green-500 dark:hover:border-green-600 transition-colors cursor-pointer bg-gray-50/50 dark:bg-gray-800/50"
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {file ? (
                    <div className="space-y-2">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                      <p className="font-medium">
                        Glissez-déposez un fichier CSV ou cliquez pour sélectionner
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Format attendu: restaurant, product, quantity, amount, date, hour
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                    Erreurs détectées ({errors.length})
                  </p>
                </div>
                <ul className="text-xs text-red-700 dark:text-red-400 space-y-1">
                  {errors.slice(0, 5).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                  {errors.length > 5 && (
                    <li>... et {errors.length - 5} autres erreurs</li>
                  )}
                </ul>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!file || !restaurantId || loading}
              className="w-full shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Importer les ventes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Prévisualisation</CardTitle>
            <CardDescription className="mt-1">
              Aperçu des premières lignes du fichier CSV
            </CardDescription>
          </CardHeader>
          <CardContent>
            {preview.length > 0 ? (
              <div className="space-y-2">
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
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
                        <tr key={i} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
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
                <p className="text-xs text-muted-foreground">
                  Affichage des 10 premières lignes
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucun fichier sélectionné</h3>
                <p className="text-sm text-muted-foreground">
                  Sélectionnez un fichier CSV pour voir la prévisualisation
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Format CSV attendu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Votre fichier CSV doit contenir les colonnes suivantes :
            </p>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 font-mono text-xs">
              <div className="space-y-1">
                <div><strong>restaurant</strong> : Nom du restaurant (doit correspondre à un restaurant existant)</div>
                <div><strong>product</strong> : Nom du produit (doit correspondre à un produit existant)</div>
                <div><strong>quantity</strong> : Quantité vendue (nombre)</div>
                <div><strong>amount</strong> : Montant total de la vente (nombre)</div>
                <div><strong>date</strong> : Date de la vente (format: YYYY-MM-DD)</div>
                <div><strong>hour</strong> : Heure de la vente (0-23)</div>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-blue-50/50 dark:bg-blue-900/10">
              <p className="text-xs font-semibold mb-2 text-blue-800 dark:text-blue-300">Exemple :</p>
              <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
{`restaurant,product,quantity,amount,date,hour
Restaurant Paris Centre,Burger Classique,5,62.50,2024-01-15,12
Restaurant Paris Centre,Burger Classique,3,37.50,2024-01-15,13`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
