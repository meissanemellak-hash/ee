# Guide de vérification des backups

Ce guide t’aide à vérifier que les backups sont bien configurés et fonctionnent.

---

## Étape 1 : Vérifier pg_dump (prérequis)

Ouvre un terminal et tape :

```bash
pg_dump --version
```

**Résultat attendu :** une version affichée (ex. `pg_dump (PostgreSQL) 16.x`)

**Si pg_dump n’est pas trouvé :**

- **Mac** : `brew install postgresql`
- **Ubuntu/Debian** : `sudo apt install postgresql-client`

---

## Étape 2 : Vérifier la présence du script

Dans le dossier du projet, vérifie que ces fichiers existent :

- `scripts/backup-db.mjs`
- `GUIDE_BACKUPS.md`

---

## Étape 3 : Lancer un backup de test

Depuis la racine du projet :

```bash
npm run db:backup
```

**Résultat attendu :** `✅ Backup sauvegardé : backups/db-backup-YYYY-MM-DDTHH-MM-SS.sql`

---

## Étape 4 : Vérifier le fichier créé

1. Ouvre le dossier `backups/`
2. Tu dois voir un fichier `.sql` avec un horodatage
3. Ouvre le fichier : tu dois voir du SQL (CREATE TABLE, INSERT, etc.)

---

## Étape 5 : Vérifier les backups Supabase

1. Va sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionne ton projet
3. **Settings** → **Database** → **Backups**
4. Vérifie que les backups automatiques sont actifs (Free : 7 jours, Pro : PITR)

---

## En cas d’erreur

### « pg_dump introuvable » ou « server version mismatch »

Supabase utilise PostgreSQL 17. Installe `postgresql@17` :

```bash
brew install postgresql@17
```

Puis ajoute dans `.env.local` :

```env
PG_DUMP_PATH=/opt/homebrew/opt/postgresql@17/bin/pg_dump
```

*(Sur Intel Mac : `/usr/local/opt/postgresql@17/bin/pg_dump`)*

### « .env.local introuvable »

Assure-toi d’être à la racine du projet et que `.env.local` contient `DATABASE_URL`.

### « Erreur de connexion » ou « timeout »

Vérifie que `DATABASE_URL` est correct dans `.env.local` et que ta machine peut atteindre Supabase (réseau, VPN, etc.).

---

## Récapitulatif

| Vérification          | Commande / action                        |
|-----------------------|------------------------------------------|
| pg_dump installé      | `pg_dump --version`                      |
| Script présent        | `scripts/backup-db.mjs` existe           |
| Backup manuel         | `npm run db:backup`                      |
| Fichier créé          | `backups/db-backup-*.sql`                |
| Supabase backups      | Dashboard → Settings → Database → Backups |
