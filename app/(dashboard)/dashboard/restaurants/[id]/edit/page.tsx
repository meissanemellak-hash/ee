'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function EditRestaurantPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    timezone: 'Europe/Paris',
  })

  useEffect(() => {
    if (params.id && isLoaded && organization?.id) {
      fetchRestaurant()
    }
  }, [params.id, isLoaded, organization?.id])

  const fetchRestaurant = async () => {
    if (!organization?.id) return

    try {
      setLoadingData(true)
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      
      const response = await fetch(`/api/restaurants/${params.id}?${queryParams.toString()}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'Restaurant introuvable',
            description: 'Le restaurant que vous recherchez n\'existe pas.',
            variant: 'destructive',
          })
          router.push('/dashboard/restaurants')
          return
        }
        throw new Error('Erreur lors du chargement du restaurant')
      }

      const data = await response.json()
      setFormData({
        name: data.name || '',
        address: data.address || '',
        timezone: data.timezone || 'Europe/Paris',
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger les données',
        variant: 'destructive',
      })
      router.push('/dashboard/restaurants')
    } finally {
      setLoadingData(false)
    }
  }

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

    setLoading(true)

    try {
      const response = await fetch(`/api/restaurants/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          clerkOrgId: organization.id, // Passer l'orgId depuis le client
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        const errorMessage = error.details || error.error || 'Erreur lors de la modification'
        
        // Si c'est un problème de synchronisation, proposer de rafraîchir
        if (errorMessage.includes('synchronisée') || errorMessage.includes('Organization not found')) {
          throw new Error(`${errorMessage} Veuillez rafraîchir la page et réessayer.`)
        }
        
        throw new Error(errorMessage)
      }

      const restaurant = await response.json()
      
      toast({
        title: 'Restaurant modifié',
        description: `${restaurant.name} a été modifié avec succès.`,
      })

      // Rediriger vers la liste au lieu de la page de détails pour éviter les problèmes
      router.push('/dashboard/restaurants')
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
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {!isLoaded ? 'Chargement de votre organisation...' : 'Chargement du restaurant...'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Modifier le restaurant</h1>
        <p className="text-muted-foreground">
          Modifiez les informations de {formData.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du restaurant</CardTitle>
          <CardDescription>
            Modifiez les informations ci-dessous
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du restaurant *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Restaurant Paris Centre"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Rue de la Paix, 75001 Paris"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Fuseau horaire</Label>
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                placeholder="Europe/Paris"
              />
              <p className="text-xs text-muted-foreground">
                Format IANA (ex: Europe/Paris, America/New_York)
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Modification...' : 'Enregistrer les modifications'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
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
