# Vérifier que Stripe Live est bien en place

À faire **sur Vercel** (Production) et **Stripe Dashboard** (mode Live).

---

## 1. Vercel → Variables d’environnement (Production)

**Vercel** → ton projet → **Settings** → **Environment Variables**. Filtre **Production**.

| Variable | À vérifier |
|----------|------------|
| **STRIPE_SECRET_KEY** | Doit commencer par `sk_live_...` (pas `sk_test_`). |
| **STRIPE_WEBHOOK_SECRET** | Doit être un `whsec_...` (secret du webhook **prod**, pas celui de `stripe listen`). |
| **STRIPE_PRICE_STARTER** | `price_...` correspondant au prix **Live** du plan Starter. |
| **STRIPE_PRICE_GROWTH** | `price_...` correspondant au prix **Live** du plan Growth. |
| **STRIPE_PRICE_PRO** | `price_...` correspondant au prix **Live** du plan Pro. |

Si une variable est en **test** (`sk_test_`, ou price IDs créés en mode Test), les paiements réels ne fonctionneront pas correctement.

---

## 2. Stripe Dashboard → Mode Live

1. Va sur [dashboard.stripe.com](https://dashboard.stripe.com).
2. En haut à droite, bascule en **mode Live** (pas « Mode test »).
3. **Developers** → **API keys** : la clé secrète affichée doit être `sk_live_...` et correspondre à **STRIPE_SECRET_KEY** sur Vercel (tu peux comparer les 4 derniers caractères si tu préfères ne pas tout afficher).

---

## 3. Stripe Dashboard → Webhooks (Live)

1. Toujours en **mode Live** : **Developers** → **Webhooks**.
2. Tu dois avoir un endpoint avec l’URL : `https://ia-restaurant-manager.com/api/webhooks/stripe`.
3. Événements typiques à écouter : `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed` (ou sélectionner les événements recommandés pour les abonnements).
4. Clique sur l’endpoint → **Signing secret** : révéler et vérifier qu’il est identique à **STRIPE_WEBHOOK_SECRET** sur Vercel (Production).

---

## 4. Price IDs en mode Live

1. **Stripe** (mode Live) → **Product catalog** (ou **Products**).
2. Ouvre chaque produit (Starter, Growth, Pro) et note les **Price ID** (ex. `price_1Abc...`).
3. Compare avec **STRIPE_PRICE_STARTER**, **STRIPE_PRICE_GROWTH**, **STRIPE_PRICE_PRO** sur Vercel : les IDs doivent être ceux du mode **Live**, pas ceux créés en test.

---

## 5. Test rapide après vérification

- Créer un abonnement de test en prod (avec une carte test Stripe si tu en as une, ou une vraie souscription annulée juste après).
- Vérifier dans ton app que le statut d’abonnement se met à jour (dashboard, base de données).
- Dans Stripe → **Developers** → **Webhooks** → ton endpoint : regarder les **événements envoyés** et qu’ils renvoient **200** (pas 4xx/5xx).

---

## Récap

| Où | Quoi |
|----|------|
| Vercel Production | `STRIPE_SECRET_KEY` = `sk_live_...`, `STRIPE_WEBHOOK_SECRET` = secret du webhook prod, 3× `STRIPE_PRICE_*` = IDs Live |
| Stripe (Live) | Webhook `https://ia-restaurant-manager.com/api/webhooks/stripe` avec le bon signing secret |
| Stripe (Live) | Price IDs des produits = ceux renseignés sur Vercel |
