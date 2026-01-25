'use client'

import { useOrganization } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * SOLUTION ROBUSTE : Détecte quand une organisation est activée via Clerk
 * Vérifie que l'organisation est synchronisée dans la DB avant de rediriger
 * Évite les boucles de redirection
 * IMPORTANT : Ne redirige PAS si on est déjà sur /dashboard (évite les boucles)
 */
export function AutoRedirectOnActivation() {
  const { organization, isLoaded } = useOrganization()
  const pathname = usePathname()
  const hasRedirected = useRef(false)
  const [isChecking, setIsChecking] = useState(false)
  const checkAttempts = useRef(0)
  const maxAttempts = 3

  useEffect(() => {
    // Ne rien faire si on est déjà sur le dashboard (évite les boucles)
    if (pathname === '/dashboard') {
      return
    }

    // Attendre que Clerk soit chargé
    if (!isLoaded || !organization?.id) {
      return
    }

    // Si on a déjà redirigé ou qu'on est en train de vérifier, ne plus rien faire
    if (hasRedirected.current || isChecking) {
      return
    }

    // Limiter le nombre de tentatives pour éviter les boucles infinies
    if (checkAttempts.current >= maxAttempts) {
      console.log('⚠️ Nombre maximum de tentatives atteint, arrêt de la vérification')
      return
    }

    // Vérifier que l'organisation est synchronisée dans la DB avant de rediriger
    const checkAndRedirect = async () => {
      setIsChecking(true)
      checkAttempts.current += 1
      
      try {
        // Vérifier côté serveur que l'organisation existe dans la DB
        const response = await fetch('/api/organizations/check-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clerkOrgId: organization.id }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.synced) {
            hasRedirected.current = true
            console.log('✅ Organisation synchronisée, redirection vers le dashboard')
            // Redirection avec rechargement complet
            window.location.href = '/dashboard'
            return
          }
        }
        
        // Si pas synchronisée, attendre un peu et réessayer
        console.log(`⏳ Organisation pas encore synchronisée, tentative ${checkAttempts.current}/${maxAttempts}...`)
        if (checkAttempts.current < maxAttempts) {
          setTimeout(() => {
            setIsChecking(false)
          }, 2000)
        } else {
          setIsChecking(false)
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error)
        // En cas d'erreur, ne pas rediriger pour éviter les boucles
        setIsChecking(false)
      }
    }

    checkAndRedirect()
  }, [organization, isLoaded, isChecking, pathname])

  return null
}
