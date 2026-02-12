'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { Users, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRestaurants } from '@/lib/react-query/hooks/use-restaurants'
import {
  usePlannedStaffing,
  useUpdatePlannedStaffing,
  PLANNED_STAFFING_SLOTS,
  type PlannedStaffingSlot,
} from '@/lib/react-query/hooks/use-planned-staffing'

export default function EffectifsPage() {
  const { organization, isLoaded } = useOrganization()
  const searchParams = useSearchParams()
  const urlRestaurant = searchParams.get('restaurant')

  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(() => urlRestaurant || '')
  const [planDate, setPlanDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [slots, setSlots] = useState<PlannedStaffingSlot[]>(
    PLANNED_STAFFING_SLOTS.map((slotLabel) => ({ slotLabel, plannedCount: 0 }))
  )

  const { data: restaurantsData } = useRestaurants(1, 100)
  const restaurants = restaurantsData?.restaurants || []

  const { data: plannedData, isLoading } = usePlannedStaffing(
    selectedRestaurant || null,
    planDate
  )
  const updateMutation = useUpdatePlannedStaffing()

  useEffect(() => {
    setSelectedRestaurant(urlRestaurant || (restaurants[0]?.id ?? ''))
  }, [urlRestaurant])

  useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurant) {
      setSelectedRestaurant(restaurants[0].id)
    }
  }, [restaurants, selectedRestaurant])

  useEffect(() => {
    if (plannedData?.slots) {
      setSlots(
        PLANNED_STAFFING_SLOTS.map((label) => {
          const row = plannedData.slots.find((s) => s.slotLabel === label)
          return { slotLabel: label, plannedCount: row?.plannedCount ?? 0 }
        })
      )
    }
  }, [plannedData])

  const handleSlotChange = (slotLabel: string, value: number) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.slotLabel === slotLabel
          ? { ...s, plannedCount: Math.max(0, Math.floor(value) || 0) }
          : s
      )
    )
  }

  const handleSave = () => {
    if (!selectedRestaurant) return
    updateMutation.mutate({ restaurantId: selectedRestaurant, date: planDate, slots })
  }

  if (!isLoaded) {
    return null
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" aria-label="Planning effectifs">
      <div className="p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
        <Breadcrumbs
          items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Effectifs' }]}
          className="mb-4"
        />
        <header>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-teal-600 dark:text-teal-400" />
            Planning effectifs
          </h1>
          <p className="text-muted-foreground mt-1.5">
            Saisissez l&apos;effectif prévu par créneau. Les alertes Sur-effectif / Sous-effectif sont
            calculées en comparant ces valeurs aux effectifs recommandés (Recommandations → Effectifs).
            En acceptant une recommandation d&apos;effectifs sur la page Recommandations, l&apos;effectif prévu est mis à jour automatiquement pour la date concernée.
          </p>
        </header>

        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Effectif prévu</CardTitle>
            <CardDescription>
              Choisissez le restaurant et la date, puis renseignez le nombre de personnes prévues par
              créneau. Enregistrez pour mettre à jour les alertes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="effectif-restaurant">Restaurant</Label>
                <Select
                  value={selectedRestaurant}
                  onValueChange={setSelectedRestaurant}
                >
                  <SelectTrigger id="effectif-restaurant" className="bg-muted/50 dark:bg-gray-800">
                    <SelectValue placeholder="Sélectionner un restaurant" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="effectif-date">Date</Label>
                <Input
                  id="effectif-date"
                  type="date"
                  value={planDate}
                  onChange={(e) => setPlanDate(e.target.value)}
                  className="bg-muted/50 dark:bg-gray-800"
                />
              </div>
            </div>

            {!selectedRestaurant ? (
              <p className="text-sm text-muted-foreground">
                Sélectionnez un restaurant pour afficher et modifier l&apos;effectif prévu.
              </p>
            ) : (
              <>
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    <span>Chargement des effectifs…</span>
                  </div>
                )}
                <div className="space-y-4">
                  <Label className="text-base">Effectif par créneau</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {slots.map((slot) => (
                      <div
                        key={slot.slotLabel}
                        className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 dark:bg-gray-800/50 px-4 py-3"
                      >
                        <span className="font-medium text-sm">{slot.slotLabel}</span>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={slot.plannedCount}
                          onChange={(e) =>
                            handleSlotChange(slot.slotLabel, Number(e.target.value))
                          }
                          className="w-20 text-center"
                          aria-label={`Effectif prévu ${slot.slotLabel}`}
                          disabled={isLoading}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending || isLoading}
                  className="bg-teal-600 hover:bg-teal-700 text-white border-0"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement…
                    </>
                  ) : (
                    'Enregistrer l\'effectif prévu'
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
