#!/usr/bin/env node
/**
 * Restaure la base PostgreSQL à partir d'un fichier de backup (.sql).
 * Usage : node scripts/restore-db.mjs [fichier.sql]
 *         ou : npm run db:restore -- backups/db-backup-2026-02-03T12-34-33.sql
 * Si aucun fichier n'est donné, utilise le plus récent dans backups/
 */

import { spawnSync } from 'child_process'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = join(__dirname, '..')

function loadEnv() {
  const envPath = join(rootDir, '.env.local')
  if (!existsSync(envPath)) {
    const envPath2 = join(rootDir, '.env')
    if (existsSync(envPath2)) return readFileSync(envPath2, 'utf8')
    console.error('❌ Fichier .env.local ou .env introuvable.')
    process.exit(1)
  }
  return readFileSync(envPath, 'utf8')
}

function getDatabaseUrl(envContent) {
  const match = envContent.match(/DATABASE_URL=["']?([^"' \n]+)["']?/)
  if (!match) {
    console.error('❌ DATABASE_URL introuvable dans .env.local')
    process.exit(1)
  }
  return match[1]
}

function getPsqlPath(envContent) {
  const match = envContent.match(/PG_DUMP_PATH=["']?([^"' \n]+)["']?/)
  const basePath = match ? match[1].replace(/pg_dump$/, '') : null
  const candidates = basePath
    ? [basePath + 'psql']
    : [
        process.env.PG_DUMP_PATH?.replace(/pg_dump$/, '') + 'psql',
        '/opt/homebrew/opt/postgresql@17/bin/psql',
        '/usr/local/opt/postgresql@17/bin/psql',
        '/opt/homebrew/opt/postgresql@16/bin/psql',
        '/usr/local/opt/postgresql@16/bin/psql',
      ].filter(Boolean)
  for (const p of candidates) {
    if (p && existsSync(p)) return p
  }
  return 'psql'
}

function getLatestBackup(backupDir) {
  if (!existsSync(backupDir)) return null
  const files = readdirSync(backupDir)
    .filter((f) => f.startsWith('db-backup-') && f.endsWith('.sql'))
    .sort()
    .reverse()
  return files.length ? join(backupDir, files[0]) : null
}

function main() {
  const envContent = loadEnv()
  const databaseUrl = getDatabaseUrl(envContent)
  const backupDir = join(rootDir, 'backups')

  let backupPath = process.argv[2]
  if (!backupPath) {
    backupPath = getLatestBackup(backupDir)
    if (!backupPath) {
      console.error('❌ Aucun fichier de backup trouvé dans backups/')
      console.error('   Usage : npm run db:restore -- backups/db-backup-YYYY-MM-DDTHH-MM-SS.sql')
      process.exit(1)
    }
    console.log('📂 Utilisation du backup le plus récent :', backupPath)
  }
  if (!existsSync(backupPath)) {
    console.error('❌ Fichier introuvable :', backupPath)
    process.exit(1)
  }

  let url
  try {
    url = new URL(databaseUrl)
  } catch {
    console.error('❌ DATABASE_URL invalide')
    process.exit(1)
  }

  const host = url.hostname
  const port = url.port || 5432
  const user = decodeURIComponent(url.username)
  const password = decodeURIComponent(url.password)
  const database = url.pathname.slice(1).split('?')[0]
  const env = { ...process.env, PGPASSWORD: password }
  const psqlPath = getPsqlPath(envContent)

  // 1. Drop schema public et recréer pour restauration propre (Supabase-compatible)
  const dropSql = `
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
`
  console.log('🔄 Nettoyage du schéma public...')
  const dropResult = spawnSync(psqlPath, ['-h', host, '-p', port, '-U', user, '-d', database, '-v', 'ON_ERROR_STOP=1', '-c', dropSql], {
    env,
    stdio: 'pipe',
    encoding: 'utf8',
  })
  if (dropResult.status !== 0) {
    console.error('❌ Erreur lors du nettoyage:', dropResult.stderr || dropResult.stdout)
    process.exit(1)
  }

  // 2. Restaurer le fichier SQL (ON_ERROR_STOP=0 pour ignorer "schema already exists" sur Supabase)
  console.log('📥 Restauration depuis', backupPath, '...')
  const restoreResult = spawnSync(psqlPath, ['-h', host, '-p', port, '-U', user, '-d', database, '-v', 'ON_ERROR_STOP=0', '-f', backupPath], {
    env,
    stdio: 'inherit',
  })
  // Sur Supabase le dump peut contenir CREATE SCHEMA auth etc. déjà présents → erreurs ignorées
  if (restoreResult.status !== 0) {
    console.error('\n⚠️  psql a terminé avec des erreurs (éventuellement normales si schémas auth/extensions déjà présents).')
    console.error('   Vérifiez les données dans le schéma public (tables, lignes).')
  }

  console.log('\n✅ Base restaurée avec succès depuis', backupPath)
}

main()
