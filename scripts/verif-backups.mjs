#!/usr/bin/env node
/**
 * Vérification de la configuration backups avant production.
 * Usage : npm run db:verif-backups
 * Voir aussi : GUIDE_VERIF_BACKUPS.md
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = join(__dirname, '..')

function loadEnv() {
  const envPath = join(rootDir, '.env.local')
  if (!existsSync(envPath)) {
    const envPath2 = join(rootDir, '.env')
    if (existsSync(envPath2)) return readFileSync(envPath2, 'utf8')
    return null
  }
  return readFileSync(envPath, 'utf8')
}

function getDatabaseUrl(envContent) {
  if (!envContent) return null
  const match = envContent.match(/DATABASE_URL=["']?([^"' \n]+)["']?/)
  return match ? match[1] : null
}

function getPgDumpPath(envContent) {
  if (envContent) {
    const match = envContent.match(/PG_DUMP_PATH=["']?([^"' \n]+)["']?/)
    if (match && existsSync(match[1])) return match[1]
  }
  const candidates = [
    process.env.PG_DUMP_PATH,
    '/opt/homebrew/opt/postgresql@17/bin/pg_dump',
    '/usr/local/opt/postgresql@17/bin/pg_dump',
    '/opt/homebrew/opt/postgresql@16/bin/pg_dump',
    '/usr/local/opt/postgresql@16/bin/pg_dump',
  ].filter(Boolean)
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  try {
    execSync('pg_dump --version', { stdio: 'pipe' })
    return 'pg_dump'
  } catch {
    return null
  }
}

function main() {
  console.log('🔍 Vérification des backups (avant production)\n')

  const envContent = loadEnv()
  if (!envContent) {
    console.log('❌ Fichier .env.local ou .env introuvable.')
    console.log('   → Ajoute DATABASE_URL dans .env.local\n')
    console.log('📖 Détails : GUIDE_VERIF_BACKUPS.md')
    process.exit(1)
  }

  const databaseUrl = getDatabaseUrl(envContent)
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL introuvable dans .env.local')
    console.log('   → Ajoute DATABASE_URL=postgresql://... dans .env.local\n')
    console.log('📖 Détails : GUIDE_VERIF_BACKUPS.md')
    process.exit(1)
  }
  console.log('✅ DATABASE_URL présent')

  const pgDumpPath = getPgDumpPath(envContent)
  if (!pgDumpPath) {
    console.log('⚠️  pg_dump introuvable (optionnel si tu utilises uniquement les backups Supabase)')
    console.log('   Pour le script npm run db:backup :')
    console.log('   Mac : brew install postgresql@17')
    console.log('   Puis .env.local : PG_DUMP_PATH=/opt/homebrew/opt/postgresql@17/bin/pg_dump')
    console.log('   Voir : GUIDE_VERIF_BACKUPS.md\n')
  } else {
    console.log('✅ pg_dump disponible :', pgDumpPath === 'pg_dump' ? 'dans PATH' : pgDumpPath)
  }

  const backupDir = join(rootDir, 'backups')
  if (existsSync(backupDir)) {
    console.log('✅ Dossier backups/ présent')
  } else {
    console.log('ℹ️  Dossier backups/ sera créé au premier `npm run db:backup`')
  }

  console.log('\n--- Prochaines étapes ---')
  console.log('1. Backups Supabase : Dashboard → Settings → Database → Backups')
  console.log('2. Test backup local : npm run db:backup')
  console.log('3. Détails : GUIDE_VERIF_BACKUPS.md')
  console.log('')
}

main()
