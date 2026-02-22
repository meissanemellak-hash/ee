# Vérification CRON_SECRET et crons Vercel

## À quoi ça sert

- **CRON_SECRET** : protège les routes `/api/cron/recommendations` et `/api/cron/alerts`. Sans cette variable, les crons répondent **503** et ne s’exécutent pas.
- **Crons** : Vercel appelle automatiquement ces routes selon le planning défini dans `vercel.json` :
  - **Recommandations** : tous les jours à **6h UTC** (`/api/cron/recommendations`)
  - **Alertes** : tous les jours à **7h UTC** (`/api/cron/alerts`)

Vercel envoie le header `Authorization: Bearer <CRON_SECRET>` à chaque appel.

---

## Étape 1 – Vérifier CRON_SECRET sur Vercel

1. Va sur **Vercel** → ton projet (**ee** ou **ia-restaurant-manager.com**) → **Settings** → **Environment Variables**.
2. Dans la liste, cherche **CRON_SECRET**.
3. **Si elle existe** : vérifie qu’elle est bien associée à **Production** (et Preview si tu veux). La valeur est masquée, c’est normal.
4. **Si elle n’existe pas** :
   - Clique sur **Add Environment Variable**.
   - **Key** : `CRON_SECRET`
   - **Value** : génère une valeur forte (en local : `openssl rand -hex 32`) ou copie celle de ton `.env.local` (ex. `cd0c26c5ee838dcb092aa651178fd2475138e9b1d561d884a886f5d4c4a782cf`).
   - Coche **Production** (et **Preview** si besoin).
   - **Save**.
5. Si tu viens d’ajouter ou de modifier : **Deployments** → **Redeploy** du dernier déploiement.

---

## Étape 2 – Vérifier les crons dans Vercel

1. Toujours dans le projet Vercel → **Settings**.
2. Dans le menu de gauche, clique sur **Cron Jobs** (sous "Build and Deployment" ou dans la liste des réglages).
3. Tu dois voir **2 crons** listés :
   - **Path** : `/api/cron/recommendations` — **Schedule** : `0 6 * * *` (tous les jours à 6h UTC).
   - **Path** : `/api/cron/alerts` — **Schedule** : `0 7 * * *` (tous les jours à 7h UTC).
4. Si la liste est vide : vérifie que le fichier **vercel.json** à la racine du projet contient bien la section `crons` et que le dernier déploiement a été fait après ce fichier. Puis refais un déploiement (push ou Redeploy).

---

## Étape 3 – Test manuel (optionnel)

Pour vérifier que la route répond bien avec le secret :

```bash
curl -H "Authorization: Bearer VOTRE_CRON_SECRET" "https://ia-restaurant-manager.com/api/cron/recommendations"
```

Remplace `VOTRE_CRON_SECRET` par la valeur de `CRON_SECRET` (celle de Vercel Production). Tu dois obtenir une réponse **200** avec du JSON (pas 401 ni 503).

---

## Résumé

| Étape | Où | Action |
|-------|-----|--------|
| 1 | Vercel → Settings → Environment Variables | Vérifier ou ajouter **CRON_SECRET** pour Production |
| 2 | Vercel → Settings → Cron Jobs | Vérifier que les 2 crons (recommendations, alerts) sont listés |
| 3 | (Optionnel) Terminal ou navigateur | Tester avec `curl` et le secret |
