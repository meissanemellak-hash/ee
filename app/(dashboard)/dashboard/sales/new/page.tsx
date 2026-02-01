'use client'

import { useState, useEffect } from 'react'
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
import { useRestaurants } from '@/lib/react-query/hooks/use-restaurants'
import { useProducts } from '@/lib/react-query/hooks/use-products'
import { useCreateSale } from '@/lib/react-query/hooks/use-sales'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { SaleFormSkeleton } from '@/components/ui/skeletons/sale-form-skeleton'

export default function NewSalePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()

  const { data: restaurantsData, isLoading: loadingRestaurants } = useRestaurants(1, 100)
  const { data: productsData, isLoading: loadingProducts } = useProducts(1, 100)
  const createSale = useCreateSale()
  
  const restaurants = (restaurantsData?.restaurants || []) as { id: string; name: string }[]
  const products = (productsData?.products || []) as { id: string; name: string; unitPrice: number }[]
  
  const [formData, setFormData] = useState({
    restaurantId: '',
    productId: '',
    quantity: '',
    amount: '',
    saleDate: new Date().toISOString().split('T')[0],
    saleHour: new Date().getHours().toString(),
  })
  
  const loadingData = loadingRestaurants || loadingProducts

  // Calculer automatiquement le montant quand la quantité ou le produit change
  useEffect(() => {
    if (formData.productId && formData.quantity) {
      const product = products.find(p => p.id === formData.productId)
      if (product) {
        const quantity = parseFloat(formData.quantity)
        if (!isNaN(quantity) && quantity > 0) {
          const calculatedAmount = product.unitPrice * quantity
          setFormData(prev => ({ ...prev, amount: calculatedAmount.toFixed(2) }))
        }
      }
    }
  }, [formData.productId, formData.quantity, products])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoaded) {
      toast({ title: 'Chargement...', description: 'Veuillez patienter.', variant: 'default' })
      return
    }
    if (!organization?.id) {
      toast({ title: 'Erreur', description: 'Aucune organisation active. Sélectionnez une organisation.', variant: 'destructive' })
      return
    }
    if (!formData.restaurantId || !formData.productId) {
      toast({ title: 'Champs requis', description: 'Restaurant et produit sont obligatoires.', variant: 'destructive' })
      return
    }

    const quantity = parseInt(formData.quantity, 10)
    const amount = parseFloat(formData.amount)
    const saleHour = parseInt(formData.saleHour, 10)

    if (isNaN(quantity) || quantity <= 0) {
      toast({ title: 'Quantité invalide', description: 'La quantité doit être un entier positif.', variant: 'destructive' })
      return
    }
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Montant invalide', description: 'Le montant doit être un nombre positif.', variant: 'destructive' })
      return
    }
    if (isNaN(saleHour) || saleHour < 0 || saleHour > 23) {
      toast({ title: 'Heure invalide', description: 'L’heure doit être entre 0 et 23.', variant: 'destructive' })
      return
    }

    createSale.mutate(
      {
        restaurantId: formData.restaurantId,
        productId: formData.productId,
        quantity,
        amount,
        saleDate: formData.saleDate,
        saleHour,
      },
      {
        onSuccess: () => {
          router.push('/dashboard/sales')
        },
      }
    )
  }

  if (!isLoaded || loadingData) {
    return <SaleFormSkeleton />
  }

  if (isLoaded && !organization?.id) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">
                Aucune organisation active. Veuillez sélectionner une organisation pour enregistrer une vente.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/sales">Retour aux ventes</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Créer une nouvelle vente">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'Ventes & Analyse', href: '/dashboard/sales' }, { label: 'Nouvelle vente' }]} />
        <header className="flex items-center gap-4 pb-6 border-b border-border/60">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild aria-label="Retour à la liste des ventes">
            <Link href="/dashboard/sales" className="hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0" aria-hidden>
                <Plus className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Nouvelle vente</h1>
            </div>
            <p className="text-muted-foreground">
              Enregistrez une nouvelle vente
            </p>
          </div>
        </header>

        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Informations de la vente</CardTitle>
            <CardDescription className="mt-1">
              Remplissez les informations pour enregistrer une nouvelle vente. Les champs marqués d’un * sont obligatoires.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" aria-describedby="sale-form-desc" id="new-sale-form">
              <p id="sale-form-desc" className="sr-only">
                Formulaire de création d’une vente : restaurant, produit, quantité, montant, date et heure.
              </p>
              <div className="space-y-2">
                <Label htmlFor="restaurantId">Restaurant *</Label>
                <Select
                  value={formData.restaurantId}
                  onValueChange={(value) => setFormData({ ...formData, restaurantId: value })}
                  required
                  disabled={createSale.isPending || loadingData}
                >
                  <SelectTrigger id="restaurantId" className="bg-muted/50 dark:bg-gray-800 border-border" aria-label="Sélectionner un restaurant">
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
                <Label htmlFor="productId">Produit *</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) => setFormData({ ...formData, productId: value })}
                  required
                  disabled={createSale.isPending || loadingData}
                >
                  <SelectTrigger id="productId" className="bg-muted/50 dark:bg-gray-800 border-border" aria-label="Sélectionner un produit">
                    <SelectValue placeholder="Sélectionner un produit" />
                  </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.unitPrice.toFixed(2)} €)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantité *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="1"
                    required
                    disabled={createSale.isPending || loadingData}
                    className="bg-muted/50 dark:bg-gray-800 border-border"
                    aria-label="Quantité"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant total (€) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                    disabled={createSale.isPending || loadingData}
                    className="bg-muted/50 dark:bg-gray-800 border-border"
                    aria-label="Montant total en euros"
                  />
                  <p className="text-xs text-muted-foreground">
                    Calculé automatiquement ou saisissez manuellement
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="saleDate">Date de la vente *</Label>
                  <Input
                    id="saleDate"
                    type="date"
                    value={formData.saleDate}
                    onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                    required
                    disabled={createSale.isPending || loadingData}
                    className="bg-muted/50 dark:bg-gray-800 border-border"
                    aria-label="Date de la vente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saleHour">Heure (0-23) *</Label>
                  <Input
                    id="saleHour"
                    type="number"
                    min="0"
                    max="23"
                    value={formData.saleHour}
                    onChange={(e) => setFormData({ ...formData, saleHour: e.target.value })}
                    placeholder="14"
                    required
                    disabled={createSale.isPending || loadingData}
                    className="bg-muted/50 dark:bg-gray-800 border-border"
                    aria-label="Heure de la vente (0 à 23)"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={createSale.isPending || loadingData}
                  className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0"
                >
                  {createSale.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer la vente
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={createSale.isPending || loadingData}
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
