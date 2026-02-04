# Configuration Stripe (abonnements)

Ce guide décrit comment activer les paiements et abonnements avec Stripe.

## 1. Créer un compte Stripe

1. Inscrivez-vous sur [dashboard.stripe.com](https://dashboard.stripe.com).
2. En mode test, récupérez les clés dans **Développeurs → Clés API** :
   - **Clé secrète** (sk_test_…) → `STRIPE_SECRET_KEY`
   - **Clé publiable** (pk_test_…) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Ajoutez-les dans `.env.local`.

## 2. Créer les produits et prix (abonnements)

1. Dans Stripe : **Produits** → **Ajouter un produit**.
2. Créez 3 produits (ex. Starter, Pro, Enterprise) en **Abonnement** mensuel.
3. Pour chaque prix créé, copiez l’**ID du prix** (price_xxx).
4. Dans `.env.local`, ajoutez (optionnel, pour que les boutons « Choisir » fonctionnent) :
   - `STRIPE_PRICE_STARTER=price_xxx`
   - `STRIPE_PRICE_PRO=price_xxx`
   - `STRIPE_PRICE_ENTERPRISE=price_xxx`

Sans ces variables, la page `/pricing` s’affiche mais le checkout renverra « Plan invalide ou prix Stripe non configuré ».

## 3. Webhook Stripe

1. En local : installez [Stripe CLI](https://stripe.com/docs/stripe-cli) et lancez :
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   La CLI affiche un secret (whsec_…) → mettez-le dans `STRIPE_WEBHOOK_SECRET` dans `.env.local`.

2. En production (ex. Vercel) :
   - Stripe Dashboard → **Développeurs → Webhooks** → **Ajouter un point de terminaison**.
   - URL : `https://votredomaine.com/api/webhooks/stripe`
   - Événements à écouter : `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`.
   - Récupérez le **Secret de signature** et configurez `STRIPE_WEBHOOK_SECRET` sur votre hébergeur.

## 4. Appliquer le schéma base de données

Le modèle `Subscription` doit exister en base :

```bash
npx prisma db push
```

(ou `npx prisma migrate dev` si vous utilisez les migrations.)

## 5. Récapitulatif des URLs et flux

- **Page tarifs** : `/pricing` (plans + bouton vers Stripe Checkout).
- **Après paiement** : redirection vers `/dashboard/settings/billing?success=1`.
- **Facturation** : `/dashboard/settings/billing` (plan actuel + lien « Gérer l’abonnement » → Stripe Customer Portal).
- **Accès dashboard** : 14 jours d’essai après création de l’organisation, puis abonnement actif ou en essai Stripe requis (sinon redirection vers `/pricing`).

## 6. Portail client Stripe (Customer Portal)

Pour que « Gérer l’abonnement » ouvre le portail Stripe (factures, moyen de paiement, annulation), configurez le portail dans le Dashboard Stripe : **Paramètres → Portail de facturation**.
