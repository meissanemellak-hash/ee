'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

interface ApplyRecommendationButtonProps {
  recommendationId: string
}

export function ApplyRecommendationButton({ recommendationId }: ApplyRecommendationButtonProps) {
  const [loading, setLoading] = useState(false)
  const [applied, setApplied] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleApply = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/recommendations/${recommendationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'accepted' }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l&apos;application')
      }

      setApplied(true)
      toast({
        title: 'Recommandation appliquée',
        description: 'La recommandation a été acceptée et l\'inventaire a été mis à jour (réception de commande).',
      })

      // Rafraîchir la page pour mettre à jour les métriques
      router.refresh()
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
    >
      {loading ? 'Application...' : 'Appliquer'}
    </Button>
  )
}
