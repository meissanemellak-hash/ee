'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'

/**
 * Redirige vers /dashboard/onboarding si l'onboarding n'est pas terminé.
 * Ne redirige pas si on est déjà sur la page onboarding.
 * Si onboardingCompleted est null (org pas encore chargée), on ne redirige pas.
 */
export function OnboardingRedirectGuard({
  onboardingCompleted,
  children,
}: {
  onboardingCompleted: boolean | null
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (onboardingCompleted === null) return
    if (onboardingCompleted === true) return
    if (pathname === '/dashboard/onboarding') return
    router.replace('/dashboard/onboarding')
  }, [onboardingCompleted, pathname, router])

  return <>{children}</>
}
