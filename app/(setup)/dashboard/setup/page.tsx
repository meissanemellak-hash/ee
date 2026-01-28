import { redirect } from 'next/navigation'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateOrganizationButton } from '@/components/dashboard/create-organization-button'
import { ActivateOrganizationButton } from '@/components/dashboard/activate-organization-button'
import { RetryButton } from '@/components/dashboard/retry-button'
import { CleanupOrganizationsButton } from '@/components/dashboard/cleanup-organizations-button'
import { ClearStorageButton } from '@/components/dashboard/clear-storage-button'
import { ForceDashboardAccess } from '@/components/dashboard/force-dashboard-access'
import { prisma } from '@/lib/db/prisma'
import { Building2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function SetupPage() {
  // SOLUTION ULTRA-SIMPLIFIÉE : 
  // On affiche SEULEMENT les organisations qui sont dans Clerk
  // On ignore complètement les organisations orphelines de la DB
  let availableOrganizations: Array<{ id: string; name: string; clerkOrgId: string }> = []
  let clerkError: string | null = null
  
  try {
    const { userId, orgId } = auth()
    
    if (!userId) {
      redirect('/sign-in')
    }

    // SOLUTION ULTRA-SIMPLE ET FIABLE :
    // Si orgId existe dans Clerk, on synchronise et on redirige UNIQUEMENT si synchronisé
    // Pas de redirection si la synchronisation échoue (évite les boucles)
    if (orgId) {
      // Utiliser getCurrentOrganization() qui synchronise automatiquement
      const { getCurrentOrganization } = await import('@/lib/auth')
      const organization = await getCurrentOrganization()
      
      // Rediriger UNIQUEMENT si l'organisation est synchronisée dans la DB
      // Si la synchronisation échoue, on reste sur la page setup
      // L'utilisateur peut recharger la page ou utiliser le sélecteur à nouveau
      if (organization) {
        redirect('/dashboard')
      }
      // Sinon, continuer pour afficher la page setup
      // L'utilisateur devra recharger la page ou réessayer
    }

    // SOLUTION SIMPLIFIÉE : Ne faire qu'UN SEUL appel Clerk si nécessaire
    // On évite les appels répétés qui causent le rate limiting
    try {
      const client = await clerkClient()
      const userMemberships = await client.users.getOrganizationMembershipList({ userId })
      const userOrganizations = userMemberships.data || []
      
      if (userOrganizations.length > 0) {
        // Pour chaque organisation Clerk, vérifier/créer dans la DB
        // On fait ça en une seule passe, sans nettoyage automatique (trop coûteux)
        for (const membership of userOrganizations) {
          const clerkOrgId = membership.organization.id
          
          // Vérifier si l'organisation existe dans la DB
          let orgInDb = await prisma.organization.findUnique({
            where: { clerkOrgId },
          })
          
          // Si elle n'existe pas, la créer
          if (!orgInDb) {
            try {
              orgInDb = await prisma.organization.create({
                data: {
                  name: membership.organization.name,
                  clerkOrgId,
                  shrinkPct: 0.1,
                },
              })
            } catch (dbError) {
              // Si erreur, essayer de récupérer
              if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
                orgInDb = await prisma.organization.findUnique({
                  where: { clerkOrgId },
                })
              }
            }
          }
          
          // Ajouter seulement si elle existe dans la DB (après création)
          if (orgInDb) {
            availableOrganizations.push({ ...orgInDb, clerkOrgId })
          }
        }
      }
      // Si aucune organisation dans Clerk, availableOrganizations reste vide
    } catch (error: any) {
      // Erreur Clerk - on continue sans organisations
      // Ne pas logger en cas de rate limit pour éviter le spam
      const isRateLimit = 
        error?.status === 429 ||
        error?.statusCode === 429 ||
        error?.message?.includes('Too Many Requests') ||
        error?.message?.includes('429') ||
        error?.code === 'too_many_requests'
      
      if (isRateLimit) {
        clerkError = 'Trop de requêtes vers Clerk. Veuillez patienter quelques instants avant de réessayer.'
      } else {
        console.error('❌ Error fetching organizations from Clerk:', error)
        clerkError = 'Erreur lors de la récupération des organisations. Vous pouvez créer une nouvelle organisation.'
      }
    }

  return (
    <main className="min-h-screen bg-muted/25" role="main" aria-label="Configuration requise">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <header className="pb-6 border-b border-border/60 text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-xl bg-teal-600 flex items-center justify-center shadow-md" aria-hidden="true">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Configuration requise</h1>
            <p className="text-muted-foreground mt-1.5">
              Pour accéder au dashboard, vous devez créer ou activer une organisation.
            </p>
          </header>

          {/* Message d'erreur Clerk */}
          {clerkError && (
            <Card className="rounded-xl border shadow-sm border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-400">
                <AlertCircle className="h-5 w-5" />
                Attention
              </CardTitle>
              <CardDescription className="text-orange-700 dark:text-orange-300">
                {clerkError}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <RetryButton />
              <ClearStorageButton />
            </CardContent>
            </Card>
          )}

          {availableOrganizations.length > 0 ? (
            <Card className="rounded-xl border shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold" id="setup-orgs-title">Organisations disponibles</CardTitle>
              <CardDescription className="mt-1" aria-describedby="setup-orgs-title">
                Vous avez {availableOrganizations.length} organisation{availableOrganizations.length > 1 ? 's' : ''} dans Clerk.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Instructions */}
              <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-900/30 rounded-lg p-4 mb-4" role="region" aria-label="Comment activer votre organisation">
                <p className="text-sm font-semibold text-teal-900 dark:text-teal-400 mb-2">
                  📌 Comment activer votre organisation :
                </p>
                <ol className="text-sm text-teal-800 dark:text-teal-300 space-y-1 list-decimal list-inside">
                  <li>Cliquez sur le sélecteur d&apos;organisation en haut à gauche</li>
                  <li>Sélectionnez votre organisation dans le menu déroulant</li>
                  <li>L&apos;organisation sera automatiquement synchronisée et vous serez redirigé vers le dashboard</li>
                </ol>
              </div>
              
              {/* Liste des organisations */}
              <div className="space-y-3" role="list" aria-label="Liste des organisations">
                {availableOrganizations.map((org) => (
                  <div key={org.id} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors" role="listitem">
                    <div className="h-10 w-10 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{org.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Disponible dans le sélecteur d&apos;organisation
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Actions */}
              <div className="pt-4 border-t space-y-4">
                <div>
                  <p className="text-sm font-medium mb-3 text-center text-muted-foreground">
                    Accès direct au dashboard :
                  </p>
                  <div className="flex justify-center">
                    <ForceDashboardAccess />
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-3 text-center">
                    Ou créez une nouvelle organisation :
                  </p>
                  <div className="flex justify-center">
                    <CreateOrganizationButton />
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2 text-center">
                    En cas de problème :
                  </p>
                  <div className="flex justify-center">
                    <ClearStorageButton />
                  </div>
                </div>
              </div>
            </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl border shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" aria-hidden="true" />
                  Aucune organisation
                </CardTitle>
              <CardDescription className="mt-1">
                Vous n&apos;avez pas encore d&apos;organisation. Créez-en une pour commencer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <CreateOrganizationButton />
              </div>
            </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
  } catch (error) {
    // En cas d'erreur critique, afficher quand même la page avec un message d'erreur
    console.error('❌ Critical error in SetupPage:', error)
    return (
      <main className="min-h-screen bg-muted/25" role="main" aria-label="Configuration requise">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <div className="max-w-2xl mx-auto space-y-8">
            <header className="pb-6 border-b border-border/60 text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-xl bg-teal-600 flex items-center justify-center shadow-md" aria-hidden="true">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Configuration requise</h1>
              <p className="text-muted-foreground mt-1.5">
                Pour accéder au dashboard, vous devez créer ou activer une organisation.
              </p>
            </header>

            <Card className="rounded-xl border shadow-sm border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-red-800 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" aria-hidden="true" />
                  Erreur
                </CardTitle>
                <CardDescription className="mt-1 text-red-700 dark:text-red-300">
                  Une erreur est survenue. Vous pouvez toujours créer une nouvelle organisation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <CreateOrganizationButton />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    )
  }
}
