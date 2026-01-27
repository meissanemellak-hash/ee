'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const UNITS = ['kg', 'g', 'L', 'mL', 'unité', 'pièce', 'paquet', 'boîte']

export default function NewIngredientPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    costPerUnit: '',
    packSize: '',
    supplierName: '',
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
      const costPerUnit = parseFloat(formData.costPerUnit)
      
      if (isNaN(costPerUnit) || costPerUnit <= 0) {
        throw new Error('Le coût par unité doit être un nombre positif')
      }

      if (!formData.unit) {
        throw new Error('L\'unité est requise')
      }

      const packSize = formData.packSize ? parseFloat(formData.packSize) : null
      if (packSize !== null && (isNaN(packSize) || packSize <= 0)) {
        throw new Error('La taille du pack doit être un nombre positif')
      }

      let response = await fetch('/api/ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          unit: formData.unit,
          costPerUnit,
          packSize,
          supplierName: formData.supplierName.trim() || null,
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
          response = await fetch('/api/ingredients', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: formData.name.trim(),
              unit: formData.unit,
              costPerUnit,
              packSize,
              supplierName: formData.supplierName.trim() || null,
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
        title: 'Ingrédient créé',
        description: `${data.ingredient.name} a été créé avec succès.`,
      })

      router.push('/dashboard/ingredients')
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
      <div>
        <h1 className="text-3xl font-bold">Nouvel ingrédient</h1>
        <p className="text-muted-foreground">
          Ajoutez un nouvel ingrédient à votre catalogue
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'ingrédient</CardTitle>
          <CardDescription>
            Remplissez les informations pour créer un nouvel ingrédient
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'ingrédient *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tomate, Fromage, Pain..."
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unité *</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                <SelectTrigger disabled={loading}>
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
                Unité de mesure pour cet ingrédient (kg, L, unité, etc.)
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
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Coût d'achat par unité en euros.
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
                disabled={loading}
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
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Optionnel. Nom du fournisseur pour cet ingrédient.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Création...' : 'Créer l\'ingrédient'}
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
