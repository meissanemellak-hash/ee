# Guide : installer et configurer OBS Studio (gratuit)

Ce guide vous permet d’installer et de configurer OBS Studio **étape par étape** pour enregistrer la vidéo de démonstration de l’application (écran ou fenêtre du navigateur).

---

## Étape 1 – Télécharger OBS Studio

1. Allez sur le site officiel : **https://obsproject.com**
2. Cliquez sur **« Download »** (bouton vert).
3. Choisissez votre système :
   - **Windows** : téléchargez l’installateur Windows.
   - **macOS** : téléchargez la version Mac (Intel ou Apple Silicon selon votre Mac).
4. Une fois le fichier téléchargé, lancez-le.

---

## Étape 2 – Installer OBS Studio

### Sur Windows

1. Double-cliquez sur le fichier **`OBS-Studio-XX.X.X-FullInstaller-x64.exe`** (ou similaire).
2. Si Windows affiche une alerte « Application non reconnue », cliquez sur **« Plus d’infos »** puis **« Exécuter quand même »**.
3. Suivez l’assistant : **Next** → acceptez la licence → **Next** → laissez le dossier par défaut (ou changez si vous voulez) → **Install**.
4. À la fin, décochez **« Launch OBS Studio »** si vous ne voulez pas l’ouvrir tout de suite, puis **Finish**.

### Sur macOS

1. Ouvrez le fichier **`.dmg`** téléchargé.
2. Glissez **OBS** dans le dossier **Applications**.
3. Ouvrez **Applications** et lancez **OBS**. Si macOS bloque (« application non identifiée ») : **Réglages Système** → **Confidentialité et sécurité** → **Ouvrir quand même** pour OBS.
4. Au premier lancement, OBS affiche une fenêtre **« Vérifiez les permissions de l’application »** :
   - **Captures d’écran** : **obligatoire**. Cliquez sur « Ouvrir les préférences de Captures d’écran », puis dans Réglages Système ajoutez OBS à la liste et activez l’accès. Sans cela, l’écran restera noir.
   - **Caméra** : pas nécessaire pour une démo écran seule (ignorer).
   - **Microphone** : optionnel (utile seulement si vous enregistrez la voix en direct).
   - **Surveillance de l’entrée** : optionnel (utile pour les raccourcis clavier en arrière-plan).
   - Cliquez sur **« Continuer »** une fois la capture d’écran autorisée.

---

## Étape 3 – Premier lancement (assistant automatique)

1. Lancez **OBS Studio**.
2. Un assistant **« Auto-Configuration Wizard »** peut s’afficher.
   - Cliquez sur **« Next »** (Suivant).
   - **Optimize for streaming or recording ?** → choisissez **« Recording »** (Enregistrement) → **Next**.
   - Résolution : laissez **1920x1080** (ou 1280x720 si votre écran est plus petit) → **Next**.
   - Cliquez sur **« Apply Settings »** puis **« Finish »**.

Si l’assistant ne s’affiche pas, continuez à l’étape 4.

---

## Étape 4 – Créer une scène pour enregistrer l’application

OBS fonctionne avec des **scènes** (conteneurs) et des **sources** (ce qu’on affiche : écran, fenêtre, etc.).

1. En bas à gauche, dans la zone **« Scènes »** :
   - Vous avez déjà une scène **« Scene »**. Vous pouvez la renommer : clic droit → **Rename** → par exemple **« Démo navigateur »**.

2. Dans la zone **« Sources »** (toujours en bas à gauche) :
   - Cliquez sur le **+** (Ajouter).
   - Deux options utiles pour une démo d’app web :
     - **« Capture de fenêtre » (Window Capture)** : enregistre **une seule fenêtre** (ex. Chrome avec votre app). Recommandé pour une démo propre (pas de bureau ni d’autres fenêtres).
     - **« Capture d’écran » (Display Capture)** : enregistre **tout l’écran**.
   - Choisissez **« Capture de fenêtre »** (Window Capture).

3. Donnez un nom à la source (ex. **« Chrome »**) → **OK**.

4. Dans la liste des fenêtres, sélectionnez **la fenêtre de votre navigateur** où s’ouvre `localhost:3000` (ou votre app). Ex. : **« Chrome »** ou **« IA Restaurant Manager »**.
   - Cochez **« Capture cursor »** (Capturer le curseur) pour que la souris soit visible dans la vidéo.
   - **OK**.

5. Dans la grande prévisualisation au centre, vous devez voir le contenu de la fenêtre. Si elle est trop grande ou trop petite :
   - Cliquez sur la source dans **Sources**, puis redimensionnez en tirant les bords dans la prévisualisation, ou utilisez **Affiner la transformation** (clic droit sur la source → **Transform** → **Edit Transform**).

---

## Étape 5 – Réglages d’enregistrement (qualité et format)

1. Allez dans **Fichier** (File) → **Paramètres** (Settings), ou cliquez sur **« Settings »** en bas à droite.

2. Onglet **« Sortie » (Output)** :
   - **Mode** : **Avancé** (Advanced) pour avoir plus d’options (si disponible), sinon laissez **Simple**.
   - **Enregistrement** (Recording) :
     - **Format d’enregistrement** : **mp4** (pour pouvoir monter facilement après).
     - **Encodeur** : laissez **x264** (logiciel) ou **NVENC** / **Apple VT** si vous avez une carte graphique dédiée (meilleures perfs).
     - **Débit** (Bitrate) : pour du 1080p, mettez **8000 à 12000 Kbps** (ou 8–12 Mbit/s). En mode Simple, choisissez **« Qualité élevée »** ou **« Indistinguishable »**.
   - Cliquez **OK** pour fermer les paramètres.

3. Onglet **Vidéo** (dans Paramètres) :
   - **Résolution de base** : **1920x1080** (ou 1280x720).
   - **Résolution de sortie** : même chose (ou plus bas si vous voulez un fichier plus léger).
   - **FPS** : **30**.
   - **OK**.

4. Onglet **Audio** (optionnel) :
   - **Périphérique de bureau** : votre sortie son (haut-parleurs). Vous pouvez le désactiver si vous ne voulez pas enregistrer le son du PC.
   - **Micro** : activez si vous voulez une voix off en direct. Sinon, vous ajouterez la voix au montage.

---

## Étape 6 – Où sont enregistrés les fichiers

1. Dans **Paramètres** → **Sortie** (Output), repérez **« Chemin d’enregistrement »** (Recording Path).
2. Par défaut c’est souvent un dossier **Vidéos** (Windows) ou **Movies** (Mac). Vous pouvez le changer (ex. Bureau ou un dossier « Démo IA »).
3. Les fichiers seront nommés automatiquement avec date et heure (ex. `2026-01-26 15-30-22.mp4`).

---

## Étape 7 – Enregistrer

1. **Préparez** la fenêtre à enregistrer : ouvrez votre app (ex. `http://localhost:3000`), mettez la fenêtre en 1920×1080 ou en plein écran sans autres onglets visibles.
2. Dans OBS, vérifiez que la prévisualisation affiche bien l’écran souhaité.
3. Cliquez sur **« Démarrer l’enregistrement »** (Start Recording) en bas à droite (ou raccourci si vous l’avez configuré).
4. Faites votre démo (naviguez dans l’app comme prévu dans le guide de réalisation de la vidéo).
5. Quand vous avez terminé, cliquez sur **« Arrêter l’enregistrement »** (Stop Recording).
6. Le fichier est dans le **Chemin d’enregistrement** défini à l’étape 6.

---

## Récapitulatif des étapes

| # | Action |
|---|--------|
| 1 | Télécharger OBS sur https://obsproject.com |
| 2 | Installer (Windows : .exe ; Mac : glisser dans Applications) |
| 3 | Premier lancement : assistant → Recording, 1920x1080 |
| 4 | Scène + source **Capture de fenêtre** (navigateur), curseur activé |
| 5 | Paramètres → Sortie : mp4, 8–12 Mbit/s ; Vidéo : 1080p, 30 FPS |
| 6 | Vérifier le dossier d’enregistrement |
| 7 | Démarrer l’enregistrement → faire la démo → Arrêter |

---

## Dépannage rapide

- **Fenêtre noire dans la capture** : sur Windows avec certains GPU, passez en **Capture d’écran** au lieu de **Capture de fenêtre**, ou mettez OBS en mode « Administrateur » (clic droit → Exécuter en tant qu’administrateur). Sur Mac, autorisez l’enregistrement d’écran pour OBS dans **Réglages Système** → **Confidentialité et sécurité** → **Enregistrement d’écran**.
- **Vidéo saccadée** : baissez la résolution (720p) ou le débit (6000 Kbps), ou fermez les autres applications.
- **Pas de son** : vérifiez **Paramètres** → **Audio** et que « Périphérique de bureau » est bien celui utilisé.

Une fois l’enregistrement fait, vous pourrez monter la vidéo avec DaVinci Resolve ou CapCut (voir `docs/GUIDE_REALISATION_VIDEO_DEMO.md`), puis l’uploader sur YouTube/Vimeo et mettre l’URL dans `NEXT_PUBLIC_LANDING_DEMO_VIDEO_URL`.
