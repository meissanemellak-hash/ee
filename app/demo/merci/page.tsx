import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Choisir un créneau | IA Restaurant Manager',
  description: 'Choisissez un créneau pour votre démo IA Restaurant Manager.',
}

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com'

type Props = {
  searchParams: Promise<{ nom?: string; email?: string; societe?: string; nb_restaurants?: string; message?: string }>
}

export default async function DemoMerciPage({ searchParams }: Props) {
  const params = await searchParams
  const nom = params.nom || ''
  const email = params.email || ''
  const inviteeFullName = encodeURIComponent(nom)
  const inviteeEmail = encodeURIComponent(email)
  const calendlyFullUrl = CALENDLY_URL.includes('?')
    ? `${CALENDLY_URL}&invitee_full_name=${inviteeFullName}&invitee_email=${inviteeEmail}`
    : `${CALENDLY_URL}?invitee_full_name=${inviteeFullName}&invitee_email=${inviteeEmail}`

  return (
    <div className="min-h-screen bg-muted/25">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-semibold text-foreground hover:opacity-90">
              IA Restaurant Manager
            </Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Merci pour votre demande</h1>
        <p className="mt-3 text-muted-foreground max-w-xl">
          Nous vous recontactons sous 48 h ouvrées. En attendant, choisissez un créneau pour votre démo personnalisée.
        </p>

        <div className="mt-10">
          <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-700 text-white border-0">
            <a href={calendlyFullUrl} target="_blank" rel="noopener noreferrer">
              Choisir un créneau pour ma démo
            </a>
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Vous serez redirigé vers notre outil de prise de rendez-vous. Après réservation, vous recevrez un email de confirmation.
        </p>
      </main>

      <footer className="border-t border-border/60 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Accueil</Link>
          <span className="mx-2">·</span>
          <Link href="/contact" className="hover:text-foreground">Contact</Link>
        </div>
      </footer>
    </div>
  )
}
