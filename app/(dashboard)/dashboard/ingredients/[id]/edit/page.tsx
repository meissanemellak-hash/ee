'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Beaker, ArrowLeft, Save } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useIngredient, useUpdateIngredient } from '@/lib/react-query/hooks/use-ingredients'
import { Skeleton } from '@/components/ui/skeleton'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

const UNITS = ['kg', 'g', 'L', 'mL', 'unité', 'pièce', 'paquet', 'boîte']

export default function EditIngredientPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const id = params?.id as string | undefined
  const { data: ingredient, isLoading: loadingProduct, isError: errorIngredient } = useIngredient(id)
  const updateIngredient = useUpdateIngredient()
  const hasRedirected = useRef(false)

  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    costPerUnit: '',
    packSize: '',
    supplierName: '',
  })

  // Synchroniser le formulaire dès que l'ingrédient est chargé (conserve l'unité dans le Select)
  useEffect(() => {
    if (ingredient) {
      setFormData({
        name: ingredient.name || '',
        unit: ingredient.unit ?? '',
        costPerUnit: String(ingredient.costPerUnit ?? ''),
        packSize: ingredient.packSize != null ? String(ingredient.packSize) : '',
        supplierName: ingredient.supplierName ?? '',
      })
    }
  }, [ingredient])

  useEffect(() => {
    if (id && errorIngredient && !ingredient && !hasRedirected.current) {
      hasRedirected.current = true
      toast({
        title: 'Ingrédient introuvable',
        description: "L'ingrédient que vous recherchez n'existe pas ou a été supprimé.",
        variant: 'destructive',
      })
    }
  }, [id, errorIngredient, ingredient, toast])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization?.id || !id) {
      toast({
        title: 'Erreur',
        description: 'Aucune organisation active. Veuillez sélectionner une organisation.',
        variant: 'destructive',
      })
      return
    }
    const costPerUnit = parseFloat(formData.costPerUnit)
    if (isNaN(costPerUnit) || costPerUnit <= 0) {
      toast({
        title: 'Erreur',
        description: 'Le coût par unité doit être un nombre positif',
        variant: 'destructive',
      })
      return
    }
    if (!formData.unit) {
      toast({
        title: 'Erreur',
        description: "L'unité est requise",
        variant: 'destructive',
      })
      return
    }
    const packSize = formData.packSize ? parseFloat(formData.packSize) : null
    if (packSize !== null && (isNaN(packSize) || packSize <= 0)) {
      toast({
        title: 'Erreur',
        description: 'La taille du pack doit être un nombre positif',
        variant: 'destructive',
      })
      return
    }
    updateIngredient.mutate(
      {
        id,
        data: {
          name: formData.name.trim(),
          unit: formData.unit,
          costPerUnit,
          packSize,
          supplierName: formData.supplierName.trim() || null,
        },
      },
      { onSuccess: () => router.push('/dashboard/ingredients') }
    )
  }

  if (!isLoaded) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Chargement de votre organisation...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (isLoaded && !organization?.id) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">
                Aucune organisation active. Veuillez sélectionner une organisation.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/ingredients">Retour aux ingrédients</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (id && !loadingProduct && (errorIngredient || !ingredient)) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Card className="rounded-xl border shadow-sm border-red-200/50 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">
                Ingrédient introuvable ou supprimé. Retournez à la liste pour modifier un autre ingrédient.
              </p>
              <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white border-0">
                <Link href="/dashboard/ingredients">Retour aux ingrédients</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (loadingProduct) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-hidden>
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <header className="flex items-center gap-4 pb-6 border-b border-border/60">
            <Skeleton className="h-9 w-9 rounded-md shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-64" />
            </div>
          </header>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label={`Modifier l'ingrédient ${ingredient?.name ?? ''}`}>
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Ingrédients', href: '/dashboard/ingredients' },
            { label: ingredient?.name ?? '...', href: `/dashboard/ingredients/${id}` },
            { label: 'Édition' },
          ]}
        />
        <header className="flex items-center gap-4 pb-6 border-b border-border/60">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild aria-label="Retour à la liste des ingrédients">
            <Link href="/dashboard/ingredients" className="hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0" aria-hidden>
              <Beaker className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight">Modifier l’ingrédient</h1>
              <p className="text-muted-foreground truncate">
                Modifiez les informations de {formData.name || 'cet ingrédient'}
              </p>
            </div>
          </div>
        </header>

        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Informations de l&apos;ingrédient</CardTitle>
            <CardDescription className="mt-1">
              Les champs marqués d’un * sont obligatoires. Enregistrez pour appliquer les modifications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" aria-describedby="edit-form-desc" noValidate>
            <p id="edit-form-desc" className="sr-only">
              Formulaire de modification de l&apos;ingrédient : nom, unité, coût par unité, taille du pack et fournisseur.
            </p>
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l&apos;ingrédient *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tomate, Fromage, Pain..."
                required
                disabled={updateIngredient.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unité *</Label>
              <Select
                key={formData.unit || 'unit-empty'}
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger disabled={updateIngredient.isPending}>
                  <SelectValue placeholder="Sélectionner une unité" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const options = formData.unit && !UNITS.includes(formData.unit) ? [formData.unit, ...UNITS] : UNITS
                    return options.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))
                  })()}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Unité de mesure pour cet ingrédient (kg, L, unité, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPerUnit">Coût par unité (€) *</Label>
              <Input
                id="costPerUnit"
                type="number"
                step="0.01"
                min="0"
                value={formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                placeholder="2.50"
                required
                disabled={updateIngredient.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Coût d&apos;achat par unité en euros.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="packSize">Taille du pack</Label>
              <Input
                id="packSize"
                type="number"
                step="0.01"
                min="0"
                value={formData.packSize}
                onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                placeholder="10"
                disabled={updateIngredient.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Optionnel. Taille du pack fournisseur (ex: 10 kg, 5 L).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierName">Nom du fournisseur</Label>
              <Input
                id="supplierName"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                placeholder="Fournisseur ABC"
                disabled={updateIngredient.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Optionnel. Nom du fournisseur pour cet ingrédient.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                type="submit"
                disabled={updateIngredient.isPending}
                className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0"
              >
                {updateIngredient.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={updateIngredient.isPending}
                className="shadow-sm"
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </main>
  )
}
