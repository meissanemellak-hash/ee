# Connexion et invitation 100 % sur ton domaine (français)

Pour que les utilisateurs (y compris les invités) voient **tout le parcours en français** sur **ia-restaurant-manager.com** au lieu du portail hébergé Clerk (accounts.ia-restaurant-manager.com en anglais).

---

## Ce qui a été fait dans l’app

- Variables d’environnement ajoutées dans `.env.local` (et à mettre sur Vercel en **Production**) :
  - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` → Clerk utilise la page de ton app pour la connexion.
  - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/demo` → Inscription / démo sur ton app.
- Les redirections après connexion/inscription restent `/dashboard` (déjà en place).
- Aucun changement de code applicatif : la page `/sign-in` existe déjà et est en français (`ClerkProvider` + `frFR`).

---

## Étapes à faire (sans casser le code)

### 1. Vercel – Variables en Production

1. Va sur **Vercel** → ton projet → **Settings** → **Environment Variables**.
2. Pour l’environnement **Production**, ajoute (ou vérifie) :
   - **Name :** `NEXT_PUBLIC_CLERK_SIGN_IN_URL`  
     **Value :** `/sign-in`
   - **Name :** `NEXT_PUBLIC_CLERK_SIGN_UP_URL`  
     **Value :** `/demo`
3. Les variables suivantes doivent déjà être présentes en Production (sinon ajoute-les) :
   - `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` = `/dashboard`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` = `/dashboard`
4. **Redeploy** le projet (Deployments → … sur le dernier déploiement → Redeploy) pour prendre en compte les variables.

---

### 2. Clerk Dashboard – Allowed redirect URLs

Pour que Clerk accepte de rediriger vers ton domaine après connexion ou acceptation d’invitation :

1. Va sur **https://dashboard.clerk.com** → ton application **IA Restaurant Manager**.
2. Passe en environnement **Production** (en haut).
3. **Configure** → **Paths** (ou **Developers** → **Paths** selon la version).
4. Cherche une section **« Allowed redirect URLs »** (ou **« Redirect URLs »** / **« URLs autorisées »**).
5. Ajoute les URLs suivantes (une par ligne ou une par entrée) :
   - `https://ia-restaurant-manager.com`
   - `https://ia-restaurant-manager.com/sign-in`
   - `https://ia-restaurant-manager.com/dashboard`
   - `https://ia-restaurant-manager.com/demo`
6. Enregistre.

Si tu as déjà **Home URL** = `https://ia-restaurant-manager.com/dashboard` et **Unauthorized sign in URL** = `https://ia-restaurant-manager.com/sign-in`, garde-les tels quels.

---

### 3. Clerk Dashboard – Sign-in / Application URL (si disponible)

Dans **Configure** → **Paths** (ou **Settings** → **URLs**) :

- S’il existe un champ **« Sign-in URL »** ou **« Application URL »** pouvant être une URL complète, tu peux mettre :
  - **Sign-in URL :** `https://ia-restaurant-manager.com/sign-in`
- Sinon, les variables d’environnement `NEXT_PUBLIC_CLERK_SIGN_IN_URL` et `NEXT_PUBLIC_CLERK_SIGN_UP_URL` suffisent pour que ton app indique à Clerk où se trouvent tes pages.

---

### 4. Vérification

1. En **navigation privée**, ouvre **https://ia-restaurant-manager.com/sign-in** → la page doit s’afficher **en français**.
2. Déconnecte-toi (ou utilise un autre navigateur), puis clique sur un **lien d’invitation** (email d’invitation Clerk) :
   - Idéalement, tu arrives sur **ia-restaurant-manager.com/sign-in** (ou une URL de ton app) avec le flux d’acceptation en **français**, puis redirection vers le dashboard.
   - Si le lien mène encore vers **accounts.ia-restaurant-manager.com**, l’email d’invitation est peut-être généré avec l’ancienne config ; après redeploy et enregistrement des redirect URLs, refaire un test avec une **nouvelle invitation**.

---

## Résumé

| Où | Action |
|----|--------|
| **App** | Déjà fait : `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/demo` dans `.env.local` |
| **Vercel** | Ajouter les 2 variables en **Production** puis **Redeploy** |
| **Clerk** | **Allowed redirect URLs** : ajouter `https://ia-restaurant-manager.com`, `/sign-in`, `/dashboard`, `/demo` |
| **Test** | Vérifier connexion et parcours d’invitation en français sur ton domaine |

Ainsi, la connexion et la création de mot de passe (y compris après invitation) se font sur ton app, en français, sans casser le code existant.
