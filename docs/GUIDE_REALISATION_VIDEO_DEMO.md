# Guide : réaliser la vidéo de démonstration IA Restaurant Manager

Ce guide vous explique **étape par étape** quoi montrer, comment enregistrer et monter la vidéo de démo pour la landing, de la préparation à la publication.

---

## 1. Objectif et durée

| Élément | Recommandation |
|--------|----------------|
| **Durée** | 1 min 30 à 3 min (idéal : 2 min). Au-delà, les visiteurs décrochent. |
| **Message principal** | « Une seule plateforme pour piloter vos restaurants : économies, stocks maîtrisés, alertes et recommandations. » |
| **Ton** | Pro, clair, sans jargon. Montrer le produit en action, pas un discours commercial. |
| **Format** | 16:9 (1920×1080 ou 1280×720), son optionnel mais recommandé (voix ou musique douce). |

---

## 2. Que montrer dans la vidéo (scénario)

L’ordre proposé suit le parcours d’un utilisateur et les **bénéfices** mis en avant sur la landing (économies, gaspillage, ruptures, pilotage).

### Plan détaillé (2 min environ)

| Séquence | Durée | Écran à montrer | Action / commentaire |
|----------|-------|------------------|----------------------|
| **Intro** | 5–10 s | Dashboard (page d’accueil connecté) | Vue d’ensemble : « Voici le tableau de bord IA Restaurant Manager. » Montrer les 3 blocs (économies, recommandations, rupture, gaspillage). Pas de clic, juste un plan fixe ou un léger zoom. |
| **Restaurants** | 15–20 s | Restaurants → liste → 1 restaurant | « Tous vos sites en un endroit. » Ouvrir un restaurant, montrer la fiche (nom, adresse). Optionnel : onglet Inventaire pour montrer que le détail existe. |
| **Produits / Ingrédients** | 15–20 s | Produits ou Ingrédients | « Produits et ingrédients centralisés. » Scroller la liste, ouvrir un produit pour montrer la fiche (et la recette / BOM si vous l’utilisez). |
| **Ventes** | 15–20 s | Ventes & Analyse | « Suivi des ventes par restaurant. » Liste des ventes ou une analyse (graphique si disponible). Montrer que les données sont structurées. |
| **Alertes** | 15–20 s | Alertes | « Les alertes vous préviennent des ruptures et des surstocks. » Afficher la liste des alertes (ex. risque rupture, gaspillage). |
| **Recommandations** | 15–20 s | Recommandations | « Des recommandations actionnables pour réduire le gaspillage et les ruptures. » Montrer quelques recommandations avec libellés clairs. |
| **Rapports / Prévisions** | 10–15 s | Rapports ou Prévisions | « Prévisions et rapports pour anticiper. » Une ou deux vues suffisent. |
| **Conclusion** | 5–10 s | Retour Dashboard ou écran « économies » | « Tout en un endroit : pilotage, économies, stocks maîtrisés. » Fin sur le chiffre « Économies générées » si possible. |

### Ce qu’il ne faut pas montrer (ou très peu)

- Paramètres, facturation, lien de paiement (réservé admin).
- Création de compte / connexion (sauf si vous faites une vidéo « onboarding » à part).
- Données sensibles ou de vrais clients : utilisez une org de démo avec des données fictives.

### Résumé en 3 phrases pour le script

1. « IA Restaurant Manager centralise vos restaurants, produits, ventes et inventaires sur une seule plateforme. »
2. « Les alertes et recommandations vous aident à réduire le gaspillage, éviter les ruptures et dégager des économies mesurables. »
3. « Tableau de bord, rapports et prévisions vous donnent la vue dont vous avez besoin pour piloter au quotidien. »

---

## 3. Préparation avant le tournage

### 3.1 Environnement de démo

- **Compte dédié** : créez une organisation type « Démo IA Restaurant Manager » (ou utilisez un compte de test).
- **Données réalistes mais fictives** :
  - 2–3 restaurants (noms génériques : « Restaurant Paris Centre », « Restaurant Lyon »).
  - Quelques produits et ingrédients (noms courts, pas de vrais fournisseurs).
  - Ventes et alertes / recommandations déjà présentes pour que les écrans ne soient pas vides.
- **Navigateur** : fenêtre en 1920×1080 ou 1280×720, barre d’onglets propre, pas de favoris visibles. Mode « propre » (ou second profil Chrome sans extensions).
- **Désactiver** : notifications desktop, mise à jour Windows/Mac, fond d’écran animé.

### 3.2 Script (optionnel mais utile)

Écrivez 5–10 phrases courtes correspondant à chaque séquence. Vous pourrez soit les dire en voix off, soit les afficher en sous-titres. Exemple :

1. « Voici le tableau de bord. »
2. « Vos restaurants en un clin d’œil. »
3. « Produits et ingrédients centralisés. »
4. « Suivi des ventes par site. »
5. « Les alertes vous préviennent des ruptures et du gaspillage. »
6. « Des recommandations pour agir tout de suite. »
7. « Prévisions et rapports pour anticiper. »
8. « Une plateforme pour tout piloter. »

---

## 3.3 Déroulé pendant l'enregistrement (sur le site)

À suivre **étape par étape** une fois OBS enregistrement lancé. Reste **2 à 3 secondes** sur chaque écran avant de cliquer, déplace la souris **lentement**.

| # | Où aller | Action sur le site | Durée approx. |
|---|----------|--------------------|---------------|
| **0** | — | Ouvre l'app (ex. `http://localhost:3000`), connecte-toi si besoin. Mets le navigateur en **plein écran**. Lance l'enregistrement OBS. | — |
| **1** | **Dashboard** (`/dashboard`) | Tu es déjà sur la page d'accueil. Montre les blocs (économies, recommandations, rupture, gaspillage) sans cliquer. Pause 5–10 s. | 5–10 s |
| **2** | **Restaurants** | Clic menu **Restaurants**. Montre la liste. Clique sur **un restaurant** pour ouvrir sa fiche. Optionnel : onglet **Inventaire**. | 15–20 s |
| **3** | **Produits** | Clic menu **Produits**. Scrolle la liste. Clique sur **un produit** pour la fiche (ingrédients / recette). | 15–20 s |
| **4** | **Ingrédients** | Clic menu **Ingrédients**. Montre la liste (scroll court). | 10–15 s |
| **5** | **Ventes & Analyse** | Clic menu **Ventes & Analyse**. Montre la liste ou une analyse (graphique). | 15–20 s |
| **6** | **Alertes** | Clic menu **Alertes**. Montre la liste (rupture, gaspillage). | 15–20 s |
| **7** | **Recommandations** | Clic menu **Recommandations**. Montre quelques recommandations. | 15–20 s |
| **8** | **Prévisions** ou **Rapports** | Clic menu **Prévisions** ou **Rapports**. Une ou deux vues. | 10–15 s |
| **9** | **Retour Dashboard** | Clic menu **Dashboard**. Finir sur la vue économies. Arrête l'enregistrement OBS. | 5–10 s |

**À ne pas faire** : Paramètres, Facturation, Lien de paiement. **Conseil** : garde ce tableau sur un second écran pendant le tournage.

---

## 4. Enregistrement de l’écran

### 4.1 Logiciels (gratuits ou courants)

| Outil | Avantages | Inconvénients |
|-------|-----------|---------------|
| **OBS Studio** (gratuit) | Puissant, 1080p, pas de limite de durée | Prise en main un peu plus longue |
| **Loom** (gratuit / payant) | Très simple, partage direct | Limite de durée en gratuit, marque Loom possible |
| **QuickTime** (Mac) | Intégré, simple | Moins de réglages |
| **Xbox Game Bar** (Windows) | Intégré (Win+G), rapide | Qualité correcte, pas de réglages avancés |
| **Captura** (Windows, gratuit) | Léger, open source | Interface en anglais |

**Recommandation** : **OBS Studio** pour un rendu pro et maîtrisé (résolution, débit).

### 4.2 Réglages recommandés (OBS)

- **Résolution** : 1920×1080 (ou 1280×720 si votre machine rame).
- **FPS** : 30.
- **Type** : « Capture de fenêtre » ou « Capture d’écran » (éviter « Capture de navigateur » si vous voulez tout l’écran de l’app).
- **Sortie** : enregistrement en fichier (MKV ou MP4). Débit vidéo : 8–12 Mbit/s pour du 1080p.

### 4.3 Pendant l’enregistrement

- **Souris** : déplacements lents et volontaires. Restez 2–3 secondes sur chaque élément important avant de cliquer.
- **Clics** : pas de double-clics accidentels ; un clic = une action.
- **Défilement** : lent et régulier pour que le montage soit facile à couper.
- **Durée** : enregistrez un peu plus long que la cible (ex. 3–4 min) pour avoir de la marge au montage.

---

## 5. Montage

### 5.1 Logiciels de montage

| Logiciel | Niveau | Prix | Idéal pour |
|----------|--------|------|------------|
| **DaVinci Resolve** | Débutant à pro | Gratuit | Montage complet, coupes, titres, export 1080p |
| **CapCut** | Débutant | Gratuit | Rapide, templates, sous-titres auto |
| **iMovie** (Mac) | Débutant | Gratuit | Simple, intégré |
| **Shotcut** | Débutant / intermédiaire | Gratuit | Open source, multi-plateforme |
| **Premiere Pro / Final Cut** | Pro | Payant | Si vous les avez déjà |

**Recommandation** : **DaVinci Resolve** ou **CapCut** pour un bon rapport simplicité / qualité.

### 5.2 Structure du montage

1. **Couper les temps morts** : hésitations, chargements trop longs, clics ratés. Garder uniquement les séquences utiles.
2. **Enchaînements** : coupes franches (pas de fondu si vous voulez un rendu dynamique) ou courts fondus (0,2 s).
3. **Rythme** : 5–15 s par « idée ». Pas plus de 20 s sur un même écran sans mouvement (souris ou zoom).
4. **Titres** (optionnel) : un titre au début « IA Restaurant Manager – Démonstration » (3–5 s), éventuellement un sous-titre par section (ex. « Tableau de bord », « Alertes »).
5. **Fin** : plan sur le dashboard ou sur « Économies générées », puis noir ou logo 2–3 s.

### 5.3 Son

- **Voix off** : enregistrez dans un endroit calme (micro intégré PC ou micro USB). Parlez lentement et distinctement. Vous pouvez enregistrer dans OBS ou dans le logiciel de montage.
- **Musique de fond** : volume bas (10–20 %), sans paroles, libre de droits (YouTube Audio Library, Pixabay Music, Uppbeat). Éviter les musiques trop rythmées.
- **Sous-titres** : utiles pour le sans-son (réseaux sociaux, accessibilité). CapCut et DaVinci proposent une détection automatique de la parole ; à vérifier et corriger.

### 5.4 Exports

- **Format** : MP4 (H.264).
- **Résolution** : 1920×1080 (ou 1280×720).
- **Débit** : 8–15 Mbit/s pour YouTube/Vimeo.
- **Audio** : AAC, 128–192 kbit/s.

---

## 6. Publication (YouTube ou Vimeo)

1. **Upload** : importez le MP4 sur votre chaîne YouTube ou compte Vimeo.
2. **Titre** : ex. « IA Restaurant Manager – Démonstration produit ».
3. **Description** : 2–3 lignes sur la plateforme + lien vers votre site.
4. **Paramètres** :
   - YouTube : autoriser l’intégration (embed) ; désactiver les suggestions en fin de vidéo si vous préférez.
   - Vimeo : choisir « Embed » autorisé, optionnel « Hide from Vimeo.com » si vous voulez que la vidéo ne soit visible que sur votre site.
5. **Récupérer l’URL d’embed** :
   - YouTube : Partager → Intégrer → `https://www.youtube.com/embed/VIDEO_ID`
   - Vimeo : Partager → Intégrer → `https://player.vimeo.com/video/NUMERO_ID`
6. **Sur le projet** : ajoutez dans `.env.local` la variable `NEXT_PUBLIC_LANDING_DEMO_VIDEO_URL` avec cette URL, redémarrez le serveur (voir `docs/GUIDE_VIDEO_DEMO_LANDING.md`).

---

## 7. Checklist finale

- [ ] Données de démo réalistes, pas de données clients réelles.
- [ ] Enregistrement en 16:9, 30 FPS, fenêtre propre (pas de notifications).
- [ ] Vidéo entre 1 min 30 et 3 min.
- [ ] Montage : coupes nettes, rythme régulier, titres optionnels.
- [ ] Son : voix ou musique douce, sous-titres si possible.
- [ ] Export MP4 1080p (ou 720p), upload YouTube ou Vimeo.
- [ ] URL d’embed ajoutée dans `.env.local`, bloc « Vidéo de démonstration » vérifié sur la landing.

---

## Résumé en une page

| Étape | Action |
|-------|--------|
| 1 | Préparer une org démo avec 2–3 restos, produits, ventes, alertes, recommandations. |
| 2 | Rédiger un mini-script (5–8 phrases) pour chaque séquence. |
| 3 | Enregistrer avec OBS (1080p, 30 FPS) : Dashboard → Restaurants → Produits/Ingrédients → Ventes → Alertes → Recommandations → Rapports/Prévisions → fin sur Dashboard. |
| 4 | Monter (DaVinci Resolve ou CapCut) : couper les temps morts, 5–15 s par idée, titres optionnels, musique ou voix. |
| 5 | Exporter en MP4 1080p, uploader sur YouTube ou Vimeo, récupérer l’URL d’embed. |
| 6 | Mettre `NEXT_PUBLIC_LANDING_DEMO_VIDEO_URL` dans `.env.local`, redémarrer, vérifier la landing. |

Si vous suivez ce guide, vous obtiendrez une vidéo de démo claire, professionnelle et alignée avec le message de votre landing (« une seule plateforme », économies, gaspillage, ruptures, pilotage).
