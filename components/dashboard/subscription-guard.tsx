'use client'

import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const BILLING_PATH = '/dashboard/settings/billing'

/**
 * Redirige vers /pricing si l'organisation n'a pas d'abonnement actif.
 * N'intervient pas sur la page Facturation pour permettre de souscrire.
 */
export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (pathname === BILLING_PATH) {
      setChecked(true)
      return
    }

    let cancelled = false
    fetch('/api/subscription/status')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        setChecked(true)
        if (!data.active) {
          router.replace('/pricing')
        }
      })
      .catch(() => setChecked(true))

    return () => {
      cancelled = true
    }
  }, [pathname, router])

  if (!checked) return null
  return <>{children}</>
}
