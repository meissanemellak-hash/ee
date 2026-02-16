import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { BillingClientSection } from './billing-client-section'
import { SyncSubscriptionButton } from './sync-subscription-button'
import { CreditCard, ArrowLeft, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

function statusLabel(sub: { status: string; cancelAtPeriodEnd: boolean }): string {
  if (sub.cancelAtPeriodEnd) return 'Annulé à la fin de la période'
  if (sub.status === 'active' || sub.status === 'trialing') return 'Actif'
  return sub.status
}

export default async function BillingPage() {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">Chargement...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const { auth } = await import('@clerk/nextjs/server')
  const { userId } = auth()
  if (!userId) redirect('/sign-in')

  const { getCurrentOrganization } = await import('@/lib/auth')
  let organization = await getCurrentOrganization()

  if (!organization) {
    try {
      const { clerkClient } = await import('@clerk/nextjs/server')
      const { prisma } = await import('@/lib/db/prisma')
      const { logger } = await import('@/lib/logger')
      const client = await clerkClient()
      const userMemberships = await client.users.getOrganizationMembershipList({ userId })
      if (userMemberships.data && userMemberships.data.length > 0) {
        const firstOrg = userMemberships.data[0].organization
        const clerkOrgId = firstOrg.id
        organization = await prisma.organization.findUnique({
          where: { clerkOrgId },
        })
        if (!organization) {
          try {
            organization = await prisma.organization.create({
              data: {
                name: firstOrg.name,
                clerkOrgId,
                shrinkPct: 0.1,
              },
            })
            logger.log(`✅ Organisation "${organization.name}" synchronisée depuis Clerk (billing)`)
          } catch (dbError) {
            if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
              organization = await prisma.organization.findUnique({
                where: { clerkOrgId },
              })
            } else {
              throw dbError
            }
          }
        }
      }
    } catch (error) {
      const { logger } = await import('@/lib/logger')
      logger.error('[billing] Error syncing organization:', error)
    }
  }

  if (!organization) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">Aucune organisation sélectionnée.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/dashboard">Retour au tableau de bord</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const clerkOrgId = organization.clerkOrgId
  if (clerkOrgId) {
    const { getCurrentUserRole } = await import('@/lib/auth-role')
    const { can } = await import('@/lib/roles')
    const role = await getCurrentUserRole(userId, clerkOrgId)
    if (!can(role, 'billing:view')) {
      redirect('/dashboard/settings')
    }
  }

  const { prisma } = await import('@/lib/db/prisma')
  let subscription = await prisma.subscription.findUnique({
    where: { organizationId: organization.id },
  })

  if (!subscription) {
    const { currentUser } = await import('@clerk/nextjs/server')
    const { syncStripeSubscriptionToOrg } = await import('@/lib/sync-stripe-subscription')
    const user = await currentUser()
    const email = user?.emailAddresses?.[0]?.emailAddress?.trim()
    if (email) {
      const synced = await syncStripeSubscriptionToOrg(organization.id, email)
      if (synced) {
        subscription = await prisma.subscription.findUnique({
          where: { organizationId: organization.id },
        })
      }
    }
  } else {
    const { refreshSubscriptionFromStripe } = await import('@/lib/sync-stripe-subscription')
    await refreshSubscriptionFromStripe(organization.id)
    subscription = await prisma.subscription.findUnique({
      where: { organizationId: organization.id },
    })
  }

  const { getPlanDisplayName } = await import('@/lib/stripe')
  const planDisplayName = (plan: string | null): string => {
    const name = getPlanDisplayName(plan)
    return name === 'Aucun plan' ? name : `Plan ${name}`
  }

  const isActive =
    subscription &&
    (subscription.status === 'active' || subscription.status === 'trialing') &&
    (!subscription.currentPeriodEnd || subscription.currentPeriodEnd > new Date())

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" role="main" aria-label="Facturation">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Paramètres', href: '/dashboard/settings' },
            { label: 'Facturation' },
          ]}
        />
        <header className="flex items-center gap-4 pb-6 border-b border-border/60">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild aria-label="Retour aux paramètres">
            <Link href="/dashboard/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Facturation</h1>
            <p className="text-muted-foreground mt-1.5">
              Gérez votre abonnement, votre moyen de paiement et consultez vos factures.
            </p>
          </div>
        </header>

        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Abonnement actuel
            </CardTitle>
            <CardDescription>
              {isActive
                ? 'Votre accès au tableau de bord est actif.'
                : 'Souscrivez à un plan pour accéder à toutes les fonctionnalités.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription && (
              <dl className="grid gap-2 text-sm sm:grid-cols-1">
                <div>
                  <dt className="font-medium text-muted-foreground">Plan</dt>
                  <dd>{planDisplayName(subscription.plan)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Statut</dt>
                  <dd>{statusLabel(subscription)}</dd>
                </div>
                {subscription.currentPeriodEnd && (
                  <div>
                    <dt className="font-medium text-muted-foreground">
                      {subscription.cancelAtPeriodEnd ? 'Fin de l\'accès le' : 'Prochain renouvellement le'}
                    </dt>
                    <dd>{subscription.currentPeriodEnd.toLocaleDateString('fr-FR')}</dd>
                  </div>
                )}
              </dl>
            )}

            {!subscription && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-teal-600" aria-hidden />
                <span>Souscrivez à un plan pour accéder au tableau de bord.</span>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {subscription?.stripeCustomerId ? (
                <BillingClientSection
                  canCancel={
                    !!subscription.stripeSubscriptionId &&
                    !subscription.cancelAtPeriodEnd &&
                    (subscription.status === 'active' || subscription.status === 'trialing')
                  }
                />
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">
                    Demandez à votre administrateur un lien de souscription pour activer votre accès.
                  </p>
                  <SyncSubscriptionButton />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
