'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useOrganizationList } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

function ActivatePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setActive, isLoaded, userMemberships } = useOrganizationList()
  const { toast } = useToast()

  useEffect(() => {
    if (!isLoaded) return

    const orgIdToActivate = searchParams.get('orgId')
    
    if (!orgIdToActivate) {
      router.replace('/dashboard')
      return
    }

    // Vérifier que l'organisation est dans la liste
    const orgInList = userMemberships?.data?.find(
      membership => membership.organization.id === orgIdToActivate
    )

    if (!orgInList) {
      toast({
        title: 'Erreur',
        description: 'Organisation introuvable dans votre liste.',
        variant: 'destructive',
      })
      router.replace('/dashboard')
      return
    }

    if (!setActive) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'activer l\'organisation.',
        variant: 'destructive',
      })
      router.replace('/dashboard')
      return
    }

    const activateOrg = async () => {
      try {
        // Utiliser une approche différente : créer un événement personnalisé
        // et laisser le composant parent gérer l'activation
        const event = new CustomEvent('activate-organization', { 
          detail: { orgId: orgIdToActivate } 
        })
        window.dispatchEvent(event)
        
        // Attendre un peu
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Essayer d'activer directement via l'API Clerk
        // En utilisant fetch pour éviter le problème de cookies
        try {
          await setActive({ organization: orgIdToActivate })
        } catch (setActiveError) {
          console.error('setActive error:', setActiveError)
          // Si setActive échoue, on force une redirection avec le paramètre
          // et on laisse le header gérer l'activation
          window.location.href = `/dashboard?switchOrg=${encodeURIComponent(orgIdToActivate)}`
          return
        }
        
        // Attendre que Clerk synchronise
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        toast({
          title: 'Organisation activée',
          description: 'Votre organisation est maintenant active.',
        })
        
        // Rediriger vers le dashboard
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 500)
      } catch (error) {
        console.error('Error activating organization:', error)
        // En cas d'erreur, rediriger vers le dashboard avec le paramètre
        window.location.href = `/dashboard?switchOrg=${encodeURIComponent(orgIdToActivate)}`
      }
    }
    
    activateOrg()
  }, [searchParams, setActive, isLoaded, userMemberships, router, toast])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Activation de l&apos;organisation en cours...</p>
      </div>
    </div>
  )
}

export default function ActivatePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ActivatePageContent />
    </Suspense>
  )
}
