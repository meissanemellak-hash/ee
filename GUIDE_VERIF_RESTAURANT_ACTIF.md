# Guide de vérification – Restaurant actif

Ce guide permet de vérifier que le sélecteur « Restaurant actif » et le filtrage par restaurant fonctionnent correctement.

---

## Prérequis

- Être connecté au dashboard avec une organisation qui a **au moins 2 restaurants** (idéalement 3 ou 4).
- Avoir des données (ventes, alertes, recommandations, prévisions) réparties sur plusieurs restaurants pour voir la différence.

---

## Étape 1 : Vérifier le sélecteur dans le header

1. Aller sur **Dashboard** (`/dashboard`).
2. En haut à droite (à côté de la barre de recherche), vérifier la présence du **sélecteur « Restaurant actif »** avec une icône magasin.
3. Ouvrir le sélecteur : vous devez voir **« Tous les restaurants »** puis la liste de vos restaurants.
4. Vérifier que la valeur par défaut est **« Tous les restaurants »** (ou la valeur déjà dans l’URL).

**À contrôler :** le sélecteur s’affiche et la liste des restaurants est correcte.

---

## Étape 2 : URL et persistance du choix

1. Rester sur le Dashboard, laisser **« Tous les restaurants »**.
2. Regarder l’URL dans la barre d’adresse : elle ne doit **pas** contenir `?restaurant=...`.
3. Choisir **un restaurant précis** dans le sélecteur.
4. L’URL doit se mettre à jour avec `?restaurant=XXX` (où `XXX` est l’id du restaurant).
5. Changer à nouveau pour **« Tous les restaurants »** : le paramètre `?restaurant=...` doit disparaître de l’URL.

**À contrôler :** le choix dans le header met bien à jour l’URL et la supprime quand on repasse sur « Tous ».

---

## Étape 3 : Dashboard filtré par restaurant

1. Sélectionner **un restaurant** dans le header.
2. Sur la page Dashboard, vérifier que :
   - les **métriques** (économies, recommandations appliquées, alertes, etc.) ne concernent que ce restaurant ;
   - le **graphique « Évolution des ventes »** ne montre que les ventes de ce restaurant ;
   - la **table « Activité récente »** ne montre que l’activité de ce restaurant.
3. Repasser sur **« Tous les restaurants »** : les chiffres et graphiques doivent à nouveau regrouper tous les restaurants.

**À contrôler :** le Dashboard change bien selon le restaurant sélectionné ou « Tous ».

---

## Étape 4 : Ventes et filtre restaurant

1. Aller sur **Ventes** (`/dashboard/sales`).
2. Sans rien changer dans le header, si un restaurant était déjà sélectionné, la liste des ventes doit être **filtrée** sur ce restaurant.
3. Ouvrir le **filtre « Restaurant »** sur la page : la valeur doit être alignée avec le sélecteur du header (même restaurant ou « Tous »).
4. Changer le restaurant **depuis le header** : la page Ventes doit se mettre à jour (liste et filtre).
5. Changer le restaurant **depuis le filtre de la page** : l’URL doit se mettre à jour et le sélecteur du header doit afficher le même restaurant.

**À contrôler :** header et filtre Ventes restent synchronisés (URL + affichage).

---

## Étape 5 : Analyse des ventes

1. Aller sur **Ventes & Analyse** (ou la page d’analyse des ventes).
2. Sélectionner un restaurant dans le header : les graphiques et données doivent concerner **uniquement** ce restaurant.
3. Vérifier que le **filtre « Restaurant »** sur la page affiche le même choix.
4. Changer le filtre sur la page : l’URL doit changer et le header doit rester cohérent.

**À contrôler :** analyse filtrée par restaurant et synchronisation header / URL / filtre page.

---

## Étape 6 : Alertes

1. Aller sur **Alertes** (`/dashboard/alerts`).
2. Sélectionner un restaurant dans le header : seules les alertes de ce restaurant doivent s’afficher.
3. Repasser sur « Tous les restaurants » : toutes les alertes de l’organisation doivent réapparaître.
4. Changer le restaurant depuis le filtre de la page : l’URL doit être mise à jour.

**À contrôler :** liste d’alertes filtrée par restaurant et synchro avec l’URL.

---

## Étape 7 : Recommandations et Prévisions

1. **Recommandations** : même principe – sélection d’un restaurant dans le header → recommandations filtrées ; filtre page → URL mise à jour.
2. **Prévisions** : sélection d’un restaurant → prévisions de ce restaurant uniquement ; filtre page et URL synchronisés.

**À contrôler :** comportement identique aux autres pages (filtre par restaurant + URL).

---

## Étape 8 : Lien « Inventaire » dans la sidebar

1. Sélectionner **un restaurant** dans le header (pas « Tous »).
2. Dans la **sidebar** (menu de gauche), un nouvel item **« Inventaire »** doit apparaître (entre Alertes et Rapports).
3. Cliquer sur **Inventaire** : vous devez arriver sur la page d’inventaire **de ce restaurant** (`/dashboard/restaurants/[id]/inventory`).
4. Repasser sur **« Tous les restaurants »** dans le header : l’item **« Inventaire »** doit **disparaître** de la sidebar.

**À contrôler :** le lien Inventaire n’apparaît que lorsqu’un restaurant est actif et mène au bon inventaire.

---

## Étape 9 : Produits et Ingrédients (aucun changement)

1. Aller sur **Produits** puis sur **Ingrédients**.
2. Changer le restaurant dans le header : les listes **Produits** et **Ingrédients** ne doivent **pas** changer (catalogue commun à l’organisation).

**À contrôler :** pas de filtrage par restaurant sur ces deux pages.

---

## Étape 10 : Navigation et conservation du paramètre

1. Sélectionner un restaurant dans le header.
2. Cliquer sur **Dashboard**, puis **Ventes**, puis **Alertes** dans la sidebar : l’URL doit conserver `?restaurant=XXX` sur chaque page et les données rester filtrées sur ce restaurant.
3. Sur mobile (ou fenêtre étroite), ouvrir le **menu hamburger** et naviguer : les liens doivent aussi conserver `?restaurant=XXX` si un restaurant est actif.

**À contrôler :** le restaurant actif est conservé lors de la navigation (sidebar et mobile).

---

## Résumé des points à valider

| Élément | Attendu |
|--------|---------|
| Sélecteur header | Visible, liste « Tous » + restaurants, valeur par défaut « Tous » |
| URL | `?restaurant=xxx` quand un restaurant est choisi, absent quand « Tous » |
| Dashboard | Métriques, graphique ventes, activité récente filtrés par restaurant |
| Ventes | Filtre page = header, changement dans l’un met à jour l’autre et l’URL |
| Analyse ventes | Données filtrées, filtre et URL synchronisés |
| Alertes | Liste filtrée, URL à jour |
| Recommandations | Liste filtrée, URL à jour |
| Prévisions | Liste filtrée, URL à jour |
| Sidebar « Inventaire » | Visible uniquement si un restaurant est actif, lien vers son inventaire |
| Produits / Ingrédients | Pas de filtrage par restaurant |
| Navigation | `?restaurant=` conservé entre les pages (sidebar + mobile) |

Si un point ne se comporte pas comme décrit, noter la page, l’action effectuée et le résultat obtenu pour le corriger.
