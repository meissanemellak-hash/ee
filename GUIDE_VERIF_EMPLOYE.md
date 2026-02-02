# Guide de vérification – Rôle Employé

Ce guide permet de vérifier que les restrictions du rôle **Employé** (staff) sont bien appliquées sur toutes les pages du dashboard. L’employé a un accès **lecture** sur la plupart des modules et peut **créer des ventes** uniquement.

---

## Comment tester en tant qu’employé

1. **Définir le rôle dans Clerk**  
   - Dashboard Clerk → votre application → **Users** (ou **Organizations** → Members).  
   - Pour l’utilisateur de test : métadonnées (Public ou Private) ou métadonnées de l’organisation.  
   - Ajouter la clé `role` (ou celle utilisée par votre API `/api/user/role`) avec la valeur **`staff`**.

2. **Ou via l’API / métadonnées**  
   - Vérifier dans le code comment le rôle est récupéré (`lib/auth-role.ts`, API `GET /api/user/role`).  
   - S’assurer que pour l’utilisateur (ou l’organisation) de test, la réponse contient `role: "staff"`.

3. **Se connecter** avec cet utilisateur et ouvrir le dashboard : `http://localhost:3000/dashboard`.

---

## 1. Menu latéral (sidebar)

| Élément            | Visible pour l’employé ? | À vérifier |
|--------------------|---------------------------|------------|
| Dashboard          | Oui                       | Lien présent et cliquable. |
| Restaurants        | Oui                       | Lien présent. |
| Produits           | Oui                       | Lien présent. |
| Ingrédients        | Oui                       | Lien présent. |
| Ventes & Analyse   | Oui                       | Lien présent. |
| Prévisions         | Oui                       | Lien présent. |
| Recommandations    | Oui                       | Lien présent. |
| Alertes            | Oui                       | Lien présent. |
| Rapports           | Oui                       | Lien présent. |
| **Paramètres**     | **Non**                   | **L’entrée « Paramètres » ne doit pas apparaître dans le menu.** |

**Checklist :**
- [ ] En tant qu’employé, le menu ne contient **pas** « Paramètres ».
- [ ] Tous les autres liens du menu sont visibles et fonctionnent.

---

## 2. Tableau de bord (`/dashboard`)

| Action                    | Autorisé ? | À vérifier |
|---------------------------|------------|------------|
| Voir la page              | Oui        | Page affichée, pas de message d’erreur. |
| Voir l’activité récente   | Oui        | Bloc « Activité récente » visible. |
| Créer / modifier / supprimer des données | Non | Aucun bouton de ce type sur cette page. |

**Checklist :**
- [ ] La page s’affiche correctement.
- [ ] L’employé ne voit que du contenu informatif (tableau de bord, activité récente).

---

## 3. Restaurants (`/dashboard/restaurants`)

| Action                         | Autorisé ? | À vérifier |
|--------------------------------|------------|------------|
| Voir la liste des restaurants  | Oui        | Liste affichée. |
| **Ajouter un restaurant**      | **Non**    | **Bouton « Ajouter un restaurant » absent.** |
| **Modifier un restaurant**     | **Non**    | **Icône/bouton Modifier absent sur chaque ligne.** |
| **Supprimer un restaurant**    | **Non**    | **Icône/bouton Supprimer absent.** |
| **Import**                     | **Non**    | **Lien/action d’import absent.** |

**Checklist :**
- [ ] Aucun bouton « Ajouter un restaurant ».
- [ ] Aucune icône crayon (modifier) ni poubelle (supprimer) sur les lignes.
- [ ] Clic sur un restaurant : page détail visible (lecture seule).

---

## 4. Détail d’un restaurant (`/dashboard/restaurants/[id]`)

| Action                         | Autorisé ? | À vérifier |
|--------------------------------|------------|------------|
| Voir les infos du restaurant   | Oui        | Page détail affichée. |
| **Modifier le restaurant**     | **Non**    | **Bouton/icône Modifier absent.** |
| **Supprimer le restaurant**    | **Non**    | **Bouton Supprimer absent.** |
| Accéder à l’inventaire         | Oui        | Lien « Inventaire » présent (lecture). |

**Checklist :**
- [ ] Aucun bouton « Modifier » ni « Supprimer » sur la page détail restaurant.

---

## 5. Inventaire d’un restaurant (`/dashboard/restaurants/[id]/inventory`)

| Action                              | Autorisé ? | À vérifier |
|-------------------------------------|------------|------------|
| Voir la liste des stocks            | Oui        | Tableau des lignes d’inventaire visible. |
| **Ajouter une ligne d’inventaire**   | **Non**    | **Bouton « Ajouter un ingrédient » absent.** |
| **Modifier une ligne (stock, seuils)** | **Non** | **Icônes Modifier / Enregistrer / Annuler absentes.** |
| **Supprimer une ligne**             | **Non**    | **Icône/bouton Supprimer absent.** |
| **Importer (CSV)**                  | **Non**    | **Dans « Import / export », l’option « Importer CSV » absente ou désactivée.** |
| Exporter en CSV                     | Oui*       | Option « Exporter CSV » peut rester visible (lecture des données). |

**Checklist :**
- [ ] Pas de bouton « Ajouter un ingrédient ».
- [ ] Pas d’icônes d’édition/suppression sur les lignes du tableau.
- [ ] Pas d’accès à l’import CSV (menu masqué ou option absente).

---

## 6. Produits (`/dashboard/products`)

| Action                         | Autorisé ? | À vérifier |
|--------------------------------|------------|------------|
| Voir la liste des produits     | Oui        | Liste affichée. |
| **Ajouter un produit**          | **Non**    | **Bouton « Ajouter un produit » absent.** |
| **Modifier un produit**         | **Non**    | **Icône Modifier absente sur chaque ligne.** |
| **Supprimer un produit**        | **Non**    | **Icône Supprimer absente.** |
| **Import CSV / Import BOM**     | **Non**    | **Dans « Import / export », options d’import absentes.** |
| Exporter (si présent)           | Oui*       | Export CSV peut rester autorisé (lecture). |

**Checklist :**
- [ ] Aucun bouton « Ajouter un produit ».
- [ ] Aucune icône Modifier ni Supprimer sur les lignes.
- [ ] Menu « Import / export » sans « Importer CSV » ni « Importer recettes (BOM) » (ou menu masqué).

---

## 7. Ingrédients (`/dashboard/ingredients`)

| Action                         | Autorisé ? | À vérifier |
|--------------------------------|------------|------------|
| Voir la liste des ingrédients  | Oui        | Liste affichée. |
| **Ajouter un ingrédient**       | **Non**    | **Bouton « Ajouter un ingrédient » absent.** |
| **Modifier un ingrédient**      | **Non**    | **Icône Modifier absente.** |
| **Supprimer un ingrédient**     | **Non**    | **Icône Supprimer absente.** |
| **Importer (CSV)**              | **Non**    | **Option « Importer CSV » absente dans le menu.** |

**Checklist :**
- [ ] Aucun bouton « Ajouter un ingrédient ».
- [ ] Aucune icône Modifier ni Supprimer.
- [ ] Pas d’option d’import CSV.

---

## 8. Ventes & Analyse (`/dashboard/sales`)

| Action                         | Autorisé ? | À vérifier |
|--------------------------------|------------|------------|
| Voir la liste des ventes       | Oui        | Liste affichée. |
| **Créer une vente**            | **Oui**    | **Bouton « Nouvelle vente » (ou équivalent) visible et utilisable.** |
| **Modifier une vente**         | **Non**    | **Icône/bouton Modifier absent sur chaque ligne.** |
| **Supprimer une vente**        | **Non**    | **Icône/bouton Supprimer absent.** |
| **Import ventes**               | **Non**    | **Option d’import absente ou désactivée.** |
| Exporter (si présent)           | Oui*       | Export possible (lecture). |

**Checklist :**
- [ ] Le bouton pour créer une vente est bien visible et fonctionne.
- [ ] Aucune icône Modifier ni Supprimer sur les lignes de ventes.
- [ ] Pas d’option d’import ventes pour l’employé.

---

## 9. Prévisions (`/dashboard/forecasts`)

| Action                         | Autorisé ? | À vérifier |
|--------------------------------|------------|------------|
| Voir la page et les prévisions | Oui        | Liste/cartes des prévisions visibles. |
| **Générer des prévisions**     | **Non**    | **Bloc « Générer des prévisions » (formulaire restaurant + date + bouton Générer) absent.** |
| **Supprimer une prévision**     | **Non**    | **Bouton Supprimer absent sur chaque prévision.** |

**Checklist :**
- [ ] La carte « Générer des prévisions » avec le formulaire et le bouton « Générer » n’apparaît pas.
- [ ] Aucun bouton de suppression sur les prévisions existantes.

---

## 10. Recommandations (`/dashboard/recommendations`)

| Action                         | Autorisé ? | À vérifier |
|--------------------------------|------------|------------|
| Voir la liste des recommandations | Oui     | Liste affichée. |
| **Accepter une recommandation**   | **Non** | **Bouton « Accepter » absent.** |
| **Rejeter une recommandation**    | **Non** | **Bouton « Rejeter » absent.** |
| **Remettre en attente**           | **Non** | **Bouton « Remettre en attente » absent.** |

**Checklist :**
- [ ] Sur chaque recommandation en attente, pas de boutons « Accepter » ni « Rejeter ».
- [ ] Sur une recommandation acceptée, pas de bouton « Remettre en attente ».

---

## 11. Alertes (`/dashboard/alerts`)

| Action                         | Autorisé ? | À vérifier |
|--------------------------------|------------|------------|
| Voir la liste des alertes      | Oui        | Liste/cartes des alertes visibles. |
| **Résoudre une alerte**         | **Non**    | **Bouton « Résoudre » absent.** |
| **Réactiver une alerte**       | **Non**    | **Bouton « Réactiver » absent.** |

**Checklist :**
- [ ] Sur chaque alerte non résolue, pas de bouton « Résoudre ».
- [ ] Sur chaque alerte résolue, pas de bouton « Réactiver ».

---

## 12. Rapports (`/dashboard/reports`)

| Action                         | Autorisé ? | À vérifier |
|--------------------------------|------------|------------|
| Voir la page Rapports          | Oui        | Page affichée. |
| **Générer un rapport**         | **Non**    | **Bouton « Générer le rapport » (ou équivalent) absent.** |

**Checklist :**
- [ ] Aucun bouton pour lancer la génération d’un rapport.

---

## 13. Paramètres (`/dashboard/settings`)

| Comportement | À vérifier |
|--------------|------------|
| **L’employé n’a pas `settings:view`** | **L’entrée « Paramètres » n’apparaît pas dans le menu.** |
| Accès direct par URL               | Si l’employé ouvre `http://localhost:3000/dashboard/settings` (saisie manuelle ou favori), il doit voir un message du type « Vous n'avez pas accès à cette page » (et non le contenu des paramètres). |

**Checklist :**
- [ ] « Paramètres » absent du menu (déjà vérifié en section 1).
- [ ] En allant sur `/dashboard/settings`, message d’accès refusé + lien retour tableau de bord, pas le formulaire Paramètres.

---

## Récapitulatif des permissions Employé

| Module        | Voir | Créer | Modifier | Supprimer | Actions spécifiques          |
|---------------|------|-------|----------|-----------|------------------------------|
| Dashboard     | Oui  | –     | –        | –         | –                            |
| Restaurants   | Oui  | Non   | Non      | Non       | –                            |
| Produits      | Oui  | Non   | Non      | Non       | Import : Non                 |
| Ingrédients   | Oui  | Non   | Non      | Non       | Import : Non                 |
| Ventes        | Oui  | **Oui** | Non    | Non       | Import : Non                 |
| Inventaire    | Oui  | Non   | Non      | Non       | Import : Non                 |
| Prévisions    | Oui  | –     | –        | Non       | Générer : Non                |
| Recommandations | Oui | –     | –        | –         | Accepter/Rejeter : Non        |
| Alertes       | Oui  | –     | –        | –         | Résoudre/Réactiver : Non     |
| Rapports      | Oui  | –     | –        | –         | Générer : Non                |
| Paramètres    | Non  | –     | –        | –         | Lien masqué + accès refusé   |

---

## Ordre de vérification recommandé

1. Se connecter avec un utilisateur dont le rôle est **staff**.
2. **Menu** : vérifier l’absence de « Paramètres » et la présence des autres entrées.
3. **Dashboard** : affichage correct, pas d’actions de création/édition/suppression.
4. **Restaurants** : liste + détail en lecture seule, pas d’ajout/modification/suppression.
5. **Inventaire** (depuis un restaurant) : lecture seule, pas d’ajout/édition/import.
6. **Produits** : liste en lecture seule, pas d’ajout/modification/suppression/import.
7. **Ingrédients** : liste en lecture seule, pas d’ajout/modification/suppression/import.
8. **Ventes** : liste visible, **bouton de création de vente** présent et utilisable, pas de modification/suppression/import.
9. **Prévisions** : pas de bloc « Générer des prévisions », pas de suppression.
10. **Recommandations** : pas de boutons Accepter / Rejeter / Remettre en attente.
11. **Alertes** : pas de boutons Résoudre / Réactiver.
12. **Rapports** : pas de bouton Générer le rapport.
13. **Paramètres** : pas dans le menu ; accès direct à `/dashboard/settings` → message d’accès refusé.

Si un des points ci‑dessus n’est pas respecté, vérifier que le rôle renvoyé par l’API est bien `staff` et que les composants utilisent `useUserRole()` et les helpers `permissions.*` (voir `lib/roles.ts`).
