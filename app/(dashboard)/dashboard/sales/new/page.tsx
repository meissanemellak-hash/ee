'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ShoppingCart, ArrowLeft, Plus, Save } from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Restaurant {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  unitPrice: number
}

export default function NewSalePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [formData, setFormData] = useState({
    restaurantId: '',
    productId: '',
    quantity: '',
    amount: '',
    saleDate: new Date().toISOString().split('T')[0],
    saleHour: new Date().getHours().toString(),
  })

  useEffect(() => {
    if (isLoaded && organization?.id) {
      fetchRestaurants()
      fetchProducts()
    } else if (isLoaded) {
      setLoadingData(false)
    }
  }, [isLoaded, organization?.id])

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
    } finally {
      setLoadingData(false)
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

    setLoading(true)

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

      if (!formData.restaurantId) {
        throw new Error('Veuillez sélectionner un restaurant')
      }

      if (!formData.productId) {
        throw new Error('Veuillez sélectionner un produit')
      }

      let response = await fetch('/api/sales', {
        method: 'POST',
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
        const errorMessage = error.details || error.error || 'Erreur lors de la création'
        
        if (errorMessage.includes('synchronisée') || errorMessage.includes('Organization not found')) {
          throw new Error(`${errorMessage} Veuillez rafraîchir la page et réessayer.`)
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      toast({
        title: 'Vente créée',
        description: 'La vente a été enregistrée avec succès.',
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

  if (!isLoaded || loadingData) {
    return (
      <div className="p-6 space-y-6">
        <Card className="border shadow-sm">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {!isLoaded ? 'Chargement de votre organisation...' : 'Chargement des données...'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header (Style Sequence) */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/sales">
          <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nouvelle vente</h1>
            <p className="text-muted-foreground">
              Enregistrez une nouvelle vente
            </p>
          </div>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Informations de la vente</CardTitle>
          <CardDescription className="mt-1">
            Remplissez les informations pour enregistrer une nouvelle vente
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
                disabled={loading}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900">
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
                disabled={loading}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900">
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="shadow-sm">
                {loading ? (
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
                disabled={loading}
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
