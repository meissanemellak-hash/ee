'use client'

import { useOrganization } from '@clerk/nextjs'
import { useEffect, useRef } from 'react'
import { logger } from '@/lib/logger'

/**
 * Si une organisation est active côté client mais le serveur a rendu l'écran de chargement,
 * on synchronise immédiatement (check-sync crée l'org en DB si besoin) puis on recharge une seule fois.
 * Tout est automatique : pas de bouton à cliquer, redirection systématique.
 */
export function DashboardSyncHandler() {
  const { organization, isLoaded } = useOrganization()
  const hasSynced = useRef(false)

  useEffect(() => {
    if (!isLoaded || hasSynced.current || !organization?.id) return

    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('t')) {
      hasSynced.current = true
      return
    }

    hasSynced.current = true
    const syncKey = `dashboard-sync-${organization.id}`
    const now = Date.now()
    const lastSync = localStorage.getItem(syncKey)
    if (lastSync && now - parseInt(lastSync, 10) < 800) return
    localStorage.setItem(syncKey, now.toString())

    const doRedirect = () => {
      localStorage.removeItem(syncKey)
      window.location.replace(`/dashboard?t=${Date.now()}`)
    }

    fetch('/api/organizations/check-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkOrgId: organization.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.synced && data.organization) {
          doRedirect()
          return null
        }
        return fetch('/api/organizations/force-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }).then((r) => r.json())
      })
      .then((data) => {
        if (data != null) doRedirect()
      })
      .catch((error) => {
        logger.error('❌ Erreur de synchronisation:', error)
        localStorage.removeItem(syncKey)
        setTimeout(doRedirect, 1500)
      })
  }, [organization?.id, organization?.name, isLoaded])

  return null
}
