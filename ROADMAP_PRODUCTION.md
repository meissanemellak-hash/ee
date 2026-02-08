# 🚀 Roadmap Production - SaaS 5000€/mois

## 📊 État actuel vs Objectif

### ✅ Ce qui est fait
- Architecture solide (Next.js, Prisma, Clerk)
- Authentification multi-tenant
- Services métier (forecast, recommender, alerts)
- Pages de base (dashboard, restaurants, alertes)
- Import CSV basique
- API routes fonctionnelles

### ❌ Ce qui manque CRITIQUEMENT
- **Système de paiement/abonnement** (Stripe)
- **CRUD complet** (produits, ingrédients, recettes)
- **Dashboard premium** avec KPIs et graphiques
- **UX/UI polish** (loading states, error handling)
- **Onboarding** pour nouveaux clients
- **Performance** (React Query, pagination)
- **Documentation** utilisateur

---

## 🎯 PLAN D'ACTION PRIORISÉ (4-6 semaines)

### 🔴 PHASE 1 : FONDATIONS CRITIQUES (Semaine 1-2)
**Objectif : Rendre le produit utilisable et vendable**

#### 1.1 Système de paiement et abonnements (PRIORITÉ #1)
**Pourquoi** : Sans paiement, pas de revenus. C'est la base.

- [ ] **Intégrer Stripe**
  - [ ] Créer compte Stripe et récupérer les clés API
  - [ ] Installer `@stripe/stripe-js` et `stripe`
  - [ ] Créer modèle Prisma `Subscription` avec :
    - `organizationId`, `stripeCustomerId`, `stripeSubscriptionId`
    - `status` (active, canceled, past_due)
    - `plan` (essentiel, croissance, pro — lookup_key Stripe)
    - `currentPeriodStart`, `currentPeriodEnd`
  - [ ] Migration Prisma pour `Subscription`
  
- [ ] **Webhook Stripe** (`/api/webhooks/stripe`)
  - [ ] Gérer `customer.subscription.created`
  - [ ] Gérer `customer.subscription.updated`
  - [ ] Gérer `customer.subscription.deleted`
  - [ ] Gérer `invoice.payment_succeeded`
  - [ ] Gérer `invoice.payment_failed`
  
- [ ] **Page de pricing** (`/pricing`)
  - [ ] Afficher 3 plans (Essentiel 1500€, Croissance 3000€, Pro 5000€)
  - [ ] Bouton "Commencer" qui redirige vers Stripe Checkout
  - [ ] Design premium avec comparaison des features
  
- [ ] **Middleware de protection**
  - [ ] Vérifier que l'organisation a un abonnement actif
  - [ ] Rediriger vers `/pricing` si pas d'abonnement
  - [ ] Gérer les périodes d'essai (14 jours gratuits)
  
- [ ] **Page de gestion d'abonnement** (`/dashboard/settings/billing`)
  - [ ] Afficher le plan actuel
  - [ ] Bouton "Gérer l'abonnement" (lien Stripe Customer Portal)
  - [ ] Historique des factures
  - [ ] Date de renouvellement

**Estimation** : 3-4 jours

#### 1.2 CRUD complet Produits et Ingrédients (PRIORITÉ #2)
**Pourquoi** : Sans données, pas de valeur. Le client doit pouvoir configurer.

- [ ] **CRUD Produits** (`/dashboard/products`)
  - [ ] Liste avec recherche et filtres
  - [ ] Formulaire création/édition (nom, catégorie, prix)
  - [ ] Suppression avec confirmation
  - [ ] Import CSV en masse
  
- [ ] **CRUD Ingrédients** (`/dashboard/ingredients`)
  - [ ] Liste avec recherche
  - [ ] Formulaire création/édition (nom, unité, coût unitaire, fournisseur)
  - [ ] Gestion des packs fournisseurs (taille, prix)
  - [ ] Suppression avec vérification des recettes liées
  
- [ ] **Gestion des recettes** (`/dashboard/products/[id]/recipes`)
  - [ ] Interface pour lier produits ↔ ingrédients
  - [ ] Formulaire pour définir quantité d'ingrédient par produit
  - [ ] Visualisation de la BOM (Bill of Materials)
  - [ ] Calcul automatique du coût de revient
  
- [ ] **Gestion des stocks** (`/dashboard/restaurants/[id]/inventory`)
  - [ ] Liste des stocks par restaurant
  - [ ] Formulaire pour mettre à jour les stocks
  - [ ] Définition des seuils min/max par ingrédient
  - [ ] Historique des mouvements de stock

**Estimation** : 4-5 jours

#### 1.3 Import CSV robuste (PRIORITÉ #3)
**Pourquoi** : Point d'entrée critique. Si l'import est difficile, le client ne peut pas utiliser le produit.

- [ ] **Améliorer la page d'import** (`/dashboard/sales/import`)
  - [ ] Drag & drop amélioré avec feedback visuel
  - [ ] Prévisualisation des données avant import (tableau)
  - [ ] Mapping automatique des colonnes (détection intelligente)
  - [ ] Validation en temps réel avec messages d'erreur clairs
  - [ ] Rapport d'import détaillé (succès/erreurs ligne par ligne)
  - [ ] Gestion des doublons (option : skip ou update)
  - [ ] Import en arrière-plan pour gros fichiers (queue)
  
- [ ] **Template CSV téléchargeable**
  - [ ] Bouton "Télécharger le template"
  - [ ] Documentation du format attendu
  - [ ] Exemples de données

**Estimation** : 2-3 jours

---

### 🟠 PHASE 2 : VALEUR BUSINESS DÉMONTRABLE (Semaine 3)
**Objectif : Montrer l'impact ROI immédiatement**

#### 2.1 Dashboard premium avec KPIs (PRIORITÉ #4)
**Pourquoi** : Premier contact avec la valeur. Doit impressionner.

- [ ] **KPIs clés en haut de page**
  - [ ] Économies estimées ce mois (€)
  - [ ] Réduction du gaspillage (%)
  - [ ] Temps gagné (heures)
  - [ ] ROI estimé (économies / coût abonnement)
  - [ ] Alertes critiques non résolues
  
- [ ] **Graphiques visuels** (Recharts)
  - [ ] Évolution des ventes sur 30 jours (ligne)
  - [ ] Top 10 produits (barres horizontales)
  - [ ] Ventes par heure (heatmap ou barres)
  - [ ] Comparaison restaurants (tableau avec graphiques)
  - [ ] Évolution des économies (ligne)
  
- [ ] **Widgets d'alertes prioritaires**
  - [ ] Top 5 alertes critiques
  - [ ] Recommandations en attente
  - [ ] Actions rapides (boutons)

- [ ] **Filtres et périodes**
  - [ ] Sélecteur de période (7j, 30j, 90j, custom)
  - [ ] Filtre par restaurant
  - [ ] Export des données (CSV, PDF)

**Estimation** : 3-4 jours

#### 2.2 Analyse des ventes avancée (PRIORITÉ #5)
**Pourquoi** : Les dirigeants veulent comprendre leurs données.

- [ ] **Page d'analyse** (`/dashboard/sales/analyze`)
  - [ ] Graphiques interactifs (Recharts)
  - [ ] Filtres avancés (restaurant, produit, période)
  - [ ] Tableau détaillé avec tri et pagination
  - [ ] Comparaison périodes (mois N vs mois N-1)
  - [ ] Export CSV/PDF
  - [ ] Drill-down (cliquer sur un graphique pour voir les détails)

**Estimation** : 2-3 jours

#### 2.3 Page recommandations premium (PRIORITÉ #6)
**Pourquoi** : C'est la valeur principale du produit.

- [ ] **Améliorer la page recommandations** (`/dashboard/recommendations`)
  - [ ] Actions rapides (accepter, rejeter, modifier)
  - [ ] Filtres (restaurant, type, statut)
  - [ ] Visualisation des détails (ingrédients, quantités, packs)
  - [ ] Calcul des économies par recommandation
  - [ ] Export vers Excel/PDF pour commandes
  - [ ] Historique des recommandations acceptées/rejetées

**Estimation** : 2-3 jours

---

### 🟡 PHASE 3 : POLISH ET PERFORMANCE (Semaine 4)
**Objectif : Expérience premium sans friction**

#### 3.1 Performance et fiabilité
- [ ] **React Query** pour cache et optimisations
  - [ ] Installer `@tanstack/react-query`
  - [ ] Configurer le provider
  - [ ] Migrer toutes les requêtes API vers React Query
  - [ ] Cache intelligent avec invalidation
  
- [ ] **Loading states** partout
  - [ ] Skeletons pour les listes
  - [ ] Spinners pour les actions
  - [ ] Progress bars pour les imports
  
- [ ] **Error boundaries** avec messages clairs
  - [ ] Composant ErrorBoundary global
  - [ ] Messages d'erreur user-friendly
  - [ ] Retry automatique pour erreurs réseau
  
- [ ] **Optimisation requêtes Prisma**
  - [ ] Pagination sur toutes les listes (take/skip)
  - [ ] Select uniquement les champs nécessaires
  - [ ] Indexes sur les colonnes fréquemment queryées
  - [ ] Lazy loading pour les relations

**Estimation** : 3-4 jours

#### 3.2 UX/UI Polish
- [x] **Onboarding** pour nouveaux clients ✅ (en place)
  - [x] Wizard 3 étapes (Bienvenue → Découvrir → Prêt) + redirection si non complété
  - [ ] Optionnel plus tard : créer premier restaurant / produit dans le wizard
  - [ ] Tooltips et help text
  - [ ] Skip optionnel (actuellement obligatoire pour accéder au dashboard)
  
- [ ] **Tooltips et help text** partout
  - [ ] Icônes d'aide sur les KPIs
  - [ ] Explications des calculs
  - [ ] Liens vers la documentation
  
- [ ] **Messages de succès/erreur** clairs
  - [ ] Toasts avec actions (undo, retry)
  - [ ] Confirmations pour actions destructives
  - [ ] Messages contextuels
  
- [ ] **Responsive mobile/tablette**
  - [ ] Tester toutes les pages sur mobile
  - [ ] Navigation mobile optimisée
  - [ ] Tableaux scrollables horizontalement

**Estimation** : 3-4 jours

---

### 🟢 PHASE 4 : FONCTIONNALITÉS PREMIUM (Semaine 5-6)
**Objectif : Différenciation et valeur ajoutée**

#### 4.1 Reporting automatique
- [ ] **Rapports automatiques** (hebdo/mensuel par email)
  - [ ] Créer modèle Prisma `Report`
  - [ ] Job cron (Vercel Cron ou external service)
  - [ ] Génération PDF avec branding
  - [ ] Envoi par email (Resend)
  
- [ ] **Rapports personnalisables**
  - [ ] Choix des KPIs à inclure
  - [ ] Choix de la période
  - [ ] Choix des restaurants
  - [ ] Export PDF avec logo client

**Estimation** : 3-4 jours

#### 4.2 Multi-utilisateurs et permissions
- [ ] **Rôles** (Admin, Manager, Viewer)
  - [ ] Modèle Prisma `UserRole` (via Clerk)
  - [ ] Middleware de vérification des permissions
  - [ ] UI adaptée selon le rôle
  
- [ ] **Permissions par restaurant**
  - [ ] Un manager peut voir seulement ses restaurants
  - [ ] Un viewer peut voir mais pas modifier
  
- [ ] **Invitations** par email
  - [ ] Formulaire d'invitation
  - [ ] Email avec lien d'invitation (Resend)
  - [ ] Acceptation de l'invitation

**Estimation** : 4-5 jours

#### 4.3 Documentation et support
- [ ] **Documentation utilisateur**
  - [ ] Guide de démarrage rapide
  - [ ] Guide d'import CSV
  - [ ] Guide de configuration (produits, ingrédients, recettes)
  - [ ] FAQ
  - [ ] Vidéos tutoriels (optionnel)
  
- [ ] **Page de support**
  - [ ] Formulaire de contact
  - [ ] Chat support (optionnel : Crisp, Intercom)
  - [ ] Liens vers documentation

**Estimation** : 2-3 jours

---

## 📋 CHECKLIST DE PRODUCTION

### Avant le lancement
- [ ] **Tests**
  - [ ] Tests manuels sur toutes les fonctionnalités
  - [ ] Tests de charge (simuler 10+ utilisateurs)
  - [ ] Tests de sécurité (auth, permissions)
  
- [ ] **Monitoring**
  - [ ] Configurer Sentry pour les erreurs
  - [ ] Configurer Vercel Analytics
  - [ ] Dashboard de monitoring (uptime, performance)
  
- [ ] **Backup et récupération**
  - [ ] Backup automatique de la base de données (Supabase)
  - [ ] Plan de récupération en cas de problème
  - [ ] Documentation des procédures
  
- [ ] **Legal**
  - [ ] CGV/CGU
  - [ ] Politique de confidentialité
  - [ ] Mentions légales
  
- [ ] **Marketing**
  - [ ] Landing page professionnelle
  - [ ] Page de pricing claire
  - [ ] Cas d'usage et témoignages (si disponibles)
  - [ ] SEO de base

---

## 🎯 PRIORISATION FINALE

### MVP Minimal (2 semaines) - VENDABLE
1. ✅ Stripe + Abonnements
2. ✅ CRUD Produits/Ingrédients/Recettes
3. ✅ Import CSV robuste
4. ✅ Dashboard avec KPIs et graphiques
5. ✅ Performance de base (React Query, loading states)

### MVP Complet (4 semaines) - PREMIUM
1. ✅ Tout le MVP minimal
2. ✅ Analyse des ventes avancée
3. ✅ Recommandations premium
4. ✅ Onboarding
5. ✅ UX/UI polish

### Version 1.0 (6 semaines) - ENTERPRISE
1. ✅ Tout le MVP complet
2. ✅ Reporting automatique
3. ✅ Multi-utilisateurs et permissions
4. ✅ Documentation complète
5. ✅ Monitoring et support

---

## 💰 ESTIMATION COÛTS MENSUELS

- **Vercel Pro** : 20€/mois (ou gratuit si < 100GB bandwidth)
- **Supabase Pro** : 25€/mois (ou gratuit si < 500MB database)
- **Clerk Pro** : 25€/mois (ou gratuit si < 10k MAU)
- **Stripe** : 0€ (frais de transaction uniquement : 1.4% + 0.25€)
- **Resend** : 20€/mois (ou gratuit si < 3k emails)
- **Sentry** : 26€/mois (ou gratuit si < 5k events)

**Total** : ~116€/mois (ou gratuit si dans les limites free tiers)

---

## 🚀 STRATÉGIE DE LANCEMENT

### Semaine 1-2 : MVP Minimal
- Focus sur Stripe + CRUD + Dashboard
- Test avec 1-2 clients beta (gratuit ou réduit)

### Semaine 3-4 : MVP Complet
- Ajouter les fonctionnalités premium
- Itérer avec feedback des clients beta

### Semaine 5-6 : Version 1.0
- Finaliser les fonctionnalités avancées (plan Pro)
- Lancer officiellement avec pricing public

---

## 📞 PROCHAINES ACTIONS IMMÉDIATES

1. **Aujourd'hui** : Créer compte Stripe et commencer l'intégration
2. **Cette semaine** : CRUD Produits/Ingrédients
3. **Semaine prochaine** : Dashboard premium avec KPIs
4. **Dans 2 semaines** : MVP minimal prêt pour beta test

---

**Note** : Cette roadmap est ambitieuse mais réaliste. Priorisez selon vos ressources et votre timeline. L'important est d'avoir un MVP minimal vendable rapidement, puis d'itérer avec les feedbacks clients.
