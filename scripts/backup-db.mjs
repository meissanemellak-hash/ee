#!/usr/bin/env node
/**
 * Script de backup PostgreSQL via pg_dump.
 * Nécessite : pg_dump installé (brew install postgresql sur Mac).
 * Usage : npm run db:backup
 */

import { spawnSync } from 'child_process'
import { readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = join(__dirname, '..')

function loadEnv() {
  const envPath = join(rootDir, '.env.local')
  if (!existsSync(envPath)) {
    const envPath2 = join(rootDir, '.env')
    if (existsSync(envPath2)) {
      return readFileSync(envPath2, 'utf8')
    }
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

function getPgDumpPath(envContent) {
  const match = envContent.match(/PG_DUMP_PATH=["']?([^"' \n]+)["']?/)
  if (match) return match[1]
  // Sur Mac avec Homebrew, tenter postgresql@17 si présent
  const candidates = [
    process.env.PG_DUMP_PATH,
    '/opt/homebrew/opt/postgresql@17/bin/pg_dump',
    '/usr/local/opt/postgresql@17/bin/pg_dump',
    '/opt/homebrew/opt/postgresql@16/bin/pg_dump',
    '/usr/local/opt/postgresql@16/bin/pg_dump',
  ]
  for (const p of candidates) {
    if (p && existsSync(p)) return p
  }
  return 'pg_dump'
}

function main() {
  const envContent = loadEnv()
  const databaseUrl = getDatabaseUrl(envContent)

  let url
  try {
    url = new URL(databaseUrl)
  } catch {
    console.error('❌ DATABASE_URL invalide')
    process.exit(1)
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupDir = join(rootDir, 'backups')
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true })
  }
  const backupPath = join(backupDir, `db-backup-${timestamp}.sql`)

  const host = url.hostname
  const port = url.port || 5432
  const user = decodeURIComponent(url.username)
  const password = decodeURIComponent(url.password)
  const database = url.pathname.slice(1).split('?')[0]

  const env = { ...process.env, PGPASSWORD: password }
  const args = ['-h', host, '-p', port, '-U', user, '-d', database, '-F', 'p', '-f', backupPath]
  const pgDumpPath = getPgDumpPath(envContent)

  try {
    const result = spawnSync(pgDumpPath, args, {
      stdio: 'inherit',
      env,
    })
    if (result.status !== 0) {
      if (result.error?.code === 'ENOENT') {
        console.error('\n❌ pg_dump introuvable. Installe PostgreSQL 17 (Supabase utilise 17.x) :')
        console.error('   Mac : brew install postgresql@17')
        console.error('   Puis ajoute dans .env.local : PG_DUMP_PATH=/opt/homebrew/opt/postgresql@17/bin/pg_dump')
        console.error('   Ubuntu : sudo apt install postgresql-client-17')
      }
      process.exit(1)
    }
    console.log(`\n✅ Backup sauvegardé : ${backupPath}`)
  } catch (err) {
    console.error('❌ Erreur lors du backup:', err.message)
    process.exit(1)
  }
}

main()
