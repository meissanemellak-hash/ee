'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, ArrowLeft, ShoppingCart, Save } from 'lucide-react'
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
import { useSale, useUpdateSale } from '@/lib/react-query/hooks/use-sales'

export default function EditSalePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const saleId = params.id as string

  const { data: restaurantsData, isLoading: loadingRestaurants } = useRestaurants(1, 100)
  const { data: productsData, isLoading: loadingProducts } = useProducts(1, 100)
  const { data: sale, isLoading: loadingSale, error: saleError } = useSale(saleId)
  const updateSale = useUpdateSale()

  const restaurants = restaurantsData?.restaurants || []
  const products = productsData?.products || []
  const loadingData = loadingRestaurants || loadingProducts

  const [formData, setFormData] = useState({
    restaurantId: '',
    productId: '',
    quantity: '',
    amount: '',
    saleDate: '',
    saleHour: '',
  })

  // Initialiser le formulaire quand la vente est chargée
  useEffect(() => {
    if (sale) {
      const saleDate = new Date(sale.saleDate).toISOString().split('T')[0]
      setFormData({
        restaurantId: sale.restaurantId,
        productId: sale.productId,
        quantity: sale.quantity.toString(),
        amount: sale.amount.toString(),
        saleDate,
        saleHour: sale.saleHour.toString(),
      })
    }
  }, [sale])

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

    if (!organization?.id || !saleId) {
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

    updateSale.mutate(
      {
        id: saleId,
        data: {
          restaurantId: formData.restaurantId,
          productId: formData.productId,
          quantity,
          amount,
          saleDate: formData.saleDate,
          saleHour,
        } as any,
      },
      {
        onSuccess: () => {
          router.push('/dashboard/sales')
        },
      }
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
                <Link href="/dashboard/sales">Retour aux ventes</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (saleId && !loadingSale && (saleError || !sale)) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Card className="rounded-xl border shadow-sm border-red-200/50 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">
                Vente introuvable ou supprimée. Retournez à la liste pour modifier une autre vente.
              </p>
              <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white border-0">
                <Link href="/dashboard/sales">Retour aux ventes</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (loadingSale || loadingData) {
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
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (!sale) {
    return null
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Modifier la vente">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <header className="flex items-center gap-4 pb-6 border-b border-border/60">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild aria-label="Retour à la liste des ventes">
            <Link href="/dashboard/sales" className="hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0" aria-hidden>
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Modifier la vente</h1>
            </div>
            <p className="text-muted-foreground">
              Modifiez les informations de la vente
            </p>
          </div>
        </header>

        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Informations de la vente</CardTitle>
            <CardDescription className="mt-1">
              Modifiez les informations ci-dessous. Les champs marqués d’un * sont obligatoires.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" aria-describedby="edit-sale-form-desc" id="edit-sale-form">
              <p id="edit-sale-form-desc" className="sr-only">
                Formulaire de modification de la vente : restaurant, produit, quantité, montant, date et heure.
              </p>
              <div className="space-y-2">
                <Label htmlFor="restaurantId">Restaurant *</Label>
                <Select
                  value={formData.restaurantId}
                  onValueChange={(value) => setFormData({ ...formData, restaurantId: value })}
                  required
                  disabled={updateSale.isPending || loadingData}
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
                  disabled={updateSale.isPending || loadingData}
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
                    disabled={updateSale.isPending || loadingData}
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
                    disabled={updateSale.isPending || loadingData}
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
                    disabled={updateSale.isPending || loadingData}
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
                    disabled={updateSale.isPending || loadingData}
                    className="bg-muted/50 dark:bg-gray-800 border-border"
                    aria-label="Heure de la vente (0 à 23)"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={updateSale.isPending || loadingData}
                  className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0"
                >
                  {updateSale.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Modification...
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
                  disabled={updateSale.isPending || loadingData}
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
