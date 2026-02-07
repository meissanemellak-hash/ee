'use client'

import { useState } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

interface ApplyRecommendationButtonProps {
  recommendationId: string
  recommendationType?: 'ORDER' | 'STAFFING'
  onApplied?: (id: string) => void
}

export function ApplyRecommendationButton({ recommendationId, recommendationType = 'ORDER', onApplied }: ApplyRecommendationButtonProps) {
  const [loading, setLoading] = useState(false)
  const [applied, setApplied] = useState(false)
  const { organization } = useOrganization()
  const { toast } = useToast()
  const router = useRouter()

  const handleApply = async () => {
    if (!organization?.id) {
      toast({
        title: 'Erreur',
        description: 'Organisation non disponible. Rechargez la page.',
        variant: 'destructive',
      })
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`/api/recommendations/${recommendationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'accepted', clerkOrgId: organization.id }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error((data.error || data.details) || 'Erreur lors de l\'application')
      }

      setApplied(true)
      onApplied?.(recommendationId)
      toast({
        title: 'Recommandation appliquée',
        description: recommendationType === 'STAFFING'
          ? 'La recommandation d\'effectifs a été marquée comme acceptée.'
          : 'La recommandation a été acceptée et l\'inventaire a été mis à jour (réception de commande).',
      })

      // Rafraîchir la page pour mettre à jour les métriques
      router.refresh()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: translateApiError(error instanceof Error ? error.message : undefined),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (applied) {
    return (
      <Button disabled size="sm" className="bg-teal-600 hover:bg-teal-700">
        <Check className="mr-2 h-4 w-4" />
        Appliquée
      </Button>
    )
  }

  return (
    <Button 
      onClick={handleApply} 
      disabled={loading}
      size="sm"
      className="bg-teal-600 hover:bg-teal-700 text-white border-0 shadow-sm"
    >
      {loading ? 'Application...' : 'Appliquer'}
    </Button>
  )
}
