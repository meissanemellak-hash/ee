#!/bin/bash

# Script de sauvegarde quotidienne
# Usage: ./save-work.sh "Message de commit"

echo "🔄 Vérification de l'état du dépôt..."
git status

echo ""
echo "📦 Ajout des fichiers modifiés..."
git add .

echo ""
echo "💾 Création du commit..."
if [ -z "$1" ]; then
    COMMIT_MSG="Sauvegarde du travail - $(date '+%Y-%m-%d %H:%M')"
else
    COMMIT_MSG="$1"
fi

git commit -m "$COMMIT_MSG"

echo ""
echo "📤 Envoi vers le dépôt distant (si configuré)..."
git push 2>/dev/null || echo "⚠️  Pas de dépôt distant configuré. Utilisez 'git remote add origin <url>' pour en ajouter un."

echo ""
echo "✅ Sauvegarde terminée !"
echo "📝 Commit: $COMMIT_MSG"
