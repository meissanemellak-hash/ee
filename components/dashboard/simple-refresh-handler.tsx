'use client'

import { useOrganization } from '@clerk/nextjs'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * SOLUTION ULTRA-SIMPLE :
 * Si une organisation est active sur la page setup, recharger la page après 3 secondes
 * Cela permet au serveur de détecter orgId et de rediriger
 * 
 * UNIQUEMENT utilisé sur /dashboard/setup
 * UNE SEULE FOIS par session (localStorage)
 */
export function SimpleRefreshHandler() {
  const { organization, isLoaded } = useOrganization()
  const pathname = usePathname()
  const hasHandled = useRef(false)

  useEffect(() => {
    // Ne s'exécuter QUE sur la page setup
    if (pathname !== '/dashboard/setup') {
      return
    }

    // Attendre que Clerk soit chargé
    if (!isLoaded) {
      return
    }

    // Vérifier dans localStorage si on a déjà géré cette session
    const handledKey = 'setup-refresh-handled'
    const alreadyHandled = localStorage.getItem(handledKey)
    
    if (alreadyHandled || hasHandled.current) {
      return
    }

    // Si une organisation est active, marquer comme géré et recharger après 3 secondes
    if (organization?.id) {
      hasHandled.current = true
      localStorage.setItem(handledKey, 'true')
      
      // Recharger la page après 3 secondes pour laisser le temps aux cookies de se synchroniser
      // Le serveur détectera orgId et redirigera vers /dashboard
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    }
  }, [organization, isLoaded, pathname])

  return null
}
