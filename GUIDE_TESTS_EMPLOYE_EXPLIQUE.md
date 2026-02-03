# Tout expliquer : les tests employé

---

## 1. À quoi ça sert ?

Tu as un **rôle employé** dans ton app : ces utilisateurs ne doivent pas voir certains boutons (ex. « Ajouter un restaurant ») ni accéder à certaines pages (import, paramètres).

On a écrit des **tests automatiques** qui vérifient ça : ils ouvrent l’app « en tant qu’employé » et regardent si les bons éléments sont cachés ou bloqués.

Pour que ces tests puissent « se connecter en employé », il faut qu’on leur donne **l’email et le mot de passe** d’un vrai compte employé. C’est tout.

---

## 2. Les deux endroits où ça tourne

### A. Sur ton ordinateur (en local)

Tu lances les tests toi-même dans un terminal. Là, il faut **soit** donner l’email/mot de passe au terminal, **soit** créer une fois un fichier de session (comme un « cookie de connexion ») pour ne pas retaper le mot de passe à chaque fois.

### B. Sur GitHub (en CI)

À chaque fois que tu fais un **push** (ou une PR) sur `main`, GitHub lance tout seul les tests. Pour que les tests employé tournent aussi là-bas, il faut enregistrer l’email et le mot de passe dans les **Secrets** du dépôt (personne ne les voit, c’est sécurisé).

---

## 3. Ce que font les commandes du terminal

Quand tu vois :

```bash
export STAFF_EMAIL=ton-email-employe@exemple.com
export STAFF_PASSWORD=ton_mot_de_passe
npm run test:e2e
```

- **`export STAFF_EMAIL=...`**  
  = « Pour cette fenêtre de terminal, la variable STAFF_EMAIL vaut cet email. »  
  Les outils (dont Playwright) pourront lire cette variable pour se connecter avec ce compte.

- **`export STAFF_PASSWORD=...`**  
  = Pareil pour le mot de passe. Il reste **dans le terminal**, il n’est pas écrit dans un fichier du projet.

- **`npm run test:e2e`**  
  = « Lance tous les tests E2E. »  
  Comme STAFF_EMAIL et STAFF_PASSWORD sont définis, Playwright va en plus :
  1. Lancer un test qui ouvre la page de connexion, remplit email + mot de passe, se connecte.
  2. Sauvegarder cette « session » (cookies, etc.) dans un fichier.
  3. Lancer les tests employé en réutilisant cette session (donc « connecté en employé »).

En résumé : tu **donnes une fois** l’email et le mot de passe au terminal, puis tu lances les tests ; Playwright s’occupe de se connecter et de vérifier les restrictions employé.

---

## 4. Marche à suivre simple (en local)

1. **Ouvre un terminal** à la racine du projet (là où il y a `package.json`).

2. **Optionnel mais conseillé :** dans un **autre** terminal, lance le serveur :
   ```bash
   npm run dev
   ```
   Attends que ça affiche que le serveur est prêt (ex. « Ready on http://localhost:3000 »).

3. Dans le **premier** terminal, remplace par **tes** vraies valeurs (email et mot de passe du compte employé), puis exécute :
   ```bash
   export STAFF_EMAIL=ici-ton-email@exemple.com
   export STAFF_PASSWORD=ici-ton-mot-de-passe
   npm run test:e2e
   ```

4. Playwright va :
   - lancer les 8 tests « classiques » (landing, auth, redirections),
   - puis se connecter avec ton compte employé,
   - puis lancer les tests employé (boutons absents, pages « accès refusé », etc.).

Si tout est vert à la fin, c’est bon.

---

## 5. Pourquoi « export » ?

`export` veut dire : « Cette variable est visible par les programmes que ce terminal va lancer (comme `npm run test:e2e`). »  
Sans `export`, le mot de passe ne serait connu que du shell, et Playwright ne le verrait pas.

La variable ne vit **que dans ce terminal** et **cette session**. Dès que tu fermes le terminal ou que tu ouvres une nouvelle fenêtre, il faudra refaire les deux `export` si tu veux relancer les tests employé avec ce compte.

---

## 6. Et pour GitHub (CI) ?

Sur GitHub, il n’y a pas de terminal où tu tapes le mot de passe. À la place :

- Tu vas dans **Settings** du dépôt → **Secrets and variables** → **Actions**.
- Tu crées deux secrets : **STAFF_EMAIL** et **STAFF_PASSWORD**, avec les mêmes valeurs que tu mets dans ton terminal en local.
- À chaque push sur `main`, GitHub lance les tests ; il injecte ces secrets comme variables d’environnement, donc Playwright peut se connecter en employé et lancer les mêmes tests.

Rien à taper dans un terminal sur GitHub : tout est automatique une fois les secrets créés.

---

## 7. Récap en une phrase

**En local :** tu mets ton email et mot de passe employé dans le terminal avec `export STAFF_EMAIL=...` et `export STAFF_PASSWORD=...`, puis tu lances `npm run test:e2e` ; les tests employé tournent automatiquement.  
**Sur GitHub :** tu enregistres les mêmes infos dans les Secrets du dépôt, et les tests employé se lancent tout seuls à chaque push sur `main`.

Si tu veux, on peut détailler uniquement la partie « terminal » ou uniquement la partie « GitHub » étape par étape.
