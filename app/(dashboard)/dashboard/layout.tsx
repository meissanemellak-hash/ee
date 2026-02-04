import { redirect } from 'next/navigation'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getCurrentOrganization } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Suspense } from 'react'
import { DashboardSyncWrapper } from '@/components/dashboard/dashboard-sync-wrapper'
import { OnboardingRedirectGuard } from '@/components/dashboard/onboarding-redirect-guard'

// Force dynamic rendering pour les pages avec authentification
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, orgId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // IMPORTANT : Ce layout ne s'applique PAS à /dashboard/setup
  // car setup a son propre layout dans app/(setup)/dashboard/setup/layout.tsx
  // Donc on peut vérifier l'organisation sans risque de boucle
  
  // SOLUTION RADICALE ET DÉFINITIVE :
  // Si orgId n'est pas dans les cookies mais que l'utilisateur a des organisations dans Clerk,
  // on LAISSE PASSER quand même. Le composant DashboardPage gérera la synchronisation côté client.
  // On ne redirige vers setup QUE si l'utilisateur n'a vraiment aucune organisation dans Clerk.
  if (!orgId) {
    try {
      // Vérifier si l'utilisateur a des organisations dans Clerk
      const client = await clerkClient()
      const userMemberships = await client.users.getOrganizationMembershipList({ userId })
      
      if (!userMemberships.data || userMemberships.data.length === 0) {
        // Pas d'organisations dans Clerk, rediriger vers setup
        redirect('/dashboard/setup')
      }
      // Si l'utilisateur a des organisations dans Clerk, on laisse passer
      // Le DashboardPage gérera la synchronisation et l'activation côté client
    } catch (error) {
      // En cas d'erreur (rate limit, etc.), on laisse quand même passer
      // pour éviter de bloquer l'utilisateur
      console.error('Error checking organizations:', error)
      // On ne redirige pas, on laisse passer
    }
  }

  // SOLUTION PROPRE ET RADICALE :
  // Si orgId existe dans Clerk, on fait confiance que l'organisation existe
  // getCurrentOrganization() synchronisera automatiquement depuis Clerk
  // Même si la synchronisation échoue temporairement (rate limit), on laisse passer
  // car l'organisation existe dans Clerk et la synchronisation se fera au prochain appel
  const organization = await getCurrentOrganization()
  
  // Si l'organisation n'est pas trouvée, on laisse quand même passer
  // car orgId existe dans Clerk, donc l'organisation existe vraiment
  // La synchronisation se fera automatiquement au prochain appel de getCurrentOrganization()
  // On ne redirige JAMAIS vers setup si orgId existe (évite les boucles)
  if (!organization) {
    // L'organisation existe dans Clerk mais n'est pas encore dans la DB
    // La synchronisation se fera automatiquement au prochain appel
    // On laisse passer pour éviter les boucles de redirection
  }

  // Protection abonnement : si Stripe est configuré et que l'org n'a pas d'abonnement actif, rediriger vers /pricing (pas de période d'essai)
  if (process.env.STRIPE_SECRET_KEY && organization) {
    const sub = await prisma.subscription.findUnique({
      where: { organizationId: organization.id },
      select: { status: true, currentPeriodEnd: true },
    })
    const now = new Date()
    const hasActiveSubscription =
      sub &&
      (sub.status === 'active' || sub.status === 'trialing') &&
      (!sub.currentPeriodEnd || sub.currentPeriodEnd > now)
    if (!hasActiveSubscription) {
      redirect('/pricing')
    }
  }

  const onboardingCompleted = organization
    ? !!organization.onboardingCompletedAt
    : null

  return (
    <OnboardingRedirectGuard onboardingCompleted={onboardingCompleted}>
      <div className="flex h-screen overflow-hidden">
        <Suspense fallback={null}>
          <DashboardSyncWrapper />
        </Suspense>
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-muted/40">
            {children}
          </main>
        </div>
      </div>
    </OnboardingRedirectGuard>
  )
}
