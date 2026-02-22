'use client'

import { useOrganization } from '@clerk/nextjs'
import { useEffect, useRef } from 'react'
import { logger } from '@/lib/logger'

/**
 * Si une organisation est active côté client mais le serveur a rendu "sync en cours",
 * on synchronise immédiatement (check-sync crée l'org en DB si besoin) puis on recharge une seule fois.
 * Throttle court (1,5 s) pour éviter les boucles tout en rendant l'accès quasi instantané.
 */
export function DashboardSyncHandler() {
  const { organization, isLoaded } = useOrganization()
  const hasSynced = useRef(false)

  useEffect(() => {
    if (!isLoaded || hasSynced.current || !organization?.id) return

    const syncKey = `dashboard-sync-${organization.id}`
    const lastSync = localStorage.getItem(syncKey)
    const now = Date.now()
    if (lastSync && now - parseInt(lastSync, 10) < 1500) return

    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('t')) {
      hasSynced.current = true
      return
    }

    hasSynced.current = true
    localStorage.setItem(syncKey, now.toString())

    fetch('/api/organizations/check-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkOrgId: organization.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.synced && data.organization) {
          localStorage.removeItem(syncKey)
          window.location.replace(`/dashboard?t=${Date.now()}`)
          return
        }
        return fetch('/api/organizations/force-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      })
      .then((res) => (res ? res.json() : null))
      .then((data) => {
        if (data?.synced) localStorage.removeItem(syncKey)
        window.location.replace(`/dashboard?t=${Date.now()}`)
      })
      .catch((error) => {
        logger.error('❌ Erreur de synchronisation:', error)
        localStorage.removeItem(syncKey)
      })
  }, [organization?.id, organization?.name, isLoaded])

  return null
}
