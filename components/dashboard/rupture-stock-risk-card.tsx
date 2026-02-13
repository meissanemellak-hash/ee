'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const RUPTURE_EXPLICATION =
  "Ce montant estime l'impact financier des alertes de rupture de stock (niveau élevé et critique). Il est calculé à partir du coût des quantités manquantes et d'une marge estimée perdue. Plus le nombre d'alertes et le coût des ingrédients concernés sont élevés, plus le montant est élevé."

interface RuptureStockRiskCardProps {
  criticalAlertsRisk: number
  criticalAlertsCount: number
}

export function RuptureStockRiskCard({ criticalAlertsRisk, criticalAlertsCount }: RuptureStockRiskCardProps) {
  const [showExplanation, setShowExplanation] = useState(false)

  return (
    <Card className="rounded-xl border shadow-sm bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          Risque de rupture de stock (7 jours)
          <button
            type="button"
            onClick={() => setShowExplanation((v) => !v)}
            className="inline-flex text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded focus:outline-none"
            aria-label="Afficher l'explication du risque de rupture de stock"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </CardTitle>
        <AlertTriangle className="h-4 w-4 text-orange-600" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {showExplanation && (
          <p className="text-xs text-muted-foreground mb-2 p-2 rounded-md bg-muted/60 border border-border">
            {RUPTURE_EXPLICATION}
          </p>
        )}
        <div className="text-3xl font-bold text-orange-600">
          {formatCurrency(criticalAlertsRisk)}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {criticalAlertsCount} restaurant{criticalAlertsCount !== 1 ? 's' : ''} concerné{criticalAlertsCount !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  )
}
