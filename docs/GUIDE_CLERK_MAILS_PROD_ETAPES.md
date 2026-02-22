# Guide étape par étape : Clerk – Mails en production

Configurer les e-mails Clerk pour la prod : **From** et **Reply-to** sur ton domaine, puis mail « Compte verrouillé » envoyé en français via Resend. **Aucune modification de code** : tout se fait dans le Dashboard Clerk et dans Vercel.

---

## Partie A – From et Reply-to pour tous les templates Clerk

Objectif : que tous les mails Clerk (mot de passe, vérification, invitation, etc.) partent avec **From** = `noreply@ia-restaurant-manager.com` et **Reply-to** = `support@ia-restaurant-manager.com`.

### Étape A1 – Ouvrir la section E-mails

1. Va sur [dashboard.clerk.com](https://dashboard.clerk.com) et connecte-toi.
2. Sélectionne ton **application** (celle utilisée par IA Restaurant Manager).
3. Dans le menu de gauche : **Configure** → **Customization** → **Emails** (ou **Email**).

### Étape A2 – Parcourir chaque catégorie de mails

Clerk regroupe les templates par catégorie (Security, Verification, Organization, etc.). Pour **chaque template** listé ci-dessous :

1. Clique sur le template pour ouvrir ses paramètres.
2. Repère les champs :
   - **From** (ou « Expéditeur » / « Sender »)
   - **Reply-to** (ou « Répondre à »)
3. Si le template permet de les modifier :
   - **From** : mets **`noreply@ia-restaurant-manager.com`** (ou le nom affiché + cette adresse si Clerk propose les deux).
   - **Reply-to** : mets **`support@ia-restaurant-manager.com`**.
4. Enregistre (Save / Enregistrer).

Templates à vérifier (les noms peuvent varier selon la langue / la version de Clerk) :

| Catégorie (ex.) | Templates à contrôler |
|-----------------|------------------------|
| **Security**    | Password reset (Réinitialisation mot de passe), Account locked (Compte verrouillé), Magic link, etc. |
| **Verification**| Verification email, Email verification code, etc. |
| **Organization**| Invitation to organization (Invitation à l’organisation), etc. |
| **Autres**      | Tous les autres e-mails listés dans la section Emails. |

Si un template n’a pas de champ From/Reply-to modifiable, Clerk utilise parfois les paramètres globaux : cherche une option du type **「Default sender」** ou **「Email sender」** dans **Configure** → **Settings** ou **Emails** et renseigne-y la même adresse From et Reply-to.

### Étape A3 – Vérification

- [ ] Chaque template modifiable a **From** = `noreply@ia-restaurant-manager.com` et **Reply-to** = `support@ia-restaurant-manager.com` (ou les paramètres globaux sont définis ainsi).

---

## Partie B – Mail « Compte verrouillé » envoyé en français (Resend)

Ce mail est en lecture seule chez Clerk. L’app l’envoie déjà en français via Resend quand Clerk déclenche le webhook. Il suffit de configurer Clerk et Vercel.

### Étape B1 – Vérifier l’endpoint webhook en prod

1. Dans Clerk : **Configure** → **Webhooks** (menu gauche).
2. Ouvre l’endpoint qui pointe vers ton API (ou crée-en un).
3. **Endpoint URL** doit être : **`https://ia-restaurant-manager.com/api/webhooks/clerk`**.
4. Statut : **Enabled** (activé). Enregistre si tu as changé l’URL.

### Étape B2 – S’abonner à l’événement e-mail

1. Dans la même page de l’endpoint, ouvre **Subscribe to events** / **Event Catalog**.
2. Cherche un événement du type **email** (souvent **`email.created`**).
3. Coche cet événement pour cet endpoint.
4. Enregistre.

### Étape B3 – Désactiver l’envoi du mail par Clerk (Compte verrouillé)

1. **Configure** → **Customization** → **Emails**.
2. Ouvre le template **Compte verrouillé** (Account Locked).
3. Désactive le toggle **「Delivered by Clerk」** (ou « Envoyé par Clerk »).
4. Enregistre.

Résultat : Clerk ne envoie plus ce mail lui-même ; il envoie un webhook à ton app, et l’app envoie le mail en français via Resend (code déjà en place).

### Étape B4 – Variable EMAIL_FROM sur Vercel

1. Va sur [vercel.com](https://vercel.com) → ton projet → **Settings** → **Environment Variables**.
2. Ajoute (ou modifie) :
   - **Key** : `EMAIL_FROM`
   - **Value** : `noreply@ia-restaurant-manager.com`
   - **Environments** : coche **Production** (et Preview si tu veux).
3. **Save**.
4. Fais un **Redeploy** du dernier déploiement (Deployments → ⋯ → Redeploy) pour que la variable soit prise en compte.

*(Optionnel : `NEXT_PUBLIC_APP_NAME` = `IA Restaurant Manager` est déjà utilisé par le code pour le pied de page du mail ; tu peux le laisser tel quel s’il est déjà défini.)*

### Étape B5 – Vérification

- [ ] Webhook Clerk pointe vers `https://ia-restaurant-manager.com/api/webhooks/clerk` et est activé.
- [ ] L’événement **email** (ex. `email.created`) est coché pour cet endpoint.
- [ ] « Delivered by Clerk » est **désactivé** pour le template Compte verrouillé.
- [ ] `EMAIL_FROM` = `noreply@ia-restaurant-manager.com` en Production sur Vercel, et un redeploy a été fait.

Pour tester : après un verrouillage de compte, vérifier dans Clerk → Webhooks → **Message Attempts** que la requête vers ton endpoint a reçu un **200**, et que l’utilisateur a bien reçu le mail en français (expéditeur = `noreply@ia-restaurant-manager.com` si Resend a le domaine vérifié).

---

## Récapitulatif (sans toucher au code)

| Partie | Où | Quoi faire |
|--------|-----|------------|
| **A** | Clerk → Configure → Customization → Emails | Pour chaque template : From = noreply@ia-restaurant-manager.com, Reply-to = support@ia-restaurant-manager.com |
| **B1–B3** | Clerk → Webhooks + Emails | URL prod, événement email, désactiver « Delivered by Clerk » pour Compte verrouillé |
| **B4** | Vercel → Settings → Environment Variables | Ajouter EMAIL_FROM = noreply@ia-restaurant-manager.com (Production), puis Redeploy |

Aucun fichier du projet n’a besoin d’être modifié ; le webhook et le template Resend sont déjà en place dans l’app.
