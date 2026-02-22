# Variables d'environnement Production (Vercel)

À définir dans **Vercel** → ton projet → **Settings** → **Environment Variables**, pour l'environnement **Production** (et **Preview** si tu veux que les déploiements de preview marchent aussi).

---

## Obligatoires

| Variable | Description | Valeur en prod |
|----------|-------------|----------------|
| **DATABASE_URL** | Connexion PostgreSQL (Supabase) | Même valeur que en local, ou une DB dédiée prod |
| **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY** | Clé publique Clerk | Garde `pk_test_...` en test ; passe à `pk_live_...` quand tu actives la prod Clerk |
| **CLERK_SECRET_KEY** | Clé secrète Clerk | Garde `sk_test_...` en test ; passe à `sk_live_...` en prod Clerk |
| **CLERK_WEBHOOK_SECRET** | Signature des webhooks Clerk | Crée un endpoint dans Clerk pointant vers `https://ia-restaurant-manager.com/api/webhooks/clerk` et colle le **Signing secret** (whsec_...) |
| **NEXT_PUBLIC_APP_URL** | URL de l'app | **`https://ia-restaurant-manager.com`** (obligatoire en prod) |
| **RESEND_API_KEY** | Envoi d'emails (Resend) | Même clé que en local (re_...) |
| **STRIPE_SECRET_KEY** | Stripe (paiements) | `sk_test_...` en test ; `sk_live_...` quand tu passes en mode live |
| **STRIPE_WEBHOOK_SECRET** | Webhook Stripe | Crée un endpoint dans Stripe pour `https://ia-restaurant-manager.com/api/webhooks/stripe` et colle le secret (whsec_...) |
| **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** | Clé publique Stripe | `pk_test_...` en test ; `pk_live_...` en live |
| **STRIPE_PRICE_STARTER** | ID prix Stripe Starter | Même qu'en local (price_...) ; en live, utilise les ID des prix live |
| **STRIPE_PRICE_GROWTH** | ID prix Stripe Growth | Idem |
| **STRIPE_PRICE_PRO** | ID prix Stripe Pro | Idem |
| **SUPER_ADMIN_EMAIL** | Email du super-admin (accès /dashboard/admin/lien-paiement) | Ton email (ex. meissane.mellak@gmail.com) |
| **CRON_SECRET** | Sécurise les crons (alertes + recommandations) | Même valeur forte qu'en local, ou génère une nouvelle : `openssl rand -hex 32` |

---

## Recommandées (Sentry)

| Variable | Description |
|----------|-------------|
| **NEXT_PUBLIC_SENTRY_DSN** | DSN Sentry (erreurs front) |
| **SENTRY_ORG** | Slug org Sentry |
| **SENTRY_PROJECT** | Slug projet Sentry |
| **SENTRY_AUTH_TOKEN** | Token pour upload des source maps (build) |

Sans elles, le build peut ignorer Sentry ; les erreurs en prod ne seront pas envoyées à Sentry.

---

## Optionnelles (recommandées pour l’invitation)

| Variable | Description |
|----------|-------------|
| **NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL** | Redirection après connexion (et après acceptation d’invitation) → `/dashboard` |
| **NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL** | Redirection après inscription (et après acceptation d’invitation) → `/dashboard` |
| **NEXT_PUBLIC_APP_NAME** | Nom de l'app (ex. "IA Restaurant Manager") — a une valeur par défaut dans le code |
| **EMAIL_FROM** | Adresse d'envoi des emails (ex. `noreply@ia-restaurant-manager.com`) — à définir quand ton domaine est vérifié dans Resend |
| **SENTRY_TEST_SECRET** | Secret pour appeler `/api/test-sentry` et envoyer un événement de test à Sentry (voir [SENTRY_PRODUCTION.md](./SENTRY_PRODUCTION.md)) | `openssl rand -hex 16` |

---

## À ne pas mettre en Production sur Vercel

- **PG_DUMP_PATH** : utilisé uniquement pour les backups en local, pas sur Vercel.
- **STAFF_EMAIL** / **STAFF_PASSWORD** : uniquement pour les tests E2E (Playwright), pas nécessaires en prod.

---

## Résumé rapide

1. **Obligatoire à changer** par rapport au local : **NEXT_PUBLIC_APP_URL** = `https://ia-restaurant-manager.com`.
2. **Webhooks** : recréer les endpoints Clerk et Stripe pour l’URL de prod et mettre à jour **CLERK_WEBHOOK_SECRET** et **STRIPE_WEBHOOK_SECRET**.
3. **Clerk / Stripe** : tu peux garder les clés **test** au début ; quand tu veux passer en réel, bascule sur les clés **live** et les **price ID** live.
4. Après avoir ajouté ou modifié des variables, faire un **Redeploy** du projet pour que les nouvelles valeurs soient prises en compte.
