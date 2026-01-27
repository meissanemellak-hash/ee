'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Beaker, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const UNITS = ['kg', 'g', 'L', 'mL', 'unité', 'pièce', 'paquet', 'boîte']

interface Ingredient {
  id: string
  name: string
  unit: string
  costPerUnit: number
  packSize: number | null
  supplierName: string | null
}

export default function EditIngredientPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { organization, isLoaded } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ingredient, setIngredient] = useState<Ingredient | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    costPerUnit: '',
    packSize: '',
    supplierName: '',
  })

  useEffect(() => {
    if (params.id && isLoaded && organization?.id) {
      fetchIngredient()
    }
  }, [params.id, isLoaded, organization?.id])

  const fetchIngredient = async () => {
    if (!organization?.id) {
      return
    }

    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      queryParams.append('clerkOrgId', organization.id)
      const response = await fetch(`/api/ingredients/${params.id}?${queryParams.toString()}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'Ingrédient introuvable',
            description: 'L\'ingrédient que vous recherchez n\'existe pas.',
            variant: 'destructive',
          })
          router.push('/dashboard/ingredients')
          return
        }
        throw new Error('Erreur lors du chargement de l\'ingrédient')
      }

      const data = await response.json()
      setIngredient(data.ingredient)
      setFormData({
        name: data.ingredient.name,
        unit: data.ingredient.unit,
        costPerUnit: data.ingredient.costPerUnit.toString(),
        packSize: data.ingredient.packSize?.toString() || '',
        supplierName: data.ingredient.supplierName || '',
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger l\'ingrédient',
        variant: 'destructive',
      })
      router.push('/dashboard/ingredients')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

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

      if (!organization?.id) {
        toast({
          title: 'Erreur',
          description: 'Aucune organisation active. Veuillez sélectionner une organisation.',
          variant: 'destructive',
        })
        return
      }

      const response = await fetch(`/api/ingredients/${params.id}`, {
        method: 'PATCH',
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

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Erreur lors de la modification')
      }

      const data = await response.json()
      
      toast({
        title: 'Ingrédient modifié',
        description: `${data.ingredient.name} a été modifié avec succès.`,
      })

      router.push('/dashboard/ingredients')
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

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Card className="border shadow-sm">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Chargement de l'ingrédient...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!ingredient) {
    return null
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header (Style Sequence) */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/ingredients">
          <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Beaker className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Modifier l'ingrédient</h1>
            <p className="text-muted-foreground">
              Modifiez les informations de l'ingrédient
            </p>
          </div>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Informations de l'ingrédient</CardTitle>
          <CardDescription className="mt-1">
            Modifiez les informations de l'ingrédient
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
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unité *</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                <SelectTrigger disabled={saving}>
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
                disabled={saving}
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
                disabled={saving}
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
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Optionnel. Nom du fournisseur pour cet ingrédient.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={saving} className="shadow-sm">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
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
