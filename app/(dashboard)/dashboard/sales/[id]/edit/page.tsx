'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ArrowLeft, ShoppingCart, Save, Link } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Sale {
  id: string
  restaurantId: string
  productId: string
  quantity: number
  amount: number
  saleDate: string
  saleHour: number
  restaurant: {
    id: string
    name: string
  }
  product: {
    id: string
    name: string
    unitPrice: number
  }
}

interface Restaurant {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  unitPrice: number
}

export default function EditSalePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sale, setSale] = useState<Sale | null>(null)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [formData, setFormData] = useState({
    restaurantId: '',
    productId: '',
    quantity: '',
    amount: '',
    saleDate: '',
    saleHour: '',
  })

  useEffect(() => {
    if (params.id && isLoaded && organization?.id) {
      fetchRestaurants()
      fetchProducts()
      fetchSale()
    }
  }, [params.id, isLoaded, organization?.id])

  const fetchRestaurants = async () => {
    if (!organization?.id) return

    try {
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/restaurants?${queryParams.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setRestaurants(data)
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error)
    }
  }

  const fetchProducts = async () => {
    if (!organization?.id) return

    try {
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/products?${queryParams.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchSale = async () => {
    if (!organization?.id) {
      return
    }

    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/sales/${params.id}?${queryParams.toString()}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'Vente introuvable',
            description: 'La vente que vous recherchez n\'existe pas.',
            variant: 'destructive',
          })
          router.push('/dashboard/sales')
          return
        }
        throw new Error('Erreur lors du chargement de la vente')
      }

      const data = await response.json()
      setSale(data)
      
      const saleDate = new Date(data.saleDate).toISOString().split('T')[0]
      setFormData({
        restaurantId: data.restaurantId,
        productId: data.productId,
        quantity: data.quantity.toString(),
        amount: data.amount.toString(),
        saleDate,
        saleHour: data.saleHour.toString(),
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger la vente',
        variant: 'destructive',
      })
      router.push('/dashboard/sales')
    } finally {
      setLoading(false)
      setLoadingData(false)
    }
  }

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
    
    if (!organization?.id) {
      toast({
        title: 'Erreur',
        description: 'Aucune organisation active. Veuillez sélectionner une organisation.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)

    try {
      const quantity = parseInt(formData.quantity)
      const amount = parseFloat(formData.amount)
      const saleHour = parseInt(formData.saleHour)
      
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error('La quantité doit être un nombre positif')
      }

      if (isNaN(amount) || amount <= 0) {
        throw new Error('Le montant doit être un nombre positif')
      }

      if (isNaN(saleHour) || saleHour < 0 || saleHour > 23) {
        throw new Error('L\'heure doit être entre 0 et 23')
      }

      const response = await fetch(`/api/sales/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: formData.restaurantId,
          productId: formData.productId,
          quantity,
          amount,
          saleDate: formData.saleDate,
          saleHour,
          clerkOrgId: organization.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        const errorMessage = error.details || error.error || 'Erreur lors de la modification'
        
        if (errorMessage.includes('synchronisée') || errorMessage.includes('Organization not found')) {
          throw new Error(`${errorMessage} Veuillez rafraîchir la page et réessayer.`)
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      toast({
        title: 'Vente modifiée',
        description: 'La vente a été modifiée avec succès.',
      })

      router.push('/dashboard/sales')
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isLoaded || loading || loadingData) {
    return (
      <div className="p-6 space-y-6">
        <Card className="border shadow-sm">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {!isLoaded ? 'Chargement de votre organisation...' : 'Chargement de la vente...'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!sale) {
    return null
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
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Modifier la vente</h1>
          </div>
          <p className="text-muted-foreground">
            Modifiez les informations de la vente
          </p>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Informations de la vente</CardTitle>
          <CardDescription className="mt-1">
            Modifiez les informations ci-dessous
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restaurantId">Restaurant *</Label>
              <Select
                value={formData.restaurantId}
                onValueChange={(value) => setFormData({ ...formData, restaurantId: value })}
                required
                disabled={saving}
              >
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
              <Label htmlFor="productId">Produit *</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData({ ...formData, productId: value })}
                required
                disabled={saving}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors">
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
                  disabled={saving}
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
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
                  disabled={saving}
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
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
                  disabled={saving}
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
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
                  disabled={saving}
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={saving} className="shadow-sm">
                {saving ? (
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
                disabled={saving}
                className="shadow-sm"
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
