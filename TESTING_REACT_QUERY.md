# Guide de test - React Query

## ✅ Ce qui a été mis en place

### 1. Configuration React Query
- ✅ Provider configuré dans `app/layout.tsx`
- ✅ Cache configuré (5 min staleTime, 10 min gcTime)
- ✅ Devtools optionnels (si installés)

### 2. Hooks personnalisés par domaine

#### Restaurants (`lib/react-query/hooks/use-restaurants.ts`)
- ✅ `useRestaurants(page, limit)` - Liste paginée
- ✅ `useRestaurant(id)` - Détails (avec _count, totalRevenue, recentSales)
- ✅ `useCreateRestaurant()` - Création
- ✅ `useUpdateRestaurant()` - Modification
- ✅ `useDeleteRestaurant()` - Suppression

#### Produits (`lib/react-query/hooks/use-products.ts`)
- ✅ `useProducts(page, limit, filters?)` - Liste avec filtres
- ✅ `useProduct(id)` - Détails
- ✅ `useCreateProduct()` - Création
- ✅ `useUpdateProduct()` - Modification
- ✅ `useDeleteProduct()` - Suppression
- ✅ `useProductIngredients(productId)` - Recette (ingrédients du produit)
- ✅ `useAddProductIngredient()` - Ajouter un ingrédient à la recette
- ✅ `useRemoveProductIngredient()` - Retirer un ingrédient de la recette

#### Ingrédients (`lib/react-query/hooks/use-ingredients.ts`)
- ✅ `useIngredients(filters?)` - Liste avec filtres
- ✅ `useIngredient(id)` - Détails
- ✅ `useCreateIngredient()` - Création
- ✅ `useUpdateIngredient()` - Modification
- ✅ `useDeleteIngredient()` - Suppression

#### Inventaire (`lib/react-query/hooks/use-inventory.ts`)
- ✅ `useInventory(restaurantId)` - Liste des stocks d'un restaurant
- ✅ `useCreateInventoryItem()` - Création
- ✅ `useUpdateInventoryItem()` - Modification
- ✅ `useDeleteInventoryItem()` - Suppression

#### Ventes (`lib/react-query/hooks/use-sales.ts`)
- ✅ `useSales(organizationId, filters?)` - Liste
- ✅ `useSalesAnalyze(organizationId, filters?)` - Analyse
- ✅ `useSale(id)` - Détail d'une vente
- ✅ `useCreateSale()` - Création
- ✅ `useUpdateSale()` - Modification
- ✅ `useDeleteSale()` - Suppression
- ✅ `useImportSales()` - Import CSV

#### Organisation & paramètres (`lib/react-query/hooks/use-organization.ts`)
- ✅ `useOrganizationData()` - Données de l'organisation (nom, shrinkPct, etc.)
- ✅ `useUpdateOrganization()` - Mise à jour des paramètres
- ✅ `useFixOrganizationId()` - Correction ID organisation
- ✅ `useCurrentUser()` - ID utilisateur côté serveur

#### Autres (forecasts, recommendations, alerts, reports)
- ✅ Hooks existants pour prévisions, recommandations, alertes, rapports

### 3. Pages migrées vers React Query

| Page | Hooks utilisés | Skeleton |
|------|----------------|----------|
| `/dashboard/restaurants` | useRestaurants, useDeleteRestaurant | ✅ RestaurantListSkeleton |
| `/dashboard/restaurants/[id]` | useRestaurant, useDeleteRestaurant (bouton Supprimer) | ✅ RestaurantDetailSkeleton |
| `/dashboard/restaurants/new` | useCreateRestaurant | — |
| `/dashboard/restaurants/[id]/edit` | useRestaurant, useUpdateRestaurant | ✅ |
| `/dashboard/restaurants/[id]/inventory` | useRestaurant, useIngredients, useInventory, mutations | ✅ InventoryPageSkeleton |
| `/dashboard/products` | useProducts, useDeleteProduct | (existant) |
| `/dashboard/products/new` | useCreateProduct | — |
| `/dashboard/products/[id]/edit` | useProduct, useIngredients, useProductIngredients, useUpdateProduct, useAddProductIngredient, useRemoveProductIngredient | ✅ |
| `/dashboard/ingredients` | useIngredients, useDeleteIngredient | (existant) |
| `/dashboard/ingredients/new` | useCreateIngredient | — |
| `/dashboard/ingredients/[id]/edit` | useIngredient, useUpdateIngredient | ✅ |
| `/dashboard/sales` | useRestaurants, useSales | (existant) |
| `/dashboard/sales/new` | useRestaurants, useProducts, useCreateSale | (existant) |
| `/dashboard/sales/[id]/edit` | useRestaurants, useProducts, useSale, useUpdateSale | (existant) |
| `/dashboard/sales/import` | useRestaurants, useImportSales | — |
| `/dashboard/sales/analyze` | useRestaurants, useSalesAnalyze | (existant) |
| `/dashboard/settings` | useOrganizationData, useCurrentUser, useUpdateOrganization, useFixOrganizationId | ✅ SettingsPageSkeleton |

### 4. Composants UI
- ✅ `RestaurantListSkeleton` - Liste restaurants
- ✅ `Skeleton` (shadcn) - Utilisé sur détail restaurant, edit, inventaire, produits edit, ingrédients edit, paramètres
- ✅ `Pagination` - Composant de pagination

## 🧪 Comment tester

### 1. Démarrer le serveur de développement

```bash
npm run dev
```

### 2. Tester le cache et les skeletons

1. **Restaurants** : Allez sur `/dashboard/restaurants` → skeleton puis liste. Naviguez ailleurs et revenez → données instantanées (cache).
2. **Détail restaurant** : Cliquez sur un restaurant → skeleton puis fiche. Le détail utilise le cache si la liste était déjà chargée.
3. **Inventaire** : Depuis un restaurant, « Gérer l'inventaire » → skeleton puis liste (useRestaurant + useIngredients + useInventory).
4. **Formulaires** : Nouveau restaurant / produit / ingrédient → submit via mutation, toast + redirection. Pas de fetch manuel.
5. **Paramètres** : `/dashboard/settings` → skeleton puis formulaire organisation + profil.

### 3. Tester les DevTools (optionnel)

```bash
npm install @tanstack/react-query-devtools --save-dev
```

Puis redémarrez le serveur. Icône React Query en bas à gauche.

### 4. Vérifier les optimisations

#### Cache
- Onglet Network (F12) : charger une page, naviguer ailleurs, revenir → pas de nouvelle requête pour la même ressource (cache 5 min).

#### Skeletons
- Slow 3G dans Network : recharger une page migrée → skeleton visible pendant le chargement.

#### Mutations
- Création / modification / suppression : toast de succès ou d’erreur, invalidation des queries concernées, liste ou détail à jour sans rechargement manuel.

## 🔍 Points à vérifier

### Fonctionnalités
- [x] Listes (restaurants, produits, ingrédients, ventes) se chargent et s’affichent correctement
- [x] Skeletons s’affichent pendant le chargement sur les pages concernées
- [x] Formulaires new/edit (restaurants, produits, ingrédients) envoient les données via les mutations et redirigent après succès
- [x] Détail restaurant et inventaire utilisent les hooks (useRestaurant, useInventory, etc.)
- [x] Paramètres : chargement org + user, sauvegarde et « Corriger l’ID » fonctionnent
- [x] Cache : retour sur une page déjà visitée = affichage immédiat (pas de refetch si données fraîches)
- [x] La suppression d’un restaurant fonctionne (API DELETE, useDeleteRestaurant, toast + redirection, liste rafraîchie)

### UX
- [x] Toasts cohérents (succès / erreur) sur les mutations
- [x] Pas de double toast d’erreur (gestion via useRef où nécessaire)
- [x] Boutons désactivés pendant les mutations (isPending)

## 🐛 Problèmes possibles

### Le skeleton ne s'affiche pas
- Vérifier que le composant Skeleton (ou le skeleton spécifique) est bien importé et que la condition de chargement utilise `isLoading` (ou équivalent) du hook.

### Données non à jour après une mutation
- Les hooks invalident les queries (invalidateQueries) dans `onSuccess`. Vérifier que la queryKey correspond bien à celle utilisée pour la liste ou le détail.

### Suppression restaurant (corrigé)
- L’API `DELETE /api/restaurants/[id]` est implémentée (clerkOrgId en query ou body). Le bouton « Supprimer » utilise `useDeleteRestaurant` ; la réponse est parsée en toute sécurité (pas d’erreur « Unexpected end of JSON input » sur réponse vide).

### Erreur "Cannot read property 'X' of undefined"
- Certaines API retournent `{ product }`, `{ ingredient }`, `{ restaurant }`. Les hooks ont été adaptés pour retourner directement l’entité (ex. `data.product`). Si une nouvelle API est ajoutée, vérifier le format de réponse.

## 📝 Notes

- Cache : staleTime 5 min, gcTime 10 min
- Les requêtes échouées sont retentées automatiquement (config par défaut React Query)
- Refetch au focus fenêtre peut être désactivé pour limiter les requêtes (déjà le cas selon la config)
- Pages avec formulaire : validation côté client avant `mutate()`, toasts d’erreur pour champs invalides

## 🚀 État de la migration

La migration React Query couvre désormais :
- **Restaurants** : liste, détail, new, edit, inventaire
- **Produits** : liste, new, edit (avec recette / ingrédients)
- **Ingrédients** : liste, new, edit
- **Ventes** : liste, analyse, new, edit, import
- **Paramètres** : organisation, profil utilisateur

Améliorations possibles pour plus tard :
- Optimistic updates sur les mutations critiques
- Préchargement (prefetch) sur des liens ou routes probables
- React Query Devtools en dev pour inspecter le cache

---

## Tests unitaires (Vitest + React Testing Library)

### Installation

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom vite-tsconfig-paths
```

### Lancer les tests

```bash
npm run test        # mode watch (relance à chaque modification)
npm run test:run    # une seule exécution (CI)
```

### Fichiers de test

- **Config** : `vitest.config.ts` (alias `@/`, env jsdom), `vitest.setup.ts` (jest-dom)
- **Utils** : `lib/react-query/__tests__/test-utils.tsx` (wrapper QueryClientProvider)
- **Hooks restaurants** : `lib/react-query/hooks/__tests__/use-restaurants.test.tsx`

### Ce qui est testé

- **useRestaurants** : appel fetch avec `clerkOrgId` et params de pagination, données retournées, cas d’erreur (fetch non ok).
- **useCreateRestaurant** : appel POST `/api/restaurants` avec le bon body (name, address, timezone, clerkOrgId), succès et données retournées.

Les tests mockent `@clerk/nextjs` (useOrganization) et `@/hooks/use-toast` pour isoler les hooks React Query.

---

*Dernière mise à jour : vérifications manuelles validées (listes, formulaires, détail, inventaire, paramètres, suppression restaurant).*
