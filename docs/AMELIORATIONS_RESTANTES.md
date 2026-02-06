# Améliorations restantes

Synthèse des améliorations encore à mettre en place (code, config, doc). Rien n’est bloquant pour livrer ; le SaaS est utilisable en l’état.

---

## 1. Avant la mise en production (config / hébergeur)

À faire **avant** le premier déploiement. Détails dans **CHECKLIST_AVANT_PRODUCTION.md**.

| Élément | Où |
|--------|-----|
| Nom de domaine + config hébergeur | Checklist |
| Mails Clerk : From / Reply-to sur ton domaine | Clerk Dashboard |
| Compte verrouillé : Resend en prod (webhook Clerk + `EMAIL_FROM`) | Une fois l’URL de prod disponible |
| Webhook Stripe en prod (Live) + `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard + variables d’env |
| Clerk : redirection après invitation → `/dashboard` | Clerk → Paths / Redirect URLs |
| Sentry : variables sur l’hébergeur | Vercel / hébergeur |
| Backups DB : vérifier / lancer `npm run db:verif-backups` | Voir GUIDE_VERIF_BACKUPS.md |

---

## 2. Code – optionnel (amélioration qualité / prod)

### 2.1 Console.log dans les API (recommandé avant ou après prod)

- **Constat :** Beaucoup de `console.log` dans les routes API (products, ingredients, sales, organizations/update, alerts, forecasts, recommendations, etc.).
- **Recommandation :** Les conditionner (ex. `if (process.env.NODE_ENV === 'development')`) ou les remplacer par un logger (actif seulement en dev ou si `DEBUG_API=1`) pour limiter le bruit et les infos sensibles en logs en production.
- **Priorité :** Moyenne. Pas bloquant.

### 2.2 Page d’erreur globale (global-error.tsx)

- **Constat :** La page affiche « Une erreur est survenue », un message et un bouton « Recharger la page ». Pas de lien « Retour à l’accueil ».
- **Recommandation :** Ajouter un lien vers `/` (accueil) en plus du bouton Recharger. Attention : `global-error` remplace tout le layout (y compris les composants UI) ; garder des styles inline ou très simples.
- **Priorité :** Basse. Optionnel.

---

## 3. Documentation / Aide utilisateur

- Créer un espace doc (ex. Notion) avec les articles essentiels.
- Publier en lien public.
- Ajouter dans l’app un lien « Aide » ou « Documentation » (header ou paramètres) pointant vers cette doc.

---

## 4. Optionnel (plus tard)

- **Clerk – Page « compléter le profil » en français** : redirection vers une page custom (ex. `/accept-invitation`) avec formulaire en français.
- **CI/CD** : s’assurer que le workflow GitHub Actions passe.
- **Tests E2E rôle employé** : automatisation en CI avec secrets (voir GUIDE_AUTOMATISATION_EMPLOYE_SIMPLE.md).
- **Revue accessibilité** : formulaires, modales, onglets (a11y ciblée).

---

## 5. Déjà en place (pour mémoire)

- Page 404 en français avec liens « Tableau de bord » et « Accueil ».
- Rapports : lien « Aucune organisation active » → `/dashboard`.
- Page détail ingrédient : carte « Ingrédient introuvable » quand `!isLoading && !ingredient`.
- Empty states sur les listes (produits, ingrédients, alertes, ventes, etc.).
- Validation API (Zod), permissions, redirections onboarding/setup et pricing.

---

En résumé : **aucune amélioration obligatoire restante dans le code** pour livrer. Les points ci-dessus sont des renforcements (logs, UX erreur globale) et de la config / doc avant prod.
