# Guide de configuration et démarrage

## Prérequis

- Node.js 18+ et npm
- Compte Supabase (ou PostgreSQL local)
- Compte Clerk pour l'authentification

## Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# Database (Supabase ou PostgreSQL local)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configuration Clerk

1. Créez un compte sur [Clerk](https://clerk.com)
2. Créez une nouvelle application
3. Activez les **Organizations** dans les paramètres
4. Copiez les clés API dans `.env.local`

### 4. Configuration de la base de données

#### Option A : Supabase (recommandé)

1. Créez un projet sur [Supabase](https://supabase.com)
2. Récupérez la connection string dans Settings > Database
3. Ajoutez-la dans `.env.local` comme `DATABASE_URL`

#### Option B : PostgreSQL local

1. Installez PostgreSQL
2. Créez une base de données :
```bash
createdb restaurant_ops
```
3. Configurez `DATABASE_URL` dans `.env.local`

### 5. Initialiser la base de données

```bash
# Générer le client Prisma
npm run db:generate

# Créer les tables
npm run db:migrate
```

### 6. Lancer l'application

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## Première utilisation

### 1. Créer un compte

1. Allez sur `/sign-up`
2. Créez un compte
3. Créez une organisation (ou rejoignez-en une)

### 2. Synchroniser l'organisation avec la base de données

Après la création de l'organisation dans Clerk, vous devez la créer dans la base de données. 

Créez un script de synchronisation ou utilisez l'API Clerk pour créer automatiquement l'organisation lors de la première connexion.

### 3. Créer des données de base

#### Créer des restaurants

Via l'interface ou directement en base de données :

```sql
INSERT INTO restaurants (id, organization_id, name, address, timezone)
VALUES ('rest_1', 'org_id', 'Restaurant Paris Centre', '123 Rue de la Paix, 75001 Paris', 'Europe/Paris');
```

#### Créer des produits

```sql
INSERT INTO products (id, organization_id, name, category, unit_price)
VALUES ('prod_1', 'org_id', 'Burger Classique', 'Burger', 12.50);
```

#### Créer des ingrédients

```sql
INSERT INTO ingredients (id, organization_id, name, unit, cost_per_unit)
VALUES ('ing_1', 'org_id', 'Pain à burger', 'unité', 0.50);
```

#### Créer des recettes (liens produit-ingrédient)

```sql
INSERT INTO product_ingredients (id, product_id, ingredient_id, quantity_needed)
VALUES ('pi_1', 'prod_1', 'ing_1', 1);
```

#### Créer des stocks

```sql
INSERT INTO inventory (id, restaurant_id, ingredient_id, current_stock, min_threshold, max_threshold)
VALUES ('inv_1', 'rest_1', 'ing_1', 100, 50, 200);
```

### 4. Importer des ventes

1. Préparez un fichier CSV avec les colonnes :
   - `restaurant` (nom du restaurant)
   - `product` (nom du produit)
   - `quantity` (quantité vendue)
   - `amount` (montant total)
   - `date` (date de vente, format YYYY-MM-DD)
   - `hour` (heure de vente, 0-23)

2. Allez sur `/dashboard/sales/import`
3. Sélectionnez le restaurant et uploadez le CSV

## Structure des données CSV

Exemple de fichier CSV pour l'import des ventes :

```csv
restaurant,product,quantity,amount,date,hour
Restaurant Paris Centre,Burger Classique,5,62.50,2024-01-15,12
Restaurant Paris Centre,Burger Classique,3,37.50,2024-01-15,13
Restaurant Paris Centre,Burger Classique,8,100.00,2024-01-15,19
```

## Commandes utiles

```bash
# Développement
npm run dev

# Build de production
npm run build

# Lancer en production
npm start

# Accéder à Prisma Studio (interface graphique pour la DB)
npm run db:studio

# Linter
npm run lint
```

## Dépannage

### Erreur de connexion à la base de données

- Vérifiez que `DATABASE_URL` est correcte
- Vérifiez que la base de données est accessible
- Vérifiez les permissions de l'utilisateur

### Erreur d'authentification Clerk

- Vérifiez que les clés API sont correctes
- Vérifiez que les Organizations sont activées dans Clerk
- Vérifiez que l'URL de callback est configurée dans Clerk

### Erreur Prisma

- Exécutez `npm run db:generate` pour régénérer le client
- Vérifiez que les migrations sont à jour : `npm run db:migrate`
