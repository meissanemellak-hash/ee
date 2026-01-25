# Résolution des problèmes de cache CSS

## Problème
Les erreurs 404 pour `layout.css` et les warnings de preload sont généralement causés par un cache Next.js corrompu.

## Solution rapide

### 1. Arrêter le serveur de développement
Appuyez sur `Ctrl+C` dans le terminal où le serveur tourne.

### 2. Nettoyer le cache
```bash
npm run clean
```

### 3. Redémarrer le serveur
```bash
npm run dev
```

## Solution alternative (tout en un)
```bash
npm run dev:clean
```

## Si le problème persiste

1. **Vider le cache du navigateur** :
   - Chrome/Edge : `Ctrl+Shift+Delete` (Windows) ou `Cmd+Shift+Delete` (Mac)
   - Firefox : `Ctrl+Shift+Delete` (Windows) ou `Cmd+Shift+Delete` (Mac)
   - Safari : `Cmd+Option+E`

2. **Hard refresh** :
   - Chrome/Edge : `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)
   - Firefox : `Ctrl+F5` (Windows) ou `Cmd+Shift+R` (Mac)
   - Safari : `Cmd+Option+R`

3. **Vérifier que le fichier `app/globals.css` existe** et contient bien les imports Tailwind.

## Notes
- Le cache Next.js (`.next/`) est automatiquement ignoré par Git
- Ne jamais commit le dossier `.next/`
- En cas de problème persistant, supprimer aussi `node_modules` et réinstaller : `rm -rf node_modules && npm install`
