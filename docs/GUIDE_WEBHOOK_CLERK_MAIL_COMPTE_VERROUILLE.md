# Guide complet : Webhook Clerk + mail « Compte verrouillé » en français (Resend)

Ce guide enregistre toutes les étapes pour que le mail **Compte verrouillé** soit envoyé en français via Resend lorsque Clerk déclenche le webhook.

---

## 1. Rendre le webhook accessible depuis Internet

Clerk envoie les webhooks depuis ses serveurs. Une URL `http://localhost:3000/...` n’est **pas joignable** par Clerk.

### En développement (test en local)

1. Installer [ngrok](https://ngrok.com) si besoin.
2. Lancer l’app : `npm run dev` (port 3000).
3. Dans un autre terminal : `ngrok http 3000`.
4. Noter l’URL HTTPS affichée (ex. `https://abc123.ngrok.io`).

### En production

Utiliser ton domaine : `https://ton-domaine.com`.

---

## 2. Configurer l’endpoint dans Clerk

1. Aller sur **Clerk Dashboard** → **Configure** → **Webhooks** (menu gauche, section Developers).
2. Cliquer sur l’endpoint existant (`http://localhost:3000/api/webhooks/clerk`) ou sur **+ Add Endpoint** pour en créer un nouveau.
3. **Endpoint URL** :
   - En dev : `https://ton-url-ngrok.ngrok.io/api/webhooks/clerk` (remplacer par ton URL ngrok).
   - En prod : `https://ton-domaine.com/api/webhooks/clerk`.
4. Enregistrer.
5. S’assurer que l’endpoint est **activé** (pas « Disabled »).

---

## 3. S’abonner à l’événement email

1. Dans la configuration de l’endpoint, ouvrir l’onglet **Event Catalog** (ou « Subscribe to events »).
2. Chercher l’événement lié aux e-mails (souvent **email.created** ou nom similaire).
3. Cocher cet événement pour cet endpoint.
4. Enregistrer.

---

## 4. Désactiver l’envoi du mail « Compte verrouillé » par Clerk

1. **Configure** → **Customization** → **Emails**.
2. Ouvrir le template **Compte verrouillé** (Account Locked).
3. Désactiver le toggle **« Delivered by Clerk »**.
4. Clerk n’enverra plus ce mail lui-même et enverra le webhook à la place ; l’app enverra le mail en français via Resend.

---

## 5. Variables d’environnement (optionnel)

Dans `.env.local` (dev) ou les variables d’environnement de l’hébergeur (prod) :

| Variable | Exemple | Rôle |
|----------|---------|------|
| `EMAIL_FROM` | `noreply@ton-domaine.com` | Adresse d’envoi du mail (en prod, une fois le domaine vérifié dans Resend). |
| `NEXT_PUBLIC_APP_NAME` | `IA Restaurant Manager` | Nom affiché dans le pied de page du mail. |

Sans `EMAIL_FROM`, Resend utilise sa valeur par défaut (ex. `onboarding@resend.dev`).

---

## 6. Récapitulatif

| Étape | Action |
|-------|--------|
| 1 | Exposer l’app (ngrok en dev, domaine en prod). |
| 2 | Mettre l’URL publique dans Clerk → Webhooks → Endpoint URL, activer l’endpoint. |
| 3 | S’abonner à l’événement **email** (Event Catalog). |
| 4 | Désactiver « Delivered by Clerk » pour le template Compte verrouillé. |
| 5 | (Optionnel) Définir `EMAIL_FROM` et `NEXT_PUBLIC_APP_NAME`. |

---

## Fichiers concernés dans le projet

- **Handler webhook** : `app/api/webhooks/clerk/route.ts` (détection `account_locked`, envoi via Resend).
- **Template HTML français** : `lib/services/email-templates.ts` (fonction `getAccountLockedEmailHtml`).
- **Envoi d’email** : `lib/services/email.ts` (`sendEmail` avec Resend).

## En cas de problème

- Clerk → Webhooks → **Logs** / **Message Attempts** : vérifier que les requêtes partent et le code HTTP renvoyé (200 = OK).
- Si le payload a une forme différente, adapter l’extraction dans `app/api/webhooks/clerk/route.ts` (champs `to`, `subject`, variables du template).
- Voir aussi : [CLERK_EMAIL_ACCOUNT_LOCKED_RESEND.md](./CLERK_EMAIL_ACCOUNT_LOCKED_RESEND.md).
