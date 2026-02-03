# Guide étape par étape : tests employé (local + CI)

Tu as déjà un compte **employé** (rôle staff) dans Clerk. Suis ces étapes pour lancer les tests employé en local et/ou en CI.

---

## Partie A : Lancer les tests employé en local

### Étape A1 – Créer le dossier pour la session

Dans un terminal, à la racine du projet :

```bash
mkdir -p e2e/.auth
```

### Étape A2 – (Option 1) Utiliser email et mot de passe en ligne de commande

Tu peux lancer les tests employé **sans** créer de fichier `staff.json` :

1. Ouvre un terminal à la racine du projet.
2. (Recommandé) Démarre le serveur de dev dans un **autre** terminal : `npm run dev`.
3. Dans le premier terminal, définis les variables puis lance tous les tests (y compris employé) :

```bash
export STAFF_EMAIL=ton-email-employe@exemple.com
export STAFF_PASSWORD=ton_mot_de_passe
npm run test:e2e
```

Ou en une seule ligne (remplace par tes vraies valeurs) :

```bash
STAFF_EMAIL=ton-email-employe@exemple.com STAFF_PASSWORD=ton_mot_de_passe npm run test:e2e
```

Playwright exécutera d’abord les 8 tests habituels, puis **setup-staff** (connexion avec ce compte), puis les **tests employé**. Ne mets jamais ces commandes avec ton vrai mot de passe dans un fichier versionné.

### Étape A2 – (Option 2) Sauvegarder la session à la main (sans taper le mot de passe à chaque fois)

1. Lance l’interface Playwright :  
   `npm run test:e2e:ui`
2. Un navigateur s’ouvre. Va sur la page de connexion si besoin (ou clique sur un test pour que la page se charge).
3. **Connecte-toi** avec le compte **employé** (email + mot de passe).
4. Une fois sur le **dashboard**, reviens à la fenêtre Playwright.
5. Dans le menu ou la barre d’outils, cherche **« Save storage »** / **« Save storage state »** et enregistre le fichier dans :  
   `e2e/.auth/staff.json`  
   (crée le dossier avec `mkdir -p e2e/.auth` si besoin.)
6. Ensuite, tu peux lancer uniquement les tests employé **sans** redonner email/mot de passe :  
   `npx playwright test --project=employee-role`

---

## Partie B : Activer les tests employé en CI (GitHub Actions)

### Étape B1 – Ouvrir les paramètres du dépôt

1. Ouvre ton dépôt sur **GitHub**.
2. Clique sur l’onglet **Settings** (Paramètres).

### Étape B2 – Aller dans les secrets

1. Dans le menu de gauche, va dans **Secrets and variables** → **Actions**.
2. Tu arrives sur la page des secrets du dépôt.

### Étape B3 – Créer le secret `STAFF_EMAIL`

1. Clique sur **New repository secret**.
2. Dans **Name**, tape exactement : `STAFF_EMAIL`
3. Dans **Secret**, colle l’**adresse email** du compte employé.
4. Clique sur **Add secret**.

### Étape B4 – Créer le secret `STAFF_PASSWORD`

1. Clique à nouveau sur **New repository secret**.
2. Dans **Name**, tape exactement : `STAFF_PASSWORD`
3. Dans **Secret**, colle le **mot de passe** du compte employé.
4. Clique sur **Add secret**.

### Étape B5 – Vérifier

1. Fais un **push** sur la branche `main` (ou ouvre une PR vers `main`).
2. Va dans l’onglet **Actions** du dépôt.
3. Ouvre la dernière exécution du workflow **CI**.
4. Tu dois voir, en plus des 8 tests habituels, le projet **setup-staff** puis le projet **employee-role** (tests employé). Si les secrets ne sont pas définis, seul le projet par défaut (8 tests) tourne, sans erreur.

---

## Récap

| Où        | Comment |
|----------|--------|
| **Local** | **Option 1** : `export STAFF_EMAIL=...` et `export STAFF_PASSWORD=...` puis `npm run test:e2e` (tout s’exécute, y compris tests employé). **Option 2** : créer `e2e/.auth/staff.json` à la main (A2 Option 2), puis `npx playwright test --project=employee-role` sans redonner le mot de passe. |
| **CI**   | **Partie B** : ajouter les secrets **STAFF_EMAIL** et **STAFF_PASSWORD** dans GitHub (Settings → Secrets and variables → Actions). Les tests employé se lanceront automatiquement à chaque push/PR sur `main`. |

**Sécurité :** ne mets jamais le mot de passe dans le code ni dans un fichier versionné. Utilise les secrets GitHub pour la CI, et des variables d’environnement ou `staff.json` (déjà dans `.gitignore`) en local.
