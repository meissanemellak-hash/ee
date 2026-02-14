import Link from 'next/link'

export const metadata = {
  title: 'Contact | IA Restaurant Manager',
  description: 'Contactez l\'équipe IA Restaurant Manager pour une démo ou un devis.',
}

export default function ContactPage() {
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
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl text-center">Contact</h1>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Nous contacter</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Email :</strong>{' '}
              <a href="mailto:contact@ai-operations.fr" className="text-teal-600 dark:text-teal-400 hover:underline">
                contact@ai-operations.fr
              </a>
            </li>
            <li>
              <strong className="text-foreground">Objet :</strong> précisez bien votre besoin.
            </li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Nous nous engageons à vous répondre sous 48 h ouvrées.
          </p>
        </section>
      </main>

      <footer className="border-t border-border/60 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Accueil</Link>
          <span className="mx-2">·</span>
          <Link href="/mentions-legales" className="hover:text-foreground">Mentions légales</Link>
          <span className="mx-2">·</span>
          <Link href="/confidentialite" className="hover:text-foreground">Confidentialité</Link>
        </div>
      </footer>
    </div>
  )
}
