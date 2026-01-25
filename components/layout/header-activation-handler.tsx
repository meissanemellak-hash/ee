'use client'

import { useOrganizationList } from '@clerk/nextjs'
import { useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

function ActivationHandlerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setActive, isLoaded, userMemberships } = useOrganizationList()
  const { toast } = useToast()
  const hasActivated = useRef(false)

  // Détecter le paramètre activateOrg et activer l'organisation
  useEffect(() => {
    const activateOrgId = searchParams.get('activateOrg')
    
    if (!activateOrgId || !isLoaded || !setActive || hasActivated.current) {
      return
    }

    // Éviter les appels multiples
    hasActivated.current = true

    const activate = async () => {
      try {
        console.log('🔍 Activation de l\'organisation:', activateOrgId)
        console.log('📋 userMemberships:', userMemberships?.data)
        
        // Trouver l'organisation dans userMemberships
        const membership = userMemberships?.data?.find(
          m => m.organization.id === activateOrgId
        )

        if (membership) {
          console.log('✅ Organisation trouvée:', membership.organization.name)
          
          try {
            // Activer l'organisation
            await setActive({ organization: activateOrgId })
            console.log('✅ setActive réussi')
            
            toast({
              title: 'Organisation activée',
              description: `L'organisation "${membership.organization.name}" est maintenant active.`,
            })
            
            // Forcer un rechargement complet pour que le serveur détecte le changement
            setTimeout(() => {
              window.location.href = '/dashboard'
            }, 500)
          } catch (setActiveError) {
            console.error('❌ Erreur setActive:', setActiveError)
            
            // Si setActive échoue, utiliser une approche alternative
            // Rediriger vers une URL qui force l'activation via Clerk
            toast({
              title: 'Activation en cours...',
              description: 'Redirection vers le dashboard...',
            })
            
            // Utiliser window.location pour forcer un rechargement complet
            // Le serveur détectera le changement d'organisation via les cookies de Clerk
            window.location.href = '/dashboard'
          }
        } else {
          console.error('❌ Organisation non trouvée dans userMemberships')
          toast({
            title: 'Erreur',
            description: 'Organisation introuvable. Veuillez utiliser le sélecteur d\'organisation en haut à gauche.',
            variant: 'destructive',
            duration: 5000,
          })
          
          // Rediriger quand même vers le dashboard
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 2000)
        }
      } catch (error) {
        console.error('❌ Error activating organization:', error)
        toast({
          title: 'Erreur',
          description: 'Impossible d\'activer l\'organisation. Veuillez utiliser le sélecteur d\'organisation en haut à gauche.',
          variant: 'destructive',
          duration: 5000,
        })
        
        // Rediriger vers le dashboard
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      }
    }

    activate()
  }, [searchParams, isLoaded, setActive, userMemberships, router, toast])

  return null
}

export function HeaderActivationHandler() {
  return (
    <Suspense fallback={null}>
      <ActivationHandlerContent />
    </Suspense>
  )
}
