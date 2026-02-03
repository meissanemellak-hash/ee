# Tests E2E (Playwright)

Les tests E2E vérifient les parcours critiques sans modifier le code applicatif.

**Quand les lancer ?** À la main : avant un push important ou un déploiement. **Automatiquement** : ils sont exécutés par la CI (GitHub Actions) à chaque push/PR sur `main` — rien à faire de plus.

## Prérequis

- Serveur dev : les tests peuvent démarrer `npm run dev` automatiquement, ou réutiliser un serveur déjà lancé (sauf en CI).

## Installation des navigateurs (une fois)

**Obligatoire** avant la première exécution des tests. Si tu vois l’erreur *"Executable doesn't exist at ..."* ou *"Please run the following command to download new browsers"*, exécute :

```bash
npx playwright install
```

Pour n’installer que Chromium (suffisant pour les tests) :

```bash
npx playwright install chromium
```

## Lancer les tests E2E

**Recommandation :** lance le serveur de dev **avant** (`npm run dev` dans un terminal), puis dans un autre terminal :

```bash
npm run test:e2e
```

Ainsi Playwright réutilise le serveur (`reuseExistingServer`) et tu évites les erreurs « too many open files » au démarrage. Assure-toi que `.env.local` contient au minimum `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` et `CLERK_SECRET_KEY` pour que la landing et l’auth fonctionnent.

Si tu préfères que Playwright démarre le serveur tout seul : arrête tout processus sur le port 3000, puis `npm run test:e2e`.

Interface graphique (débogage) :

```bash
npm run test:e2e:ui
```

### En cas d’échec

Ouvre le rapport HTML généré (lien affiché en fin de run, ou `playwright-report/index.html`) : tu y verras la capture d’écran de la page au moment de l’échec, ce qui aide à comprendre (page blanche, erreur, mauvais texte, etc.).

## Fichiers de tests

| Fichier | Parcours testés |
|---------|------------------|
| `landing.spec.ts` | Page d'accueil, lien « Se connecter », titre hero |
| `auth.spec.ts` | Page sign-in se charge, accès dashboard sans auth → redirection sign-in |
| `dashboard-redirect.spec.ts` | /dashboard, /sales, /products sans auth → redirection sign-in |
| `setup-staff.spec.ts` | En CI : connexion avec compte staff (STAFF_EMAIL/STAFF_PASSWORD), sauvegarde session pour employee-role |
| `employee-role.spec.ts` | Rôle employé : pas de bouton « Ajouter un restaurant », pages import et paramètres → accès refusé |

## Tests rôle employé (employee-role)

Ces tests vérifient que, connecté en tant qu’**employé** (staff), les actions réservées aux managers/admins sont invisibles ou bloquées (bouton « Ajouter un restaurant » absent, pages import et paramètres affichent « Vous n'avez pas accès »).

Ils ne s’exécutent que si une session staff est sauvegardée dans `e2e/.auth/staff.json`.

### Créer `e2e/.auth/staff.json` (une fois)

1. Créez un utilisateur avec le rôle **employé** dans votre org (Clerk + metadata `role: "staff"`).
2. Lancez l’interface Playwright : `npm run test:e2e:ui`
3. Connectez-vous en tant que cet employé dans le navigateur ouvert par Playwright.
4. Une fois sur le dashboard, dans Playwright : **Save storage state** (ou via le menu) et enregistrez dans `e2e/.auth/staff.json`.
5. Créez le dossier si besoin : `mkdir -p e2e/.auth`

Alternative (ligne de commande) : après connexion manuelle dans un navigateur, vous pouvez utiliser l’outil Playwright pour capturer le storage state et le sauvegarder dans ce fichier (voir la doc Playwright sur [storage state](https://playwright.dev/docs/auth)).

### Lancer uniquement les tests employee-role

```bash
npx playwright test --project=employee-role
```

Sans `e2e/.auth/staff.json`, le projet `employee-role` n’apparaît pas dans la config et ces tests sont ignorés.

### Exécution automatique en CI (tests employé)

En CI, si les secrets GitHub **`STAFF_EMAIL`** et **`STAFF_PASSWORD`** sont définis (compte employé avec rôle `staff` dans Clerk), Playwright exécute d'abord le projet **setup-staff** (connexion + sauvegarde de la session dans `e2e/.auth/staff.json`), puis le projet **employee-role**. Pour activer : dans le dépôt GitHub → Settings → Secrets and variables → Actions, ajouter `STAFF_EMAIL` et `STAFF_PASSWORD` avec les identifiants d'un utilisateur employé de test. Si ces secrets sont absents, les tests employé ne sont pas exécutés en CI (aucune erreur).

## Vitest

Les dossiers `e2e/**` sont exclus de Vitest pour éviter que les specs Playwright soient exécutées en environnement jsdom. Les tests unitaires restent inchangés : `npm run test` ou `npm run test:run`.
