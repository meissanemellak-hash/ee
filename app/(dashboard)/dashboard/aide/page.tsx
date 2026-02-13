'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { HelpCircle, LayoutDashboard, Store, Package, Beaker, BarChart3, TrendingUp, Lightbulb, Bell, FileText, Settings, BookOpen, ChevronRight, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const sections = [
  { id: 'prise-en-main', label: 'Prise en main', icon: BookOpen },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'restaurants', label: 'Restaurants', icon: Store },
  { id: 'produits', label: 'Produits', icon: Package },
  { id: 'ingredients', label: 'Ingrédients', icon: Beaker },
  { id: 'ventes', label: 'Ventes & Analyse', icon: BarChart3 },
  { id: 'previsions', label: 'Prévisions', icon: TrendingUp },
  { id: 'recommandations', label: 'Recommandations', icon: Lightbulb },
  { id: 'effectifs', label: 'Effectifs', icon: Users },
  { id: 'alertes', label: 'Alertes', icon: Bell },
  { id: 'rapports', label: 'Rapports', icon: FileText },
  { id: 'parametres', label: 'Paramètres', icon: Settings },
] as const

type SectionId = (typeof sections)[number]['id']

function SectionContent({ sectionId }: { sectionId: SectionId }) {
  const section = sections.find((s) => s.id === sectionId)
  if (!section) return null
  const Icon = section.icon

  const content: Record<SectionId, { title: string; description: string; body: React.ReactNode }> = {
    'prise-en-main': {
      title: 'Prise en main',
      description: 'Démarrez avec IA Restaurant Manager',
      body: (
        <>
          <p>
            IA Restaurant Manager centralise la gestion de vos établissements, produits, ingrédients, ventes et stocks. Après connexion, vous accédez au tableau de bord. Selon votre rôle (administrateur, manager ou employé), certaines actions sont disponibles ou restreintes.
          </p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Ordre recommandé pour démarrer</h3>
          <ol className="list-decimal list-inside space-y-1 ml-1">
            <li>Créez au moins un <strong className="text-teal-700 dark:text-teal-400 font-bold">restaurant</strong> (établissement).</li>
            <li>Ajoutez vos <strong className="text-teal-700 dark:text-teal-400 font-bold">ingrédients</strong> (unité, coût, fournisseur si besoin).</li>
            <li>Créez vos <strong className="text-teal-700 dark:text-teal-400 font-bold">produits</strong> (prix, catégorie) et définissez leurs <strong className="text-teal-700 dark:text-teal-400 font-bold">recettes</strong> (ingrédients et quantités).</li>
            <li>Enregistrez des <strong className="text-teal-700 dark:text-teal-400 font-bold">ventes</strong> pour alimenter le tableau de bord et les prévisions.</li>
            <li>Consultez les <strong className="text-teal-700 dark:text-teal-400 font-bold">alertes</strong> (stocks) et les <strong className="text-teal-700 dark:text-teal-400 font-bold">recommandations</strong> pour optimiser.</li>
          </ol>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Rôles et permissions</h3>
          <p>
            L&apos;<strong className="text-teal-700 dark:text-teal-400 font-bold">administrateur</strong> peut tout gérer (organisation, membres, suppression). Le <strong className="text-teal-700 dark:text-teal-400 font-bold">manager</strong> peut créer et modifier la plupart des données ; l&apos;<strong className="text-teal-700 dark:text-teal-400 font-bold">employé</strong> a des droits limités (consultation, saisie de ventes selon la config). La page Paramètres affiche ou masque certaines options selon votre rôle.
          </p>
        </>
      ),
    },
    dashboard: {
      title: 'Dashboard',
      description: "Vue d'ensemble de votre activité",
      body: (
        <>
          <p>
            Le tableau de bord donne une vue d&apos;ensemble de votre activité : chiffre d&apos;affaires, nombre de ventes, alertes actives, et indicateurs utiles pour piloter vos établissements.
          </p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Filtrer par restaurant</h3>
          <p>
            Le sélecteur en haut de page (à côté du logo ou dans le header) permet de choisir un restaurant ou « Tous ». Les données affichées (ventes, alertes, etc.) sont alors filtrées pour ce ou ces établissements. L&apos;option sélectionnée est conservée lorsque vous naviguez entre les pages (Dashboard, Ventes, Alertes…).
          </p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Ce que vous voyez</h3>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>Indicateurs principaux : revenus, ventes, évolution.</li>
            <li>Alertes actives (stocks sous seuil ou en surstock).</li>
            <li>Résumé par restaurant si plusieurs établissements.</li>
          </ul>
        </>
      ),
    },
    restaurants: {
      title: 'Restaurants',
      description: 'Gérer vos établissements',
      body: (
        <>
          <p>
            Chaque restaurant représente un établissement : nom, adresse, fuseau horaire. Vous pouvez en créer plusieurs, les modifier ou les supprimer. En cliquant sur « Voir détails » pour un restaurant, vous accédez à son inventaire (stocks par ingrédient) et aux ventes qui lui sont rattachées.
          </p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Créer un restaurant</h3>
          <p>Cliquez sur « Ajouter un restaurant » (en haut à droite), renseignez le nom et l&apos;adresse, choisissez le fuseau horaire, puis enregistrez.</p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Fiche restaurant</h3>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li><strong className="text-teal-700 dark:text-teal-400 font-bold">Modifier</strong> : éditer le nom, l&apos;adresse ou le fuseau.</li>
            <li><strong className="text-teal-700 dark:text-teal-400 font-bold">Inventaire</strong> : consulter et mettre à jour les stocks d&apos;ingrédients pour cet établissement (seuils min/max, alertes).</li>
            <li>Les ventes enregistrées pour ce restaurant apparaissent dans Ventes & Analyse et impactent son inventaire si les produits ont une recette.</li>
          </ul>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Import et export CSV</h3>
          <p>Via le menu « Import / export » : importer plusieurs restaurants en une fois (colonnes : nom, adresse, fuseau) ou exporter la liste actuelle en CSV pour archivage ou usage externe.</p>
        </>
      ),
    },
    produits: {
      title: 'Produits',
      description: 'Catalogue et recettes',
      body: (
        <>
          <p>
            Les produits sont vos plats ou articles vendus. Pour chaque produit vous définissez un prix unitaire et une catégorie. La recette (BOM) associe des ingrédients et des quantités : elle sert à calculer les coûts et la consommation de stock lors des ventes.
          </p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Créer un produit</h3>
          <p>« Ajouter un produit » → nom, prix unitaire, catégorie (optionnelle). Enregistrez puis éditez le produit pour ajouter sa recette (ingrédients et quantités).</p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Recette (BOM)</h3>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>Sur la fiche produit, la section recette liste les ingrédients et quantités nécessaires par unité vendue.</li>
            <li>À chaque vente du produit, les stocks d&apos;ingrédients sont déduits selon cette recette (par restaurant).</li>
            <li>Sans recette, les ventes du produit n&apos;impactent pas l&apos;inventaire ; vous pouvez quand même suivre les ventes et le chiffre d&apos;affaires.</li>
          </ul>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Import CSV</h3>
          <p>Import de produits (nom, prix, catégorie) ou import BOM (produit, ingrédient, quantité, unité). Les ingrédients et produits doivent exister avant l&apos;import BOM. Utilisez les modèles ou explications fournis sur la page d&apos;import.</p>
        </>
      ),
    },
    ingredients: {
      title: 'Ingrédients',
      description: 'Coûts et stocks',
      body: (
        <>
          <p>
            Les ingrédients sont les matières premières utilisées dans les recettes produits. Ils sont partagés au niveau de l&apos;organisation ; les stocks sont gérés par restaurant dans l&apos;inventaire.
          </p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Créer un ingrédient</h3>
          <p>« Ajouter un ingrédient » → nom, unité (kg, L, pièce, g, etc.), coût par unité. Optionnel : taille de pack, nom du fournisseur. Choisissez l&apos;unité comme dans vos recettes : si vos recettes indiquent la farine en grammes, mettez « gramme » (g) pour l&apos;ingrédient ; si elles utilisent des kg, mettez kg. Si vous commandez en kilos chez le fournisseur mais travaillez en grammes dans les recettes, gardez « gramme » dans l&apos;app : à la réception, saisissez le stock en grammes (ex. 25 kg = 25 000 g) et le coût par gramme (prix au kg ÷ 1000).</p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Où sont utilisés les ingrédients ?</h3>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li><strong className="text-teal-700 dark:text-teal-400 font-bold">Recettes produits</strong> : chaque produit peut associer des ingrédients et des quantités (BOM).</li>
            <li><strong className="text-teal-700 dark:text-teal-400 font-bold">Inventaire</strong> : par restaurant, vous renseignez le stock actuel et les seuils min/max. Les ventes de produits avec recette déduisent automatiquement les stocks (saisie, modification, suppression ou import de ventes).</li>
            <li>Les <strong className="text-teal-700 dark:text-teal-400 font-bold">alertes</strong> se créent ou se mettent à jour automatiquement quand un stock sort des seuils min/max, après toute modification d&apos;inventaire ou après des ventes (qui déduisent les stocks).</li>
          </ul>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Import CSV</h3>
          <p>Vous pouvez importer une liste d&apos;ingrédients (nom, unité, coût, etc.) via la page Ingrédients, menu Import / export. Vérifiez le format des colonnes indiqué sur la page.</p>
        </>
      ),
    },
    ventes: {
      title: 'Ventes & Analyse',
      description: 'Saisie et analyse des ventes',
      body: (
        <>
          <p>
            La section Ventes permet d&apos;enregistrer les ventes (restaurant, produit, quantité, date) et de consulter des analyses (statistiques, tendances, meilleurs produits).
          </p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Saisir une vente</h3>
          <p>« Ajouter une vente » (ou depuis la liste) : choisissez le restaurant, le produit, la quantité, la date et l&apos;heure si besoin. Le montant est calculé à partir du prix unitaire du produit.</p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Déduction automatique des stocks</h3>
          <p>Dès qu&apos;une vente est enregistrée, les stocks du restaurant sont <strong className="text-teal-700 dark:text-teal-400 font-bold">déduits automatiquement</strong> selon la recette du produit (quantité d&apos;ingrédients par unité vendue). Si vous modifiez une vente (quantité ou produit), l&apos;ancienne déduction est annulée et la nouvelle est appliquée. Si vous supprimez une vente, les quantités sont remises dans l&apos;inventaire. Les <strong className="text-teal-700 dark:text-teal-400 font-bold">alertes</strong> (rupture de stock, surstock) sont recalculées après chaque saisie, modification, suppression ou import de ventes.</p>
          <p className="mt-2">Un produit sans recette n&apos;impacte pas l&apos;inventaire ; les ventes restent enregistrées pour le chiffre d&apos;affaires et les analyses.</p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Import CSV</h3>
          <p>Pour charger un historique de ventes, utilisez l&apos;import CSV depuis la page Ventes. Le fichier doit contenir les colonnes attendues (restaurant, produit, quantité, date, etc.). Les ventes importées déduisent elles aussi les stocks selon les recettes et déclenchent la mise à jour des alertes pour le restaurant concerné. Consultez les instructions sur la page d&apos;import.</p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Page Analyse</h3>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>Filtrez par période et par restaurant.</li>
            <li>Visualisez les ventes par jour, le chiffre d&apos;affaires, les produits les plus vendus.</li>
            <li>Utilisez ces données pour les prévisions et le pilotage.</li>
          </ul>
        </>
      ),
    },
    previsions: {
      title: 'Prévisions',
      description: 'Anticiper les ventes et la consommation',
      body: (
        <>
          <p>
            Les prévisions sont générées à partir de vos données historiques de ventes. Le pourcentage de gaspillage (Paramètres → Organisation) sert à majorer les quantités à commander, pas les chiffres de prévisions affichés ici. Elles aident à anticiper la demande et à planifier les commandes et la production.
          </p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Générer une prévision</h3>
          <p>Sur la page Prévisions, renseignez les filtres (période, restaurant si besoin) puis cliquez sur « Générer ». Les résultats s&apos;affichent sous le formulaire : prévisions de ventes et, selon le cas, impact sur la consommation d&apos;ingrédients.</p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Pourcentage de gaspillage</h3>
          <p>Le pourcentage de gaspillage par défaut est réglé dans Paramètres → Organisation (valeur entre 0 et 1, ex. 0,1 = 10 %). Il anticipe les pertes sur la période (gaspillage, casse, pertes en préparation) lors du calcul des quantités à commander à partir des prévisions ; il n’affecte pas les chiffres de prévisions de ventes affichés. <strong className="text-teal-700 dark:text-teal-400">Comment choisir un % cohérent ?</strong> Suivez vos pertes réelles sur quelques semaines (produits jetés, périmés, pertes en préparation) ou partez d&apos;une fourchette courante en restauration (souvent 5 à 15 %), puis ajustez selon les retours terrain.</p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Bon à savoir</h3>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>Plus vous avez d&apos;historique de ventes, plus les prévisions peuvent être pertinentes.</li>
            <li>Filtrez par restaurant pour des prévisions par établissement.</li>
          </ul>
        </>
      ),
    },
    recommandations: {
      title: 'Recommandations',
      description: "Suggestions d'optimisation",
      body: (
        <>
          <p>
            Les recommandations sont des suggestions générées à partir de vos données (recettes, ventes, stocks, coûts) : commandes d&apos;ingrédients, effectifs, etc. Chaque recommandation affiche le <strong className="text-teal-700 dark:text-teal-400 font-bold">coût estimé de la commande</strong> (montant à dépenser) et le <strong className="text-teal-700 dark:text-teal-400 font-bold">gain estimé</strong> (ruptures de stock et gaspillage évités, indicateur).
          </p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Consulter les recommandations</h3>
          <p>Sur la page Recommandations, la liste affiche les suggestions avec type, coût et gain estimés. Vous pouvez filtrer par restaurant, type et statut (en attente, acceptée, rejetée).</p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Accepter ou rejeter</h3>
          <p>Pour une recommandation de <strong className="text-teal-700 dark:text-teal-400 font-bold">commande</strong>, l&apos;<strong className="text-teal-700 dark:text-teal-400 font-bold">accepter</strong> enregistre la réception : les quantités recommandées sont ajoutées à l&apos;inventaire du restaurant et les alertes sont recalculées. Vous n&apos;avez plus à saisir la réception à la main. Pour les autres types ou si vous ne souhaitez pas appliquer, vous pouvez <strong className="text-teal-700 dark:text-teal-400 font-bold">rejeter</strong>. Les recommandations acceptées ou rejetées restent visibles dans l&apos;historique.</p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Générer des recommandations</h3>
          <p>Vous pouvez générer des recommandations pour <strong className="text-teal-700 dark:text-teal-400 font-bold">un restaurant</strong> (sélectionnez-le puis « Générer (1 restaurant) ») ou pour <strong className="text-teal-700 dark:text-teal-400 font-bold">tous les restaurants</strong> en un clic (« Générer pour tous les restaurants »). La génération s&apos;appuie sur les prévisions de ventes et les recettes (BOM) ; les nouvelles suggestions apparaissent avec le statut « En attente ». Les recommandations sont aussi <strong className="text-teal-700 dark:text-teal-400 font-bold">générées automatiquement</strong> chaque jour.</p>
        </>
      ),
    },
    effectifs: {
      title: 'Effectifs',
      description: 'Effectif prévu et alertes sur/sous-effectif',
      body: (
        <>
          <p>
            La page <strong className="text-teal-700 dark:text-teal-400 font-bold">Effectifs</strong> (menu) permet de saisir l&apos;<strong className="text-teal-700 dark:text-teal-400 font-bold">effectif prévu</strong> par restaurant, par date et par créneau horaire. En comparant ces valeurs à l&apos;effectif recommandé (Recommandations → Effectifs), l&apos;application génère des alertes <strong className="text-teal-700 dark:text-teal-400 font-bold">Sur-effectif</strong> ou <strong className="text-teal-700 dark:text-teal-400 font-bold">Sous-effectif</strong> sur la page Alertes.
          </p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Où saisir l&apos;effectif prévu ?</h3>
          <p>Menu <strong className="text-teal-700 dark:text-teal-400 font-bold">Effectifs</strong> → choisissez un restaurant et une date → renseignez le nombre de personnes prévues pour chaque créneau (08:00-12:00, 12:00-14:00, 14:00-18:00, 18:00-22:00) → cliquez sur « Enregistrer l&apos;effectif prévu ». Les alertes sont recalculées automatiquement après l&apos;enregistrement.</p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Lien avec les alertes</h3>
          <p>Si l&apos;effectif prévu est <strong className="text-teal-700 dark:text-teal-400 font-bold">supérieur</strong> à l&apos;effectif recommandé pour un créneau, une alerte <strong className="text-teal-700 dark:text-teal-400 font-bold">Sur-effectif</strong> est créée. S&apos;il est <strong className="text-teal-700 dark:text-teal-400 font-bold">inférieur</strong>, une alerte <strong className="text-teal-700 dark:text-teal-400 font-bold">Sous-effectif</strong> est créée. Ces alertes apparaissent sur la page Alertes (filtres par type : Sur-effectif / Sous-effectif).</p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Conseil</h3>
          <p>Générez d&apos;abord une <strong className="text-teal-700 dark:text-teal-400 font-bold">recommandation d&apos;effectifs</strong> (page Recommandations, type « Effectifs », choisir la date) pour obtenir l&apos;effectif recommandé par créneau. Vous pouvez ensuite saisir l&apos;effectif prévu sur la page Effectifs : les écarts généreront les alertes Sur-effectif ou Sous-effectif.</p>
        </>
      ),
    },
    alertes: {
      title: 'Alertes',
      description: 'Stocks et seuils',
      body: (
        <>
          <p>
            Les alertes vous informent lorsque le stock d&apos;un ingrédient dans un restaurant est sous le seuil minimum (risque de rupture de stock) ou au-dessus du seuil maximum (surstock). Elles permettent d&apos;agir rapidement sur les commandes et la production.
          </p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">D&apos;où viennent les alertes ?</h3>
          <p>Les seuils min et max sont définis dans l&apos;<strong className="text-teal-700 dark:text-teal-400 font-bold">inventaire</strong> de chaque restaurant (page Restaurants → Voir détails → Inventaire). Les alertes sont <strong className="text-teal-700 dark:text-teal-400 font-bold">générées automatiquement</strong> dès que les stocks changent : après une modification d&apos;inventaire (saisie manuelle ou import), et après chaque vente enregistrée, modifiée, supprimée ou importée (car les ventes déduisent les stocks selon les recettes). Vous pouvez aussi lancer manuellement la génération depuis la page Alertes (sélectionnez un restaurant puis le bouton « Générer les alertes ») pour recalculer les alertes à partir des stocks actuels. Le bouton « Actualiser » rafraîchit la liste sans relancer la génération.</p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Où les voir ?</h3>
          <p>Les alertes apparaissent sur le <strong className="text-teal-700 dark:text-teal-400 font-bold">tableau de bord</strong> (section « Alertes critiques ») et sur la page <strong className="text-teal-700 dark:text-teal-400 font-bold">Alertes</strong> (menu Dashboard → Alertes), où vous pouvez filtrer par restaurant, type, sévérité et consulter ou marquer comme résolues. Chaque fiche restaurant affiche aussi le nombre d&apos;alertes actives.</p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Sur la page Alertes</h3>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>Consultez la liste des alertes actives (rupture de stock, surstock). Filtrez par restaurant si besoin.</li>
            <li>Générez les alertes pour un restaurant (bouton « Générer les alertes ») si vous souhaitez forcer un recalcul selon les stocks et seuils actuels. « Actualiser » rafraîchit uniquement la liste.</li>
            <li>Après avoir traité le problème (commande, ajustement), marquez l&apos;alerte comme <strong className="text-teal-700 dark:text-teal-400 font-bold">résolue</strong>.</li>
            <li>Vous pouvez afficher les alertes résolues pour l&apos;historique.</li>
          </ul>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Conseil</h3>
          <p>Renseignez des seuils réalistes dans l&apos;inventaire pour éviter trop d&apos;alertes ou au contraire des ruptures de stock non signalées. Vous pouvez laisser le seuil max optionnel si vous ne gérez que des seuils minimum.</p>
        </>
      ),
    },
    rapports: {
      title: 'Rapports',
      description: 'Rapports et export',
      body: (
        <>
          <p>
            La page Rapports permet de générer des rapports détaillés (récapitulatif, ventes, performance, inventaire, recommandations, alertes) sur une période et un restaurant choisis, puis de les exporter en CSV.
          </p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Types de rapports</h3>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li><strong className="text-teal-700 dark:text-teal-400 font-bold">Récapitulatif</strong> : vue d&apos;ensemble sur la période.</li>
            <li><strong className="text-teal-700 dark:text-teal-400 font-bold">Ventes</strong> : détail des ventes par jour, revenus.</li>
            <li><strong className="text-teal-700 dark:text-teal-400 font-bold">Performance</strong> : comparaison ou répartition par restaurant.</li>
            <li><strong className="text-teal-700 dark:text-teal-400 font-bold">Inventaire</strong> : état des stocks par restaurant et ingrédient (seuils, statut).</li>
            <li><strong className="text-teal-700 dark:text-teal-400 font-bold">Recommandations / Alertes</strong> : synthèse des recommandations ou alertes sur la période.</li>
          </ul>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Générer et exporter</h3>
          <p>Sélectionnez le type de rapport, la période (date de début, date de fin) et éventuellement un restaurant. Cliquez sur « Générer le rapport ». Le résultat s&apos;affiche à l&apos;écran ; vous pouvez ensuite l&apos;exporter en CSV via le bouton d&apos;export pour l&apos;archivage ou un traitement externe.</p>
          <p className="mt-2">Seuls les rôles <strong className="text-teal-700 dark:text-teal-400 font-bold">Admin</strong> et <strong className="text-teal-700 dark:text-teal-400 font-bold">Manager</strong> peuvent générer des rapports (droits « Rapports »). Le rôle Employé peut consulter le tableau de bord mais pas générer ni exporter les rapports.</p>
        </>
      ),
    },
    parametres: {
      title: 'Paramètres',
      description: 'Organisation et profil',
      body: (
        <>
          <p>
            La page Paramètres regroupe la gestion de l&apos;organisation, des membres et de votre profil. L&apos;accès à certaines sections dépend de votre rôle (admin, manager, employé).
          </p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Organisation</h3>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li><strong className="text-teal-700 dark:text-teal-400 font-bold">Nom de l&apos;organisation</strong> : modifiable par le créateur ou un administrateur. Ce nom est utilisé dans toute l&apos;application.</li>
            <li><strong className="text-teal-700 dark:text-teal-400 font-bold">Pourcentage de gaspillage par défaut</strong> : valeur entre 0 et 1 (ex. 0,1 = 10 %) utilisée dans les prévisions et les recommandations de commande (pertes, casse, gaspillage). Pour l&apos;estimer : suivez vos pertes réelles ou partez d&apos;une fourchette courante (5–15 %) puis affinez. Voir la section Prévisions dans le centre d&apos;aide pour plus de détail.</li>
          </ul>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Membres</h3>
          <p>Les administrateurs peuvent inviter des membres et attribuer les rôles (admin, manager, employé). Chaque rôle dispose de permissions précises (création, modification, suppression, rapports, etc.). Consultez la section Membres pour gérer les invitations et les rôles.</p>
          <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">Profil utilisateur</h3>
          <p>Vous pouvez consulter votre nom, votre email et les informations de compte. Pour modifier votre profil (nom, email, mot de passe), utilisez le menu utilisateur en haut à droite (avatar ou nom). Le bouton « Déconnexion » vous déconnecte et vous renvoie à l&apos;accueil.</p>
        </>
      ),
    },
  }

  const data = content[sectionId]
  if (!data) return null

  return (
    <Card className="rounded-xl border shadow-sm bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          <CardTitle className="text-xl">{data.title}</CardTitle>
        </div>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-muted-foreground">
        {data.body}
      </CardContent>
    </Card>
  )
}

export default function AidePage() {
  const [selectedSectionId, setSelectedSectionId] = useState<SectionId | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedSectionId && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedSectionId])

  return (
    <main className="bg-muted/25 min-h-screen" role="main" aria-label="Centre d'aide">
      <div className="max-w-4xl mx-auto p-6 lg:p-8 pb-12 space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Aide' },
          ]}
          className="mb-4"
        />

        <header className="pb-6 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md">
              <HelpCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Centre d&apos;aide</h1>
              <p className="text-muted-foreground mt-1">
                Documentation et guide d&apos;utilisation d&apos;IA Restaurant Manager
              </p>
            </div>
          </div>
        </header>

        {/* Sommaire */}
        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Sommaire</CardTitle>
            <CardDescription>Cliquez sur une section pour afficher son contenu</CardDescription>
          </CardHeader>
          <CardContent>
            <nav className="grid gap-2 sm:grid-cols-2" aria-label="Sommaire de l'aide">
              {sections.map(({ id, label, icon: Icon }) => {
                const isSelected = selectedSectionId === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedSectionId(id)}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-200 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-200 focus-visible:ring-inset dark:focus-visible:ring-teal-800',
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800 shadow-sm'
                        : 'border-border/60 bg-muted/30 text-foreground hover:bg-muted/60 hover:border-teal-200/70 dark:hover:border-teal-800/70'
                    )}
                    aria-expanded={isSelected}
                    aria-controls="aide-contenu"
                  >
                    <span className="flex items-center gap-2">
                      <Icon
                        className={cn(
                          'h-4 w-4 flex-shrink-0',
                          isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'
                        )}
                      />
                      {label}
                    </span>
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground'
                      )}
                    />
                  </button>
                )
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Contenu de la section sélectionnée */}
        <div id="aide-contenu" ref={contentRef} className="scroll-mt-8">
          {selectedSectionId ? (
            <SectionContent sectionId={selectedSectionId} />
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Cliquez sur une section ci-dessus pour afficher son contenu.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
