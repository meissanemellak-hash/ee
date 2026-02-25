# Activer le Row Level Security (RLS) sur Supabase

Le **Security Advisor** Supabase signale que le RLS est désactivé sur les tables `public`. Ce script active le RLS sur toutes les tables concernées sans casser l’application (Clerk + Prisma).

---

## Pourquoi ces politiques ?

- L’app se connecte avec le rôle **postgres** (connexion Supabase dans `DATABASE_URL`).
- Les politiques créées autorisent **uniquement** ce rôle à accéder aux données.
- Les autres rôles (anon, authenticated, etc.) n’ont aucun accès.
- L’application continue de fonctionner normalement ; le Security Advisor ne signale plus d’erreurs.

---

## Étapes

### 1. Vérifier le rôle utilisé par l’app

Dans ta **DATABASE_URL** Supabase, le rôle est le premier élément après `postgresql://` :

- `postgresql://**postgres**:password@...` → rôle **postgres**
- `postgresql://**postgres.cixqjwlcttmlusohwfat**:password@...` → rôle **postgres.cixqjwlcttmlusohwfat**

Si tu utilises un rôle **différent de `postgres`** (ex. avec le pooler), ouvre `prisma/enable-rls.sql` et remplace **toutes** les occurrences de `TO postgres` par `TO ton_role` (ex. `TO "postgres.cixqjwlcttmlusohwfat"`).

### 2. Exécuter le script dans Supabase

1. Va sur [supabase.com/dashboard](https://supabase.com/dashboard) → ton projet **IA Manager Restaurant**.
2. Menu de gauche → **SQL Editor**.
3. **New query**.
4. Copie-colle le contenu de **`prisma/enable-rls.sql`**.
5. Clique sur **Run** (ou Ctrl+Entrée).

Tu dois voir 13 lignes du type `Success. No rows returned`.

### 3. Vérifier

1. Menu de gauche → **Advisors** → **Security Advisor**.
2. Onglet **Errors** : les erreurs « RLS Disabled in Public » doivent avoir disparu (ou cliquer sur **Rerun linter** / **Refresh**).
3. Teste l’app (connexion, dashboard, ventes, etc.) pour confirmer que tout fonctionne.

---

## En cas d’erreur « permission denied » après le script

Si l’app ne peut plus accéder aux données, c’est que le rôle de connexion n’est pas `postgres`. Refais l’étape 1 et réapplique le script en utilisant le bon rôle. Si tu as déjà exécuté le script, supprime les politiques et refais :

```sql
-- Exemple pour une table (à répéter pour chaque table si besoin)
DROP POLICY IF EXISTS "rls_organizations_app" ON public.organizations;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
```

Puis réexécute `enable-rls.sql` avec le bon rôle.

---

## Tables concernées

- `organizations`, `restaurants`, `products`, `ingredients`, `product_ingredients`
- `sales`, `inventory`, `forecasts`, `recommendations`, `alerts`, `planned_staffing`
- `subscriptions`, `_prisma_migrations`
