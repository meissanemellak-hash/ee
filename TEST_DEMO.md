# Guide de test du mode démo

## Prérequis

Avant de tester le mode démo, assurez-vous d'avoir :

1. ✅ **Base de données configurée** (PostgreSQL via Supabase ou local)
2. ✅ **Variables d'environnement** configurées dans `.env.local`
3. ✅ **Clerk configuré** avec une application et les clés API
4. ✅ **Migrations Prisma** exécutées

## Étapes pour tester

### 1. Vérifier la configuration

```bash
# Vérifier que les dépendances sont installées
npm install

# Vérifier que le client Prisma est généré
npm run db:generate

# Vérifier que les migrations sont à jour
npm run db:migrate
```

### 2. Lancer l'application

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

### 3. Créer un compte et une organisation

1. Allez sur `http://localhost:3000`
2. Cliquez sur "Sign up" (ou "Sign in" si vous avez déjà un compte)
3. Créez un compte Clerk
4. **Important** : Créez une organisation dans Clerk (ou rejoignez-en une)
   - Dans Clerk Dashboard → Organizations → Create Organization
   - Ou via l'interface si vous avez configuré les organizations

### 4. Synchroniser l'organisation avec la base de données

**Option A : Via webhook Clerk (automatique)**

Si vous avez configuré le webhook Clerk :
- Le webhook `POST /api/webhooks/clerk` sera appelé automatiquement
- L'organisation sera créée dans la DB

**Option B : Manuellement (pour test rapide)**

Si le webhook n'est pas configuré, vous pouvez créer l'organisation manuellement :

```sql
-- Récupérez votre clerkOrgId depuis Clerk Dashboard
INSERT INTO organizations (id, name, "clerk_org_id", "shrink_pct", "is_demo", "created_at", "updated_at")
VALUES (
  'org_123',
  'Mon Organisation',
  'org_xxxxxxxxxxxxx', -- Votre Clerk Org ID
  0.1,
  false,
  NOW(),
  NOW()
);
```

Ou utilisez Prisma Studio :

```bash
npm run db:studio
```

### 5. Accéder à la page démo

1. Connectez-vous à l'application
2. Dans la sidebar, cliquez sur **"Mode Démo"**
3. Ou allez directement sur `http://localhost:3000/dashboard/demo`

### 6. Générer les données de démonstration

1. Sur la page démo, vous verrez deux cartes :
   - **Générer les données de démonstration**
   - **Supprimer les données de démonstration**

2. Cliquez sur le bouton **"Load demo data"**

3. Attendez la génération (peut prendre 1-2 minutes) :
   - 1 organisation de démo
   - 3 restaurants
   - 30 produits avec recettes
   - 25 ingrédients avec packs
   - 90 jours de ventes
   - Stocks initiaux
   - Recommandations générées automatiquement
   - Alertes générées automatiquement

4. Un message de succès s'affichera avec le résumé

### 7. Explorer les données générées

Une fois les données générées, vous pouvez :

#### Dashboard
- Allez sur `/dashboard`
- Vous verrez les statistiques :
  - 3 restaurants
  - Ventes sur 90 jours
  - Recommandations en attente
  - Alertes actives

#### Restaurants
- Allez sur `/dashboard/restaurants`
- Vous verrez les 3 restaurants :
  - Restaurant Paris Centre
  - Restaurant Lyon Part-Dieu
  - Restaurant Marseille Vieux-Port

#### Recommandations
- Allez sur `/dashboard/recommendations`
- Vous verrez les recommandations BOM générées
- Cliquez sur "Voir les détails" pour voir :
  - Liste des ingrédients à commander
  - Quantités avec packs
  - Fournisseurs
  - Économies estimées

#### Alertes
- Allez sur `/dashboard/alerts`
- Vous verrez les alertes générées (surstock, rupture, etc.)

#### Ventes
- Allez sur `/dashboard/sales`
- Vous pouvez analyser les 90 jours de ventes générées

### 8. Tester la génération de nouvelles recommandations

1. Allez sur `/dashboard/recommendations`
2. Dans la section "Générer de nouvelles recommandations" :
   - Sélectionnez un restaurant
   - Cliquez sur "Générer"
3. Les nouvelles recommandations apparaîtront dans la liste

### 9. Supprimer les données de démo

Si vous voulez recommencer :

1. Allez sur `/dashboard/demo`
2. Cliquez sur **"Supprimer les données démo"**
3. Confirmez la suppression
4. Toutes les données de démonstration seront supprimées

## Vérification des données générées

### Via Prisma Studio

```bash
npm run db:studio
```

Vous pouvez vérifier :
- `organizations` : 1 organisation avec `isDemo = true`
- `restaurants` : 3 restaurants
- `products` : 30 produits
- `ingredients` : 25 ingrédients avec `packSize` et `supplierName`
- `product_ingredients` : Recettes (BOM)
- `inventory` : Stocks par restaurant
- `sales` : ~90 jours × 3 restaurants × ~40 ventes/jour = ~10 800 ventes
- `recommendations` : Recommandations BOM générées
- `alerts` : Alertes générées

### Via l'interface

- Dashboard : Statistiques globales
- Restaurants : Liste des restaurants avec stats
- Recommandations : Liste avec détails complets
- Alertes : Liste des alertes actives

## Dépannage

### Erreur : "Organization not found"

**Solution** : L'organisation n'existe pas dans la DB. Créez-la manuellement ou configurez le webhook Clerk.

### Erreur : "Unauthorized"

**Solution** : Vérifiez que vous êtes connecté et que votre organisation est bien synchronisée.

### Erreur lors de la génération

**Solution** : 
- Vérifiez les logs dans la console
- Assurez-vous que la base de données est accessible
- Vérifiez que les migrations sont à jour

### Les recommandations ne s'affichent pas

**Solution** :
- Vérifiez que la génération s'est bien terminée
- Vérifiez les filtres sur la page recommandations
- Regardez dans Prisma Studio si les recommandations existent

## Notes importantes

1. **Données de démo** : Les données générées sont marquées avec `isDemo = true`
2. **Suppression** : La suppression supprime TOUT (organisation, restaurants, produits, ventes, etc.)
3. **Performance** : La génération de 90 jours de ventes peut prendre 1-2 minutes
4. **Recommandations** : Elles sont générées automatiquement après la création des données

## Prochaines étapes après le test

Une fois le mode démo testé :

1. ✅ Vérifier que les recommandations BOM fonctionnent
2. ✅ Vérifier l'affichage des détails (packs, fournisseurs)
3. ✅ Tester les actions (Accepter/Rejeter)
4. ✅ Vérifier les alertes générées
5. ✅ Explorer le dashboard avec les vraies données
