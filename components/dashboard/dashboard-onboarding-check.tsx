'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Méthode B : vérification côté client au montage.
 * Appelle GET /api/onboarding/status ; si completed === false, redirige vers /dashboard/onboarding.
 * Évite d'afficher le dashboard aux nouveaux admins d'une org qui n'a pas fait l'onboarding.
 */
export function DashboardOnboardingCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'redirect' | 'ok'>('loading')

  useEffect(() => {
    let cancelled = false
    fetch('/api/onboarding/status')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (data.completed === false) {
          setStatus('redirect')
          router.replace('/dashboard/onboarding')
        } else {
          setStatus('ok')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('ok')
      })
    return () => {
      cancelled = true
    }
  }, [router])

  if (status === 'loading' || status === 'redirect') {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-muted/25" aria-busy="true">
        <p className="text-sm text-muted-foreground">
          {status === 'redirect' ? 'Redirection vers la configuration...' : 'Chargement...'}
        </p>
      </div>
    )
  }

  return <>{children}</>
}
