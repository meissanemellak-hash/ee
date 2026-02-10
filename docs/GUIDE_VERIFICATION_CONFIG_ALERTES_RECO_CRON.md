# Guide de vérification – Alertes, Recommandations et Crons

Ce guide permet de vérifier que tout est bien configuré pour les **alertes** (état actuel, synchronisation, cron), les **recommandations** (dernière génération, cron) et les **crons** (Vercel / local).

---

## 1. Variables d’environnement

### En local (`.env.local`)

| Variable | Rôle | Comment vérifier |
|----------|------|-------------------|
| `CRON_SECRET` | Sécurise les routes `/api/cron/alerts` et `/api/cron/recommendations` | Doit être définie si tu veux tester les crons en local (voir section 4). |
| `DATABASE_URL` | Connexion Prisma | Sans elle, l’app et les APIs ne fonctionnent pas. |
| Clerk, Stripe, etc. | Auth, paiements | Déjà couverts par tes autres guides. |

- [ ] **CRON_SECRET** : présente dans `.env.local` si tu testes le cron en local (valeur quelconque forte, ex. `openssl rand -hex 32`).
- [ ] **DATABASE_URL** : présente et valide (tu peux lancer `npx prisma db pull` ou ouvrir l’app pour confirmer).

### En production (Vercel)

Dans **Vercel → Ton projet → Settings → Environment Variables** (environnement **Production**) :

- [ ] **CRON_SECRET** : définie. **Sans elle**, les crons Vercel renverront 503 et ne s’exécuteront pas.
- [ ] **DATABASE_URL** et les autres variables (Stripe, Clerk, etc.) : déjà vérifiées dans ta checklist production.

---

## 2. Vérification des Alertes

### 2.1 Page Alertes (interface)

1. Lancer l’app en local : `npm run dev`.
2. Se connecter, aller sur **Dashboard → Alertes**.
3. **Sélectionner un restaurant** (pas « Tous les restaurants »).

À vérifier :

- [ ] Un bloc **« État actuel (d’après l’inventaire) »** s’affiche sous le titre, avec :
  - le nombre de **ruptures imminentes** et de **surstocks** (calculés en direct depuis l’inventaire).
- [ ] Si des ruptures/surstocks existent : un bouton **« Synchroniser les alertes »** est proposé.
- [ ] Le bouton **« Générer les alertes »** (ou « Synchroniser les alertes ») crée/met à jour les alertes en base ; après actualisation, les alertes apparaissent dans la liste.
- [ ] Les filtres (restaurant, type, sévérité, statut Actives/Résolues) fonctionnent.
- [ ] Quand la liste « Actives » est vide mais que l’état actuel affiche des ruptures/surstocks : le message indique d’utiliser « Synchroniser les alertes ».

### 2.2 API « État actuel » (optionnel)

Pour vérifier que l’API état actuel répond bien :

1. Récupérer un `restaurantId` (ex. depuis l’URL ou les filtres de la page Alertes).
2. Appeler en étant connecté (cookie de session) :

```bash
# Remplace RESTAURANT_ID et (si besoin) CLERK_ORG_ID
curl -s "http://localhost:3000/api/alerts/current-state?restaurantId=RESTAURANT_ID&clerkOrgId=CLERK_ORG_ID" \
  -H "Cookie: __session=..." 
```

Ou ouvre dans le navigateur (connecté) :

`http://localhost:3000/api/alerts/current-state?restaurantId=xxx&clerkOrgId=yyy`

- [ ] Réponse 200 avec `shortages`, `overstocks` et `items` (tableau). Pas d’erreur 401/404/500.

---

## 3. Vérification des Recommandations

### 3.1 Page Recommandations (interface)

1. Aller sur **Dashboard → Recommandations**.
2. Sélectionner un restaurant (ou « Tous »).

À vérifier :

- [ ] Sous le titre, un texte du type **« Dernière génération : [date/heure] »** s’affiche s’il existe au moins une recommandation en base pour ce filtre.
- [ ] S’il n’y a jamais eu de génération : **« Aucune génération récente. Générez des recommandations pour commencer. »**.
- [ ] Cliquer sur **« Générer »** (BOM ou selon ta config) : après succès, « Dernière génération » se met à jour.
- [ ] Le bouton **« Actualiser »** rafraîchit la liste sans erreur.

### 3.2 API « Dernière génération » (optionnel)

En étant connecté :

```bash
# Optionnel : avec restaurantId pour un restaurant donné
curl -s "http://localhost:3000/api/recommendations/last-generated?clerkOrgId=CLERK_ORG_ID" \
  -H "Cookie: __session=..."
```

- [ ] Réponse 200 avec `lastGeneratedAt` (date ISO ou `null`).

---

## 4. Vérification des Crons

### 4.1 Configuration (vercel.json)

Dans le projet, le fichier **`vercel.json`** doit contenir :

```json
{
  "crons": [
    { "path": "/api/cron/recommendations", "schedule": "0 6 * * *" },
    { "path": "/api/cron/alerts", "schedule": "0 * * * *" }
  ]
}
```

- [ ] **Alertes** : `path` = `/api/cron/alerts`, schedule = `0 * * * *` (toutes les heures).
- [ ] **Recommandations** : `path` = `/api/cron/recommendations`, schedule = `0 6 * * *` (tous les jours à 6h UTC).

### 4.2 Test en local (avec CRON_SECRET)

Sans `CRON_SECRET`, les routes cron renvoient **503**. Avec une valeur définie, tu peux les appeler manuellement.

1. Définir `CRON_SECRET` dans `.env.local` (ex. `CRON_SECRET=mon-secret-de-test`).
2. Redémarrer le serveur (`npm run dev`).
3. Appeler les routes avec le secret :

**Alertes :**

```bash
# Remplace MON_SECRET par la valeur de CRON_SECRET
curl -s -w "\nHTTP_CODE:%{http_code}\n" "http://localhost:3000/api/cron/alerts" \
  -H "Authorization: Bearer MON_SECRET"
```

- [ ] Réponse **200** avec un JSON contenant `success: true`, `restaurantsProcessed`, `successCount`, `results`. **Pas** 401 ni 503.

**Recommandations :**

```bash
curl -s -w "\nHTTP_CODE:%{http_code}\n" "http://localhost:3000/api/cron/recommendations" \
  -H "Authorization: Bearer MON_SECRET"
```

- [ ] Réponse **200** avec un JSON (ex. `totalCreated`, détails par org). **Pas** 401 ni 503.

Si tu reçois **503** : `CRON_SECRET` est absent ou le serveur n’a pas été redémarré après l’ajout.  
Si tu reçois **401** : le secret envoyé (Bearer ou header) ne correspond pas à `CRON_SECRET`.

### 4.3 Vérification en production (Vercel)

1. Déployer le projet sur Vercel (avec `CRON_SECRET` définie en Production).
2. **Vercel → Project → Settings → Crons** : les deux crons doivent apparaître avec les bonnes routes et schedules.
3. (Optionnel) Attendre l’heure planifiée ou déclencher un run manuel depuis l’interface Vercel si disponible.
4. Vérifier les **logs / fonctions** Vercel pour les routes `api/cron/alerts` et `api/cron/recommendations` : pas d’erreur 503 (config manquante) ni 401 (secret invalide).

- [ ] **CRON_SECRET** bien définie en Production.
- [ ] Les deux crons listés dans Vercel avec les bons path/schedule.
- [ ] Aucune erreur 503/401 dans les exécutions.

---

## 5. Récapitulatif rapide

| Élément | Où vérifier | Critère de succès |
|--------|-------------|-------------------|
| **État actuel (alertes)** | Page Alertes + 1 restaurant | Bloc « État actuel » avec ruptures/surstocks + bouton Synchroniser |
| **API current-state** | GET `/api/alerts/current-state` | 200 + `shortages`, `overstocks`, `items` |
| **Dernière génération (reco)** | Page Recommandations | Texte « Dernière génération : … » ou « Aucune génération récente » |
| **API last-generated** | GET `/api/recommendations/last-generated` | 200 + `lastGeneratedAt` |
| **Cron alertes** | `vercel.json` + test curl local / Vercel | 200 avec Bearer CRON_SECRET ; en prod crons visibles et sans 503/401 |
| **Cron recommandations** | Idem | Idem |
| **CRON_SECRET** | `.env.local` (local) / Vercel (prod) | Définie pour que les crons répondent 200 |

Une fois toutes les cases cochées, la configuration Alertes / Recommandations / Crons est considérée comme correcte. Pour la checklist globale avant mise en production, voir **CHECKLIST_AVANT_PRODUCTION.md** (section Variables Vercel et Crons).
