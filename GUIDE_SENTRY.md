# Guide Sentry – Étape par étape

Sentry est configuré pour capturer les erreurs (client, serveur, edge). L'app fonctionne **sans Sentry** tant que tu n'as pas ajouté les variables d'environnement.

---

## Étape 1 : Créer un compte Sentry

1. Va sur [sentry.io/signup](https://sentry.io/signup/)
2. Crée un compte (gratuit pour 5 000 événements/mois)
3. Connecte-toi

---

## Étape 2 : Créer un projet

1. Dans Sentry, clique sur **Create Project**
2. Choisis la plateforme **Next.js**
3. Donne un nom au projet (ex. `ai-restaurant-manager`)
4. Note le **DSN** affiché (format : `https://xxx@o0.ingest.sentry.io/0`)

---

## Étape 3 : Récupérer org et project

1. Dans Sentry : **Settings** (roue dentée) → **Projects** → ton projet
2. Note le **Organization Slug** (ex. `mon-org`)
3. Note le **Project Slug** (ex. `ai-restaurant-manager`)

---

## Étape 4 : Configurer les variables d'environnement

Ajoute dans ton fichier `.env.local` :

```env
# Sentry - DSN public (obligatoire pour activer Sentry)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@o0.ingest.sentry.io/0

# Sentry - Pour l'upload des source maps (optionnel mais recommandé)
SENTRY_ORG=ton-org-slug
SENTRY_PROJECT=ton-project-slug
SENTRY_AUTH_TOKEN=sntrys_xxx
```

**Pour obtenir `SENTRY_AUTH_TOKEN` :**

1. Sentry → **Settings** → **Auth Tokens** → **Create New Token**
2. Scopes : `project:releases`, `org:read`
3. Copie le token (il commence par `sntrys_`)

---

## Étape 5 : Redémarrer l'app

```bash
npm run dev
```

Ou pour un build :

```bash
npm run build
```

---

## Étape 6 : Tester que Sentry fonctionne

**Option A – Erreur simulée dans une route API :**

Crée temporairement une route de test (ou utilise la console du navigateur) :

```javascript
// Dans la console du navigateur sur ton app :
throw new Error('Test Sentry - à supprimer')
```

**Option B – Erreur dans une page :**

Ajoute temporairement un bouton qui lance une erreur :

```tsx
<button onClick={() => { throw new Error('Test Sentry') }}>
  Tester Sentry
</button>
```

Après l'erreur, vérifie dans Sentry → **Issues** que l'événement apparaît.

---

## Fichiers créés (ne pas modifier sauf besoin)

| Fichier | Rôle |
|---------|------|
| `instrumentation.ts` | Enregistre les configs serveur et edge |
| `instrumentation-client.ts` | Config Sentry côté navigateur |
| `sentry.server.config.ts` | Config Sentry côté serveur Node |
| `sentry.edge.config.ts` | Config Sentry côté edge (middleware) |
| `app/global-error.tsx` | Page affichée en cas d'erreur React + envoi à Sentry |
| `next.config.js` | Intégration Sentry (conditionnelle) |

---

## Comportement sans configuration

Si `NEXT_PUBLIC_SENTRY_DSN` n'est **pas** défini :

- Aucune erreur n'est envoyée à Sentry
- Le build et l'app fonctionnent normalement
- Sentry est effectivement désactivé

---

## En production (Vercel, etc.)

Ajoute les mêmes variables dans les paramètres de ton hébergeur :

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`

---

## Rappel : Après la mise en production

Une fois déployé en production :

1. Vérifie que les variables Sentry sont bien configurées sur l'hébergeur
2. Provoque une erreur de test (ex. visite une page qui n'existe pas, ou une API qui échoue)
3. Vérifie dans Sentry → **Issues** que l'erreur apparaît (peut prendre 1-2 minutes)
4. Si l'erreur s'affiche, Sentry fonctionne correctement en production
