import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Contact</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Vous gérez plusieurs restaurants et souhaitez centraliser ventes, inventaire et alertes ? Notre équipe est à votre écoute pour une démo, un devis personnalisé ou toute question sur la plateforme IA Restaurant Manager.
        </p>

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
              <strong className="text-foreground">Objet :</strong> démo, devis, question technique ou commerciale — précisez votre besoin et le nombre d&apos;établissements que vous pilotez.
            </li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Nous nous engageons à vous répondre sous 48 h ouvrées. Pour une démo ou un devis, remplissez le formulaire de demande de démo ci-dessous ou envoyez-nous un email.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Actions rapides</h2>
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white border-0">
              <Link href="/demo">Demander une démo</Link>
            </Button>
            <Button asChild variant="ghost" className="text-muted-foreground">
              <a href="mailto:contact@ai-operations.fr">Envoyer un email</a>
            </Button>
          </div>
        </section>

        <section className="mt-10 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Pourquoi nous contacter ?</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• <strong className="text-foreground">Demander une démo</strong> : découvrez la plateforme en direct, adaptée à votre nombre de restaurants.</li>
            <li>• <strong className="text-foreground">Obtenir un devis</strong> : tarification selon le nombre d&apos;établissements et d&apos;utilisateurs.</li>
            <li>• <strong className="text-foreground">Questions techniques ou commerciales</strong> : intégration, formation, support — nous vous répondons.</li>
          </ul>
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
