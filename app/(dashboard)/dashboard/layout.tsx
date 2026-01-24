import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { requireOrganization } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Vérifier que l'utilisateur a une organisation
  // Si l'organisation n'existe pas, on laisse l'utilisateur accéder au dashboard
  // Il pourra créer une organisation ou utiliser le mode démo
  try {
    await requireOrganization()
  } catch (error) {
    // Si l'organisation n'existe pas, on ne redirige pas
    // L'utilisateur pourra utiliser le mode démo ou créer une organisation
    console.log('Organization not found, user can still access dashboard')
  }

  return (
    <div className="flex h-screen overflow-hidden">
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
}
