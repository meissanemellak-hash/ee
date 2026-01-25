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
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <Building2 className="h-12 w-12 mx-auto text-primary" />
          <h1 className="text-3xl font-bold">Configuration requise</h1>
          <p className="text-muted-foreground">
            Pour accéder au dashboard, vous devez créer ou activer une organisation.
          </p>
        </div>

        {clerkError && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                Attention
              </CardTitle>
              <CardDescription className="text-orange-700">
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
          <Card>
            <CardHeader>
              <CardTitle>Organisations disponibles</CardTitle>
              <CardDescription>
                Vous avez {availableOrganizations.length} organisation{availableOrganizations.length > 1 ? 's' : ''} dans Clerk.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  📌 Comment activer votre organisation :
                </p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Cliquez sur le sélecteur d&apos;organisation en haut à gauche (actuellement &quot;graille M&quot;)</li>
                  <li>Sélectionnez votre organisation dans le menu déroulant</li>
                  <li>L&apos;organisation sera automatiquement synchronisée et vous serez redirigé vers le dashboard</li>
                </ol>
              </div>
              <div className="space-y-3">
                {availableOrganizations.map((org) => (
                  <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <p className="font-medium">{org.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Disponible dans le sélecteur d&apos;organisation
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t space-y-4">
                <div>
                  <p className="text-sm font-medium mb-3 text-center">
                    Accès direct au dashboard :
                  </p>
                  <ForceDashboardAccess />
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-3">
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
                  <ClearStorageButton />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                Aucune organisation
              </CardTitle>
              <CardDescription>
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
  )
  } catch (error) {
    // En cas d'erreur critique, afficher quand même la page avec un message d'erreur
    console.error('❌ Critical error in SetupPage:', error)
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center space-y-2">
            <Building2 className="h-12 w-12 mx-auto text-primary" />
            <h1 className="text-3xl font-bold">Configuration requise</h1>
            <p className="text-muted-foreground">
              Pour accéder au dashboard, vous devez créer ou activer une organisation.
            </p>
          </div>
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                Erreur
              </CardTitle>
              <CardDescription className="text-red-700">
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
    )
  }
}
