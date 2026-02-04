import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CheckoutButton } from '@/components/pricing/checkout-button'
import { STRIPE_PLANS } from '@/lib/stripe'
import { getCurrentOrganization } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Tarifs - AI Operations',
  description: 'Un plan pour piloter votre chaîne de restaurants.',
}

const PLAN_FEATURES = [
  'Tableau de bord unifié multi-restaurants',
  'Ventes et analyse par restaurant',
  'Inventaire, stocks et alertes de rupture',
  'Prévisions et recommandations d’achat',
  'Rapports et exports',
  'Support prioritaire',
]

function formatPrice(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function PricingPage() {
  const { userId, orgId } = auth()

  // Si l'utilisateur est connecté et son organisation a déjà un abonnement actif (ex. employé invité), redirection immédiate vers le dashboard (pas d'affichage de la page Tarifs)
  if (userId && orgId && process.env.STRIPE_SECRET_KEY) {
    const organization = await getCurrentOrganization()
    if (organization) {
      const sub = await prisma.subscription.findUnique({
        where: { organizationId: organization.id },
        select: { status: true, currentPeriodEnd: true },
      })
      const now = new Date()
      const hasActiveSubscription =
        sub &&
        (sub.status === 'active' || sub.status === 'trialing') &&
        (!sub.currentPeriodEnd || sub.currentPeriodEnd > now)
      if (hasActiveSubscription) {
        redirect('/dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen bg-muted/25">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-semibold text-foreground">
              AI Operations
            </Link>
            <nav className="flex items-center gap-2">
              {userId ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard">Tableau de bord</Link>
                </Button>
              ) : (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/sign-in">Se connecter</Link>
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Un plan, tout inclus
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
            Sans engagement. Annulation à tout moment.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="rounded-2xl border-2 border-teal-500 bg-card p-8 shadow-lg flex flex-col max-w-md w-full">
            <p className="text-sm font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wide">
              Plan Pro
            </p>
            <div className="mt-4">
              <span className="text-4xl font-bold text-foreground">
                {formatPrice(STRIPE_PLANS.pro.amount)}
              </span>
              <span className="text-muted-foreground"> / mois</span>
            </div>
            <ul className="mt-8 space-y-3 flex-1">
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <CheckoutButton
                plan="pro"
                label="Souscrire"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white border-0"
              />
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Facturation mensuelle. Paiement sécurisé par Stripe. Vous pouvez annuler à tout moment.
        </p>
      </main>
    </div>
  )
}
