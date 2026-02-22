# Guide Calendly – étape par étape

Ce guide permet de connecter un événement Calendly (démo) à la page **/demo/merci** de l’app. Le bouton « Choisir un créneau pour ma démo » ouvrira ton créneau de réservation.

---

## Étape 1 – Créer un compte Calendly (si besoin)

1. Va sur **https://calendly.com**.
2. Clique sur **Sign up free** (ou **S’inscrire**).
3. Inscris-toi avec ton email (ex. meissane.mellak@gmail.com ou support@ia-restaurant-manager.com) ou via Google.
4. Valide ton compte si Calendly le demande.

---

## Étape 2 – Créer un type d’événement « Démo »

1. Une fois connecté, tu arrives sur le tableau de bord Calendly.
2. Clique sur **Create** (ou **Créer**) → **Event type** (Type d’événement).
3. Choisis **One-on-One** (ou « Un à un ») pour un rendez-vous avec un seul visiteur.
4. **Nom de l’événement** : par ex. **Démo IA Restaurant Manager** (ou « Démo 30 min »).
5. **Durée** : 30 minutes (ou 15 / 45 selon ton besoin).
6. **Description** (optionnel) : courte phrase du type « Démo personnalisée de la solution IA Restaurant Manager ».
7. **Lieu** : choisis **Calendly Video** (visioconférence intégrée) ou **Google Meet** / **Zoom** si tu préfères.
8. Clique sur **Save** (Enregistrer) ou **Next** jusqu’à la fin de la création.

---

## Étape 3 – Récupérer l’URL de l’événement

1. Dans Calendly, ouvre l’événement que tu viens de créer (ou **Event types** → clique sur « Démo IA Restaurant Manager »).
2. En haut de la page de l’événement, tu vois une **URL de partage**, du type :
   - `https://calendly.com/ton-username/demo`
   - ou `https://calendly.com/ton-username/30min`
3. **Copie cette URL** entière (sans paramètres supplémentaires pour l’instant).  
   Exemple : `https://calendly.com/meissane-mellak/demo-ia-restaurant-manager`

Tu en auras besoin aux étapes 4 et 5.

---

## Étape 4 – Ajouter la variable en local (.env.local)

1. Ouvre le fichier **`.env.local`** à la racine du projet.
2. Ajoute une nouvelle ligne (ou modifie si elle existe déjà) :
   ```env
   NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/ton-username/nom-de-ton-evenement
   ```
   Remplace par **ta vraie URL** copiée à l’étape 3.  
   Exemple :
   ```env
   NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/meissane-mellak/demo-ia-restaurant-manager
   ```
3. Enregistre le fichier.
4. (Optionnel) Redémarre le serveur de dev (`npm run dev`) pour que la variable soit prise en compte.

---

## Étape 5 – Ajouter la variable sur Vercel (Production)

1. Va sur **https://vercel.com** → ton projet **IA Restaurant Manager**.
2. **Settings** → **Environment Variables**.
3. Clique sur **Add New** (ou **Add**).
4. Renseigne :
   - **Key (Name)** : `NEXT_PUBLIC_CALENDLY_URL`
   - **Value** : la même URL que en local (ex. `https://calendly.com/ton-username/demo-ia-restaurant-manager`)
   - **Environments** : coche **Production** (et **Preview** si tu veux que les déploiements de branche utilisent aussi cette URL).
5. Clique sur **Save**.
6. Fais un **Redeploy** : **Deployments** → **⋯** sur le dernier déploiement → **Redeploy**.

Sans cette variable en Production, le bouton sur le site en ligne pointera vers `https://calendly.com` par défaut.

---

## Étape 6 – Vérification

1. **En local** : lance `npm run dev`, va sur la page de démo/merci (ex. `http://localhost:3000/demo/merci` ou avec des paramètres `?nom=Test&email=test@test.com`). Clique sur **« Choisir un créneau pour ma démo »** → tu dois arriver sur ta page Calendly (avec nom/email pré-remplis si l’URL contient les paramètres).
2. **En production** : après le redeploy, ouvre `https://ia-restaurant-manager.com/demo/merci` (éventuellement avec `?nom=...&email=...`), clique sur le bouton → tu dois arriver sur le même événement Calendly.

---

## Récapitulatif

| Étape | Où | Action |
|-------|-----|--------|
| 1 | calendly.com | Créer un compte si besoin |
| 2 | Calendly | Créer un type d’événement « Démo » (30 min, visio, etc.) |
| 3 | Calendly | Copier l’URL de l’événement |
| 4 | `.env.local` | Ajouter `NEXT_PUBLIC_CALENDLY_URL=<ton URL>` |
| 5 | Vercel → Environment Variables | Ajouter la même variable pour Production, puis Redeploy |
| 6 | App (local + prod) | Tester le bouton « Choisir un créneau » sur /demo/merci |

La page **/demo/merci** envoie déjà le **nom** et l’**email** du visiteur dans l’URL Calendly (`invitee_full_name`, `invitee_email`) pour pré-remplir le formulaire de réservation.
