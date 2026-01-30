import Link from 'next/link'

export const metadata = {
  title: 'Mentions légales | AI Operations',
  description: 'Mentions légales et informations sur l\'éditeur du site AI Operations.',
}

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-muted/25">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-semibold text-foreground hover:opacity-90">
              AI Operations
            </Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Mentions légales</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dernière mise à jour : janvier 2025
        </p>

        <div className="mt-8 prose prose-neutral dark:prose-invert max-w-none text-muted-foreground text-sm space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 first:mt-0">1. Éditeur du site</h2>
            <p>
              Le site <strong>AI Operations</strong> est édité par la société suivante (à compléter selon votre structure) :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Raison sociale : [À compléter]</li>
              <li>Forme juridique : [À compléter]</li>
              <li>Siège social : [Adresse complète]</li>
              <li>RCS : [Ville et numéro]</li>
              <li>Capital social : [À compléter]</li>
              <li>Numéro de TVA intracommunautaire : [À compléter]</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">2. Hébergeur</h2>
            <p>
              L&apos;hébergement du site est assuré par (à compléter selon votre hébergeur) :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Raison sociale : [À compléter]</li>
              <li>Adresse : [À compléter]</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">3. Responsable de la publication</h2>
            <p>
              Le responsable de la publication du site est [Nom du responsable], en qualité de [fonction].
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">4. Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble du contenu de ce site (textes, images, logos, graphismes, logiciels, etc.) est protégé par le droit d&apos;auteur et le droit des marques. Toute reproduction, représentation, modification ou exploitation non autorisée de tout ou partie de ce contenu, sans l&apos;accord préalable d&apos;AI Operations, est interdite et constitutive d&apos;une contrefaçon.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">5. Limitation de responsabilité</h2>
            <p>
              AI Operations s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, AI Operations ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des informations. En conséquence, AI Operations décline toute responsabilité pour toute imprécision ou omission portant sur des informations disponibles sur ce site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">6. Liens hypertextes</h2>
            <p>
              Ce site peut contenir des liens vers d&apos;autres sites. AI Operations n&apos;exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu. La création de liens vers ce site est soumise à l&apos;accord préalable d&apos;AI Operations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">7. Droit applicable</h2>
            <p>
              Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">8. Contact</h2>
            <p>
              Pour toute question relative aux mentions légales : <Link href="/contact" className="text-teal-600 dark:text-teal-400 hover:underline">page Contact</Link>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border/60 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Accueil</Link>
          <span className="mx-2">·</span>
          <Link href="/confidentialite" className="hover:text-foreground">Confidentialité</Link>
          <span className="mx-2">·</span>
          <Link href="/contact" className="hover:text-foreground">Contact</Link>
        </div>
      </footer>
    </div>
  )
}
