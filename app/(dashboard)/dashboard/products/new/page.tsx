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
import { useCreateProduct } from '@/lib/react-query/hooks/use-products'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export default function NewProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const createProduct = useCreateProduct()
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unitPrice: '',
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
        description: 'Le nom du produit est obligatoire.',
        variant: 'destructive',
      })
      return
    }

    const unitPrice = parseFloat(formData.unitPrice)
    if (isNaN(unitPrice) || unitPrice <= 0) {
      toast({
        title: 'Erreur',
        description: 'Le prix doit être un nombre positif.',
        variant: 'destructive',
      })
      return
    }
    createProduct.mutate(
      {
        name: formData.name.trim(),
        category: formData.category.trim() || undefined,
        unitPrice,
      },
      { onSuccess: () => router.push('/dashboard/products') }
    )
  }

  if (isLoaded && !organization?.id) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">
                Aucune organisation active. Veuillez sélectionner une organisation pour ajouter un produit.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/products">Retour aux produits</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Créer un nouveau produit">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'Produits', href: '/dashboard/products' }, { label: 'Nouveau' }]} />
        <header className="flex items-center gap-4 pb-6 border-b border-border/60">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild aria-label="Retour à la liste des produits">
            <Link href="/dashboard/products" className="hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0" aria-hidden>
                <Plus className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Nouveau produit</h1>
            </div>
            <p className="text-muted-foreground">
              Ajoutez un nouveau produit à votre catalogue
            </p>
          </div>
        </header>

        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Informations du produit</CardTitle>
            <CardDescription className="mt-1">
              Remplissez les informations pour créer un nouveau produit. Les champs marqués d’un * sont obligatoires.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" aria-describedby="form-desc" noValidate>
            <p id="form-desc" className="sr-only">
              Formulaire de création d’un produit : nom, catégorie et prix unitaire.
            </p>
            <div className="space-y-2">
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Burger Classique"
                required
                disabled={createProduct.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Burger, Boisson, Dessert..."
                disabled={createProduct.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Optionnel. Permet de regrouper vos produits par catégorie.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice">Prix unitaire (€) *</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                placeholder="12.50"
                required
                disabled={createProduct.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Prix de vente unitaire du produit en euros.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                type="submit"
                disabled={createProduct.isPending}
                className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0"
              >
                {createProduct.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Créer le produit
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createProduct.isPending}
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
