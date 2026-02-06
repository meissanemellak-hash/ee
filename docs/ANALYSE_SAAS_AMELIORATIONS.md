# Analyse du SaaS – Améliorations possibles (dev)

Analyse effectuée sans reprendre ce qui est déjà en place (onboarding supprimé, setup supprimé, paramètres/scroll/rôles, mails Clerk/Resend, etc.).

---

## 1. Erreurs et cas limites

### 1.1 Ingrédient introuvable (404)
- **Page concernée :** `app/(dashboard)/dashboard/ingredients/[id]/page.tsx`
- **Problème :** Quand l’API renvoie 404 (id invalide ou ingrédient supprimé), la page affiche un **skeleton indéfiniment** au lieu d’un message « Ingrédient introuvable » avec lien retour.
- **Cause :** La condition `if (isLoading || !ingredient)` renvoie le skeleton dès que `!ingredient`, sans distinguer « encore en chargement » de « chargement terminé, pas de donnée ».
- **Recommandation :** Afficher une carte « Ingrédient introuvable » avec bouton « Retour aux ingrédients » lorsque `!isLoading && !ingredient` (et optionnellement `isError`).

### 1.2 Page 404 globale
- **Constat :** Aucun fichier `not-found.tsx` à la racine de `app/`. Une URL dashboard invalide (ex. `/dashboard/xyz`) affiche la page 404 par défaut de Next.js (anglais, style brut).
- **Recommandation :** Ajouter `app/not-found.tsx` avec un message en français et un lien vers le dashboard, style aligné sur le reste de l’app.

### 1.3 Erreur globale (global-error)
- **Fichier :** `app/global-error.tsx`
- **Constat :** Page très basique (styles inline, pas de composants UI). Pas de lien vers le dashboard ni de bouton teal.
- **Recommandation :** Garder la page simple (obligatoire pour global-error car elle remplace le layout), mais ajouter un lien « Retour à l’accueil » ou « Réessayer » pour une meilleure UX.

---

## 2. Visuel et cohérence

### 2.1 Ce qui est déjà cohérent
- Empty states sur les listes (restaurants, produits, ingrédients, ventes, alertes, prévisions, recommandations) avec icône teal, message et CTA.
- Pages détail/édition (restaurant, produit, inventaire) : message « introuvable » avec carte rouge et bouton teal.
- Dashboard error boundary : carte rouge, bouton Réessayer, Sentry.
- Breadcrumbs, boutons principaux en teal (`bg-teal-600`), cartes `rounded-xl`.

### 2.2 À améliorer (optionnel)
- **Rapports :** La page rapports affiche le formulaire de génération et les résultats. Si aucun rapport n’a encore été généré, un court message du type « Générez votre premier rapport ci-dessus » pourrait figurer sous le formulaire (au lieu de rien ou d’une zone vide). À vérifier selon le rendu actuel.
- **Global-error :** Visuellement très sobre ; acceptable pour une erreur critique, mais un lien clair aide l’utilisateur.

---

## 3. Fonctionnalités

- Aucun TODO/FIXME repéré dans le code.
- Mutations (create/update/delete) : toasts d’erreur utilisés (hooks react-query avec `onError`).
- Les APIs renvoient des erreurs structurées (400, 404, 500) ; les hooks propagent le message au toast.

---

## 4. Accessibilité et responsive

- Plusieurs pages ont des `aria-label` ou `role` (tableaux, sections, boutons).
- Menu mobile présent (`MobileSidebar`) pour les petits écrans.
- Pas d’audit a11y complet ; les usages repérés sont corrects.

---

## 5. Synthèse des actions recommandées

| Priorité | Action |
|----------|--------|
| **Haute** | Corriger la page ingrédient `[id]` : afficher « Ingrédient introuvable » au lieu du skeleton quand `!isLoading && !ingredient`. |
| **Moyenne** | Ajouter `app/not-found.tsx` (404 en français, lien dashboard, style app). |
| **Basse** | Améliorer `global-error.tsx` (lien accueil / réessayer, sans casser le layout). |

Le reste (empty states, gestion erreur sur les autres détails, toasts) est déjà en place. Aucune modification proposée qui casserait le code existant.
