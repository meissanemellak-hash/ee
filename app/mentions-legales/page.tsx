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
          Dernière mise à jour : janvier 2026
        </p>

        <div className="mt-8 prose prose-neutral dark:prose-invert max-w-none text-muted-foreground text-sm space-y-8">
          <p className="text-muted-foreground">
            Les présentes mentions légales s&apos;appliquent au site internet <strong>AI Operations</strong> et à la plateforme de gestion multi-restaurants associée. Conformément à la loi pour la confiance dans l&apos;économie numérique (LCEN), les informations ci-dessous identifient l&apos;éditeur et les conditions d&apos;utilisation du site.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 first:mt-0">1. Éditeur du site</h2>
            <p>
              Le site et la plateforme <strong>AI Operations</strong> sont édités par :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Raison sociale : [À compléter]</li>
              <li>Forme juridique : [À compléter]</li>
              <li>Siège social : [Adresse complète]</li>
              <li>RCS : [Ville et numéro RCS]</li>
              <li>SIRET : [À compléter]</li>
              <li>Capital social : [À compléter]</li>
              <li>Numéro de TVA intracommunautaire : [À compléter]</li>
              <li>Email : [contact@votredomaine.fr]</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">2. Hébergeur</h2>
            <p>
              L&apos;hébergement du site et des services est assuré par :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Raison sociale : [À compléter, ex. Vercel Inc., OVH, etc.]</li>
              <li>Adresse : [Adresse complète de l&apos;hébergeur]</li>
              <li>Site web : [URL de l&apos;hébergeur]</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">3. Responsable de la publication</h2>
            <p>
              Le responsable de la publication du site est <strong>[Nom et prénom du responsable]</strong>, en qualité de [fonction, ex. Président, Directeur général].
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">4. Objet des services</h2>
            <p>
              AI Operations propose une plateforme SaaS de pilotage opérationnel destinée aux groupes et chaînes de restaurants : centralisation des ventes, de l&apos;inventaire, des alertes et des prévisions sur un tableau de bord unifié. Les conditions générales de vente ou d&apos;utilisation du service sont communiquées lors de la souscription et font l&apos;objet d&apos;un contrat distinct.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">5. Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble du contenu de ce site (textes, images, logos, graphismes, logiciels, bases de données, structure) est protégé par le droit d&apos;auteur, le droit des marques et le droit des bases de données. Toute reproduction, représentation, modification, diffusion ou exploitation non autorisée de tout ou partie de ce contenu, sans l&apos;accord préalable écrit d&apos;AI Operations, est interdite et constitutive d&apos;une contrefaçon susceptible de poursuites civiles et pénales.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">6. Limitation de responsabilité</h2>
            <p>
              AI Operations s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, AI Operations ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des informations. En conséquence, AI Operations décline toute responsabilité pour toute imprécision, omission ou erreur portant sur les informations disponibles sur ce site.
            </p>
            <p className="mt-2">
              L&apos;utilisation du site et de la plateforme est soumise aux conditions du contrat en vigueur. AI Operations ne saurait être tenue responsable des dommages indirects ou des pertes de données résultant de l&apos;utilisation du service, dans les limites autorisées par la loi.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">7. Liens hypertextes</h2>
            <p>
              Ce site peut contenir des liens vers d&apos;autres sites. AI Operations n&apos;exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu, leur accessibilité ou leurs pratiques en matière de données personnelles. La création de liens vers ce site (notamment en framing) est soumise à l&apos;accord préalable écrit d&apos;AI Operations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">8. Droit applicable et litiges</h2>
            <p>
              Les présentes mentions légales sont régies par le droit français. En cas de litige relatif à l&apos;interprétation ou l&apos;exécution des présentes, les tribunaux français seront seuls compétents, après tentative de résolution amiable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">9. Contact</h2>
            <p>
              Pour toute question relative aux mentions légales ou à l&apos;éditeur du site : <Link href="/contact" className="text-teal-600 dark:text-teal-400 hover:underline">page Contact</Link> ou par email à [contact@votredomaine.fr].
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
