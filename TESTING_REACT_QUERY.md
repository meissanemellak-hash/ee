# Guide de test - React Query

## ✅ Ce qui a été mis en place

### 1. Configuration React Query
- ✅ Provider configuré dans `app/layout.tsx`
- ✅ Cache configuré (5 min staleTime, 10 min gcTime)
- ✅ Devtools optionnels (si installés)

### 2. Hooks personnalisés
- ✅ `useRestaurants(page, limit)` - Liste paginée
- ✅ `useRestaurant(id)` - Détails
- ✅ `useCreateRestaurant()` - Création
- ✅ `useUpdateRestaurant()` - Modification
- ✅ `useDeleteRestaurant()` - Suppression

### 3. Composants UI
- ✅ `RestaurantListSkeleton` - Skeleton de chargement
- ✅ `Pagination` - Composant de pagination

### 4. Page migrée
- ✅ `/dashboard/restaurants` - Utilise maintenant React Query

## 🧪 Comment tester

### 1. Démarrer le serveur de développement

```bash
npm run dev
```

### 2. Tester la page Restaurants

1. **Aller sur** `/dashboard/restaurants`
2. **Observer le skeleton** : Si les données se chargent, vous verrez un skeleton avec 6 cards au lieu d'un spinner
3. **Tester la pagination** : Si vous avez plus de 12 restaurants, vous verrez les boutons de pagination en bas
4. **Tester le cache** :
   - Naviguez vers une autre page
   - Revenez sur `/dashboard/restaurants`
   - Les données devraient s'afficher instantanément (depuis le cache)
5. **Tester la suppression** :
   - Cliquez sur l'icône poubelle d'un restaurant
   - Confirmez la suppression
   - La liste devrait se rafraîchir automatiquement

### 3. Tester les DevTools (optionnel)

Si vous voulez voir les DevTools React Query :

```bash
npm install @tanstack/react-query-devtools --save-dev
```

Puis redémarrez le serveur. Vous verrez une icône React Query en bas à gauche de l'écran.

### 4. Vérifier les optimisations

#### Cache
- Ouvrez les DevTools du navigateur (F12)
- Allez dans l'onglet "Network"
- Chargez la page restaurants une première fois
- Naviguez ailleurs puis revenez
- Vous ne devriez **pas** voir de nouvelle requête vers `/api/restaurants` (données depuis le cache)

#### Pagination
- Si vous avez plus de 12 restaurants, vérifiez que :
  - Seulement 12 restaurants s'affichent
  - Les boutons de pagination apparaissent
  - Cliquer sur "2" charge la page suivante
  - L'URL ne change pas (pagination côté client)

#### Skeletons
- Ouvrez les DevTools
- Allez dans l'onglet "Network"
- Activez "Slow 3G" dans les throttling
- Rechargez la page
- Vous devriez voir le skeleton pendant le chargement

## 🔍 Points à vérifier

### ✅ Fonctionnalités
- [ ] La page restaurants se charge correctement
- [ ] Le skeleton s'affiche pendant le chargement
- [ ] Les restaurants s'affichent correctement
- [ ] La pagination fonctionne (si > 12 restaurants)
- [ ] La suppression fonctionne et rafraîchit la liste
- [ ] Le cache fonctionne (pas de requête au retour sur la page)

### ✅ Performance
- [ ] Pas de requêtes inutiles (vérifier dans Network tab)
- [ ] Chargement rapide grâce au cache
- [ ] Skeleton fluide (pas de flash de contenu)

### ✅ UX
- [ ] Skeleton au lieu de spinner (meilleure UX)
- [ ] Pagination intuitive
- [ ] Messages d'erreur clairs si problème

## 🐛 Problèmes possibles

### Le skeleton ne s'affiche pas
- Vérifiez que `RestaurantListSkeleton` est bien importé
- Vérifiez que `isLoading` est bien utilisé

### La pagination ne fonctionne pas
- Vérifiez que l'API retourne bien `{ restaurants, total, page, limit, totalPages }`
- Vérifiez que `useRestaurants(page, limit)` est appelé avec les bons paramètres

### Erreur "Cannot read property 'restaurants' of undefined"
- L'API retourne peut-être encore l'ancien format (tableau)
- Vérifiez que vous passez `page` et `limit` dans `useRestaurants()`

## 📝 Notes

- Le cache est actif pendant 5 minutes
- Les données restent en cache 10 minutes après non-utilisation
- Les requêtes échouées sont retentées automatiquement 1 fois
- Le refetch automatique au focus de la fenêtre est désactivé (pour économiser les requêtes)

## 🚀 Prochaines étapes

Une fois que tout fonctionne, vous pouvez :
1. Migrer d'autres pages vers React Query (products, sales, etc.)
2. Ajouter la pagination aux autres listes
3. Implémenter des optimistic updates pour les mutations
