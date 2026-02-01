'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ArrowLeft, Building2, Save } from 'lucide-react'
import { useRestaurant, useUpdateRestaurant } from '@/lib/react-query/hooks/use-restaurants'
import { Skeleton } from '@/components/ui/skeleton'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export default function EditRestaurantPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const id = params?.id as string | undefined
  const { data: restaurant, isLoading: loadingData, isError } = useRestaurant(id)
  const updateRestaurant = useUpdateRestaurant()

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    timezone: 'Europe/Paris',
  })

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        address: restaurant.address ?? '',
        timezone: restaurant.timezone || 'Europe/Paris',
      })
    }
  }, [restaurant])

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
    updateRestaurant.mutate(
      {
        id,
        data: {
          name: formData.name,
          address: formData.address || null,
          timezone: formData.timezone,
        },
      },
      {
        onSuccess: () => {
          router.push('/dashboard/restaurants')
        },
      }
    )
  }

  useEffect(() => {
    if (isError && !restaurant && id) {
      toast({
        title: 'Restaurant introuvable',
        description: 'Le restaurant que vous recherchez n’existe pas ou a été supprimé.',
        variant: 'destructive',
      })
    }
  }, [isError, restaurant, id, toast])

  if (!isLoaded) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-12 text-center">
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
                <Link href="/dashboard/restaurants">Retour aux restaurants</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (id && !loadingData && (isError || !restaurant)) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Card className="rounded-xl border shadow-sm border-red-200/50 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">
                Restaurant introuvable ou supprimé. Retournez à la liste pour modifier un autre établissement.
              </p>
              <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white border-0">
                <Link href="/dashboard/restaurants">Retour aux restaurants</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (loadingData) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-hidden>
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <header className="flex items-center gap-4 pb-6 border-b border-border/60">
            <Skeleton className="h-9 w-9 rounded-md shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-40" />
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
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label={`Modifier le restaurant ${restaurant?.name ?? ''}`}>
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Restaurants', href: '/dashboard/restaurants' },
            { label: restaurant?.name ?? '...', href: `/dashboard/restaurants/${id}` },
            { label: 'Édition' },
          ]}
        />
        <header className="flex items-center gap-4 pb-6 border-b border-border/60">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild aria-label="Retour à la liste des restaurants">
            <Link href="/dashboard/restaurants" className="hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0" aria-hidden>
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Modifier le restaurant</h1>
            </div>
            <p className="text-muted-foreground">
              Modifiez les informations de {formData.name || 'cet établissement'}
            </p>
          </div>
        </header>

        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Informations du restaurant</CardTitle>
            <CardDescription className="mt-1">
              Les champs marqués d’un * sont obligatoires. Enregistrez pour appliquer les modifications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" aria-describedby="edit-form-desc" noValidate>
            <p id="edit-form-desc" className="sr-only">
              Formulaire de modification du restaurant : nom, adresse et fuseau horaire.
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
                disabled={updateRestaurant.isPending}
                className="shadow-md bg-teal-600 hover:bg-teal-700 text-white border-0"
              >
                {updateRestaurant.isPending ? (
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
                disabled={updateRestaurant.isPending}
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
