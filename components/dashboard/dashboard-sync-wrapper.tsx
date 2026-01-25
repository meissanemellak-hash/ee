'use client'

import { DashboardSyncHandler } from './dashboard-sync-handler'

/**
 * Wrapper client pour DashboardSyncHandler
 * Permet d'utiliser le composant dans une page serveur
 */
export function DashboardSyncWrapper() {
  return <DashboardSyncHandler />
}
