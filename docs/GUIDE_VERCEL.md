# Guide Vercel – Déploiement et configuration

Guide pas à pas pour déployer **IA Restaurant Manager** sur Vercel et configurer la production (domaine, variables d’environnement).

---

## 1. Connexion du projet à Vercel

1. Va sur [vercel.com](https://vercel.com) et connecte-toi (ou crée un compte).
2. Clique sur **Add New** → **Project**.
3. **Import** : connecte ton dépôt Git (GitHub, GitLab ou Bitbucket) si ce n’est pas déjà fait, puis sélectionne le dépôt du projet **IA Restaurant Manager**.
4. **Configure** :
   - **Framework Preset** : Next.js (détecté automatiquement).
   - **Root Directory** : laisser vide si le projet est à la racine du dépôt.
   - **Build Command** : laisser par défaut (`next build`).
   - **Output Directory** : laisser par défaut.
5. Clique sur **Deploy**. Un premier déploiement se lance (il peut échouer tant que les variables d’environnement ne sont pas définies, c’est normal).

---

## 2. Domaine (ia-restaurant-manager.com)

1. Dans le **tableau de bord Vercel**, ouvre ton projet.
2. Va dans **Settings** → **Domains**.
3. Clique sur **Add** et saisis **ia-restaurant-manager.com** (et éventuellement **www.ia-restaurant-manager.com**).
4. Vercel affiche les enregistrements DNS à configurer chez ton hébergeur de domaine (ex. Cloudflare) :
   - En général : un enregistrement **A** pointant vers l’IP Vercel, ou un **CNAME** vers `cname.vercel-dns.com`.
5. Ajoute ces enregistrements dans ton fournisseur DNS, puis dans Vercel clique sur **Refresh** ou **Verify** jusqu’à ce que le domaine soit vérifié.

Une fois le domaine actif, l’URL de prod sera **https://ia-restaurant-manager.com**.

---

## 3. Variables d’environnement (Production)

1. Dans ton projet Vercel : **Settings** → **Environment Variables**.
2. Pour chaque variable ci-dessous :
   - **Key** = nom de la variable.
   - **Value** = valeur (comme en local, sauf **NEXT_PUBLIC_APP_URL** et les webhooks prod).
   - Coche **Production** (et **Preview** si tu veux que les déploiements de branche fonctionnent aussi).
   - Clique sur **Save**.

### 3.1 Obligatoires

| Variable | Valeur (Production) |
|----------|----------------------|
| `DATABASE_URL` | Même URL PostgreSQL que en local (Supabase) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` (test) ou `pk_live_...` (prod Clerk) |
| `CLERK_SECRET_KEY` | `sk_test_...` (test) ou `sk_live_...` (prod Clerk) |
| `CLERK_WEBHOOK_SECRET` | Secret du webhook Clerk **prod** (endpoint `https://ia-restaurant-manager.com/api/webhooks/clerk`) |
| **`NEXT_PUBLIC_APP_URL`** | **`https://ia-restaurant-manager.com`** ← à ne pas oublier |
| `RESEND_API_KEY` | Ta clé Resend (re_...) |
| `STRIPE_SECRET_KEY` | `sk_test_...` (test) ou `sk_live_...` (prod) |
| `STRIPE_WEBHOOK_SECRET` | Secret du webhook Stripe **prod** (endpoint `https://ia-restaurant-manager.com/api/webhooks/stripe`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` ou `pk_live_...` |
| `STRIPE_PRICE_STARTER` | ID du prix Starter (price_...) |
| `STRIPE_PRICE_GROWTH` | ID du prix Growth |
| `STRIPE_PRICE_PRO` | ID du prix Pro |
| `SUPER_ADMIN_EMAIL` | Ton email (ex. meissane.mellak@gmail.com) |
| `CRON_SECRET` | Valeur générée (ex. `openssl rand -hex 32`) |

### 3.2 Recommandées (Sentry)

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_SENTRY_DSN` | Ton DSN Sentry |
| `SENTRY_ORG` | Slug de ton org Sentry |
| `SENTRY_PROJECT` | Slug du projet (ex. ai-restaurant-manager) |
| `SENTRY_AUTH_TOKEN` | Token Sentry (upload des source maps) |

### 3.3 Optionnelles (recommandées)

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/demo` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` | `/dashboard` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` | `/dashboard` |
| `NEXT_PUBLIC_APP_NAME` | `IA Restaurant Manager` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `support@ia-restaurant-manager.com` |
| `NEXT_PUBLIC_CALENDLY_URL` | URL de ton événement Calendly (ex. `https://calendly.com/ton-username/demo`) |
| `EMAIL_FROM` | `noreply@ia-restaurant-manager.com` (si domaine vérifié dans Resend) |

### 3.4 À ne pas mettre sur Vercel

- `PG_DUMP_PATH` (backups locaux uniquement)
- `STAFF_EMAIL` / `STAFF_PASSWORD` (tests E2E uniquement)

---

## 4. Webhooks en production

Une fois le domaine et les variables en place :

### Clerk

1. **Clerk Dashboard** → **Webhooks** → **Add Endpoint**.
2. **Endpoint URL** : `https://ia-restaurant-manager.com/api/webhooks/clerk`.
3. Abonne-toi aux événements nécessaires (ex. `user.created`, `organizationInvitation.*`, `email` pour le mail « Compte verrouillé », etc.).
4. Copie le **Signing secret** (whsec_...) et mets-le dans la variable **CLERK_WEBHOOK_SECRET** sur Vercel (Production).

### Stripe

1. **Stripe Dashboard** (mode Live pour la prod) → **Developers** → **Webhooks** → **Add endpoint**.
2. **Endpoint URL** : `https://ia-restaurant-manager.com/api/webhooks/stripe`.
3. Sélectionne les événements (ex. `customer.subscription.*`, `invoice.payment_*`, etc.).
4. Copie le **Signing secret** et mets-le dans **STRIPE_WEBHOOK_SECRET** sur Vercel (Production).

---

## 5. Redéploiement

Après avoir ajouté ou modifié des variables :

1. Va dans **Deployments**.
2. Clique sur les **⋯** du dernier déploiement → **Redeploy** (ou déclenche un nouveau déploiement via un push Git).

Les variables d’environnement sont prises en compte au moment du build ; un simple **Redeploy** suffit pour les appliquer.

---

## 6. Vérifications rapides

- [ ] Le site s’affiche sur **https://ia-restaurant-manager.com**.
- [ ] Connexion / inscription (Clerk) fonctionnent.
- [ ] La page **Contact** affiche **support@ia-restaurant-manager.com**.
- [ ] Les webhooks Clerk et Stripe sont en succès (Clerk Dashboard / Stripe Dashboard).
- [ ] Les crons (alertes, recommandations) ont **CRON_SECRET** défini et ne renvoient plus 503.

Liste détaillée : [CHECKLIST_AVANT_PRODUCTION.md](../CHECKLIST_AVANT_PRODUCTION.md).  
Référence des variables : [VARIABLES_PRODUCTION_VERCEL.md](./VARIABLES_PRODUCTION_VERCEL.md).
