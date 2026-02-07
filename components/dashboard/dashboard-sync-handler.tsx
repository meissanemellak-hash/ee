'use client'

import { useOrganization } from '@clerk/nextjs'
import { useEffect, useRef } from 'react'
import { logger } from '@/lib/logger'

/**
 * SOLUTION RADICALE ET DÉFINITIVE :
 * Si une organisation est active côté client (via useOrganization), on la synchronise dans la DB
 * UNIQUEMENT si elle n'est pas déjà synchronisée côté serveur.
 * On utilise localStorage pour éviter les rechargements en boucle.
 */
export function DashboardSyncHandler() {
  const { organization, isLoaded } = useOrganization()
  const hasSynced = useRef(false)

  useEffect(() => {
    // Attendre que Clerk soit chargé
    if (!isLoaded || hasSynced.current) {
      return
    }

    // Si une organisation est active côté client
    if (organization?.id) {
      // Vérifier si on a déjà tenté de synchroniser cette organisation
      const syncKey = `dashboard-sync-${organization.id}`
      const lastSyncAttempt = localStorage.getItem(syncKey)
      const now = Date.now()

      // Si on a tenté de synchroniser il y a moins de 10 secondes, ne pas réessayer
      if (lastSyncAttempt) {
        const timeSinceLastAttempt = now - parseInt(lastSyncAttempt, 10)
        if (timeSinceLastAttempt < 10000) {
          logger.log('⏳ Synchronisation récente, pas de rechargement')
          return
        }
      }

      // Vérifier si l'URL contient un paramètre de cache-busting (indique un rechargement récent)
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.has('t')) {
        logger.log('✅ Page déjà rechargée, pas de nouvelle synchronisation')
        hasSynced.current = true
        return
      }

      hasSynced.current = true
      localStorage.setItem(syncKey, now.toString())
      
      logger.log('✅ Organisation active détectée:', organization.name, organization.id)
      
      // Vérifier d'abord si l'organisation est déjà synchronisée côté serveur
      fetch('/api/organizations/check-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkOrgId: organization.id }),
      })
        .then(res => res.json())
        .then(data => {
          logger.log('📋 Vérification synchronisation:', data)
          
          // Si l'organisation est déjà synchronisée, ne pas recharger
          if (data.synced && data.organization) {
            logger.log('✅ Organisation déjà synchronisée:', data.organization.name)
            // Nettoyer le flag de synchronisation
            localStorage.removeItem(syncKey)
            return
          }

          // Si pas synchronisée, utiliser force-sync
          logger.log('🔄 Organisation non synchronisée, synchronisation en cours...')
          return fetch('/api/organizations/force-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        })
        .then(res => res ? res.json() : null)
        .then(data => {
          if (!data) return // Déjà synchronisée
          
          logger.log('📋 Réponse force-sync:', data)
          
          if (data.synced) {
            logger.log('✅ Organisation synchronisée:', data.organization?.name)
          } else {
            logger.log('⚠️ Synchronisation échouée')
          }
          
          // Nettoyer le flag avant le rechargement
          localStorage.removeItem(syncKey)
          
          // Forcer un rechargement UNIQUEMENT si nécessaire
          // Attendre un peu pour laisser le temps au serveur de mettre à jour
          setTimeout(() => {
            logger.log('🔄 Rechargement pour afficher le dashboard')
            window.location.replace(`/dashboard?t=${Date.now()}`)
          }, 500)
        })
        .catch(error => {
          logger.error('❌ Erreur de synchronisation:', error)
          // Nettoyer le flag en cas d'erreur
          localStorage.removeItem(syncKey)
          // Ne pas recharger en cas d'erreur pour éviter les boucles
        })
    }
  }, [organization, isLoaded])

  return null
}
