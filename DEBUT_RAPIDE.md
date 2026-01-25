# 🚀 Démarrage Rapide

## Pour démarrer le serveur avec le visuel correct

### Option 1 : Démarrage normal (recommandé)
```bash
npm run dev
```

### Option 2 : Si le visuel ne se charge pas
```bash
npm run dev:fresh
```

Cette commande nettoie le cache et redémarre le serveur.

## ✅ Vérifications

1. **Ouvrez votre navigateur** : `http://localhost:3000`
2. **Vérifiez que le visuel s'affiche correctement** :
   - Sidebar visible
   - Styles Tailwind appliqués
   - Pas de texte brut sans style

## 🔧 Si le problème persiste

1. **Arrêtez le serveur** (Ctrl+C)
2. **Nettoyez complètement** :
   ```bash
   rm -rf .next node_modules/.cache
   ```
3. **Redémarrez** :
   ```bash
   npm run dev
   ```
4. **Dans le navigateur** : Faites un **hard refresh** :
   - **Mac** : `Cmd + Shift + R`
   - **Windows/Linux** : `Ctrl + Shift + R`

## 📝 Notes

- Le cache Webpack est désactivé en développement pour éviter les problèmes de CSS
- Les styles sont chargés de manière synchrone pour garantir l'affichage immédiat
- Si vous modifiez `globals.css`, redémarrez le serveur
