# Guide : Webhook Stripe en production (mode live)

## Étape 1 – Ouvrir Stripe en mode Live

1. Va sur **https://dashboard.stripe.com**
2. En **haut à droite**, vérifie que tu es en **mode Live** (pas "Test mode").  
   - Si tu vois "Test mode", clique dessus pour passer en **Live**.

---

## Étape 2 – Aller dans Webhooks

1. Dans le menu de gauche, clique sur **Developers** (ou **Paramètres développeur**).
2. Clique sur **Webhooks** dans le sous-menu.
3. Tu arrives sur la liste des endpoints. Clique sur **Add endpoint** (ou **Ajouter un endpoint**).

---

## Étape 3 – Renseigner l’URL de production

1. Dans le champ **Endpoint URL**, saisis exactement :
   ```
   https://ia-restaurant-manager.com/api/webhooks/stripe
   ```
2. Ne mets pas d’espace ni de slash à la fin.

---

## Étape 4 – Choisir les événements à écouter

1. Dans la section **Events to send** (ou **Événements à envoyer**), choisis **Select events** (sélectionner des événements).
2. Coche **uniquement** les événements suivants (utilisés par ton app) :
   - **customer.subscription.created**
   - **customer.subscription.updated**
   - **customer.subscription.deleted**
   - **invoice.payment_succeeded**
   - **invoice.payment_failed**
3. Clique sur **Add endpoint** (ou **Créer l’endpoint**) en bas.

---

## Étape 5 – Récupérer le Signing secret

1. Après la création, tu arrives sur la page de l’endpoint.
2. Dans la section **Signing secret** (Clé de signature), tu vois quelque chose comme `whsec_...`.
3. Clique sur **Reveal** (Révéler) pour afficher le secret en entier.
4. Clique sur **Copy** (ou copie à la main) pour copier toute la valeur `whsec_...`.

---

## Étape 6 – Mettre le secret dans Vercel

1. Va sur **Vercel** → ton projet **ia-restaurant-manager.com** → **Settings** → **Environment Variables**.
2. Trouve la variable **STRIPE_WEBHOOK_SECRET** pour l’environnement **Production**.
   - Si elle existe : **Edit** et remplace la valeur par le `whsec_...` que tu viens de copier.
   - Si elle n’existe pas : **Add** → Key : `STRIPE_WEBHOOK_SECRET`, Value : colle le `whsec_...`, coche **Production**.
3. Sauvegarde.

---

## Étape 7 – Redéployer

1. Vercel → **Deployments**.
2. Sur le dernier déploiement, clique sur les **...** (ou **Redeploy**).
3. Choisis **Redeploy** pour que la nouvelle variable soit prise en compte.

---

## Vérification rapide

- Dans Stripe → **Webhooks** → ton endpoint : tu peux voir les **événements envoyés** et leur statut (succès / erreur).
- Après un vrai paiement ou abonnement sur ton site, vérifie qu’un événement apparaît et est marqué comme réussi (code 200).

---

## Résumé des événements utilisés par ton app

| Événement | Rôle |
|-----------|------|
| `customer.subscription.created` | Nouvel abonnement créé |
| `customer.subscription.updated` | Abonnement modifié (changement de plan, etc.) |
| `customer.subscription.deleted` | Abonnement annulé |
| `invoice.payment_succeeded` | Facture payée (renouvellement, etc.) |
| `invoice.payment_failed` | Échec de paiement (mise à jour quand même côté app) |
