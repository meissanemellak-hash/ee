# Guide de vérification – Import recettes BOM et conversion d’unités

## Contexte

L’import BOM accepte désormais une unité différente de celle de l’ingrédient, avec conversion automatique : **g ↔ kg** et **ml ↔ L**.

Exemple : Fromage en **kg** (livré par le fournisseur) → dans le CSV vous pouvez mettre **60** avec **unité g** → l’app convertit en **0,06 kg**.

---

## Étape 1 : Vérifier les données existantes

1. Aller sur **Ingrédients**.
2. Noter l’unité de **Fromage** (ex. **kg**).
3. Noter l’unité d’un ingrédient en **L** (ex. **Huile d'olive bio**).
4. Aller sur **Produits** et vérifier que **Tacos maison** (ou un autre produit) existe.

---

## Étape 2 : Créer un fichier CSV de test

1. Ouvrir un éditeur de texte ou Excel.
2. Créer un fichier avec ce contenu (en adaptant les noms si besoin) :

```csv
produit,ingrédient,quantité,unité
Tacos maison,Fromage,60,g
Tacos maison,Viande,180,g
Tacos maison,Huile d'olive bio,0.02,L
```

3. Sauvegarder en **CSV UTF-8** sous le nom `test_bom.csv`.

**Cas testés :**
- **Fromage** : 60 g → doit devenir 0,06 kg (ingrédient en kg).
- **Viande** : 180 g → si ingrédient en g, reste 180 g ; si en kg, devient 0,18 kg.
- **Huile** : 0,02 L → si ingrédient en L, reste 0,02 L ; si en ml, devient 20 ml.

---

## Étape 3 : Importer le fichier

1. Aller sur **Produits**.
2. Cliquer sur **Importer recettes (BOM)**.
3. Glisser-déposer `test_bom.csv` ou cliquer pour le sélectionner.
4. Vérifier l’aperçu (colonnes produit, ingrédient, quantité, unité).
5. Cliquer sur **Importer les recettes**.
6. Vérifier un message du type « X recette(s) importée(s) avec succès ».

---

## Étape 4 : Vérifier les recettes dans les produits

1. Sur **Produits**, cliquer sur l’icône **Modifier** (crayon) à côté de **Tacos maison** (ou le produit utilisé).
2. Sur la page d’édition, descendre jusqu’à la section **Recette** / **Ingrédients**.
3. Contrôler :
   - **Fromage** : quantité **0,06** avec unité **kg**.
   - **Viande** : quantité cohérente avec l’unité de l’ingrédient (180 g ou 0,18 kg selon la fiche ingrédient).
   - **Huile** : **0,02** en L ou **20** en ml selon la fiche ingrédient.

Les quantités doivent correspondre à ce que vous avez saisi, exprimé dans l’unité de chaque ingrédient.

---

## Étape 5 : Tester une erreur (unité incompatible)

1. Créer un fichier CSV avec une unité non convertible, par exemple :

```csv
produit,ingrédient,quantité,unité
Tacos maison,Fromage,60,L
```

(Ici : Fromage en kg, unité CSV en L → incompatible.)

2. Importer ce fichier.
3. Vérifier l’erreur : message indiquant que l’unité est incompatible et rappelant que seules les conversions **g↔kg** et **ml↔L** sont possibles.

---

## Étape 6 : Tester sans colonne unité (comportement inchangé)

1. Créer un fichier CSV sans colonne **unité** :

```csv
produit,ingrédient,quantité
Steak frites,Viande,180
```

2. Importer ce fichier.
3. Vérifier que l’import fonctionne comme avant : la quantité est utilisée directement dans l’unité de l’ingrédient.

---

## Récapitulatif des conversions

| CSV (quantité, unité) | Ingrédient (unité) | Résultat stocké |
|----------------------|--------------------|------------------|
| 60, g                | kg                 | 0,06             |
| 0,06, kg             | g                  | 60               |
| 20, ml               | L                  | 0,02             |
| 0,02, L              | ml                 | 20               |
