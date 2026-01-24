# Roadmap - AI Operations Manager (5 000€/mois)

## 🎯 Objectif : MVP prêt pour vente premium en 4-6 semaines

---

## PHASE 1 : FONDATIONS ROBUSTES (Semaine 1)
**Objectif : Base solide et fiable**

### 1.1 Navigation et structure UX
- [ ] **Sidebar navigation** avec menu principal
  - Dashboard
  - Restaurants
  - Ventes & Analyse
  - Prévisions
  - Recommandations
  - Alertes
  - Paramètres
- [ ] **Header** avec UserButton Clerk + sélecteur d'organisation
- [ ] **Layout responsive** pour mobile/tablette
- [ ] **Breadcrumbs** pour navigation claire

**Pourquoi** : UX premium = navigation intuitive. Client paie 5k€, il doit se sentir dans un outil professionnel.

### 1.2 Gestion complète des données de base
- [ ] **CRUD Restaurants** (création, édition, suppression)
- [ ] **CRUD Produits** avec catégories
- [ ] **CRUD Ingrédients** avec unités
- [ ] **Gestion des recettes** (liens produit-ingrédient)
- [ ] **Gestion des stocks** (seuils min/max par restaurant)

**Pourquoi** : Sans données, pas de valeur. Le client doit pouvoir configurer facilement.

### 1.3 Import CSV robuste
- [ ] **Page d'upload** avec drag & drop
- [ ] **Prévisualisation** des données avant import
- [ ] **Validation en temps réel** avec messages d'erreur clairs
- [ ] **Mapping automatique** des colonnes
- [ ] **Rapport d'import** (succès/erreurs)
- [ ] **Gestion des doublons** (skip ou update)

**Pourquoi** : Point d'entrée critique. Si l'import est difficile, le client ne peut pas utiliser le produit.

---

## PHASE 2 : VALEUR BUSINESS DÉMONTRABLE (Semaine 2)
**Objectif : Montrer l'impact ROI immédiatement**

### 2.1 Dashboard dirigeant premium
- [ ] **KPIs clés** en haut de page :
  - Économies estimées ce mois
  - Réduction du gaspillage (%)
  - Temps gagné (heures)
  - ROI estimé
- [ ] **Graphiques visuels** :
  - Évolution des ventes (ligne)
  - Top produits (barres)
  - Ventes par heure (heatmap ou barres)
  - Comparaison restaurants (tableau)
- [ ] **Alertes prioritaires** (widget)
- [ ] **Recommandations urgentes** (widget)
- [ ] **Export PDF** du dashboard

**Pourquoi** : Le dirigeant doit voir la valeur en 30 secondes. C'est la première impression.

### 2.2 Analyse des ventes avancée
- [ ] **Filtres multiples** :
  - Par restaurant (multi-select)
  - Par période (date range)
  - Par produit/catégorie
- [ ] **Graphiques interactifs** :
  - Ventes par jour (ligne)
  - Ventes par heure (barres)
  - Top produits (tableau triable)
  - Comparaison restaurants (graphiques multiples)
- [ ] **Export CSV/Excel** des données
- [ ] **Insights automatiques** :
  - "Pic de vente détecté le mardi à 19h"
  - "Produit X en baisse de 15% vs semaine dernière"

**Pourquoi** : L'analyse doit être actionnable, pas juste des chiffres.

### 2.3 Module de prévisions amélioré
- [ ] **Page dédiée** avec visualisation :
  - Calendrier des prévisions
  - Graphique prévisions vs réalisé (quand disponible)
  - Détail par produit
- [ ] **Ajustement manuel** des prévisions
- [ ] **Historique des prévisions** (pour améliorer le modèle)
- [ ] **Indicateur de confiance** visuel (score 0-100%)

**Pourquoi** : Les prévisions doivent être transparentes et ajustables. Le client doit avoir confiance.

---

## PHASE 3 : RECOMMANDATIONS ACTIONNABLES (Semaine 3)
**Objectif : Automatisation qui fait gagner du temps**

### 3.1 Page de recommandations premium
- [ ] **Vue d'ensemble** avec :
  - Total économies potentielles
  - Nombre de recommandations par type
  - Priorité visuelle (rouge/orange/vert)
- [ ] **Filtres** : type, restaurant, priorité, statut
- [ ] **Cartes de recommandations** avec :
  - Détail complet (quoi, pourquoi, combien)
  - Actions rapides (Accepter / Rejeter / Modifier)
  - Impact estimé (€ économisés)
- [ ] **Bulk actions** (accepter plusieurs d'un coup)
- [ ] **Historique** des recommandations acceptées/rejetées

**Pourquoi** : Les recommandations doivent être claires et actionnables. Le client doit pouvoir agir rapidement.

### 3.2 Recommandations de commandes améliorées
- [ ] **Détail par ingrédient** :
  - Stock actuel vs besoin
  - Coût estimé de la commande
  - Fournisseur suggéré (si données disponibles)
  - Date de livraison recommandée
- [ ] **Export liste de courses** (PDF/CSV)
- [ ] **Intégration email** (envoyer la commande au fournisseur)

**Pourquoi** : La recommandation doit être prête à l'emploi, pas juste un chiffre.

### 3.3 Recommandations de staffing améliorées
- [ ] **Vue calendrier** avec staffing recommandé par jour/tranche
- [ ] **Comparaison** staffing recommandé vs actuel
- [ ] **Coût estimé** (salaire horaire × heures)
- [ ] **Impact sur service** (temps d'attente estimé)
- [ ] **Export planning** (PDF/Excel)

**Pourquoi** : Le staffing doit être visualisable et exportable pour l'équipe.

---

## PHASE 4 : SYSTÈME D'ALERTES INTELLIGENT (Semaine 3-4)
**Objectif : Anticiper les problèmes avant qu'ils arrivent**

### 4.1 Alertes avancées
- [ ] **Page dédiée** avec filtres (type, sévérité, restaurant, statut)
- [ ] **Notifications en temps réel** (toast/badge)
- [ ] **Actions rapides** depuis les alertes :
  - "Commander maintenant" (pour rupture)
  - "Ajuster stock" (pour surstock)
  - "Voir détails"
- [ ] **Historique** des alertes résolues
- [ ] **Règles personnalisables** (seuils par restaurant)

**Pourquoi** : Les alertes doivent être actionnables, pas juste informatives.

### 4.2 Types d'alertes supplémentaires
- [ ] **Anomalies de ventes** (baisse soudaine, pic inattendu)
- [ ] **Dépassement budget** (si données disponibles)
- [ ] **Performance restaurant** (comparaison avec moyenne)
- [ ] **Prévisions vs réalisé** (écart important)

**Pourquoi** : Plus d'alertes = plus de valeur. Le client doit être proactif.

---

## PHASE 5 : POLISH ET PRODUCTION (Semaine 4-5)
**Objectif : Expérience premium sans friction**

### 5.1 Performance et fiabilité
- [ ] **React Query** pour cache et optimisations
- [ ] **Loading states** partout (skeletons)
- [ ] **Error boundaries** avec messages clairs
- [ ] **Optimisation requêtes** Prisma (select, pagination)
- [ ] **Pagination** sur toutes les listes longues

**Pourquoi** : Un outil à 5k€/mois doit être rapide et fiable.

### 5.2 Expérience utilisateur
- [ ] **Onboarding** pour nouveaux clients (wizard)
- [ ] **Tooltips** et help text partout
- [ ] **Tours guidés** pour features clés
- [ ] **Messages de succès/erreur** clairs
- [ ] **Confirmations** pour actions destructives

**Pourquoi** : Réduire la courbe d'apprentissage = adoption rapide.

### 5.3 Responsive et accessibilité
- [ ] **Mobile-first** sur toutes les pages
- [ ] **Tablette** optimisée
- [ ] **Accessibilité** (ARIA, keyboard navigation)
- [ ] **Dark mode** (optionnel mais premium)

**Pourquoi** : Les dirigeants utilisent mobile/tablette. L'outil doit suivre.

---

## PHASE 6 : FONCTIONNALITÉS PREMIUM (Semaine 5-6)
**Objectif : Différenciation et valeur ajoutée**

### 6.1 Reporting avancé
- [ ] **Rapports automatiques** (hebdo/mensuel par email)
- [ ] **Rapports personnalisables** (choix KPIs, période)
- [ ] **Export PDF** avec branding
- [ ] **Comparaison périodes** (mois N vs mois N-1)
- [ ] **Benchmarking** entre restaurants

**Pourquoi** : Les dirigeants aiment les rapports. C'est du temps gagné.

### 6.2 Intégrations (optionnel mais valeur ajoutée)
- [ ] **Webhook outbound** (envoyer données vers autres outils)
- [ ] **API publique** (pour intégrations custom)
- [ ] **Export vers Excel/Google Sheets** (formule directe)

**Pourquoi** : Les clients premium veulent intégrer avec leur stack.

### 6.3 Multi-utilisateurs et permissions
- [ ] **Rôles** (Admin, Manager, Viewer)
- [ ] **Permissions** par restaurant (accès limité)
- [ ] **Audit log** (qui a fait quoi)
- [ ] **Invitations** par email

**Pourquoi** : Les chaînes ont plusieurs utilisateurs. Il faut gérer les accès.

---

## PRIORISATION POUR MVP (Minimum Viable Premium)

### 🔴 CRITIQUE (Semaine 1-2)
1. Navigation + Layout
2. CRUD complet (restaurants, produits, ingrédients, stocks)
3. Import CSV robuste
4. Dashboard avec KPIs et graphiques
5. Analyse des ventes avec filtres

### 🟠 IMPORTANT (Semaine 3)
6. Page recommandations avec actions
7. Alertes améliorées
8. Prévisions visualisées

### 🟡 NICE TO HAVE (Semaine 4+)
9. Reporting automatique
10. Multi-utilisateurs
11. Intégrations

---

## MÉTRIQUES DE SUCCÈS

### Technique
- ✅ Temps de chargement < 2s
- ✅ 0 erreurs critiques
- ✅ 99.9% uptime

### Business
- ✅ Client peut importer ses données en < 10 min
- ✅ Dashboard montre ROI en < 30 secondes
- ✅ Recommandations actionnables en 1 clic

### UX
- ✅ Navigation intuitive (pas de formation nécessaire)
- ✅ Mobile responsive
- ✅ Export/Import fluide

---

## ESTIMATION TEMPS

- **Phase 1** : 5-7 jours
- **Phase 2** : 5-7 jours
- **Phase 3** : 4-5 jours
- **Phase 4** : 3-4 jours
- **Phase 5** : 4-5 jours
- **Phase 6** : 5-7 jours

**Total MVP complet** : 26-35 jours (4-5 semaines)

**MVP minimal** (Phases 1-2) : 10-14 jours (2 semaines)

---

## RECOMMANDATION

**Pour un SaaS à 5 000€/mois, je recommande :**

1. **MVP minimal** (2 semaines) : Phases 1-2
   - Navigation + CRUD + Import + Dashboard + Analyse
   - Assez pour démo et premiers clients

2. **MVP complet** (4-5 semaines) : Phases 1-5
   - Tout sauf multi-utilisateurs et intégrations
   - Prêt pour vente premium

3. **Version 1.0** (6-8 semaines) : Toutes les phases
   - Produit complet et différencié

**Stratégie** : Lancer MVP minimal rapidement, itérer avec feedback clients, compléter en parallèle.
