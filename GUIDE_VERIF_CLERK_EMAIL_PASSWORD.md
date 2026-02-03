# Vérifier que la connexion email + mot de passe est activée dans Clerk

Pour que le test employé (setup-staff) puisse se connecter avec un email et un mot de passe, il faut que cette méthode soit activée dans ton application Clerk.

---

## Étapes

1. **Ouvre le dashboard Clerk**  
   Va sur [dashboard.clerk.com](https://dashboard.clerk.com) et connecte-toi.

2. **Choisis ton application**  
   Sélectionne le projet qui correspond à ton app (ex. "AI Restaurant manager" ou le nom de ton app).

3. **Ouvre la configuration de connexion**  
   Dans le menu de gauche :
   - Clique sur **User & Authentication** (ou **Configure** selon la version).
   - Puis sur **Email, Phone, Username** (ou **Sign-in options** / **Authentication**).

4. **Vérifie les méthodes de connexion**  
   Tu dois voir les options proposées pour la connexion, par exemple :
   - **Email address** (adresse e-mail)
   - **Password** (mot de passe)
   - **Google** (connexion avec Google)
   - Autres (GitHub, etc.)

5. **Ce qu’il faut avoir pour le test**  
   - **Email** : activé (souvent avec "Email address" ou "Email").
   - **Password** : activé (option du type "Password" ou "Email + Password" pour la stratégie de connexion).

   Si tu vois uniquement "Sign in with Google" (ou d’autres fournisseurs) et **aucune** option "Email" / "Password" pour une connexion classique, le formulaire email + mot de passe n’existe pas : il faut l’activer.

6. **Activer email + mot de passe si besoin**  
   - Repère une option du type **"Email"** ou **"Email address"** et active-la.
   - Repère **"Password"** (souvent dans la même section ou dans "Sign-in strategies") et active-la.
   - Enregistre les changements (bouton **Save** ou **Update**).

---

## Où ça se trouve exactement (à jour selon Clerk)

L’interface Clerk peut changer. En général :

- **Configure** → **Sign-in** (ou **Authentication** → **Sign-in**),  
  ou  
- **User & Authentication** → **Email, Phone, Username** / **Sign-in options**.

Tu dois voir la liste des **strategies** ou **methods** (Email, Password, Google, etc.). Vérifier que **Email** et **Password** (ou "Email + Password") sont bien activés.

---

## Récap

| À vérifier | Où (exemple) |
|------------|----------------|
| Connexion par email activée | Configure → Sign-in / Email, Phone, Username |
| Mot de passe activé pour l’email | Même section, option "Password" ou "Email + Password" |

Si les deux sont activés, le formulaire de connexion avec email + mot de passe s’affiche sur ta page `/sign-in` et le test employé peut s’y connecter.

---

## Si le test reste sur « sign-in#/factor-one » (pas de redirection vers le dashboard)

Cela signifie que Clerk affiche une étape supplémentaire (vérification, MFA, ou que la redirection n’est pas configurée). À vérifier dans le **Clerk Dashboard** :

1. **Redirect URL après connexion (Paths)**  
   Dans **Configure** → **Developers** → **Paths** :
   - **Fallback development host** : mets `http://localhost:3000` (pour les tests en local). Ne laisse pas vide.
   - **Application paths** → **Home URL** : mets `/dashboard` (ou `http://localhost:3000/dashboard`) pour que Clerk redirige vers le dashboard après connexion.
   - Enregistre (bouton **Save** en bas de page si présent).

2. **« Vérifiez votre messagerie » (code par email)**  
   Si après email + mot de passe Clerk affiche « Vérifiez votre messagerie » et demande un code à 5 chiffres, le test ne peut pas continuer. Il faut **désactiver cette vérification à la connexion** : **Configure** → **User & authentication** → **Email, Phone, Username** (ou **Authentication**) → chercher « Email verification », « Verify at sign-in » ou « One-time code » et désactiver pour que, après mot de passe, on aille directement au dashboard.

3. **MFA / vérification en 2 étapes**  
   Si la **vérification en deux étapes (MFA)** est activée pour l’application ou pour certains utilisateurs, Clerk peut rester sur une page « factor-one » ou demander un code. Pour le **compte employé de test**, soit désactiver le MFA pour ce compte, soit utiliser un compte sans MFA pour les tests.

Après avoir corrigé la redirection et/ou le MFA, relancer le test.

---

## Si Clerk affiche « Utiliser une autre méthode » / « Continuer avec Google »

La connexion email + mot de passe n’a pas abouti pour ce compte. À faire :

1. **Clerk Dashboard** → **Users** → ouvre l’utilisateur employé. Vérifie qu’il a bien une **méthode Password** (mot de passe). Si le compte a été créé avec Google uniquement, définis un mot de passe pour lui (ou crée un nouveau compte email + mot de passe pour les tests).
2. Vérifie que **STAFF_PASSWORD** dans le terminal est bien le mot de passe de ce compte.

**Alternative :** crée la session à la main une fois (voir GUIDE_TESTS_EMPLOYE_ETAPES.md, Option 2), sauvegarde dans `e2e/.auth/staff.json`, puis lance `npx playwright test --project=employee-role` sans STAFF_EMAIL/STAFF_PASSWORD.
