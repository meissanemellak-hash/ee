import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getCurrentOrganization } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { BillingClientSection } from './billing-client-section'
import { STRIPE_PLANS, type PlanId } from '@/lib/stripe'
import { CreditCard, ArrowLeft, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

function planLabel(plan: string | null): string {
  if (!plan) return 'Aucun plan'
  const id = plan as PlanId
  return STRIPE_PLANS[id]?.name ?? plan
}

export default async function BillingPage() {
  const { userId } = auth()
  if (!userId) redirect('/sign-in')

  const organization = await getCurrentOrganization()
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

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: organization.id },
  })

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
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="font-medium">Plan :</span>
                <span className="capitalize">{planLabel(subscription.plan)}</span>
                {subscription.currentPeriodEnd && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span>
                      {subscription.status === 'active' || subscription.status === 'trialing'
                        ? `Renouvellement le ${subscription.currentPeriodEnd.toLocaleDateString('fr-FR')}`
                        : `Fin le ${subscription.currentPeriodEnd.toLocaleDateString('fr-FR')}`}
                    </span>
                  </>
                )}
                {subscription.cancelAtPeriodEnd && (
                  <span className="text-amber-600 dark:text-amber-400">(annulation en fin de période)</span>
                )}
              </div>
            )}

            {!subscription && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-teal-600" aria-hidden />
                <span>Souscrivez à un plan pour accéder au tableau de bord.</span>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {subscription?.stripeCustomerId ? (
                <BillingClientSection />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Demandez à votre administrateur un lien de souscription pour activer votre accès.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
