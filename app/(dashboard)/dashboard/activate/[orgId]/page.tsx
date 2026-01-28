'use client'

import { useEffect, Suspense, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrganizationList } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

function ActivateContent() {
  const params = useParams()
  const router = useRouter()
  const { setActive, isLoaded, userMemberships } = useOrganizationList()
  const { toast } = useToast()
  const orgId = params.orgId as string
  const hasActivated = useRef(false)

  useEffect(() => {
    // Éviter les appels multiples
    if (hasActivated.current) {
      return
    }

    // Attendre que Clerk soit chargé
    if (!isLoaded || !setActive) {
      return
    }

    // Attendre que userMemberships soit disponible
    if (!userMemberships?.data) {
      return
    }

    hasActivated.current = true

    const activate = async () => {
      try {
        console.log('🔍 Recherche de l\'organisation:', orgId)
        console.log('📋 Organisations disponibles:', userMemberships.data?.map(m => ({
          id: m.organization.id,
          name: m.organization.name
        })))

        // Vérifier que l'organisation est dans la liste
        const orgInList = userMemberships.data.find(
          membership => membership.organization.id === orgId
        )

        if (!orgInList) {
          console.error('❌ Organisation non trouvée dans userMemberships:', orgId)
          console.log('💡 Toutes les organisations:', userMemberships.data)
          
          // Essayer quand même d'activer - parfois Clerk accepte même si pas dans la liste
          try {
            console.log('🔄 Tentative d\'activation directe...')
            await setActive({ organization: orgId })
            console.log('✅ Activation directe réussie')
            
            toast({
              title: 'Organisation activée',
              description: 'L&apos;organisation a été activée avec succès.',
            })
            
            setTimeout(() => {
              window.location.href = '/dashboard'
            }, 1000)
            return
          } catch (directError) {
            console.error('❌ Activation directe échouée:', directError)
            toast({
              title: 'Erreur',
              description: `L&apos;organisation n&apos;est pas dans votre liste. Veuillez utiliser le sélecteur d&apos;organisation en haut à gauche.`,
              variant: 'destructive',
              duration: 5000,
            })
            setTimeout(() => {
              router.push('/dashboard')
            }, 2000)
            return
          }
        }

        console.log('✅ Organisation trouvée:', orgInList.organization.name)
        
        // Activer l'organisation
        await setActive({ organization: orgId })
        
        console.log('✅ Organisation activée avec succès')
        
        toast({
          title: 'Organisation activée',
          description: `L&apos;organisation "${orgInList.organization.name}" est maintenant active.`,
        })
        
        // Rediriger vers le dashboard après un court délai
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      } catch (error) {
        console.error('❌ Error activating organization:', error)
        toast({
          title: 'Erreur',
          description: error instanceof Error ? error.message : 'Impossible d&apos;activer l&apos;organisation. Veuillez réessayer.',
          variant: 'destructive',
        })
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    }

    activate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, isLoaded, userMemberships])

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-muted/25" role="main" aria-label="Activation de l'organisation" aria-live="polite">
      <div className="max-w-7xl mx-auto w-full px-6 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center shadow-md mb-4" aria-hidden="true">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
        <h2 className="text-lg font-semibold">Activation de l&apos;organisation en cours...</h2>
        <p className="text-sm text-muted-foreground">Veuillez patienter</p>
      </div>
    </main>
  )
}

export default function ActivatePage() {
  return (
    <Suspense fallback={
      <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-muted/25" role="main" aria-label="Chargement">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center shadow-md" aria-hidden="true">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        </div>
      </main>
    }>
      <ActivateContent />
    </Suspense>
  )
}
