# Guide Backups – Étape par étape

Ce guide explique comment mettre en place des sauvegardes pour ta base PostgreSQL (Supabase), sans modifier le comportement de l’app.

---

## Option 1 : Backups Supabase (recommandé)

Supabase propose des sauvegardes intégrées.

### Free tier

- **Rétention** : 7 jours
- **Fréquence** : quotidienne

### Pro tier (si tu passes au plan payant)

- **Point-in-Time Recovery (PITR)** : restauration à une date/heure précise
- **Rétention** : plus longue

### Activer / vérifier les backups Supabase

1. Va sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionne ton projet
3. **Settings** → **Database** → **Backups**
4. Vérifie la fréquence et la rétention
5. Pour PITR, passe sur le plan Pro

---

## Option 2 : Script de backup manuel (pg_dump)

Pour des sauvegardes supplémentaires (copies hors ligne, avant migrations, etc.), utilise le script fourni.

### Prérequis : PostgreSQL client (version ≥ serveur)

Supabase utilise PostgreSQL 17.x. Installe la même version ou plus récente.

Sur Mac :

```bash
brew install postgresql@17
```

Puis ajoute dans `.env.local` (pour utiliser pg_dump 17) :

```env
PG_DUMP_PATH=/opt/homebrew/opt/postgresql@17/bin/pg_dump
```

*(Sur Intel Mac, le chemin est `/usr/local/opt/postgresql@17/bin/pg_dump`)*

Sur Ubuntu/Debian :

```bash
sudo apt install postgresql-client-17
```

### Lancer un backup

```bash
npm run db:backup
```

Le fichier est créé dans `backups/` avec un horodatage, ex. :  
`backups/db-backup-2026-02-01T11-30-00.sql`

### Sauvegarde programmée (cron)

Pour un backup quotidien à 2h du matin :

```bash
crontab -e
```

Ajoute :

```
0 2 * * * cd /chemin/vers/projet && npm run db:backup
```

---

## Option 3 : Restauration depuis un backup

### Depuis Supabase Dashboard

1. Supabase → **Settings** → **Database** → **Backups**
2. Choisis un point de restauration
3. Clique sur **Restore** (plan Pro requis pour PITR)

### Depuis un fichier .sql (pg_dump)

```bash
psql $DATABASE_URL < backups/db-backup-YYYY-MM-DD.sql
```

Ou avec les variables :

```bash
psql "postgresql://user:pass@host:5432/dbname" < backups/db-backup-YYYY-MM-DD.sql
```

---

## Récapitulatif

| Méthode              | Avantage                    | Inconvénient                     |
|----------------------|-----------------------------|----------------------------------|
| Supabase built-in    | Automatique, sans script    | Dépend du plan Supabase          |
| Script pg_dump       | Contrôle total, copies off  | Nécessite pg_dump et cron        |

---

## Recommandation

1. **Vérifier** que les backups Supabase sont bien actifs (Dashboard → Database → Backups).
2. **Tester** le script : `npm run db:backup`, puis vérifier que le fichier est créé.
3. **Optionnel** : mettre en place un cron pour des backups quotidiens locaux.
4. **Documenter** la procédure de restauration pour ton équipe.
