import Link from 'next/link'

export const metadata = {
  title: 'Politique de confidentialité | AI Operations',
  description: 'Politique de confidentialité et protection des données personnelles - AI Operations.',
}

export default function ConfidentialitePage() {
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
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Politique de confidentialité</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dernière mise à jour : janvier 2025
        </p>

        <div className="mt-8 prose prose-neutral dark:prose-invert max-w-none text-muted-foreground text-sm space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 first:mt-0">1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement des données personnelles est AI Operations (à compléter : raison sociale, adresse, email de contact ou DPO). Pour toute question relative à vos données personnelles, vous pouvez nous contacter via la <Link href="/contact" className="text-teal-600 dark:text-teal-400 hover:underline">page Contact</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">2. Données collectées</h2>
            <p>
              Dans le cadre de l&apos;utilisation de la plateforme AI Operations, nous sommes susceptibles de collecter :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Données d&apos;identification</strong> : nom, prénom, adresse email, mot de passe (géré de manière sécurisée).</li>
              <li><strong>Données d&apos;organisation</strong> : nom de l&apos;organisation, nombre d&apos;établissements, rôles des utilisateurs.</li>
              <li><strong>Données d&apos;activité</strong> : données relatives aux restaurants, ventes, inventaire, alertes et rapports que vous saisissez ou générez dans la plateforme.</li>
              <li><strong>Données techniques</strong> : adresse IP, type de navigateur, logs d&apos;accès, dans le cadre du fonctionnement et de la sécurité du service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">3. Finalités et base légale</h2>
            <p>
              Vos données sont traitées pour les finalités suivantes :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Fourniture du service</strong> : création de compte, gestion des organisations et des établissements, fonctionnalités de la plateforme (ventes, inventaire, alertes, prévisions, rapports). Base légale : exécution du contrat.</li>
              <li><strong>Support et accompagnement</strong> : réponse à vos demandes, formation, assistance technique. Base légale : exécution du contrat et intérêt légitime.</li>
              <li><strong>Amélioration du service</strong> : analyses agrégées et anonymisées pour améliorer la plateforme. Base légale : intérêt légitime.</li>
              <li><strong>Obligations légales</strong> : conservation de preuves et respect des obligations légales et réglementaires. Base légale : obligation légale.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">4. Durée de conservation</h2>
            <p>
              Les données sont conservées pour la durée nécessaire à la fourniture du service et au respect de nos obligations légales. Après clôture du compte ou fin du contrat, les données peuvent être conservées pendant une durée limitée (par exemple pour preuve ou réclamation), puis supprimées ou anonymisées, sauf obligation de conservation imposée par la loi.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">5. Destinataires et sous-traitants</h2>
            <p>
              Les données peuvent être transmises à des prestataires techniques (hébergement, authentification, emails) dans le cadre strict de la fourniture du service, sur la base de contrats garantissant la confidentialité et la sécurité. Nous recourons notamment à des services d&apos;authentification et d&apos;hébergement conformes aux exigences du RGPD. La liste des sous-traitants peut être communiquée sur demande.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">6. Vos droits (RGPD)</h2>
            <p>
              Conformément au Règlement général sur la protection des données (RGPD), vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Droit d&apos;accès</strong> : obtenir une copie de vos données personnelles.</li>
              <li><strong>Droit de rectification</strong> : faire corriger des données inexactes ou incomplètes.</li>
              <li><strong>Droit à l&apos;effacement</strong> : demander la suppression de vos données dans les limites prévues par la loi.</li>
              <li><strong>Droit à la limitation du traitement</strong> : demander la suspension de certains traitements dans les conditions prévues.</li>
              <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré et couramment utilisé.</li>
              <li><strong>Droit d&apos;opposition</strong> : vous opposer à certains traitements fondés sur l&apos;intérêt légitime.</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, contactez-nous via la <Link href="/contact" className="text-teal-600 dark:text-teal-400 hover:underline">page Contact</Link>. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">7. Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte, altération ou divulgation (chiffrement, accès restreint, hébergement sécurisé).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">8. Cookies</h2>
            <p>
              Le site peut utiliser des cookies ou technologies similaires pour le fonctionnement de la session, la sécurité et l&apos;analyse d&apos;usage. Vous pouvez configurer votre navigateur pour refuser certains cookies ; l&apos;utilisation de certaines fonctionnalités peut en être affectée.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">9. Contact</h2>
            <p>
              Pour toute question relative à cette politique ou à vos données personnelles : <Link href="/contact" className="text-teal-600 dark:text-teal-400 hover:underline">page Contact</Link>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border/60 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Accueil</Link>
          <span className="mx-2">·</span>
          <Link href="/mentions-legales" className="hover:text-foreground">Mentions légales</Link>
          <span className="mx-2">·</span>
          <Link href="/contact" className="hover:text-foreground">Contact</Link>
        </div>
      </footer>
    </div>
  )
}
