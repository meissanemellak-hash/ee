# Guide CI/CD – GitHub Actions

Un pipeline CI s’exécute à chaque push sur `main` (ou pull request vers `main`). Il exécute : **lint**, **tests unitaires**, **build**. Si une étape échoue, le pipeline est bloqué.

---

## Étapes exécutées

1. **Checkout** – récupération du code
2. **Setup Node.js** – Node 20, cache npm
3. **Install dependencies** – `npm ci` (reproductible)
4. **Prisma generate** – génération du client Prisma
5. **Lint** – `npm run lint`
6. **Unit tests** – `npm run test:run`
7. **Build** – `npm run build` (avec variables d’environnement de test)

---

## Prérequis

1. **Projet sur GitHub** – le dépôt doit être poussé sur GitHub
2. **Branche `main`** – le workflow se lance sur `main` (ou PR vers `main`)

---

## Activation

1. Pousse le code sur GitHub (branche `main`)
2. Va dans **Actions** sur GitHub
3. Le workflow se lance automatiquement à chaque push

---

## Variables d’environnement (build)

Le build utilise des valeurs de test (placeholder). Pour un déploiement réel, configure les secrets dans les paramètres de ton hébergeur (Vercel, Railway, etc.).

---

## Déploiement automatique

Pour déployer automatiquement après un build réussi :

- **Vercel** : connecte ton dépôt GitHub à Vercel ; Vercel déploiera automatiquement à chaque push sur `main`. Le CI GitHub sert alors de garde-fou (si le CI échoue, tu peux configurer Vercel pour ne pas déployer – ou laisser Vercel gérer son propre build).
- **Railway** : idem, connecte le dépôt pour un déploiement auto.

---

## Résumé

| Événement   | Action                    |
|------------|---------------------------|
| Push sur `main` | Lint → Tests → Build      |
| PR vers `main`  | Lint → Tests → Build      |
| Si une étape échoue | Pipeline bloqué, pas de déploiement |
