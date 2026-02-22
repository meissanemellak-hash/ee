# Configurer « Continuer avec Google » (Clerk)

Si en cliquant sur **Continuer avec Google** tu vois l’erreur **« Missing required parameter: client_id »** ou **« Accès bloqué : erreur d'autorisation »**, c’est que la connexion Google (OAuth) n’est pas encore configurée. Suis ces étapes.

---

## Étape 1 – Créer les identifiants OAuth dans Google Cloud

1. Va sur **https://console.cloud.google.com** et connecte-toi avec le compte Google que tu utilises pour le projet (ex. meissane.mellak@gmail.com).
2. En haut, sélectionne ou crée un **projet** (ex. « IA Restaurant Manager »).
3. Menu **☰** → **APIs & Services** → **Credentials** (Identifiants).
4. Clique sur **+ Create Credentials** → **OAuth client ID**.
5. Si on te demande de configurer l’écran de consentement OAuth :
   - **User Type** : **External** (pour que n’importe quel utilisateur Google puisse se connecter).
   - Renseigne **App name** (ex. « IA Restaurant Manager »), **User support email**, **Developer contact**.
   - Enregistre et reviens à **Credentials** → **Create Credentials** → **OAuth client ID**.
6. **Application type** : **Web application**.
7. **Name** : ex. « IA Restaurant Manager – Clerk ».
8. **Authorized redirect URIs** : clique sur **+ Add URI** et ajoute **exactement** l’URL indiquée par Clerk (voir étape 2 ci‑dessous).  
   Clerk affiche une URL du type :  
   `https://<ton-domaine-clerk>.clerk.accounts.dev/v1/oauth_callback`  
   ou pour la prod :  
   `https://accounts.ia-restaurant-manager.com/v1/oauth_callback`  
   (le domaine exact s’affiche dans Clerk au moment où tu actives Google).
9. **Create** → note le **Client ID** et le **Client Secret** (tu en auras besoin à l’étape 3).

---

## Étape 2 – Récupérer l’URL de redirection Clerk

1. Va sur **https://dashboard.clerk.com** → ton application.
2. Passe en **Production** (en haut) si tu testes sur ia-restaurant-manager.com.
3. **Configure** → **Social connections** (ou **User & Authentication** → **Social connections**).
4. Clique sur **Google** pour l’ouvrir.
5. Tu verras un champ **Redirect URI** (ou « Callback URL »). **Copie cette URL**.
6. Si tu ne l’as pas encore fait à l’étape 1, ajoute cette URL dans Google Cloud Console → Credentials → ton OAuth client → **Authorized redirect URIs**.

---

## Étape 3 – Renseigner Client ID et Client Secret dans Clerk

1. Dans **Clerk** → **Configure** → **Social connections** → **Google**.
2. Active **Google** (toggle **On**).
3. **Client ID** : colle le **Client ID** copié depuis Google Cloud (ex. `xxxxx.apps.googleusercontent.com`).
4. **Client Secret** : colle le **Client Secret** depuis Google Cloud.
5. **Save** (Enregistrer).

---

## Étape 4 – Vérifier l’environnement (Development vs Production)

- Si tu testes sur **ia-restaurant-manager.com** (prod), fais les étapes 2 et 3 en étant en **Production** dans Clerk, et utilise l’URL de redirection **Production** dans Google Cloud.
- Si tu testes en **local** (localhost), fais la même chose en **Development** dans Clerk et ajoute dans Google Cloud l’URL de redirection **Development** fournie par Clerk (souvent un domaine `*.clerk.accounts.dev`).

Tu peux avoir deux OAuth clients dans Google (un pour dev, un pour prod) avec chacune leur redirect URI, ou un seul client avec **les deux** redirect URIs (dev + prod) ajoutées.

---

## Vérification

1. Ouvre **https://ia-restaurant-manager.com/sign-in** (ou ta page de connexion).
2. Clique sur **Continuer avec Google**.
3. Tu dois être redirigé vers la page de connexion Google (choix du compte), puis revenir sur l’app connecté.

Si l’erreur persiste : vérifie que le **Client ID** et le **Client Secret** sont bien collés sans espace, et que l’**Authorized redirect URI** dans Google Cloud correspond **exactement** à celle affichée dans Clerk pour l’environnement (Production ou Development) que tu utilises.
