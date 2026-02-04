# Guide étape par étape – À faire maintenant

Ce guide te permet de configurer Stripe, tester l’invitation et le paiement, puis (optionnel) Calendly. Suis les étapes dans l’ordre.

---

## Partie 1 : Stripe (paiements)

### Étape 1.1 – Compte Stripe

1. Va sur [https://stripe.com](https://stripe.com) et connecte-toi (ou crée un compte).
2. En haut à droite, vérifie que tu es en **mode Test** (toggle « Test mode » activé).
3. Va dans **Developers** → **API keys**.
4. Note :
   - **Secret key** (commence par `sk_test_...`) → tu en auras besoin à l’étape 1.3.

---

### Étape 1.2 – Créer le produit et le prix « Plan Pro »

1. Dans Stripe : **Product catalog** → **Products** → **Add product**.
2. **Name** : `Plan Pro` (ou « AI Operations Pro »).
3. **Description** (optionnel) : « Abonnement mensuel – Tableau de bord, ventes, inventaire, alertes. »
4. Dans la section **Pricing** :
   - **Pricing model** : Standard pricing.
   - **Price** : `5000` (ou 5000,00).
   - **Currency** : EUR.
   - **Billing period** : Monthly (mensuel).
5. Clique sur **Save product**.
6. Une fois le produit créé, ouvre le **prix** (Price) que tu viens de créer (ou ajoute un prix si besoin).
7. Dans le détail du prix, trouve **Lookup key** (ou « Clé de recherche ») et mets exactement : `pro`.
8. Sauvegarde.
9. Copie l’**ID du prix** (commence par `price_...`, ex. `price_1Sx2BLFvSu9j4m29S8JU4PPZ`) → tu en auras besoin à l’étape 1.3.

---

### Étape 1.3 – Renseigner les variables dans `.env.local`

1. Ouvre le fichier `.env.local` à la racine du projet.
2. Repère le bloc commenté **# Stripe**.
3. Décommente et remplis (ou corrige) les lignes suivantes :

```env
# Stripe (voir docs/STRIPE_SETUP.md)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
STRIPE_PRICE_PRO=price_xxxxxxxxxxxxxxxx
```

- Remplace `sk_test_xxxxxxxxxxxxxxxx` par ta **Secret key** Stripe (étape 1.1).
- Remplace `price_xxxxxxxxxxxxxxxx` par l’**ID du prix** du Plan Pro (étape 1.2).

4. Pour l’instant, tu peux **ne pas** mettre `STRIPE_WEBHOOK_SECRET` (on le fera à l’étape 1.5 pour tester les abonnements en local, ou en prod plus tard).
5. Sauvegarde le fichier.

---

### Étape 1.4 – Redémarrer l’app

1. Arrête le serveur Next.js (Ctrl+C dans le terminal).
2. Relance : `npm run dev`.
3. Ouvre [http://localhost:3000](http://localhost:3000).

---

### Étape 1.5 – Webhook en local (pour enregistrer l’abonnement après paiement)

Sans webhook, le paiement Stripe fonctionne mais l’app ne saura pas que le client a payé → il restera bloqué sur `/pricing`. Pour que l’abonnement soit enregistré en base :

1. Installe la Stripe CLI : [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli) (ou `brew install stripe/stripe-cli/stripe` sur Mac).
2. Dans un **second terminal** : `stripe login`.
3. Puis :  
   `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. La CLI affiche un **webhook signing secret** du type `whsec_...`. Copie-le.
5. Dans `.env.local`, ajoute (ou décommente) :  
   `STRIPE_WEBHOOK_SECRET=whsec_...`
6. Redémarre `npm run dev` (terminal 1). Garde `stripe listen` ouvert (terminal 2) pendant tes tests.

---

## Partie 2 : Tester le parcours (invitation → paiement)

### Étape 2.1 – Créer une organisation dans Clerk

1. Va sur [https://dashboard.clerk.com](https://dashboard.clerk.com) → ton application.
2. **Organizations** → **Create organization**.
3. **Name** : par ex. `Test Client`.
4. Clique sur **Create**.

---

### Étape 2.2 – Inviter un membre (ton email de test)

1. Ouvre l’organisation que tu viens de créer.
2. Onglet **Members** → **Invite member**.
3. **Email address** : mets une adresse email à laquelle tu peux recevoir (Gmail perso, etc.).
4. **Role** : Admin (ou Member).
5. Clique sur **Send invitation**.

---

### Étape 2.3 – Accepter l’invitation (côté « client »)

1. Ouvre ta boîte mail (celle que tu as invitée).
2. Ouvre l’email Clerk « Invitation à rejoindre l’organisation… ».
3. Clique sur **Accepter l’invitation** (ou « cliquez ici »).
4. Tu arrives sur une page Clerk : crée un mot de passe (ou connecte-toi avec Google) pour ce compte.
5. Après validation, Clerk te redirige (souvent vers la home ou le dashboard de l’app).

---

### Étape 2.4 – Aller sur la page Tarifs et payer

1. Dans l’app, va sur [http://localhost:3000/pricing](http://localhost:3000/pricing) (ou clique sur le lien si l’app t’y envoie).
2. Tu dois voir le **Plan Pro** à 5 000 €/mois et le bouton **Souscrire** (ou « Choisir ce plan »).
3. Clique sur **Souscrire**.
4. Tu es redirigé vers **Stripe Checkout**. En mode test, utilise une carte de test Stripe, par ex. :
   - **Numéro** : `4242 4242 4242 4242`
   - **Date** : une date future (ex. 12/34)
   - **CVC** : n’importe quel 3 chiffres (ex. 123)
   - **Code postal** : n’importe quel (ex. 75001)
5. Valide le paiement.
6. Stripe te renvoie vers ton app (URL configurée dans la session Checkout, en général la home ou le dashboard).

---

### Étape 2.5 – Vérifier l’accès au dashboard

1. Si le webhook est bien configuré (étape 1.5) et que l’événement a été reçu, ton organisation a maintenant un abonnement actif en base.
2. Va sur [http://localhost:3000/dashboard](http://localhost:3000/dashboard).
3. Tu dois accéder au tableau de bord (et éventuellement à l’onboarding si c’est la première fois).

Si tu es redirigé encore vers `/pricing`, vérifie que :
- le webhook Stripe a bien reçu les événements (terminal où tourne `stripe listen`) ;
- `STRIPE_WEBHOOK_SECRET` dans `.env.local` correspond bien au secret affiché par `stripe listen`.

---

## Partie 3 (optionnel) : Calendly pour la démo

### Étape 3.1 – Créer un événement Calendly

1. Va sur [https://calendly.com](https://calendly.com) et crée un événement (ex. « Démo AI Operations », 30 min).
2. Copie l’URL de l’événement (ex. `https://calendly.com/ton-username/demo`).

---

### Étape 3.2 – Brancher l’URL dans l’app

1. Dans `.env.local`, ajoute :  
   `NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/ton-username/demo`  
   (remplace par ta vraie URL.)
2. Vérifie que la page **/demo/merci** affiche un bouton « Choisir un créneau » (ou similaire) qui pointe vers cette URL (le code peut utiliser `process.env.NEXT_PUBLIC_CALENDLY_URL`).

---

## Récapitulatif

| Ordre | Action |
|-------|--------|
| 1.1 | Compte Stripe, mode Test, noter la Secret key |
| 1.2 | Créer produit « Plan Pro », prix 5 000 €/mois, Lookup key `pro`, copier le Price ID |
| 1.3 | Dans `.env.local` : `STRIPE_SECRET_KEY` et `STRIPE_PRICE_PRO` |
| 1.4 | Redémarrer `npm run dev` |
| 1.5 | (Recommandé) Stripe CLI : `stripe listen` + `STRIPE_WEBHOOK_SECRET` dans `.env.local` |
| 2.1 | Clerk : créer une organisation |
| 2.2 | Clerk : inviter un membre (ton email) |
| 2.3 | Accepter l’invitation dans l’email (mot de passe ou Google) |
| 2.4 | Aller sur /pricing → Souscrire → payer avec carte test 4242... |
| 2.5 | Vérifier l’accès au dashboard |
| 3 (optionnel) | Calendly : créer l’événement, mettre l’URL dans `.env.local` |

Ensuite, avant la mise en production, suis la **CHECKLIST_AVANT_PRODUCTION.md** (domaine, Stripe Live, webhook prod, Clerk redirect vers `/pricing`, etc.).
