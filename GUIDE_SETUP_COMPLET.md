# Guide de configuration complet - Étape par étape

## ✅ Étape 1 : Vérifications initiales

- [x] Node.js installé (v20.19.6)
- [x] npm installé (v10.8.2)
- [x] Dépendances installées

---

## 📊 Étape 2 : Créer un compte Supabase (Base de données)

### 2.1 Créer le compte
1. Allez sur [https://supabase.com](https://supabase.com)
2. Cliquez sur **"Start your project"** ou **"Sign up"**
3. Créez un compte (Google, GitHub, ou email)

### 2.2 Créer un nouveau projet
1. Une fois connecté, cliquez sur **"New Project"**
2. Remplissez les informations :
   - **Name** : `restaurant-ops` (ou autre nom)
   - **Database Password** : Créez un mot de passe fort (⚠️ **SAVEZ-LE**)
   - **Region** : Choisissez la région la plus proche (ex: `West Europe (Paris)`)
   - **Pricing Plan** : Free (suffisant pour commencer)
3. Cliquez sur **"Create new project"**
4. ⏳ Attendez 2-3 minutes que le projet soit créé

### 2.3 Récupérer la connection string
1. Dans votre projet Supabase, allez dans **Settings** (icône ⚙️ en bas à gauche)
2. Cliquez sur **Database** dans le menu de gauche
3. Descendez jusqu'à **"Connection string"**
4. Sélectionnez **"URI"** (pas "Session mode")
5. Copiez la connection string qui ressemble à :
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
6. ⚠️ **Remplacez `[YOUR-PASSWORD]`** par le mot de passe que vous avez créé à l'étape 2.2
7. ✅ **SAUVEGARDEZ cette chaîne**, vous en aurez besoin à l'étape 4

---

## 🔐 Étape 3 : Créer un compte Clerk (Authentification)

### 3.1 Créer le compte
1. Allez sur [https://clerk.com](https://clerk.com)
2. Cliquez sur **"Sign up"** ou **"Get started"**
3. Créez un compte (Google, GitHub, ou email)

### 3.2 Créer une nouvelle application
1. Une fois connecté, cliquez sur **"Create Application"**
2. Remplissez les informations :
   - **Application name** : `AI Restaurant Manager` (ou autre)
   - **Authentication providers** : Laissez par défaut (Email, Google, etc.)
3. Cliquez sur **"Create Application"**

### 3.3 Activer les Organizations
1. Dans votre application Clerk, allez dans **"Configure"** → **"Organization"**
2. Activez **"Enable Organizations"**
3. Configurez les paramètres :
   - **Allow users to create organizations** : ✅ Activé
   - **Allow users to join organizations** : ✅ Activé
4. Cliquez sur **"Save"**

### 3.4 Récupérer les clés API
1. Allez dans **"API Keys"** dans le menu de gauche
2. Vous verrez deux clés :
   - **Publishable key** : Commence par `pk_test_...` ou `pk_live_...`
   - **Secret key** : Commence par `sk_test_...` ou `sk_live_...`
3. ✅ **Copiez ces deux clés**, vous en aurez besoin à l'étape 4

### 3.5 (Optionnel) Configurer le webhook pour auto-sync
1. Allez dans **"Webhooks"** dans le menu de gauche
2. Cliquez sur **"Add Endpoint"**
3. Remplissez :
   - **Endpoint URL** : `http://localhost:3000/api/webhooks/clerk` (pour le dev local)
   - **Events** : Sélectionnez :
     - `organization.created`
     - `organization.updated`
     - `organization.deleted`
4. Cliquez sur **"Create"**
5. Copiez le **"Signing secret"** (commence par `whsec_...`)
6. ✅ **SAUVEGARDEZ ce secret**, vous en aurez besoin à l'étape 4

---

## ⚙️ Étape 4 : Créer le fichier .env.local

### 4.1 Créer le fichier
Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@db.xxxxx.supabase.co:5432/postgres?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx

# Clerk Webhook (optionnel mais recommandé)
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4.2 Remplacer les valeurs
- **DATABASE_URL** : Remplacez par la connection string de Supabase (étape 2.3)
- **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY** : Remplacez par la clé publishable de Clerk (étape 3.4)
- **CLERK_SECRET_KEY** : Remplacez par la clé secrète de Clerk (étape 3.4)
- **CLERK_WEBHOOK_SECRET** : Remplacez par le secret du webhook (étape 3.5) - optionnel
- **NEXT_PUBLIC_APP_URL** : Laissez tel quel pour le développement local

### 4.3 Vérifier le fichier
Le fichier doit être à la racine du projet, au même niveau que `package.json`

---

## 🗄️ Étape 5 : Créer les tables dans la base de données

### 5.1 Générer le client Prisma
```bash
npm run db:generate
```

### 5.2 Créer les migrations
```bash
npm run db:migrate
```

Vous devrez donner un nom à la migration (ex: `init`)

### 5.3 Vérifier dans Supabase
1. Allez dans Supabase → **Table Editor**
2. Vous devriez voir toutes les tables créées :
   - `organizations`
   - `restaurants`
   - `products`
   - `ingredients`
   - `sales`
   - etc.

---

## 🚀 Étape 6 : Lancer l'application

### 6.1 Démarrer le serveur
```bash
npm run dev
```

### 6.2 Vérifier que ça fonctionne
1. Ouvrez votre navigateur sur `http://localhost:3000`
2. Vous devriez voir la page de connexion Clerk
3. ✅ Si c'est le cas, tout fonctionne !

---

## 👤 Étape 7 : Créer votre compte et organisation

### 7.1 Créer un compte
1. Sur `http://localhost:3000`, cliquez sur **"Sign up"**
2. Créez un compte avec votre email
3. Vérifiez votre email et confirmez

### 7.2 Créer une organisation
1. Une fois connecté, Clerk vous proposera de créer une organisation
2. Cliquez sur **"Create Organization"**
3. Donnez un nom (ex: `Ma Chaîne de Restaurants`)
4. Cliquez sur **"Create"**

### 7.3 Synchroniser avec la base de données

**Option A : Si vous avez configuré le webhook (recommandé)**
- L'organisation sera créée automatiquement dans la DB
- ✅ Rien à faire !

**Option B : Si le webhook n'est pas configuré**
1. Récupérez votre `clerkOrgId` :
   - Dans Clerk Dashboard → Organizations
   - Cliquez sur votre organisation
   - Copiez l'ID (ex: `org_xxxxxxxxxxxxx`)
2. Créez l'organisation dans la DB :
   ```bash
   npm run db:studio
   ```
3. Dans Prisma Studio :
   - Cliquez sur `Organization`
   - Cliquez sur **"Add record"**
   - Remplissez :
     - `id` : Généré automatiquement (ou utilisez `cuid()`)
     - `name` : Le nom de votre organisation
     - `clerkOrgId` : L'ID copié depuis Clerk
     - `shrinkPct` : `0.1`
     - `isDemo` : `false`
     - `createdAt` : Laissez par défaut
     - `updatedAt` : Laissez par défaut
   - Cliquez sur **"Save 1 change"**

---

## 🎮 Étape 8 : Tester le mode démo

### 8.1 Accéder à la page démo
1. Une fois connecté, dans la sidebar, cliquez sur **"Mode Démo"**
2. Ou allez directement sur `http://localhost:3000/dashboard/demo`

### 8.2 Générer les données
1. Cliquez sur le bouton **"Load demo data"**
2. ⏳ Attendez 1-2 minutes (la génération peut prendre du temps)
3. Un message de succès s'affichera avec :
   - Nombre de restaurants créés
   - Nombre de produits
   - Nombre d'ingrédients

### 8.3 Explorer les données
1. **Dashboard** (`/dashboard`) :
   - Vous verrez 3 restaurants
   - Statistiques de ventes
   - Recommandations en attente
   - Alertes actives

2. **Restaurants** (`/dashboard/restaurants`) :
   - Restaurant Paris Centre
   - Restaurant Lyon Part-Dieu
   - Restaurant Marseille Vieux-Port

3. **Recommandations** (`/dashboard/recommendations`) :
   - Recommandations BOM avec détails complets
   - Ingrédients à commander
   - Packs et fournisseurs
   - Économies estimées

4. **Alertes** (`/dashboard/alerts`) :
   - Alertes de surstock
   - Alertes de rupture
   - Alertes de risque

5. **Ventes** (`/dashboard/sales`) :
   - 90 jours de données
   - Analyses disponibles

---

## ✅ Checklist finale

- [ ] Compte Supabase créé
- [ ] DATABASE_URL récupéré et ajouté dans .env.local
- [ ] Compte Clerk créé
- [ ] Organizations activées dans Clerk
- [ ] Clés API Clerk ajoutées dans .env.local
- [ ] Webhook Clerk configuré (optionnel)
- [ ] Fichier .env.local créé et complété
- [ ] Migrations Prisma exécutées
- [ ] Application lancée (`npm run dev`)
- [ ] Compte et organisation créés
- [ ] Organisation synchronisée avec la DB
- [ ] Mode démo testé avec succès

---

## 🆘 Dépannage

### Erreur : "Cannot connect to database"
- Vérifiez que DATABASE_URL est correct dans .env.local
- Vérifiez que le mot de passe est bien remplacé (pas `[YOUR-PASSWORD]`)
- Vérifiez que Supabase est accessible

### Erreur : "Invalid Clerk key"
- Vérifiez que les clés Clerk sont correctes
- Vérifiez que vous utilisez les clés de test (`pk_test_...` et `sk_test_...`)

### Erreur : "Organization not found"
- Vérifiez que l'organisation existe dans la DB
- Utilisez Prisma Studio pour vérifier : `npm run db:studio`

### Erreur lors de la génération des données démo
- Vérifiez les logs dans la console du terminal
- Vérifiez que la DB est accessible
- Vérifiez que les migrations sont à jour

---

## 🎉 Félicitations !

Si vous avez suivi toutes les étapes, vous devriez maintenant avoir :
- ✅ Une application fonctionnelle
- ✅ Des données de démonstration complètes
- ✅ Des recommandations BOM générées
- ✅ Un système prêt à être testé

Bon test ! 🚀
