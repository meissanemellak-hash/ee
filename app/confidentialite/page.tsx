import Link from 'next/link'

export const metadata = {
  title: 'Politique de confidentialité | IA Restaurant Manager',
  description: 'Politique de confidentialité et protection des données personnelles - IA Restaurant Manager.',
}

export default function ConfidentialitePage() {
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
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Politique de confidentialité</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dernière mise à jour : janvier 2026
        </p>

        <div className="mt-8 prose prose-neutral dark:prose-invert max-w-none text-muted-foreground text-sm space-y-8">
          <p className="text-muted-foreground">
            La présente politique de confidentialité décrit la manière dont <strong>IA Restaurant Manager</strong> collecte, utilise et protège les données personnelles des utilisateurs de son site et de sa plateforme SaaS de pilotage multi-restaurants. Elle s&apos;inscrit dans le cadre du Règlement général sur la protection des données (RGPD) et de la loi française « Informatique et Libertés ».
          </p>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 first:mt-0">1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement des données personnelles est :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Raison sociale : [À compléter]</li>
              <li>Siège social : [Adresse complète]</li>
              <li>Email contact / DPO : [contact@votredomaine.fr ou dpo@votredomaine.fr]</li>
            </ul>
            <p className="mt-2">
              Pour toute question relative à vos données personnelles ou pour exercer vos droits : <Link href="/contact" className="text-teal-600 dark:text-teal-400 hover:underline">page Contact</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">2. Données collectées</h2>
            <p>
              Nous collectons les données suivantes, selon le contexte (visite du site, demande de démo, utilisation de la plateforme) :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Site et formulaire de demande de démo</strong> : nom, prénom, adresse email, société/groupe, nombre de restaurants, difficultés et priorités indiquées, message. Ces données permettent de traiter votre demande et de vous recontacter.</li>
              <li><strong>Compte et plateforme</strong> : identifiants (nom, prénom, email), mot de passe (stocké de manière sécurisée, non lisible), nom de l&apos;organisation, nombre d&apos;établissements, rôles des utilisateurs.</li>
              <li><strong>Données d&apos;activité</strong> : données relatives aux restaurants, ventes, inventaire, alertes, prévisions et rapports que vous saisissez ou générez dans la plateforme. En tant que client, vous êtes responsable du traitement de ces données pour vos propres finalités ; IA Restaurant Manager agit en tant que sous-traitant pour la fourniture du service.</li>
              <li><strong>Données techniques</strong> : adresse IP, type de navigateur, logs d&apos;accès et d&apos;utilisation, dans le cadre du fonctionnement, de la sécurité et de la maintenance du service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">3. Finalités et bases légales</h2>
            <p>
              Vos données sont traitées pour les finalités suivantes, sur les bases légales indiquées :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Gestion des demandes de démo et de la relation commerciale</strong> : traitement de votre demande, prise de rendez-vous, suivi commercial. Base légale : exécution de mesures précontractuelles et intérêt légitime.</li>
              <li><strong>Fourniture du service SaaS</strong> : création et gestion du compte, des organisations et des établissements, fonctionnalités de la plateforme (ventes, inventaire, alertes, prévisions, rapports). Base légale : exécution du contrat.</li>
              <li><strong>Support et accompagnement</strong> : réponse à vos demandes, formation, assistance technique, onboarding. Base légale : exécution du contrat et intérêt légitime.</li>
              <li><strong>Amélioration du service</strong> : analyses agrégées et anonymisées pour améliorer la plateforme et la sécurité. Base légale : intérêt légitime.</li>
              <li><strong>Obligations légales et preuves</strong> : conservation de preuves, respect des obligations comptables et réglementaires. Base légale : obligation légale.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">4. Durée de conservation</h2>
            <p>
              Les données sont conservées pour la durée nécessaire aux finalités décrites ci-dessus :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Demande de démo (sans conclusion de contrat)</strong> : conservation pendant [3 ans] à compter du dernier contact, puis suppression ou anonymisation.</li>
              <li><strong>Compte et données de la plateforme</strong> : durée du contrat, puis période de conservation limitée (par ex. 1 à 3 ans) pour preuves et réclamations, sauf obligation légale plus longue.</li>
              <li><strong>Données techniques et logs</strong> : durée limitée nécessaire à la sécurité et au dépannage (par ex. 12 mois), sauf obligation légale.</li>
            </ul>
            <p className="mt-2">
              À l&apos;issue de ces durées, les données sont supprimées ou anonymisées de manière irréversible.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">5. Destinataires et sous-traitants</h2>
            <p>
              Les données peuvent être transmises à des prestataires techniques (hébergement, authentification, envoi d&apos;emails, analytics) strictement pour la fourniture du service. Ces sous-traitants sont soumis à des contrats garantissant la confidentialité, la sécurité et le respect du RGPD (instructions du responsable du traitement, audit, sous-traitance).
            </p>
            <p className="mt-2">
              La liste des sous-traitants et, le cas échéant, une convention de sous-traitance (DPA) peuvent être communiqués sur demande à l&apos;adresse indiquée au § 1. En cas de transfert de données hors de l&apos;Espace économique européen, des garanties appropriées (clauses types, BCR, etc.) sont mises en place.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">6. Vos droits (RGPD)</h2>
            <p>
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Droit d&apos;accès</strong> : obtenir une copie de vos données personnelles et des informations sur leur traitement.</li>
              <li><strong>Droit de rectification</strong> : faire corriger des données inexactes ou incomplètes.</li>
              <li><strong>Droit à l&apos;effacement</strong> : demander la suppression de vos données dans les limites prévues par la loi (ex. après fin du contrat, sous réserve des obligations de conservation).</li>
              <li><strong>Droit à la limitation du traitement</strong> : demander la suspension de certains traitements dans les conditions prévues par le RGPD.</li>
              <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré et couramment utilisé, lorsque le traitement est fondé sur le contrat ou le consentement.</li>
              <li><strong>Droit d&apos;opposition</strong> : vous opposer à un traitement fondé sur l&apos;intérêt légitime (ex. prospection), sans préjudice de la poursuite du traitement pour d&apos;autres finalités.</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, contactez-nous à l&apos;adresse indiquée au § 1 ou via la <Link href="/contact" className="text-teal-600 dark:text-teal-400 hover:underline">page Contact</Link>. Nous nous engageons à répondre dans un délai d&apos;un mois. Vous disposez également du droit d&apos;introduire une réclamation auprès de la CNIL (www.cnil.fr).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">7. Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte, altération ou divulgation : chiffrement des données sensibles (mots de passe, flux), accès restreint et tracé, hébergement sécurisé, politique de confidentialité interne et, le cas échéant, audits ou certifications. En cas d&apos;incident susceptible d&apos;affecter vos données personnelles, nous nous engageons à vous en informer et à en informer la CNIL si la loi l&apos;exige.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">8. Cookies et traceurs</h2>
            <p>
              Le site et la plateforme peuvent utiliser des cookies ou technologies similaires pour :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Fonctionnement essentiel</strong> : session, authentification, sécurité (base légale : intérêt légitime).</li>
              <li><strong>Préférences et analyse d&apos;usage</strong> : mémorisation de vos choix, statistiques d&apos;utilisation pour améliorer le service (base légale : intérêt légitime ou consentement selon le type de traceur).</li>
            </ul>
            <p className="mt-2">
              Vous pouvez configurer votre navigateur pour refuser ou supprimer certains cookies ; l&apos;utilisation de certaines fonctionnalités (connexion, préférences) peut en être affectée. La liste détaillée des cookies utilisés peut être communiquée sur demande ou affichée dans un bandeau dédié si vous en mettez un en place.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">9. Modifications de la politique</h2>
            <p>
              Nous nous réservons le droit de modifier la présente politique de confidentialité pour refléter les évolutions du service ou de la réglementation. Toute modification substantielle sera portée à votre connaissance (par exemple par email ou par un bandeau sur le site) et la date de dernière mise à jour sera modifiée. Nous vous invitons à consulter régulièrement cette page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8">10. Contact</h2>
            <p>
              Pour toute question relative à cette politique ou à vos données personnelles, pour exercer vos droits ou pour toute demande de convention de sous-traitance (DPA) : <Link href="/contact" className="text-teal-600 dark:text-teal-400 hover:underline">page Contact</Link> ou email à [contact@votredomaine.fr].
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
