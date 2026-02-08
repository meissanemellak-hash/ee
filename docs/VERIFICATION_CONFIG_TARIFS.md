# Vérification de la configuration – Tarifs (Essentiel, Croissance, Pro)

Suivez ces étapes **dans l’ordre** pour vérifier que tout est bien configuré. Cochez au fur et à mesure.

---

## Étape 1 – Stripe Dashboard (mode test)

1. Ouvrez [https://dashboard.stripe.com](https://dashboard.stripe.com) et connectez-vous.
2. **Vérifiez le mode** : en haut à droite, le bouton doit indiquer **« Mode test »** (activé). Si ce n’est pas le cas, cliquez pour passer en mode test.
3. Allez dans **Produits** (menu de gauche).
4. Vous devez avoir **3 produits** (ou 1 produit avec 3 prix). Pour chaque produit, vérifiez :

   | Produit / Prix | Prix mensuel | Clé de recherche (lookup key) |
   |----------------|--------------|-------------------------------|
   | Essentiel (1–5 restos) | 1 500 € | `essentiel` |
   | Croissance (6–10 restos) | 3 000 € | `croissance` |
   | Pro (10+ restos) | 5 000 € | `pro` |

5. Pour **chaque prix**, notez le **Price ID** (format `price_xxxxxxxxxxxx`) :
   - Cliquez sur le produit → ouvrez le prix → l’ID est affiché (ou dans l’URL).
   - Vous en aurez besoin à l’étape 2.

**Checklist étape 1 :**
- [ ] Mode test activé
- [ ] 3 prix créés (1 500 €, 3 000 €, 5 000 €)
- [ ] Clés de recherche : `essentiel`, `croissance`, `pro`
- [ ] 3 Price ID notés quelque part

---

## Étape 2 – Variables d’environnement (`.env.local`)

1. Ouvrez le fichier **`.env.local`** à la racine du projet.
2. Vérifiez que les lignes suivantes existent **sans `#` devant** et que les valeurs sont remplies (remplacez `price_xxx` par vos vrais Price ID) :

   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PRICE_STARTER=price_...
   STRIPE_PRICE_GROWTH=price_...
   STRIPE_PRICE_PRO=price_...
   ```

3. Optionnel mais recommandé pour le portail et les redirections :
   ```
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
   (En production, mettez l’URL réelle du site.)

4. Pour que les abonnements soient enregistrés en base à la souscription, il faut aussi le webhook (étape 4). La variable est :
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

**Checklist étape 2 :**
- [ ] `STRIPE_SECRET_KEY` défini (sk_test_...)
- [ ] `STRIPE_PRICE_STARTER` = Price ID du plan Essentiel (1 500 €)
- [ ] `STRIPE_PRICE_GROWTH` = Price ID du plan Croissance (3 000 €)
- [ ] `STRIPE_PRICE_PRO` = Price ID du plan Pro (5 000 €)
- [ ] Pas d’espace avant/après le `=`, pas de guillemets autour de la valeur (sauf si votre outil l’exige)

---

## Étape 3 – Redémarrage du serveur

1. Arrêtez le serveur Next.js (Ctrl+C dans le terminal où il tourne).
2. Relancez : `npm run dev` (ou `yarn dev` / `pnpm dev`).
3. Les variables d’environnement sont lues au démarrage ; un redémarrage est nécessaire après toute modification de `.env.local`.

**Checklist étape 3 :**
- [ ] Serveur redémarré après vérification de `.env.local`

---

## Étape 4 – Landing et page Démo (navigateur)

1. Ouvrez **http://localhost:3000** (ou votre URL locale).
2. Descendez jusqu’à la section **« Une offre pensée pour la croissance »** (ou section Tarifs).
3. Vérifiez qu’il y a **3 cartes** :
   - **Essentiel** : 1 500 € / mois, 1 à 5 restaurants, bouton « Demander une démo »
   - **Croissance** : 3 000 € / mois, 6 à 10 restaurants (carte mise en avant)
   - **Pro** : 5 000 € / mois, 10+ restaurants
4. Cliquez sur **« Demander une démo »** de la carte **Essentiel**.
5. L’URL doit être : `http://localhost:3000/demo?plan=essentiel`.
6. Sur la page Démo, vérifiez qu’un texte du type **« Offre concernée : Essentiel »** s’affiche sous le titre.
7. Refaites un test avec **Croissance** et **Pro** : les URLs doivent contenir `?plan=croissance` et `?plan=pro`, et le libellé « Offre concernée : Croissance » puis « Offre concernée : Pro ».

**Checklist étape 4 :**
- [ ] 3 cartes tarifs visibles sur la landing
- [ ] Clic « Demander une démo » → URL avec `?plan=essentiel` (ou croissance / pro)
- [ ] Page Démo affiche « Offre concernée : Essentiel » (ou Croissance / Pro)

---

## Étape 5 – Checkout (utilisateur connecté avec organisation)

Cette étape nécessite d’être **connecté** et d’avoir **une organisation** (Clerk).

1. Connectez-vous à l’app (Clerk).
2. Allez sur **Paramètres** → **Facturation** : `http://localhost:3000/dashboard/settings/billing`.
3. Si vous n’avez pas encore d’abonnement, vous pouvez tester le checkout soit :
   - via l’**admin** (étape 6) en générant un lien et en l’ouvrant dans le navigateur,  
   - soit en appelant l’API depuis la console du navigateur (voir ci-dessous).
4. **Test via la console navigateur** (sur la page Facturation, F12 → Console) :
   ```javascript
   fetch('/api/stripe/create-checkout-session', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ plan: 'essentiel' })
   }).then(r => r.json()).then(console.log)
   ```
   - Si la config est bonne : vous obtenez un objet avec `url` (lien Stripe Checkout). Ouvrez ce lien : la page Stripe doit proposer le **plan à 1 500 € / mois** (Essentiel).
   - Si vous obtenez `{ error: "Plan invalide ou prix Stripe non configuré" }` : vérifiez que `STRIPE_PRICE_STARTER` est bien défini dans `.env.local` et que le serveur a été redémarré.

5. Refaites le test avec `plan: 'croissance'` puis `plan: 'pro'` : les montants affichés sur Stripe doivent être 3 000 € et 5 000 €.

**Checklist étape 5 :**
- [ ] `plan: 'essentiel'` → URL Stripe avec 1 500 € / mois
- [ ] `plan: 'croissance'` → 3 000 € / mois
- [ ] `plan: 'pro'` → 5 000 € / mois

---

## Étape 6 – Admin : génération de lien de paiement

Réservé au **super-admin** (email = `SUPER_ADMIN_EMAIL` dans `.env.local`).

1. Connectez-vous avec le compte super-admin.
2. Allez dans **Paramètres** → **Lien de paiement** (ou **Admin** → **Lien paiement**, selon votre menu).
3. Vous devez voir un **sélecteur de plan** : Essentiel (1–5 restos), Croissance (6–10 restos), Pro (10+ restos).
4. Choisissez une organisation (si la page le demande), sélectionnez **Essentiel**, cliquez sur **Générer le lien**.
5. Un lien Stripe doit s’afficher. Ouvrez-le dans un nouvel onglet (ou en navigation privée) : la page Stripe doit afficher l’abonnement **1 500 € / mois** (Essentiel).
6. Répétez avec **Croissance** et **Pro** pour confirmer 3 000 € et 5 000 €.

**Checklist étape 6 :**
- [ ] Sélecteur de plan visible (Essentiel, Croissance, Pro)
- [ ] Lien généré pour Essentiel → Stripe affiche 1 500 € / mois
- [ ] Idem pour Croissance (3 000 €) et Pro (5 000 €)

---

## Étape 7 – Après une souscription réussie (webhook)

Pour que le **plan** (Essentiel / Croissance / Pro) soit enregistré en base après paiement Stripe, le **webhook** doit être configuré.

1. En local : lancez la Stripe CLI :  
   `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
2. Copiez le **Signing secret** affiché (whsec_...) dans `.env.local` :  
   `STRIPE_WEBHOOK_SECRET=whsec_...`
3. Redémarrez le serveur Next.js.
4. Effectuez un **vrai** checkout test (carte 4242 4242 4242 4242) pour un plan (par ex. Essentiel).
5. Après redirection vers l’app, allez sur **Paramètres** → **Facturation**.
6. Vous devez voir **« Plan Essentiel »** (ou le plan souscrit) et les détails de l’abonnement.

Si vous n’utilisez pas le webhook en local, le plan peut ne pas être mis à jour automatiquement ; dans ce cas, une synchronisation manuelle (bouton « Synchroniser l’abonnement » si présent) ou un script peut être utilisé pour mettre à jour la table `subscriptions` à partir de Stripe.

**Checklist étape 7 :**
- [ ] `stripe listen` lancé (ou webhook configuré en prod)
- [ ] `STRIPE_WEBHOOK_SECRET` défini dans `.env.local`
- [ ] Après un paiement test, la page Facturation affiche le bon plan (Essentiel / Croissance / Pro)

---

## Résumé des variables `.env.local` utiles

| Variable | Obligatoire pour les tarifs | Description |
|----------|-----------------------------|-------------|
| `STRIPE_SECRET_KEY` | Oui | Clé secrète Stripe (sk_test_...) |
| `STRIPE_PRICE_STARTER` | Oui | Price ID du plan Essentiel (1 500 €) |
| `STRIPE_PRICE_GROWTH` | Oui | Price ID du plan Croissance (3 000 €) |
| `STRIPE_PRICE_PRO` | Oui | Price ID du plan Pro (5 000 €) |
| `STRIPE_WEBHOOK_SECRET` | Pour enregistrer l’abo en base | Signing secret du webhook (whsec_...) |
| `NEXT_PUBLIC_APP_URL` | Recommandé | URL de l’app (ex. http://localhost:3000) |
| `SUPER_ADMIN_EMAIL` | Pour l’admin lien paiement | Email du super-admin |

---

## En cas de problème

- **« Plan invalide ou prix Stripe non configuré »** : une des variables `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH` ou `STRIPE_PRICE_PRO` est absente, incorrecte ou mal recopiée. Vérifiez le nom exact (STARTER, GROWTH, PRO) et l’absence d’espaces/guillemets.
- **Page Facturation affiche « pro » ou l’ID au lieu de « Pro »** : le webhook enregistre le `lookup_key` Stripe. Vérifiez que les prix Stripe ont bien les clés `essentiel`, `croissance`, `pro`. L’app affiche déjà « Essentiel » / « Croissance » / « Pro » via `getPlanDisplayName`.
- **Stripe affiche un mauvais montant** : le lien de checkout a été créé avec un autre Price ID. Vérifiez que le paramètre `plan` envoyé à l’API correspond au plan voulu (essentiel → Starter, croissance → Growth, pro → Pro) et que les 3 variables d’env pointent vers les bons prix.

Une fois toutes les cases cochées, la configuration des tarifs (Essentiel, Croissance, Pro) est correcte.
