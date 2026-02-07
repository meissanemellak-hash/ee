'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, HelpCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const GASPILLAGE_EXPLICATION =
  'Ce montant vient des produits en surstock (stock au-dessus du seuil max) : on multiplie le surplus par le coût unitaire de chaque ingrédient. Si ce calcul n\'est pas possible, on utilise une estimation forfaitaire (800 € par alerte de surstock).'

export function GaspillageEstimeCard({ estimatedWaste }: { estimatedWaste: number }) {
  const [showExplanation, setShowExplanation] = useState(false)

  return (
    <Card className="rounded-xl border shadow-sm bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          Gaspillage estimé
          <button
            type="button"
            onClick={() => setShowExplanation((v) => !v)}
            className="inline-flex text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded focus:outline-none"
            aria-label="Afficher l'explication du gaspillage estimé"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </CardTitle>
        <Package className="h-4 w-4 text-amber-600" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {showExplanation && (
          <p className="text-xs text-muted-foreground mb-2 p-2 rounded-md bg-muted/60 border border-border">
            {GASPILLAGE_EXPLICATION}
          </p>
        )}
        <div className="text-3xl font-bold">
          {formatCurrency(estimatedWaste)}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Produits frais surstockés ce mois-ci
        </p>
      </CardContent>
    </Card>
  )
}
