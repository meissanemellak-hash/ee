# Guide : intégrer la vidéo de démonstration sur la landing

Ce guide décrit comment remplacer le bloc « Vidéo de démonstration – Disponible sur demande » par une vraie vidéo, de la meilleure façon possible.

---

## Vue d’ensemble

- **Aujourd’hui** : placeholder avec icône Play et texte « Disponible sur demande ».
- **Objectif** : lecteur vidéo intégré (YouTube ou Vimeo recommandé), avec chargement léger et bonne accessibilité.

---

## Étape 1 – Choisir où héberger la vidéo

| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| **YouTube** | Gratuit, lecteur familier, sous-titres faciles, pas de bande passante à payer | Logo YouTube, suggestions à la fin (désactivables en paramètres d’embed) |
| **Vimeo** | Look pro, pas de pub, bon contrôle (privacy, domaine) | Gratuit limité ; au-delà, abonnement |
| **Fichier sur le site** | Contrôle total | Poids, bande passante, hébergement à gérer |

**Recommandation** : **YouTube** (gratuit, simple) ou **Vimeo** si vous voulez un rendu plus « produit » et contrôler la diffusion.

---

## Étape 2 – Préparer la vidéo

1. **Contenu** : 1 à 3 minutes pour montrer le produit (dashboard, un restaurant, une alerte, une recommandation).
2. **Format** : 16:9 (aspect-video), résolution 1080p si possible.
3. **Export** : MP4 (H.264) pour upload YouTube/Vimeo.
4. **Sous-titres** : optionnel mais utile (accessibilité + vision sans son).

---

## Étape 3 – Upload et récupérer l’URL d’embed

### Si YouTube

1. Créez une chaîne / connectez-vous à [YouTube](https://www.youtube.com).
2. **Créer** → **Importer une vidéo** → uploadez le fichier.
3. Une fois la vidéo en ligne : **Partager** → **Intégrer** → copiez le code de l’**iframe**.
4. Dans l’URL de l’iframe, repérez l’**id** de la vidéo :
   - Format : `https://www.youtube.com/embed/VIDEO_ID`
   - Exemple : `https://www.youtube.com/embed/dQw4w9WgXcQ` → l’id est `dQw4w9WgXcQ`.

Vous utiliserez soit l’URL complète `https://www.youtube.com/embed/VIDEO_ID`, soit uniquement `VIDEO_ID` selon ce que le code attend.

### Si Vimeo

1. [Vimeo](https://vimeo.com) → **Upload** → uploadez la vidéo.
2. Sur la page de la vidéo : **Partager** → **Intégrer** → copiez l’URL ou le code iframe.
3. L’URL d’embed ressemble à : `https://player.vimeo.com/video/NUMERO_ID`.

Conservez cette URL (ou l’id) pour l’étape suivante.

---

## Étape 4 – Configurer l’URL dans le projet

Pour pouvoir changer la vidéo sans toucher au code :

- **Option A (recommandée)** : variable d’environnement  
  Dans `.env.local` (et en prod) :
  ```env
  NEXT_PUBLIC_LANDING_DEMO_VIDEO_URL=https://www.youtube.com/embed/VOTRE_VIDEO_ID
  ```
  Ou pour Vimeo :
  ```env
  NEXT_PUBLIC_LANDING_DEMO_VIDEO_URL=https://player.vimeo.com/video/VOTRE_ID
  ```

- **Option B** : constante dans le code  
  Dans un fichier de config ou directement dans le composant landing, par exemple :
  ```ts
  const DEMO_VIDEO_EMBED_URL = 'https://www.youtube.com/embed/...'
  ```

L’implémentation dans la landing utilisera cette URL (lire `process.env.NEXT_PUBLIC_LANDING_DEMO_VIDEO_URL` ou la constante).

---

## Étape 5 – Intégration dans la landing (code)

Le code fera :

1. **Si une URL de vidéo est configurée** : afficher un lecteur embed (iframe YouTube/Vimeo) dans le bloc actuel, avec :
   - ratio 16:9 (`aspect-video`),
   - bordures arrondies,
   - titre accessible pour les lecteurs d’écran.

2. **Si aucune URL** : garder le placeholder actuel (« Vidéo de démonstration – Disponible sur demande ») pour ne rien casser.

Pour ne pas alourdir la page, l’iframe peut être chargée seulement au clic sur un bouton « Lire » (image de prévue + bouton Play), puis affichage du lecteur. Sinon, affichage direct de l’iframe (YouTube/Vimeo ne chargent le lecteur que lorsqu’il est visible).

---

## Étape 6 – Vérifications

- [ ] La vidéo s’affiche correctement sur desktop et mobile.
- [ ] Le titre / le contenu du bloc est accessible (aria-label ou titre visible).
- [ ] En changeant `NEXT_PUBLIC_LANDING_DEMO_VIDEO_URL` (ou la constante), la nouvelle vidéo s’affiche après rechargement (et redémarrage du serveur si vous utilisez une env).

---

## Résumé des étapes (checklist)

1. [ ] Choisir YouTube ou Vimeo.
2. [ ] Préparer et exporter la vidéo (16:9, ~1–3 min).
3. [ ] Upload sur la plateforme et récupérer l’URL d’embed.
4. [ ] Ajouter `NEXT_PUBLIC_LANDING_DEMO_VIDEO_URL` dans `.env.local` (ou constante dans le code).
5. [ ] Mettre à jour le composant landing (voir implémentation ci-dessous).
6. [ ] Tester sur plusieurs tailles d’écran et vérifier l’accessibilité.

Une fois l’URL en place, le bloc « Vidéo de démonstration » affichera le lecteur à la place du placeholder.
