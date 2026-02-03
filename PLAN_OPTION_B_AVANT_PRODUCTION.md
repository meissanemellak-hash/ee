# Plan Option B : Sécuriser avant la production

Ordre recommandé pour Sentry, backups et checklist.

---

## 1. Sentry (monitoring des erreurs)

**Déjà en place** : `@sentry/nextjs` installé, config dans `next.config.js`, `instrumentation*.ts`, `sentry.*.config.ts`, `app/global-error.tsx`. L’app fonctionne sans Sentry tant que les variables d’environnement ne sont pas définies.

**À faire** :

1. Créer un compte sur [sentry.io](https://sentry.io/signup/) et un projet **Next.js**.
2. Récupérer le **DSN** et (optionnel) **SENTRY_ORG**, **SENTRY_PROJECT**, **SENTRY_AUTH_TOKEN** (voir [GUIDE_SENTRY.md](./GUIDE_SENTRY.md)).
3. Ajouter en local dans `.env.local` :
   ```env
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@o0.ingest.sentry.io/0
   ```
4. Redémarrer l’app, provoquer une erreur de test, vérifier qu’elle apparaît dans Sentry.
5. **Avant prod** : configurer les mêmes variables sur l’hébergeur (ex. Vercel).

**Référence** : [GUIDE_SENTRY.md](./GUIDE_SENTRY.md)

---

## 2. Backups

**Déjà en place** : script `npm run db:backup` (`scripts/backup-db.mjs`). Guide pour Supabase et pg_dump.

**À faire** :

1. Lancer `npm run db:verif-backups` pour vérifier DATABASE_URL et pg_dump (voir [GUIDE_VERIF_BACKUPS.md](./GUIDE_VERIF_BACKUPS.md)).
2. **Supabase Free** : les backups auto ne sont pas inclus (payant). Utiliser `npm run db:backup` régulièrement. **Supabase Pro** : vérifier Settings → Database → Backups (7 jours, PITR).
3. Installer `pg_dump` si besoin (voir [GUIDE_BACKUPS.md](./GUIDE_BACKUPS.md)) et tester `npm run db:backup` une fois.
4. Si tu ne passes pas par Supabase : s’assurer qu’un backup automatique (cron, hébergeur, etc.) lance régulièrement une sauvegarde (ou le script `db:backup`).

**Référence** : [GUIDE_BACKUPS.md](./GUIDE_BACKUPS.md), [GUIDE_VERIF_BACKUPS.md](./GUIDE_VERIF_BACKUPS.md)

---

## 3. Checklist avant production

Quand tu approches du lancement, cocher tous les points de la checklist.

**À faire** :

1. Ouvrir [CHECKLIST_AVANT_PRODUCTION.md](./CHECKLIST_AVANT_PRODUCTION.md).
2. Traiter dans l’ordre : **Documentation (Aide utilisateur)** → **Sentry** → **Backups** → **Autres (optionnel)**.
3. Les éléments optionnels (CI/CD, variables d’env, tests E2E employé) peuvent être faits après le premier déploiement si besoin.

**Référence** : [CHECKLIST_AVANT_PRODUCTION.md](./CHECKLIST_AVANT_PRODUCTION.md)

---

## Récap

| Étape | Priorité | Temps estimé |
|-------|----------|--------------|
| 1. Sentry (compte + DSN + test) | ✅ Fait | — |
| 2. Backups (vérif Supabase ou script) | Haute | ~15 min |
| 3. Checklist (doc, env, CI…) | Avant lancement | Selon ce qui reste |

Commencer par **Sentry** : une fois le DSN ajouté et un test d’erreur validé, tu es couvert pour la prod.
