# Automatisation des tests employé — simple

**En une phrase :** au lieu de te connecter toi-même en employé et de tout vérifier à la main à chaque fois, l’ordinateur (ou GitHub) le fait tout seul avec l’email et le mot de passe que tu lui donnes une fois.

---

## Partie 1 : Sur ton ordinateur (en local)

**But :** lancer les tests employé depuis ton terminal sans refaire la vérification manuelle.

### Ce que tu fais

1. Ouvre un **terminal** à la racine du projet (dossier du projet).

2. Donne l’email et le mot de passe du **compte employé** au terminal (remplace par tes vraies valeurs) :
   ```bash
   export STAFF_EMAIL=email-du-compte-employe@exemple.com
   export STAFF_PASSWORD=mot_de_passe_du_compte
   ```

3. Lance les tests :
   ```bash
   npm run test:e2e
   ```

**Résultat :** Playwright se connecte avec ce compte, puis lance tous les tests (dont ceux qui vérifient le rôle employé). Tu n’as rien à cliquer toi-même.

**À savoir :** ces variables ne restent que dans ce terminal. Si tu fermes le terminal ou en ouvres un autre, il faudra refaire les deux lignes `export` avant `npm run test:e2e` si tu veux relancer les tests employé.

---

## Partie 2 : Sur GitHub (à chaque push)

**But :** que les tests employé se lancent **automatiquement** à chaque fois que tu pushes sur `main`, sans ouvrir ton terminal.

### Ce que tu fais

1. Va sur **GitHub** → ouvre **ton dépôt** → onglet **Settings** (Paramètres).

2. Dans le menu de gauche : **Secrets and variables** → **Actions**.

3. Clique sur **New repository secret**.

4. Premier secret :
   - **Name :** `STAFF_EMAIL` (exactement comme ça).
   - **Secret :** l’email du compte employé.
   - Clique sur **Add secret**.

5. Clique à nouveau sur **New repository secret**.

6. Deuxième secret :
   - **Name :** `STAFF_PASSWORD` (exactement comme ça).
   - **Secret :** le mot de passe du compte employé.
   - Clique sur **Add secret**.

**Résultat :** à chaque push (ou PR) sur `main`, GitHub lance les tests. Comme les deux secrets sont là, il lance aussi les tests employé. Tu n’as plus rien à faire.

---

## Récap

| Où | Tu fais quoi | Ensuite |
|----|----------------|--------|
| **Ton PC** | Tu mets `export STAFF_EMAIL=...` et `export STAFF_PASSWORD=...` dans le terminal, puis `npm run test:e2e`. | Les tests employé tournent avec le compte que tu as donné. |
| **GitHub** | Tu crées les deux secrets `STAFF_EMAIL` et `STAFF_PASSWORD` dans Settings → Secrets and variables → Actions. | À chaque push sur `main`, les tests employé se lancent tout seuls. |

**Sécurité :** ne mets jamais le mot de passe dans un fichier du projet ni dans le code. Uniquement : dans le terminal (en local) ou dans les Secrets GitHub (en CI).
