// Layout spécifique pour la page setup
// IMPORTANT : On affiche le header pour que l'utilisateur puisse utiliser le sélecteur d'organisation
import { Header } from '@/components/layout/header'
import { SimpleRefreshHandler } from '@/components/dashboard/simple-refresh-handler'

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SimpleRefreshHandler />
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  )
}
