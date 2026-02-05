# Configuration Stripe (paiements et abonnements)

L’app intègre déjà Stripe (modèle `Subscription`, webhook, page Tarifs, Facturation). Pour l’activer, suivez ces étapes.

---

## 1. Compte Stripe

1. Créez un compte sur [stripe.com](https://stripe.com) (mode test pour le dev).
2. Récupérez les clés : **Developers → API keys**.
   - **Secret key** (sk_test_…) → `STRIPE_SECRET_KEY`
   - La clé publique (pk_test_…) n’est pas utilisée côté serveur pour l’instant (Checkout géré côté serveur).

---

## 2. Produits et prix (Dashboard Stripe)

1. **Products** → **Add product** pour chaque plan (Starter, Pro, Enterprise).
2. Pour chaque produit, ajoutez un **prix récurrent mensuel** (Recurring, Monthly).
3. Dans le prix, renseignez le **Lookup key** (obligatoire pour que le webhook reconnaisse le plan) :
   - `starter` pour le plan Starter
   - `pro` pour le plan Pro
   - `enterprise` pour le plan Enterprise
4. Copiez l’**ID du prix** (price_xxx) pour chaque plan.

---

## 3. Variables d’environnement

Dans `.env.local` (et sur votre hébergeur en production), ajoutez :

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
STRIPE_PRICE_STARTER=price_xxxxxxxxxxxxxxxx
STRIPE_PRICE_PRO=price_xxxxxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxxxxxxxxxxxxx

# Admin : email du super-admin (accès à /dashboard/admin/lien-paiement pour générer les liens de paiement)
SUPER_ADMIN_EMAIL=ton@email.com
```

- **STRIPE_SECRET_KEY** : clé secrète Stripe (Developers → API keys).
- **STRIPE_WEBHOOK_SECRET** : obtenu à l’étape 4 (webhook).
- **STRIPE_PRICE_*** : IDs des prix créés à l’étape 2 (Starter, Pro, Enterprise).
- **SUPER_ADMIN_EMAIL** : email de l’administrateur qui peut générer les liens de paiement (page back-office).

Sans ces variables, l’app fonctionne mais le webhook et la génération de liens admin ne seront pas actifs.

---

## 4. Webhook Stripe

1. **Developers** → **Webhooks** → **Add endpoint**.
2. **URL** : `https://votredomaine.com/api/webhooks/stripe` (en local vous pouvez utiliser [Stripe CLI](https://stripe.com/docs/stripe-cli) pour tunneler).
3. **Events to send** : cochez au minimum :
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Après création, révélez le **Signing secret** (whsec_…) et mettez-le dans `STRIPE_WEBHOOK_SECRET`.

---

## 5. Base de données

Le modèle Prisma `Subscription` est déjà dans le schéma. Si la table n’existe pas encore :

```bash
npx prisma db push
```

---

## Comportement de l’app (nouveau processus)

- **Flux client** : après la visio, l’admin crée l’organisation et envoie l’invitation Clerk. Il génère un lien de paiement (Plan Pro) depuis **/dashboard/admin/lien-paiement** et l’envoie au client. Le client paie sur Stripe ; le webhook crée l’abonnement pour cette organisation. Le client accepte l’invitation et accède au dashboard.
- **Page Admin** (`/dashboard/admin/lien-paiement`) : réservée au super-admin (email dans `SUPER_ADMIN_EMAIL`). Liste des organisations et bouton « Générer le lien Plan Pro » par organisation. L’URL générée est à copier et envoyer au client.
- **Page Facturation** (`/dashboard/settings/billing`) : plan actuel, renouvellement, bouton « Gérer l’abonnement » (Stripe Customer Portal). Sans abonnement : message invitant à demander un lien de souscription à l’administrateur.
- **Route /pricing** : redirige vers l’accueil (ancienne page Tarifs retirée).

---

## Résumé des fichiers concernés

| Élément | Fichier / route |
|--------|------------------|
| Config Stripe | `lib/stripe.ts` |
| Webhook | `app/api/webhooks/stripe/route.ts` |
| Création session Checkout (utilisateur courant) | `app/api/stripe/create-checkout-session/route.ts` |
| Génération lien paiement (admin) | `app/api/admin/create-checkout-link/route.ts` |
| Portail facturation | `app/api/stripe/create-portal-session/route.ts` |
| Page Admin lien paiement | `app/(dashboard)/dashboard/admin/lien-paiement/page.tsx` |
| Page Facturation | `app/(dashboard)/dashboard/settings/billing/page.tsx` |
