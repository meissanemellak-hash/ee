# React Query - Guide d'utilisation

Ce projet utilise **React Query** (TanStack Query) pour la gestion des requêtes API, le cache et l'optimisation des performances.

## Configuration

Le provider React Query est configuré dans `app/layout.tsx` avec les options suivantes :
- **staleTime** : 5 minutes (données considérées fraîches pendant 5 min)
- **gcTime** : 10 minutes (données gardées en cache 10 min après non-utilisation)
- **retry** : 1 tentative automatique en cas d'erreur
- **refetchOnWindowFocus** : false (pas de refetch automatique au focus)

## Hooks disponibles

### Restaurants
- `useRestaurants(page, limit)` - Liste paginée des restaurants
- `useRestaurant(id)` - Détails d'un restaurant
- `useCreateRestaurant()` - Créer un restaurant
- `useUpdateRestaurant()` - Modifier un restaurant
- `useDeleteRestaurant()` - Supprimer un restaurant

### Products
- `useProducts(page, limit)` - Liste paginée des produits
- `useProduct(id)` - Détails d'un produit
- `useCreateProduct()` - Créer un produit
- `useUpdateProduct()` - Modifier un produit
- `useDeleteProduct()` - Supprimer un produit

### Sales
- `useSales(page, limit, filters)` - Liste paginée des ventes avec filtres
- `useSale(id)` - Détails d'une vente
- `useCreateSale()` - Créer une vente
- `useUpdateSale()` - Modifier une vente
- `useDeleteSale()` - Supprimer une vente

## Exemple d'utilisation

```tsx
'use client'

import { useRestaurants } from '@/lib/react-query/hooks/use-restaurants'
import { RestaurantListSkeleton } from '@/components/ui/skeletons/restaurant-list-skeleton'

export default function RestaurantsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = useRestaurants(page, 12)

  if (isLoading) return <RestaurantListSkeleton />
  if (error) return <div>Erreur: {error.message}</div>

  const restaurants = data?.restaurants || []

  return (
    <div>
      {restaurants.map(restaurant => (
        <div key={restaurant.id}>{restaurant.name}</div>
      ))}
    </div>
  )
}
```

## Mutations

Les mutations invalident automatiquement les queries concernées et affichent des toasts :

```tsx
const deleteRestaurant = useDeleteRestaurant()

const handleDelete = () => {
  deleteRestaurant.mutate(restaurantId, {
    onSuccess: () => {
      // La liste des restaurants sera automatiquement rafraîchie
      console.log('Restaurant supprimé !')
    },
  })
}
```

## Skeletons

Des composants skeleton sont disponibles pour améliorer l'UX pendant le chargement :
- `RestaurantListSkeleton`
- `ProductListSkeleton`
- `SaleListSkeleton`
- `TableSkeleton`

## Pagination

Le composant `Pagination` est disponible pour les listes paginées :

```tsx
import { Pagination } from '@/components/ui/pagination'

<Pagination
  currentPage={page}
  totalPages={data.totalPages}
  onPageChange={setPage}
/>
```

## Avantages

✅ **Cache intelligent** : Les données sont mises en cache automatiquement
✅ **Refetch automatique** : Les données sont rafraîchies quand nécessaire
✅ **Optimistic updates** : Possibilité de mettre à jour l'UI avant la réponse serveur
✅ **Gestion d'erreurs** : Retry automatique et gestion d'erreurs centralisée
✅ **Performance** : Moins de requêtes inutiles grâce au cache
✅ **UX améliorée** : Skeletons au lieu de spinners
