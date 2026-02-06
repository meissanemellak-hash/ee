# Analyse SaaS – Améliorations dev (visuel, erreurs, fonctionnalités)

Analyse effectuée sans modifier les éléments déjà mis en place (onboarding, setup, paramètres, scroll, mails Clerk/Resend, etc.).

---

## 1. Visuel

### 1.1 Page d’erreur globale (`app/global-error.tsx`)
- **Constat** : Style inline basique (padding, font, bouton sans composant UI). Pas aligné avec le reste de l’app (Card, teal, design system).
- **Recommandation** : Réutiliser le même pattern que `dashboard/error.tsx` (Card, icône, message, bouton « Recharger ») ou au minimum appliquer des classes Tailwind / variables CSS pour rester cohérent. Attention : `global-error` remplace tout le layout (y compris le root), donc pas d’import de composants qui dépendent du layout (utiliser des styles inline ou un mini CSS).

### 1.2 Cohérence mobile
- Sidebar desktop et menu mobile sont cohérents (même liste de liens, même rôles). Rien à signaler.

### 1.3 Breadcrumbs
- Présents sur les pages principales (rapports, paramètres, etc.). Rien à signaler.

---

## 2. Erreurs et feedback utilisateur

### 2.1 Facturation – « Gérer l’abonnement » (`billing-client-section.tsx`)
- **Constat** : En cas d’erreur (API ou pas d’URL), le code utilise `alert()`. Peu cohérent avec le reste de l’app qui utilise des toasts.
- **Recommandation** : Remplacer `alert(...)` par `toast({ title: 'Erreur', description: ..., variant: 'destructive' })` et utiliser le hook `useToast()` déjà présent ailleurs.

### 2.2 Pages avec erreur API (Sales, Products, Restaurants, etc.)
- **Constat** : Les pages listent correctement `isError` et affichent un message + bouton « Réessayer » ou équivalent. Comportement correct.

### 2.3 Rapports
- Le hook `useGenerateReport` a un `onError` qui affiche un toast. La page désactive le bouton avec `generateReport.isPending` et affiche « Génération en cours... ». Rien à signaler.

### 2.4 Error boundary dashboard
- `app/(dashboard)/dashboard/error.tsx` : message clair, bouton Réessayer, envoi à Sentry. Correct.

---

## 3. Fonctionnalités et UX

### 3.1 Lien « Retour » quand aucune organisation (page Rapports)
- **Constat** : Quand `!organization?.id`, la page affiche « Aucune organisation active » et un bouton « Retour aux rapports » qui pointe vers `/dashboard/reports`. L’utilisateur reste sur la même page.
- **Recommandation** : Changer le libellé en « Retour au dashboard » et le lien en `href="/dashboard"`.

### 3.2 Rapports sans restaurants
- Si l’organisation n’a aucun restaurant, le select « Restaurant » ne contient que « Tous les restaurants ». La génération peut quand même être lancée. Comportement acceptable ; optionnel : afficher un message du type « Ajoutez au moins un restaurant pour générer des rapports » et désactiver le bouton si `restaurants.length === 0` pour les types de rapport qui en ont besoin.

### 3.3 États vides
- Les listes (ventes, produits, restaurants, ingrédients, alertes, recommandations, prévisions) ont des états vides dédiés (« Aucun restaurant pour l’instant », « Aucune vente trouvée », etc.). Rien à signaler.

### 3.4 Loading / skeletons
- Les pages critiques ont des skeletons ou un état de chargement (dashboard, paramètres, listes, formulaires, inventaire, etc.). Rien à signaler.

---

## 4. Sécurité et robustesse

- Les routes API utilisent `auth()` et souvent `getCurrentOrganization()` ou vérification d’org. Pas d’audit exhaustif ici ; à garder en tête pour une revue dédiée.
- Pas de `not-found.tsx` dans le dashboard : les pages dynamiques (ex. détail restaurant avec id invalide) gèrent le cas « introuvable » en rendu (message + lien retour). Suffisant.

---

## 5. Synthèse des actions recommandées

| Priorité | Élément | Action | Statut |
|----------|--------|--------|--------|
| Haute | Billing – erreur | Remplacer `alert()` par un toast dans `BillingClientSection`. | ✅ Fait |
| Haute | Rapports – lien sans org | Bouton « Retour aux rapports » → « Retour au dashboard » avec `href="/dashboard"`. | ✅ Fait |
| Moyenne | global-error | Améliorer le style (aligné app) si tu veux une erreur globale plus soignée ; optionnel. | ✅ Fait |
| Basse | Rapports sans restaurants | Message + désactivation du bouton si 0 restaurant ; optionnel. | ✅ Fait |

---

## 6. Analyse 2 (accessibilité, cohérence)

Nouvelle passe : accessibilité clavier/lecteurs d’écran, cohérence des feedbacks, bonnes pratiques.

### 6.1 Accessibilité

- **Lien « Passer au contenu principal »** : Absence d’un lien d’évitement en tête du dashboard pour permettre aux utilisateurs au clavier de sauter la navigation. **Recommandation** : Ajouter un lien masqué (sr-only) visible au focus, pointant vers `#main-content`, et donner un `id="main-content"` + `tabIndex={-1}` au `<main>`. ✅ Fait.
- **Champ de recherche (header)** : Le champ n’avait pas d’`aria-label`, ce qui pénalise les lecteurs d’écran. **Recommandation** : Ajouter `aria-label="Rechercher dans l'application"` (ou équivalent). ✅ Fait.
- **Liens target="_blank"** : La page démo/merci utilise `rel="noopener noreferrer"`. Rien à signaler.

### 6.2 Formulaires et mutations

- Les formulaires (création / édition produit, vente, restaurant, ingrédient, etc.) désactivent bien les boutons avec `isPending` et affichent un état de chargement. Les hooks de mutation ont un `onError` avec toast. Rien à signaler.

### 6.3 Performance et structure

- Pagination déjà en place sur les listes (API restaurants, sales, products). Pas de virtualisation des longues listes pour l’instant ; à envisager si les listes dépassent plusieurs centaines d’éléments (voir ROADMAP).

### 6.4 Synthèse Analyse 2

| Priorité | Élément | Action | Statut |
|----------|--------|--------|--------|
| Moyenne | Skip to content | Lien « Passer au contenu principal » + id main + tabIndex sur main. | ✅ Fait |
| Moyenne | Recherche header | aria-label sur le champ de recherche. | ✅ Fait |

---

## 7. Dernière passe (analyse complète)

Sans répéter ce qui est déjà en place (onboarding/setup supprimés, paramètres, scroll, mails Clerk, etc.) :

| Élément | Action | Statut |
|--------|--------|--------|
| Page ingrédient `[id]` (404) | Afficher « Ingrédient introuvable » + lien retour au lieu du skeleton quand l’API renvoie 404. | ✅ Fait |
| Menu mobile (accessibilité) | `aria-label` et `aria-expanded` sur le bouton menu, `aria-label` sur le bouton fermer du tiroir. Titre du tiroir en `h2` pour hiérarchie. | ✅ Fait |

Aucune autre anomalie bloquante repérée. Les mutations ont un `onError` avec toast, les listes ont des états vides et des états d’erreur avec « Réessayer », la page 404 globale existe en français, l’error boundary dashboard envoie à Sentry.

---

*Document généré pour servir de base aux améliorations sans casser le code existant. Toutes les actions des sections 5, 6 et 7 ont été implémentées.*
