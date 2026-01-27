'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Package, ArrowLeft, Plus, Save } from 'lucide-react'
import Link from 'next/link'

export default function NewProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unitPrice: '',
  })

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
      const unitPrice = parseFloat(formData.unitPrice)
      
      if (isNaN(unitPrice) || unitPrice <= 0) {
        throw new Error('Le prix doit être un nombre positif')
      }

      let response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          category: formData.category.trim() || null,
          unitPrice,
          clerkOrgId: organization.id, // Passer l'orgId depuis le client
        }),
      })

      // Si erreur "Organization not found", essayer de forcer la synchronisation
      if (!response.ok) {
        const error = await response.json()
        if (error.error === 'Organization not found' || error.details?.includes('synchronisée')) {
          console.log('Tentative de synchronisation de l\'organisation...')
          // Forcer la synchronisation
          await fetch('/api/organizations/force-sync', { method: 'POST' })
          // Attendre un peu pour que la synchronisation se termine
          await new Promise(resolve => setTimeout(resolve, 1000))
          // Réessayer la création
          response = await fetch('/api/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: formData.name.trim(),
              category: formData.category.trim() || null,
              unitPrice,
              clerkOrgId: organization.id, // Passer l'orgId depuis le client
            }),
          })
        }
      }

      if (!response.ok) {
        const error = await response.json()
        const errorMessage = error.details || error.error || 'Erreur lors de la création'
        
        // Si c'est toujours un problème de synchronisation, proposer de rafraîchir
        if (errorMessage.includes('synchronisée') || errorMessage.includes('Organization not found')) {
          throw new Error(`${errorMessage} Veuillez rafraîchir la page et réessayer.`)
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      toast({
        title: 'Produit créé',
        description: `${data.product.name} a été créé avec succès.`,
      })

      router.push('/dashboard/products')
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
        <Link href="/dashboard/products">
          <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nouveau produit</h1>
            <p className="text-muted-foreground">
              Ajoutez un nouveau produit à votre catalogue
            </p>
          </div>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Informations du produit</CardTitle>
          <CardDescription className="mt-1">
            Remplissez les informations pour créer un nouveau produit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Burger Classique"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Burger, Boisson, Dessert..."
                disabled={loading}
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
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Prix de vente unitaire du produit en euros.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="shadow-sm">
                {loading ? (
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
