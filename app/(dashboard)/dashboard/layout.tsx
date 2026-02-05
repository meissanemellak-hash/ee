import { redirect } from 'next/navigation'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getCurrentOrganization, ensureOrganizationInDb } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Suspense } from 'react'
import { DashboardSyncWrapper } from '@/components/dashboard/dashboard-sync-wrapper'
import { OnboardingRedirectGuard } from '@/components/dashboard/onboarding-redirect-guard'
import { OnboardingRedirectOrContent } from '@/components/dashboard/onboarding-redirect-or-content'

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

  // getCurrentOrganization() synchronise l'org depuis Clerk si besoin
  let organization = await getCurrentOrganization()

  // Si org null alors qu'on a un orgId (ex. rate limit), on réessaie une fois pour éviter
  // d'afficher l'onboarding à un employé ou quand l'onboarding est déjà fait (faux positifs).
  if (!organization && orgId) {
    try {
      organization = await ensureOrganizationInDb(orgId)
    } catch {
      // Garder null ; on ne redirige pas vers l'onboarding sans certitude
    }
  }

  const onboardingCompleted = organization
    ? !!organization.onboardingCompletedAt
    : null

  const dashboardContent = (
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
  )

  // Si l'onboarding n'est pas fait : sur /dashboard on affiche "Redirection..." (le guard
  // redirige vers /dashboard/onboarding) ; sur /dashboard/onboarding on affiche le contenu (wizard).
  if (onboardingCompleted === false) {
    return (
      <OnboardingRedirectGuard onboardingCompleted={false}>
        <OnboardingRedirectOrContent
          fallback={
            <div className="flex h-screen items-center justify-center bg-muted/25" aria-busy="true">
              <p className="text-sm text-muted-foreground">Redirection vers la configuration...</p>
            </div>
          }
        >
          {dashboardContent}
        </OnboardingRedirectOrContent>
      </OnboardingRedirectGuard>
    )
  }

  // Onboarding fait ou inconnu : afficher le dashboard. Admin et employés arrivent directement ici.
  return (
    <OnboardingRedirectGuard onboardingCompleted={onboardingCompleted}>
      {dashboardContent}
    </OnboardingRedirectGuard>
  )
}
