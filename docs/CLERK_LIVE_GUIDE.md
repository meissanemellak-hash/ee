# Guide : Clerk en production (mode live) + webhook

## Partie 1 – Récupérer les clés API Clerk (Production)

### Étape 1.1 – Ouvrir Clerk

1. Va sur **https://dashboard.clerk.com**
2. Connecte-toi et sélectionne ton application (IA Restaurant Manager).

### Étape 1.2 – Passer en environnement Production

1. En haut à droite du dashboard, vérifie l’environnement : **Development** ou **Production**.
2. Si tu vois **Development**, clique dessus et choisis **Production** (ou **Switch to Production**).
3. Tu es maintenant en mode **Production** ; les clés affichées seront `pk_live_...` et `sk_live_...`.

### Étape 1.3 – Copier les clés API

1. Dans le menu de gauche : **Configure** → **API Keys** (ou **Settings** → **API Keys**).
2. Tu vois :
   - **Publishable key** : `pk_live_...` → tu en auras besoin pour Vercel (**NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**).
   - **Secret key** : clique sur **Show** / **Reveal** puis copie `sk_live_...` → pour Vercel (**CLERK_SECRET_KEY**).
3. Garde ces deux valeurs de côté (ou mets-les directement dans Vercel après la partie 2).

---

## Partie 2 – Créer le webhook Clerk (production)

### Étape 2.1 – Aller dans Webhooks

1. Toujours dans le dashboard Clerk (en **Production**).
2. Menu de gauche : **Configure** → **Webhooks** (ou **Developers** → **Webhooks**).

### Étape 2.2 – Ajouter un endpoint

1. Clique sur **Add endpoint** (ou **Create webhook**).
2. Dans le champ **Endpoint URL**, saisis exactement :
   ```
   https://ia-restaurant-manager.com/api/webhooks/clerk
   ```
   - En **https**, sans espace, sans slash à la fin.

### Étape 2.3 – Choisir les événements à écouter

Ton app utilise ces événements. Coche au minimum :

- **organization.created**
- **organization.updated**
- **organization.deleted**
- **email.created** (pour l’email « Compte verrouillé » envoyé via Resend)

Si l’interface propose des groupes d’événements, ouvre **Organizations** et **Emails** et sélectionne ceux listés ci-dessus.

### Étape 2.4 – Créer le webhook

1. Clique sur **Create** (ou **Add endpoint**).
2. La page du webhook s’affiche.

### Étape 2.5 – Récupérer le Signing secret

1. Sur la page du webhook créé, trouve la section **Signing secret** (ou **Secret**).
2. Clique sur **Reveal** / **Show** puis **Copy** pour copier la valeur (elle commence par `whsec_...`).
3. Cette valeur doit être mise dans Vercel en **CLERK_WEBHOOK_SECRET** (environnement **Production**).

---

## Partie 3 – Mettre à jour Vercel

### Étape 3.1 – Variables Clerk en Production

Dans **Vercel** → ton projet → **Settings** → **Environment Variables**, pour l’environnement **Production** :

| Variable | Valeur |
|----------|--------|
| **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY** | `pk_live_...` (copié à l’étape 1.3) |
| **CLERK_SECRET_KEY** | `sk_live_...` (copié à l’étape 1.3) |
| **CLERK_WEBHOOK_SECRET** | `whsec_...` (copié à l’étape 2.5) |

- Si les variables existent déjà : **Edit** et remplace par les valeurs live.
- Sinon : **Add** → saisir Key et Value, cocher **Production**.

### Étape 3.2 – Redéployer

1. **Deployments** → dernier déploiement → **Redeploy**.
2. Attends la fin du déploiement.

---

## Résumé des événements utilisés par ton app

| Événement | Rôle |
|-----------|------|
| **organization.created** | Création d’une organisation → enregistrement en base |
| **organization.updated** | Modification d’une organisation → mise à jour en base |
| **organization.deleted** | Suppression d’une organisation → suppression en base |
| **email.created** | Envoi d’emails Clerk (ex. compte verrouillé) → ton app envoie le mail en français via Resend |

---

## Vérification

- Inscription / connexion sur **https://ia-restaurant-manager.com** avec les clés live.
- Création d’une organisation : elle doit apparaître dans ta base.
- Dans Clerk → **Webhooks** → ton endpoint : tu peux voir les requêtes envoyées et leur statut (200 = OK).
