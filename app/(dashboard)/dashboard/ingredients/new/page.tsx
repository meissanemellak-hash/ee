'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ArrowLeft, Plus, Save } from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateIngredient } from '@/lib/react-query/hooks/use-ingredients'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

const UNITS = ['kg', 'g', 'L', 'mL', 'unité', 'pièce', 'paquet', 'boîte']

export default function NewIngredientPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const createIngredient = useCreateIngredient()
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    costPerUnit: '',
    packSize: '',
    supplierName: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) {
      toast({
        title: 'Chargement...',
        description: 'Veuillez patienter pendant le chargement de votre organisation.',
        variant: 'default',
      })
      return
    }
    if (!organization?.id) {
      toast({
        title: 'Erreur',
        description: 'Aucune organisation active. Veuillez sélectionner une organisation.',
        variant: 'destructive',
      })
      return
    }
    if (!formData.name.trim()) {
      toast({
        title: 'Champ requis',
        description: 'Le nom de l’ingrédient est obligatoire.',
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
    createIngredient.mutate(
      {
        name: formData.name.trim(),
        unit: formData.unit,
        costPerUnit,
        packSize,
        supplierName: formData.supplierName.trim() || null,
      },
      { onSuccess: () => router.push('/dashboard/ingredients') }
    )
  }

  if (isLoaded && !organization?.id) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">
                Aucune organisation active. Veuillez sélectionner une organisation pour ajouter un ingrédient.
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

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Créer un nouvel ingrédient">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'Ingrédients', href: '/dashboard/ingredients' }, { label: 'Nouveau' }]} />
        <header className="flex items-center gap-4 pb-6 border-b border-border/60">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild aria-label="Retour à la liste des ingrédients">
            <Link href="/dashboard/ingredients" className="hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0" aria-hidden>
                <Plus className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Nouvel ingrédient</h1>
            </div>
            <p className="text-muted-foreground">
              Ajoutez un nouvel ingrédient à votre catalogue
            </p>
          </div>
        </header>

        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Informations de l’ingrédient</CardTitle>
            <CardDescription className="mt-1">
              Remplissez les informations pour créer un nouvel ingrédient. Les champs marqués d’un * sont obligatoires.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" aria-describedby="form-desc" noValidate>
            <p id="form-desc" className="sr-only">
              Formulaire de création d&apos;un ingrédient : nom, unité, coût par unité, taille du pack et fournisseur.
            </p>
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l&apos;ingrédient *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tomate, Fromage, Pain..."
                required
                disabled={createIngredient.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unité *</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                <SelectTrigger disabled={createIngredient.isPending}>
                  <SelectValue placeholder="Sélectionner une unité" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Unité de mesure pour cet ingrédient commandé à votre fournisseur (kg, L, unité, etc.)
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
                disabled={createIngredient.isPending}
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
                disabled={createIngredient.isPending}
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
                disabled={createIngredient.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Optionnel. Nom du fournisseur pour cet ingrédient.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                type="submit"
                disabled={createIngredient.isPending}
                className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0"
              >
                {createIngredient.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Créer l’ingrédient
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createIngredient.isPending}
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
