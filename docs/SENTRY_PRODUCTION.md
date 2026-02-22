# Sentry en production

## 1. Variables sur Vercel

Dans **Vercel** → ton projet → **Settings** → **Environment Variables**, ajoute pour l’environnement **Production** (et **Preview** si tu veux) :

| Variable | Valeur | Rôle |
|----------|--------|------|
| **NEXT_PUBLIC_SENTRY_DSN** | Ton DSN Sentry (ex. `https://xxx@o4510810064945152.ingest.de.sentry.io/4510810083164240`) | Envoi des erreurs |
| **SENTRY_ORG** | Slug de ton org Sentry (ex. `ia-operations`) | Build / source maps |
| **SENTRY_PROJECT** | Slug du projet (ex. `ai-restaurant-manager`) | Build / source maps |
| **SENTRY_AUTH_TOKEN** | Token Sentry (Settings → Auth Tokens) | Upload des source maps au build |

Tu peux copier les valeurs depuis ton `.env.local`. Sans ces variables, le build n’intègre pas Sentry et les erreurs prod ne remontent pas.

## 2. (Optionnel) Tester Sentry en prod

Une route permet d’envoyer un événement de test à Sentry :

1. Sur **Vercel**, ajoute une variable **SENTRY_TEST_SECRET** (Production) avec une valeur secrète, par ex. :  
   `openssl rand -hex 16`
2. Redéploie le projet.
3. Appelle la route avec ce secret :
   ```bash
   curl "https://ia-restaurant-manager.com/api/test-sentry?secret=TA_VALEUR_SENTRY_TEST_SECRET"
   ```
4. Réponse attendue : `{"ok":true,"message":"Événement de test envoyé à Sentry..."}`.
5. Dans **Sentry** → ton projet → **Issues**, tu dois voir une erreur avec le message :  
   `[Test] Sentry configuré correctement – IA Restaurant Manager`.

Après validation, tu peux supprimer **SENTRY_TEST_SECRET** de Vercel si tu veux (la route renverra 401 sans elle).

## 3. Vérifier que Sentry est actif

- Les erreurs non gérées (front et API) sont envoyées à Sentry si `NEXT_PUBLIC_SENTRY_DSN` est défini.
- Les source maps sont uploadées au build si `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` et `SENTRY_PROJECT` sont définis (stack traces lisibles dans Sentry).
