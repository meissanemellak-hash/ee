import { redirect } from 'next/navigation'
import { currentUser, clerkClient } from '@clerk/nextjs/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Link2 } from 'lucide-react'
import { GenerateCheckoutLinkButton } from './generate-checkout-link-button'

export const dynamic = 'force-dynamic'

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()

export default async function LienPaiementAdminPage() {
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase()

  if (!SUPER_ADMIN_EMAIL || email !== SUPER_ADMIN_EMAIL) {
    redirect('/dashboard')
  }

  const client = await clerkClient()
  const { data: clerkOrgs } = await client.organizations.getOrganizationList({
    limit: 100,
    orderBy: '+name',
  })
  const organizations = (clerkOrgs ?? []).map((org) => ({ clerkOrgId: org.id, name: org.name }))

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" role="main" aria-label="Lien de paiement">
      <div className="max-w-3xl mx-auto p-6 lg:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Admin' },
            { label: 'Lien de paiement' },
          ]}
        />
        <header className="flex items-center gap-4 pb-6 border-b border-border/60">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild aria-label="Retour au dashboard">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Link2 className="h-8 w-8" />
              Lien de paiement (Plan Pro)
            </h1>
            <p className="text-muted-foreground mt-1.5">
              Générez un lien Stripe pour une organisation. Envoyez ce lien au client après la visio.
            </p>
          </div>
        </header>

        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <CardTitle>Organisations</CardTitle>
            <CardDescription>
              Choisissez une organisation puis générez le lien. Le client paiera sur Stripe ; l&apos;abonnement sera rattaché à cette organisation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {organizations.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune organisation dans Clerk. Créez-en une depuis le dashboard Clerk.</p>
            ) : (
              <ul className="space-y-3">
                {organizations.map((org) => (
                  <li
                    key={org.clerkOrgId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 p-3"
                  >
                    <span className="font-medium">{org.name}</span>
                    <GenerateCheckoutLinkButton clerkOrgId={org.clerkOrgId} organizationName={org.name} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
