import { redirect } from 'next/navigation'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { NavProgress } from '@/components/layout/nav-progress'
import { Suspense } from 'react'
import { DashboardSyncWrapper } from '@/components/dashboard/dashboard-sync-wrapper'

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

  // Si orgId absent, vérifier si l'utilisateur a des organisations dans Clerk (cas rare)
  if (!orgId) {
    try {
      const client = await clerkClient()
      const userMemberships = await client.users.getOrganizationMembershipList({ userId })
      
      if (!userMemberships.data || userMemberships.data.length === 0) {
        redirect('/dashboard')
      }
    } catch (error) {
      console.error('Error checking organizations:', error)
    }
  }

  // Ne pas bloquer le rendu : la syncho org est faite à la demande dans les API (getCurrentOrganization crée l'org si besoin)
  return (
    <div className="flex min-h-screen">
      <NavProgress />
      <Suspense fallback={null}>
        <DashboardSyncWrapper />
      </Suspense>
      <div className="fixed left-0 top-0 bottom-0 z-30 hidden lg:block w-64 shrink-0">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col min-w-0 lg:ml-64">
        <Header />
        <main className="flex-1 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  )
}
