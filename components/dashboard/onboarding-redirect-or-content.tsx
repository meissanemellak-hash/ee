'use client'

import { usePathname } from 'next/navigation'

/**
 * Quand l'onboarding n'est pas fait : sur /dashboard (exact) on affiche un court
 * message de redirection au lieu du contenu du dashboard ; sur /dashboard/onboarding
 * on affiche les children (la page onboarding).
 */
export function OnboardingRedirectOrContent({
  fallback,
  children,
}: {
  fallback: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()

  if (pathname === '/dashboard') {
    return <>{fallback}</>
  }

  return <>{children}</>
}
