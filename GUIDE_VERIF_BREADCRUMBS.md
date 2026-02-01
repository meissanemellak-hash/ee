# Guide de vérification des breadcrumbs

Ce guide vous permet de vérifier que les breadcrumbs (fils d'Ariane) fonctionnent correctement sur toutes les pages concernées.

---

## Étape 1 : Pages listes principales

Vérifiez que chaque page liste affiche **Dashboard > [Section]** en haut du contenu.

| Page | URL | Breadcrumb attendu | ☐ |
|------|-----|-------------------|---|
| Produits | `/dashboard/products` | Dashboard > Produits | ☐ |
| Ingrédients | `/dashboard/ingredients` | Dashboard > Ingrédients | ☐ |
| Restaurants | `/dashboard/restaurants` | Dashboard > Restaurants | ☐ |
| Ventes & Analyse | `/dashboard/sales` | Dashboard > Ventes & Analyse | ☐ |
| Alertes | `/dashboard/alerts` | Dashboard > Alertes | ☐ |
| Prévisions | `/dashboard/forecasts` | Dashboard > Prévisions | ☐ |
| Recommandations | `/dashboard/recommendations` | Dashboard > Recommandations | ☐ |
| Rapports | `/dashboard/reports` | Dashboard > Rapports | ☐ |
| Paramètres | `/dashboard/settings` | Dashboard > Paramètres | ☐ |

**Actions :**
1. Cliquez sur chaque lien dans la sidebar
2. Vérifiez que le breadcrumb apparaît juste au-dessus du titre de la page
3. Le dernier élément (nom de la section) doit être en gras et sans lien

---

## Étape 2 : Clic sur « Dashboard » dans le breadcrumb

Sur chaque page liste, vérifiez que cliquer sur **Dashboard** vous ramène à `/dashboard`.

| Page | Action | Résultat attendu | ☐ |
|------|--------|------------------|---|
| Produits | Cliquer sur « Dashboard » | Redirection vers /dashboard | ☐ |
| Ingrédients | Cliquer sur « Dashboard » | Redirection vers /dashboard | ☐ |
| Restaurants | Cliquer sur « Dashboard » | Redirection vers /dashboard | ☐ |
| Ventes | Cliquer sur « Dashboard » | Redirection vers /dashboard | ☐ |

---

## Étape 3 : Pages imbriquées (sous-pages)

Vérifiez que les pages de détail, édition et import conservent leurs breadcrumbs existants et que la navigation fonctionne.

### Produits
| Page | URL | Breadcrumb attendu | ☐ |
|------|-----|-------------------|---|
| Nouveau produit | `/dashboard/products/new` | Produits > Nouveau | ☐ |
| Import CSV | `/dashboard/products/import` | Produits > Import | ☐ |
| Import BOM | `/dashboard/products/import-bom` | Produits > Import recettes (BOM) | ☐ |
| Édition produit | `/dashboard/products/[id]/edit` | Produits > [nom] > Édition | ☐ |

### Restaurants
| Page | URL | Breadcrumb attendu | ☐ |
|------|-----|-------------------|---|
| Nouveau restaurant | `/dashboard/restaurants/new` | Restaurants > Nouveau | ☐ |
| Import CSV | `/dashboard/restaurants/import` | Restaurants > Import | ☐ |
| Détail restaurant | `/dashboard/restaurants/[id]` | Restaurants > [nom] | ☐ |
| Inventaire | `/dashboard/restaurants/[id]/inventory` | Restaurants > [nom] > Inventaire | ☐ |
| Import inventaire | `/dashboard/restaurants/[id]/inventory/import` | Restaurants > [nom] > Import inventaire | ☐ |

### Ingrédients
| Page | URL | Breadcrumb attendu | ☐ |
|------|-----|-------------------|---|
| Nouveau ingrédient | `/dashboard/ingredients/new` | Ingrédients > Nouveau | ☐ |
| Import CSV | `/dashboard/ingredients/import` | Ingrédients > Import | ☐ |
| Détail ingrédient | `/dashboard/ingredients/[id]` | Ingrédients > [nom] | ☐ |
| Édition ingrédient | `/dashboard/ingredients/[id]/edit` | Ingrédients > [nom] > Édition | ☐ |

### Ventes
| Page | URL | Breadcrumb attendu | ☐ |
|------|-----|-------------------|---|
| Nouvelle vente | `/dashboard/sales/new` | Ventes & Analyse > Nouvelle vente | ☐ |
| Import CSV | `/dashboard/sales/import` | Ventes & Analyse > Import | ☐ |
| Analyse | `/dashboard/sales/analyze` | Ventes & Analyse > Analyse | ☐ |
| Édition vente | `/dashboard/sales/[id]/edit` | Ventes & Analyse > Édition | ☐ |

---

## Étape 4 : Conservation du paramètre restaurant

Si vous avez un restaurant sélectionné dans le header (`?restaurant=xxx`), les liens des breadcrumbs doivent conserver ce paramètre.

1. Sélectionnez un restaurant dans le header (dropdown « Tous les restaurants »)
2. Naviguez vers une page (ex. Produits)
3. Cliquez sur « Dashboard » dans le breadcrumb
4. **Vérifiez** : l’URL doit contenir `?restaurant=xxx` après la redirection

---

## Étape 5 : Apparence visuelle

- [ ] Les breadcrumbs utilisent une couleur discrète (gris/muted)
- [ ] Le dernier élément est en gras et couleur normale
- [ ] Les séparateurs (ChevronRight) sont visibles entre les éléments
- [ ] Au survol, les liens changent de couleur
- [ ] Sur mobile, les breadcrumbs ne débordent pas (troncature si besoin)

---

## Checklist finale

- [ ] Toutes les pages listes affichent un breadcrumb
- [ ] Le clic sur « Dashboard » fonctionne sur les pages listes
- [ ] Les pages imbriquées ont des breadcrumbs cohérents
- [ ] Le paramètre `?restaurant=` est préservé dans les liens
- [ ] Aucun problème d’affichage ou de responsive

---

## En cas de problème

- **Breadcrumb manquant** : Vérifier que la page importe `Breadcrumbs` et l’utilise correctement
- **Lien cassé** : Vérifier que `href` est correct dans les items du breadcrumb
- **Paramètre restaurant perdu** : Le composant `Breadcrumbs` utilise `preserveSearchParams={true}` par défaut
