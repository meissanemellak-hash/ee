# Clerk : redirection après invitation → /dashboard

## Comportement

Quand un **admin** invite un **employé** ou un **manager** :

1. L’invité reçoit un email Clerk avec un lien.
2. Il clique, accepte l’invitation (connexion ou création de compte).
3. Il est **redirigé vers le dashboard** de l’app (`/dashboard`), c’est-à-dire le tableau de bord de l’organisation à laquelle il a été invité.

## Ce qui a été mis en place

### 1. Variables d’environnement (déjà ajoutées)

Dans **`.env.local`** (et à mettre en **Production** sur Vercel) :

```env
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard
```

Clerk utilise ces URLs pour **toute** redirection après sign-in ou sign-up, y compris après acceptation d’invitation. L’invité atterrit donc toujours sur `/dashboard`.

### 2. À faire dans le Dashboard Clerk (production)

Pour que la redirection vers ton domaine soit autorisée :

1. Va sur **https://dashboard.clerk.com** → ton application → **Configure** → **Paths** (ou **Settings** → **Paths** / **URLs**).
2. Si une section **« Allowed redirect URLs »** (ou **« Redirect URLs autorisées »**) existe, ajoute :
   - `https://ia-restaurant-manager.com/dashboard`
3. Sauvegarde.

Sans cela, Clerk peut refuser de rediriger vers cette URL en production.

### 3. Vercel (production)

Ajoute les deux variables en **Production** :

- `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` = `/dashboard`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` = `/dashboard`

Puis **Redeploy** pour prendre en compte les changements.

## Résumé

| Étape | Où | Action |
|-------|-----|--------|
| 1 | `.env.local` | Déjà fait : les 2 variables sont définies |
| 2 | Clerk Dashboard | Ajouter `https://ia-restaurant-manager.com/dashboard` aux URLs de redirection autorisées (si la section existe) |
| 3 | Vercel | Ajouter les 2 variables en Production et redéployer |

Après ça, tout invité (employé ou manager) qui accepte l’invitation arrive bien sur le **dashboard** de l’app de son admin.
