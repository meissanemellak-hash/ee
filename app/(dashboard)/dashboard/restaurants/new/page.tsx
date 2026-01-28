'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ArrowLeft, Plus, Save } from 'lucide-react'
import { useCreateRestaurant } from '@/lib/react-query/hooks/use-restaurants'

export default function NewRestaurantPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const createRestaurant = useCreateRestaurant()
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    timezone: 'Europe/Paris',
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
        description: 'Le nom du restaurant est obligatoire.',
        variant: 'destructive',
      })
      return
    }
    createRestaurant.mutate(
      { name: formData.name, address: formData.address || undefined, timezone: formData.timezone },
      {
        onSuccess: (restaurant) => {
          router.push(`/dashboard/restaurants/${restaurant.id}`)
        },
      }
    )
  }

  if (isLoaded && !organization?.id) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">
                Aucune organisation active. Veuillez sélectionner une organisation pour ajouter un restaurant.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/restaurants">Retour aux restaurants</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Créer un nouveau restaurant">
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <header className="flex items-center gap-4 pb-6 border-b border-border/60">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild aria-label="Retour à la liste des restaurants">
            <Link href="/dashboard/restaurants" className="hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0" aria-hidden>
                <Plus className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Nouveau restaurant</h1>
            </div>
            <p className="text-muted-foreground">
              Ajoutez un nouvel établissement à votre organisation
            </p>
          </div>
        </header>

        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Informations du restaurant</CardTitle>
            <CardDescription className="mt-1">
              Remplissez les informations de base pour créer un nouveau restaurant. Les champs marqués d’un * sont obligatoires.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" aria-describedby="form-desc" noValidate>
            <p id="form-desc" className="sr-only">
              Formulaire de création d’un restaurant : nom, adresse et fuseau horaire.
            </p>
            <div className="space-y-2">
              <Label htmlFor="name">Nom du restaurant *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Restaurant Paris Centre"
                required
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Rue de la Paix, 75001 Paris"
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Fuseau horaire</Label>
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                placeholder="Europe/Paris"
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
              />
              <p className="text-xs text-muted-foreground">
                Format IANA (ex: Europe/Paris, America/New_York)
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                type="submit"
                disabled={createRestaurant.isPending}
                className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0"
              >
                {createRestaurant.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Créer le restaurant
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createRestaurant.isPending}
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
