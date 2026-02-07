'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useOrganization } from '@clerk/nextjs'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { logger } from '@/lib/logger'

/**
 * SOLUTION SIMPLE ET DIRECTE :
 * Bouton pour forcer l'accès au dashboard en synchronisant l'organisation
 * et en redirigeant manuellement
 */
export function ForceDashboardAccess() {
  const { organization, isLoaded } = useOrganization()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleForceAccess = async () => {
    if (!isLoaded) {
      toast({
        title: 'Chargement en cours',
        description: 'Veuillez patienter...',
      })
      return
    }

    if (!organization?.id) {
      toast({
        title: 'Aucune organisation active',
        description: 'Veuillez sélectionner une organisation dans le sélecteur en haut à gauche, puis réessayez.',
        variant: 'destructive',
        duration: 5000,
      })
      return
    }

    setLoading(true)

    try {
      logger.log('🔄 Redirection vers le dashboard:', organization.id, organization.name)
      
      toast({
        title: 'Redirection en cours...',
        description: 'Accès au dashboard...',
        duration: 2000,
      })

      // Redirection directe vers /dashboard
      // Le DashboardSyncHandler gérera automatiquement la synchronisation
      setTimeout(() => {
        logger.log('🔄 Redirection vers /dashboard')
        window.location.href = '/dashboard'
      }, 1000)
    } catch (error) {
      logger.error('❌ Erreur:', error)
      toast({
        title: 'Redirection en cours...',
        description: 'Redirection vers le dashboard...',
      })

      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)
    } finally {
      setLoading(false)
    }
  }

  // Toujours afficher le bouton, même si l'organisation n'est pas encore chargée
  // Cela permet à l'utilisateur de forcer l'accès
  return (
    <Button
      onClick={handleForceAccess}
      disabled={loading || !isLoaded}
      className="w-full"
      size="lg"
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!isLoaded ? 'Chargement...' : !organization?.id ? 'Sélectionnez une organisation d\'abord' : 'Accéder au dashboard maintenant'}
    </Button>
  )
}
