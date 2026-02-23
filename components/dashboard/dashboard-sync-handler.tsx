'use client'

import { useOrganization } from '@clerk/nextjs'
import { useEffect, useRef } from 'react'
import { logger } from '@/lib/logger'

/**
 * Uniquement quand le serveur a rendu l'écran "sync en cours" (data-dashboard-state="syncing") :
 * on synchronise (check-sync crée l'org si besoin, sinon force-sync) puis on recharge une fois.
 * Si le dashboard complet est affiché, on ne fait rien : pas de reload, comme en dev.
 */
export function DashboardSyncHandler() {
  const { organization, isLoaded } = useOrganization()
  const hasSynced = useRef(false)

  useEffect(() => {
    if (!isLoaded || hasSynced.current || !organization?.id) return
    if (typeof document === 'undefined') return
    if (!document.querySelector('[data-dashboard-state="syncing"]')) return

    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('t')) {
      hasSynced.current = true
      return
    }

    const syncKey = `dashboard-sync-${organization.id}`
    const now = Date.now()
    const lastSync = localStorage.getItem(syncKey)
    if (lastSync && now - parseInt(lastSync, 10) < 1500) return

    hasSynced.current = true
    localStorage.setItem(syncKey, now.toString())

    let didRedirect = false
    const doRedirect = () => {
      if (didRedirect) return
      didRedirect = true
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
          return
        }
        return fetch('/api/organizations/force-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }).then((r) => r.json())
      })
      .then((data) => {
        if (data !== undefined) doRedirect()
      })
      .catch((error) => {
        logger.error('❌ Erreur de synchronisation:', error)
        localStorage.removeItem(syncKey)
        doRedirect()
      })
      .finally(() => {
        setTimeout(() => {
          if (!didRedirect && document.querySelector('[data-dashboard-state="syncing"]')) {
            window.location.replace(`/dashboard?t=${Date.now()}`)
          }
        }, 2500)
      })
  }, [organization?.id, organization?.name, isLoaded])

  return null
}
