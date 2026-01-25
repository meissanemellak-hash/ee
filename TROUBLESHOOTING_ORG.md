# 🔧 Diagnostic - Erreur création organisation

## Vérifications à faire

### 1. Vérifier les logs du serveur
Dans le terminal où `npm run dev` tourne, cherchez les lignes qui commencent par :
- `Clerk API Error:`
- `Database Error:`
- `Error creating organization:`

Ces logs vous donneront l'erreur exacte.

### 2. Vérifier la configuration Clerk

#### Dans Clerk Dashboard :
1. Allez dans votre application Clerk
2. **Configure** → **Organization**
3. Vérifiez que :
   - ✅ **Enable Organizations** est activé
   - ✅ **Allow users to create organizations** est activé
   - ✅ **Allow users to join organizations** est activé

#### Vérifier les clés API :
Dans `.env.local`, vérifiez que vous avez :
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 3. Vérifier la base de données

#### Test de connexion :
```bash
npm run db:studio
```

Si Prisma Studio s'ouvre, la connexion DB fonctionne.

#### Vérifier les migrations :
```bash
npm run db:migrate
```

### 4. Erreurs courantes et solutions

#### Erreur : "organizations feature is not enabled"
**Solution** : Activez les organizations dans Clerk Dashboard (voir étape 2)

#### Erreur : "Unique constraint violation"
**Solution** : L'organisation existe déjà. Vérifiez dans Prisma Studio ou supprimez-la.

#### Erreur : "Database connection failed"
**Solution** : Vérifiez `DATABASE_URL` dans `.env.local`

#### Erreur : "Unauthorized" ou "Forbidden"
**Solution** : Vérifiez que vous êtes bien connecté et que les clés Clerk sont correctes.

## Solution rapide

Si rien ne fonctionne, créez l'organisation manuellement :

1. **Dans Clerk Dashboard** :
   - Allez dans **Organizations**
   - Cliquez sur **Create Organization**
   - Donnez un nom (ex: "Ma Chaîne")
   - Copiez l'ID de l'organisation (commence par `org_...`)

2. **Dans Prisma Studio** :
   ```bash
   npm run db:studio
   ```
   - Cliquez sur `Organization`
   - Cliquez sur **Add record**
   - Remplissez :
     - `name` : Le nom de votre organisation
     - `clerkOrgId` : L'ID copié depuis Clerk
     - `shrinkPct` : `0.1`
   - Cliquez sur **Save**

3. **Rechargez la page** du dashboard
