# Tests E2E (Playwright)

Les tests E2E vérifient les parcours critiques sans modifier le code applicatif.

## Prérequis

- Serveur dev : les tests peuvent démarrer `npm run dev` automatiquement, ou réutiliser un serveur déjà lancé (sauf en CI).

## Installation des navigateurs (une fois)

```bash
npx playwright install chromium
```

Ou tous les navigateurs : `npx playwright install`

## Lancer les tests E2E

```bash
npm run test:e2e
```

Interface graphique (débogage) :

```bash
npm run test:e2e:ui
```

## Fichiers de tests

| Fichier | Parcours testés |
|---------|------------------|
| `landing.spec.ts` | Page d'accueil, lien « Se connecter », titre hero |
| `auth.spec.ts` | Page sign-in se charge, accès dashboard sans auth → redirection sign-in |
| `dashboard-redirect.spec.ts` | /dashboard, /sales, /products sans auth → redirection sign-in |

## Vitest

Les dossiers `e2e/**` sont exclus de Vitest pour éviter que les specs Playwright soient exécutées en environnement jsdom. Les tests unitaires restent inchangés : `npm run test` ou `npm run test:run`.
