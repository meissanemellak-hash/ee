'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { translateApiError } from '@/lib/translate-api-error'
import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function CleanupOrganizationsButton() {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCleanup = async () => {
    const deleteAll = confirm(
      'Voulez-vous supprimer TOUTES les organisations de la DB pour repartir à zéro ?\n\n' +
      'Cliquez sur OK pour tout supprimer, ou Annuler pour supprimer seulement les orphelines.'
    )

    if (!deleteAll && !confirm('Supprimer les organisations orphelines (qui ne sont pas dans vos membreships Clerk) ?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/organizations/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deleteAll }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du nettoyage')
      }

      toast({
        title: 'Nettoyage terminé',
        description: `${data.count} organisation(s) orpheline(s) supprimée(s).`,
      })

      // Recharger la page pour voir les changements
      setTimeout(() => {
        router.refresh()
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Error cleaning up organizations:', error)
      toast({
        title: 'Erreur',
        description: translateApiError(error instanceof Error ? error.message : undefined),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleCleanup}
      disabled={loading}
      variant="destructive"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Suppression...
        </>
      ) : (
        <>
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer les organisations orphelines
        </>
      )}
    </Button>
  )
}
