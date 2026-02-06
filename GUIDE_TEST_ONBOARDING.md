# Guide étape par étape : tester l'onboarding avant la production

Ce guide vous permet de valider le parcours d'onboarding de bout en bout avant la mise en production.

---

## Prérequis

- [ ] L’application tourne en local (`npm run dev` ou équivalent).
- [ ] Vous avez accès à Clerk (Dashboard Clerk) pour créer un compte ou une organisation de test.
- [ ] Optionnel : accès à la base de données (Prisma Studio ou SQL) si vous voulez réinitialiser l’onboarding pour re-tester.

---

## Étape 1 : Créer un compte de test

Pour tester l’onboarding, il faut partir d’un contexte où l’organisation n’a **jamais terminé** l’onboarding.

### Option A : Nouvel utilisateur + nouvelle organisation (recommandé)

1. Déconnectez-vous si vous êtes connecté (menu utilisateur → Se déconnecter).
2. Allez sur la page d’inscription : **Sign up** (ou `/sign-up`).
3. Créez un **nouveau compte** avec une adresse email de test (ex. `test-onboarding@votredomaine.fr`).
4. Lors de l’inscription, créez une **nouvelle organisation** (nom ex. « Test onboarding »).
5. Validez jusqu’à arriver dans l’application.

**Résultat attendu :** vous êtes connecté avec une organisation fraîche, sans `onboardingCompletedAt` en base → vous devez être redirigé vers l’onboarding.

### Option B : Réutiliser un compte existant

Si vous préférez utiliser un compte déjà existant :

1. Dans Clerk Dashboard : créez une **nouvelle organisation** et ajoutez-y votre utilisateur, **ou**
2. En base de données : pour une organisation existante, mettez `onboarding_completed_at` à `NULL` pour cette organisation (voir section « Réinitialiser l’onboarding » plus bas).

Puis connectez-vous avec ce compte en ayant **cette organisation** sélectionnée (switch d’organisation si besoin).

---

## Étape 2 : Vérifier la redirection vers l’onboarding

1. Une fois connecté avec le compte / l’organisation de test, vous devez arriver soit sur le dashboard, soit directement sur l’onboarding.
2. Si vous étiez sur le dashboard : vous devez être **redirigé automatiquement** vers `/dashboard/onboarding`.
3. Vérifiez que l’URL affichée est bien :  
   `http://localhost:3000/dashboard/onboarding` (ou votre domaine de dev).

**À valider :**

- [ ] La redirection vers `/dashboard/onboarding` se fait sans erreur.
- [ ] La page affiche le **wizard** (carte avec « Bienvenue sur IA Restaurant Manager »).
- [ ] L’indicateur d’étapes en haut montre le **premier point** actif (premier step).

---

## Étape 3 : Tester le wizard (3 étapes)

### Étape 3.1 – Écran « Bienvenue »

1. Vous devez voir :
   - Le titre **« Bienvenue sur IA Restaurant Manager »**.
   - Un court texte sur la plateforme (ventes, stocks, achats, recommandations).
   - Un bouton **« Commencer »** avec une flèche.
2. Cliquez sur **« Commencer »**.

**À valider :**

- [ ] Le contenu s’affiche correctement (pas de texte coupé, pas d’erreur).
- [ ] Après le clic, passage à l’**étape 2** (indicateur + nouveau contenu).

### Étape 3.2 – Écran « Tout ce dont vous avez besoin »

1. Vous devez voir :
   - Le titre **« Tout ce dont vous avez besoin »**.
   - Quatre blocs : Restaurants, Produits, Ingrédients, Ventes & prévisions (avec icônes et descriptions).
   - Un bouton **« Retour »** et un bouton **« Continuer »**.
2. Cliquez sur **« Retour »** : vous devez revenir à l’étape 1 (Bienvenue).
3. Recliquez sur **« Commencer »** puis sur **« Continuer »** pour passer à l’étape 3.

**À valider :**

- [ ] Les 4 blocs s’affichent correctement.
- [ ] « Retour » ramène bien à l’étape 1.
- [ ] « Continuer » mène à l’étape 3.

### Étape 3.3 – Écran « Vous êtes prêt »

1. Vous devez voir :
   - Une icône de validation (coche).
   - Le titre **« Vous êtes prêt »**.
   - Un bouton **« Retour »** et un bouton **« Accéder au tableau de bord »**.
2. Cliquez sur **« Accéder au tableau de bord »**.

**À valider :**

- [ ] Le bouton affiche brièvement un état de chargement (ex. « Redirection... ») puis la page change.
- [ ] Aucune erreur en console (F12 → Console).
- [ ] Vous êtes redirigé vers le **tableau de bord** (`/dashboard`).

---

## Étape 4 : Vérifier la fin du parcours

1. Après le clic sur « Accéder au tableau de bord », vous devez arriver sur la page **Dashboard** (vue d’ensemble : économies, KPIs, graphique, etc.).
2. Rechargez la page (F5) ou naviguez vers une autre section (ex. Restaurants, Produits) puis revenez au Dashboard.

**À valider :**

- [ ] La page Dashboard s’affiche correctement.
- [ ] Aucune **redirection automatique** vers `/dashboard/onboarding` après rechargement ou navigation.
- [ ] En base : pour cette organisation, `onboarding_completed_at` est bien renseigné (date/heure).

---

## Étape 5 : Checklist finale avant production

Cochez chaque point une fois validé :

| # | Vérification | OK |
|---|------------------------------|----|
| 1 | Redirection vers onboarding pour une org sans onboarding terminé | ☐ |
| 2 | Étape 1 (Bienvenue) : affichage + bouton « Commencer » | ☐ |
| 3 | Étape 2 (Découvrir) : 4 blocs + Retour + Continuer | ☐ |
| 4 | Étape 3 (Vous êtes prêt) : bouton « Accéder au tableau de bord » | ☐ |
| 5 | Après clic : redirection vers `/dashboard` sans erreur | ☐ |
| 6 | Pas de boucle : retour sur le dashboard ne redirige plus vers onboarding | ☐ |
| 7 | Comportement correct sur un écran mobile (responsive) | ☐ |

---

## Réinitialiser l’onboarding pour re-tester

Si vous voulez **rejouer** le parcours avec la même organisation :

1. Ouvrez Prisma Studio : `npx prisma studio`
2. Allez dans la table **`organizations`**.
3. Trouvez l’organisation de test (nom ou `clerk_org_id`).
4. Pour cette ligne : mettez le champ **`onboarding_completed_at`** à **vide** (NULL).
5. Enregistrez, fermez Prisma Studio.
6. Rechargez l’application en étant connecté avec cette organisation : vous devez à nouveau être redirigé vers `/dashboard/onboarding`.

---

## En cas de problème

- **Pas de redirection vers l’onboarding** : vérifiez que l’organisation utilisée a bien `onboarding_completed_at` à NULL en base.
- **Boucle de redirection** : vérifiez que l’API `POST /api/organizations/complete-onboarding` répond bien (200) et que le champ est mis à jour en base.
- **Erreur 401 sur l’API** : vous devez être connecté (session Clerk) et avoir une organisation active.
- **Sidebar / header absents** : normal, le wizard s’affiche dans la même zone que le reste du dashboard ; si quelque chose manque, vérifier le layout et les chemins.

Une fois toutes les cases cochées, le parcours d’onboarding est prêt pour la production.
