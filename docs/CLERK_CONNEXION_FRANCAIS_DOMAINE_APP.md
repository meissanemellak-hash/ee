# Connexion et invitation 100 % en français (via le domaine de l'app)

Pour que les invités (et toute connexion) passent par **ia-restaurant-manager.com/sign-in** (page en français) au lieu du portail Clerk (anglais), la config suivante a été mise en place.

---

## Ce qui a été fait dans le code

- **API d’invitation** (`/api/organizations/invite`) : chaque invitation envoyée inclut maintenant un `redirectUrl` vers `{NEXT_PUBLIC_APP_URL}/sign-in`. Quand l’invité clique sur le lien dans l’email, Clerk le redirige vers ta page de connexion (en français) avec les paramètres nécessaires (`__clerk_ticket`, `__clerk_status`).

Aucun autre fichier applicatif n’a été modifié ; le reste est de la **configuration** (Clerk + Vercel).

---

## Étapes à faire de ton côté

### 1. Vercel – Variables d’environnement (Production)

Dans **Vercel** → ton projet → **Settings** → **Environment Variables** (environnement **Production**) :

- **`NEXT_PUBLIC_APP_URL`**  
  Valeur : `https://ia-restaurant-manager.com`  
  (Si elle existe déjà, vérifier qu’elle est bien celle-ci en prod.)

- **`NEXT_PUBLIC_CLERK_SIGN_IN_URL`** (recommandé)  
  Valeur : `https://ia-restaurant-manager.com/sign-in`  
  Cela indique à Clerk d’utiliser ta page de connexion comme URL de sign-in.

Ensuite : **Redeploy** du projet (ou un nouveau déploiement) pour que les variables soient prises en compte.

---

### 2. Clerk Dashboard – Paths / Redirect URLs

1. Va sur **[dashboard.clerk.com](https://dashboard.clerk.com)** → ton application **IA Restaurant Manager**.
2. Passe en **Production** (en haut).
3. **Configure** → **Paths** (ou **Developers** → **Paths**).
4. Vérifie que :
   - **Home URL** est bien `https://ia-restaurant-manager.com/dashboard`.
   - S’il existe une section **« Allowed redirect URLs »** (ou **Redirect URLs autorisées**), ajoute :
     - `https://ia-restaurant-manager.com/sign-in`
     - `https://ia-restaurant-manager.com/dashboard`
5. S’il existe un champ **« Sign-in URL »** ou **« Component path »** pour le sign-in, mets :  
   `https://ia-restaurant-manager.com/sign-in`
6. Enregistre.

---

### 3. Vérification

1. **Invitation** : en tant qu’admin, invite un compte de test (ou un nouvel email). L’email reçu doit contenir un lien.
2. **Clic sur le lien** : tu dois arriver sur **https://ia-restaurant-manager.com/sign-in** (avec éventuellement des paramètres dans l’URL), avec la page **en français**.
3. Après connexion ou inscription, la redirection doit se faire vers **https://ia-restaurant-manager.com/dashboard**.

Si le lien mène encore vers **accounts.ia-restaurant-manager.com**, vérifier que le **Redeploy** Vercel a bien été fait après l’ajout des variables, et que les **Allowed redirect URLs** dans Clerk incluent bien `https://ia-restaurant-manager.com/sign-in`.

---

## Récap

| Où | Quoi |
|----|------|
| **Code** | `redirectUrl` vers `/sign-in` dans l’API d’invitation (déjà en place). |
| **Vercel** | `NEXT_PUBLIC_APP_URL` et `NEXT_PUBLIC_CLERK_SIGN_IN_URL` en Production, puis Redeploy. |
| **Clerk** | Allowed redirect URLs + Sign-in URL si disponible, vers `https://ia-restaurant-manager.com/sign-in`. |

Après ça, le parcours invitation + connexion se fait entièrement sur ton domaine, en français.
