# Guide : Pousser ton code sur GitHub

Guide étape par étape pour le push Git.

---

## PARTIE 1 : Créer un token GitHub (une seule fois)

1. Ouvre ton navigateur et va sur **https://github.com**
2. Connecte-toi si ce n’est pas déjà fait
3. Clique sur ta **photo de profil** (en haut à droite)
4. Clique sur **Settings** (Paramètres)
5. Dans le menu de gauche, tout en bas, clique sur **Developer settings**
6. Clique sur **Personal access tokens** puis **Tokens (classic)**
7. Clique sur **Generate new token** → **Generate new token (classic)**
8. Dans "Note", écris par exemple : `Ordinateur portable`
9. Coche la case **repo** (la première)
10. Clique sur **Generate token**
11. **Copie le token** (une série de lettres et chiffres) et sauvegarde-le quelque part — tu ne le reverras plus

---

## PARTIE 2 : Configurer Git et pousser le code

1. Ouvre le **Terminal** (celui de Cursor ou l’app Terminal de macOS)
2. Va dans ton projet :
   ```
   cd "/Users/meissanemellak/Officiel IA Restaurant manager saas"
   ```
3. Configure le credential helper (une seule fois) :
   ```
   git config credential.helper osxkeychain
   ```
4. Lance le push :
   ```
   git push origin main
   ```
5. Si une fenêtre ou le terminal demande :
   - **Username** : ton pseudo GitHub (ex. `meissanemellak-hash`)
   - **Password** : colle ton **token** (celui de la Partie 1, pas ton mot de passe GitHub)
6. Valide. Le push devrait se terminer avec un message du type : `Enumerating objects...` puis `... done`

---

## Si ça ne marche pas

- **Aucune fenêtre ne s’ouvre** : attends 15 secondes. Regarde s’il y a une fenêtre cachée (Cmd+Tab).
- **"Authentication failed"** : vérifie que tu utilises bien le **token** et pas le mot de passe GitHub.
- **"Repository not found"** : vérifie que le dépôt existe sur GitHub et que l’URL est correcte (`git remote -v`).
