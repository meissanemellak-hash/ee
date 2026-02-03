#!/usr/bin/env bash
# Appelé par cron pour lancer un backup DB.
# Usage dans crontab : 0 2 * * * /chemin/vers/projet/scripts/cron-backup.sh
# Ne modifie pas le code de backup : appelle uniquement npm run db:backup.

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"
npm run db:backup
