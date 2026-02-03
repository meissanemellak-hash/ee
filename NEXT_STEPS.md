# 🚀 Prochaines étapes - Plan d'action

## ✅ Ce qui est fait

1. ✅ **React Query configuré** - Provider, cache, hooks
2. ✅ **Hooks créés** - Restaurants, Products, Sales, Ingredients (et autres : forecasts, reports, alerts, recommendations)
3. ✅ **Skeletons** - Composants de chargement
4. ✅ **Pagination** - Composant réutilisable
5. ✅ **Page Restaurants migrée** - Exemple fonctionnel
6. ✅ **Phase 1 terminée** - Products, Sales et Ingredients migrés vers React Query (pagination, skeletons, gestion d’erreurs)

## 📋 Plan d'action priorisé

### 🎯 PHASE 1 : Migrer les pages principales ✅ TERMINÉE

#### 1.1 Page Products ✅
**Pourquoi** : Page très utilisée, beaucoup de données
- [x] Migrer vers `useProducts()` avec pagination
- [x] Ajouter `ProductListSkeleton`
- [x] Implémenter la pagination
- [x] Optimiser l’usage de l’API avec pagination

**Impact** : ⭐⭐⭐⭐⭐ (Très élevé - page centrale)

#### 1.2 Page Sales ✅
**Pourquoi** : Page critique avec filtres complexes
- [x] Migrer vers `useSales()` avec filtres
- [x] Ajouter `SaleListSkeleton`
- [x] Implémenter la pagination
- [x] Filtres et API alignés

**Impact** : ⭐⭐⭐⭐⭐ (Très élevé - données importantes)

#### 1.3 Page Ingredients ✅
**Pourquoi** : Page simple, bon pour tester
- [x] Créer `useIngredients()` hook
- [x] Migrer la page
- [x] Skeleton / gestion d’erreurs

**Impact** : ⭐⭐⭐ (Moyen)

### 🎯 PHASE 2 : Optimisations avancées (Priorité MOYENNE)

#### 2.1 Optimistic Updates (2h)
**Pourquoi** : UX premium - l'UI se met à jour instantanément
- [x] Implémenter optimistic updates pour les mutations (suppression vente + prévision)
- [x] Rollback automatique en cas d'erreur
- [x] Suppression de restaurant (optimistic + rollback)

**Impact** : ⭐⭐⭐⭐ (Élevé - meilleure UX)

#### 2.2 Infinite Scroll (Optionnel - 2h)
**Pourquoi** : Alternative moderne à la pagination
- [ ] Utiliser `useInfiniteQuery` de React Query
- [ ] Implémenter sur la page Sales
- [ ] Chargement automatique au scroll

**Impact** : ⭐⭐⭐ (Moyen - nice to have)

#### 2.3 Prefetching (1h)
**Pourquoi** : Chargement anticipé des données
- [ ] Prefetch des détails au hover
- [ ] Prefetch de la page suivante
- [ ] Amélioration de la perception de vitesse

**Impact** : ⭐⭐⭐ (Moyen)

### 🎯 PHASE 3 : Autres améliorations (Priorité BASSE)

#### 3.1 Dashboard Premium (Option 2 de la liste initiale)
- [ ] KPIs visuels avec graphiques
- [ ] Widgets d'alertes prioritaires
- [ ] Comparaisons de périodes

#### 3.2 Export CSV/PDF (Option 3)
- [ ] Export des rapports
- [ ] Export des listes (restaurants, produits, ventes)
- [ ] Génération côté serveur

#### 3.3 Notifications en temps réel
- [ ] Toasts améliorés
- [ ] Notifications push (optionnel)
- [ ] Badges de notifications

## 🎯 Recommandation : Commencer par Phase 1

### Pourquoi Phase 1 en premier ?

1. **Impact immédiat** : Les pages les plus utilisées bénéficient du cache et des skeletons
2. **Cohérence** : Toutes les pages principales utilisent le même pattern
3. **Performance** : Réduction significative des requêtes inutiles
4. **Base solide** : Une fois fait, le reste est plus facile

### Ordre suggéré

1. **Products** (2-3h) - Page très utilisée
2. **Sales** (2-3h) - Page critique avec filtres
3. **Ingredients** (1-2h) - Plus simple, bon pour finir

**Total estimé** : 5-8 heures

## 📊 État actuel vs Objectif

### Pages à migrer
- [x] Restaurants ✅
- [x] Products ✅
- [x] Sales ✅
- [x] Ingredients ✅
- [x] Forecasts ✅ (utilise `useForecasts`)
- [x] Recommendations ✅ (utilise `useRecommendations`)
- [x] Alerts ✅ (utilise `useAlerts`)
- [x] Reports ✅ (utilise `useGenerateReport` + `useRestaurants`)

### Hooks disponibles
- [x] useRestaurants ✅
- [x] useProducts ✅ (utilisé)
- [x] useSales ✅ (utilisé)
- [x] useIngredients ✅ (utilisé)
- [x] useForecasts ✅ (utilisé)
- [x] useRecommendations ✅ (utilisé)
- [x] useAlerts ✅ (utilisé)
- [x] useReports ✅ (useGenerateReport utilisé sur la page Rapports)

## 🚀 Suite possible (Option C – UX/Performance)

**Phase 1 et pages Forecasts/Recommendations/Alerts/Reports sont à jour.** Prefetch page suivante + au hover en place sur Products et Sales. Optimistic delete restaurant en place. Error boundary dashboard en place (`app/(dashboard)/dashboard/error.tsx`).

**Encore possible (sans casser le code) :**
1. **Phase 2.2 – Infinite scroll** : optionnel, sur Sales ou Products avec `useInfiniteQuery`.
2. **Autre** : fiabilité (Sentry, backups), monétisation (Stripe), etc. — voir `CHECKLIST_AVANT_PRODUCTION.md` et `ROADMAP_PRODUCTION.md`.
