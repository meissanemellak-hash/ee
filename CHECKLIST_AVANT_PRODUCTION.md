# Checklist avant production

À vérifier avant de lancer l’app en production. Plan détaillé : [PLAN_OPTION_B_AVANT_PRODUCTION.md](./PLAN_OPTION_B_AVANT_PRODUCTION.md).

**Rappel** : Renseigner les mêmes variables Sentry sur l'hébergeur (ex. Vercel) pour que les erreurs en production remontent dans Sentry.

---

## Rappel production – Mails Clerk (tous les templates)

> **En production**, pour **tous** les e-mails Clerk (Account Locked, Reset password, Invitation, Verification, etc.) :
>
> 1. **Champ « From »**  
>    Utiliser une adresse sur **ton propre domaine**, ex. `noreply@ton-domaine.com` ou `ne-pas-repondre@ton-domaine.com`, **pas** la valeur par défaut type `noreply@accounts.dev`.  
>    → Meilleure délivrabilité, confiance, moins de risque de spam.
>
> 2. **Champ « Reply-to »**  
>    Renseigner une adresse de réponse sur ton domaine (ex. `support`, `contact` ou `aide`) pour que les réponses des utilisateurs arrivent dans une boîte que tu consultes, ex. `support@ton-domaine.com`.  
>    → Les réponses ne partent pas dans le vide.
>
> **Où** : Clerk Dashboard → Configure → Customization → Emails → chaque template (Security, Verification, Organization, etc.). Configurer l’envoi avec ton domaine dans Clerk (ou via ton fournisseur d’e-mails) avant la mise en prod.

- [ ] **Clerk – From des e-mails** : pour chaque template, définir le **From** sur ton domaine (ex. `noreply@ton-domaine.com`) en production.
- [ ] **Clerk – Reply-to des e-mails** : pour chaque template, définir le **Reply-to** sur ton domaine (ex. `support` → `support@ton-domaine.com`) en production.

**Mails Clerk en « Read only » (body non modifiable) – à envoyer en français via Resend :**

| Template Clerk | Action |
|----------------|--------|
| **Compte verrouillé** (Account Locked) | Désactiver « Delivered by Clerk » dans Clerk. Écouter le webhook `emails` et envoyer le mail en français via Resend (même style visuel que les autres mails). |

*(Pour l’instant, seul ce template est non modifiable. Si d’autres apparaissent en read-only, les ajouter ici.)*

- [ ] **Clerk – Compte verrouillé** : 1) Dans Clerk → Configure → Emails → Compte verrouillé, désactiver « Delivered by Clerk ». 2) Dans Clerk → Webhooks, s’assurer que l’endpoint pointe vers `https://ton-domaine.com/api/webhooks/clerk` et qu’il est abonné à l’événement **email** (ex. `email.created` — à vérifier dans l’Event Catalog). 3) En prod, définir `EMAIL_FROM` (ex. `noreply@ton-domaine.com`) et optionnellement `NEXT_PUBLIC_APP_NAME` pour le pied de page du mail.

> **Rappel – Compte verrouillé en production**  
> À faire **une fois l’app déployée** (pas en local) : Clerk n’enverra plus ce mail ; c’est Resend qui l’enverra en français via le webhook. Ne pas désactiver « Delivered by Clerk » avant d’avoir une URL de prod pour le webhook et les variables Resend configurées sur l’hébergeur.

---

## À faire avant la prod (rappels)

- [ ] **Nom de domaine** : avoir un domaine pour l’app (ex. app.tonnom.com ou tonnom.com) et le configurer sur l’hébergeur.
- [ ] **Mail pro** : utiliser une adresse email professionnelle (ex. contact@tonnom.com) pour Clerk, support, Stripe, etc. (plus de confiance qu’un Gmail perso).
- [ ] **Webhook Stripe en prod** : dans le Dashboard Stripe (mode **Live**), créer un endpoint webhook avec l’URL `https://ton-domaine.com/api/webhooks/stripe`, sélectionner les événements (customer.subscription.*, invoice.payment_*), puis mettre le **Signing secret** dans les variables d’environnement de prod (`STRIPE_WEBHOOK_SECRET`). Sans ça, les abonnements réels ne sont pas enregistrés en base.
- [ ] Variables Stripe en prod : `STRIPE_SECRET_KEY` (clé Live), `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO` (ou les price IDs utilisés).
- [ ] **Clerk – Redirection après invitation** : dans le Dashboard Clerk (Configure → Paths / Redirect URLs), configurer la redirection après acceptation d’invitation vers **`/dashboard`** (URL de prod, ex. `https://ton-domaine.com/dashboard`). L’utilisateur arrive toujours sur le tableau de bord. (La page `/pricing` n’existe plus ; toute requête vers `/pricing` est redirigée vers `/dashboard`.)
- [ ] **Clerk – Page « compléter le profil » en français (optionnel)** : si tu veux que la page après « Accepter l’invitation » soit en français (au lieu de la page hébergée Clerk en anglais), mettre en place l’**option 2** : redirection vers une page de ton app (ex. `/accept-invitation`) qui affiche le formulaire avec les composants Clerk — nécessite le nom de domaine en prod. Voir la conversation / doc pour le détail.

---

## Cron Vercel – Recommandations (génération automatique)

Le cron génère des recommandations BOM pour **tous les restaurants** de toutes les organisations (ex. tous les jours à 6h UTC). Il appelle `GET /api/cron/recommendations`, sécurisé par un secret.

- [ ] **CRON_SECRET en production** : dans Vercel (Project → Settings → Environment Variables), ajouter la variable **`CRON_SECRET`** avec une valeur forte (ex. `openssl rand -hex 32`). **Important** : tant que `CRON_SECRET` est défini, Vercel envoie automatiquement `Authorization: Bearer <CRON_SECRET>` lors de l’appel du cron ; la route vérifie ce secret et refuse les appels non autorisés.
- [ ] **Planification** : le fichier `vercel.json` définit déjà un cron `0 6 * * *` (tous les jours à 6h UTC) sur `/api/cron/recommendations`. Après déploiement, le cron apparaît dans Vercel (Project → Settings → Crons) et s’exécute automatiquement.
- [ ] **Test (optionnel)** : après le premier déploiement, vérifier dans les logs Vercel qu’une exécution du cron a bien eu lieu, ou appeler manuellement l’URL avec le secret : `curl -H "Authorization: Bearer VOTRE_CRON_SECRET" https://ton-domaine.com/api/cron/recommendations` et contrôler la réponse JSON (success, recommendationsCreated, etc.).

---

## Documentation (Aide utilisateur)

- [ ] Créer le workspace Notion avec les articles essentiels
- [ ] Publier en lien public
- [ ] Ajouter le lien « Aide » ou « Documentation » dans l’app (header ou paramètres)
- [ ] Tester que le lien ouvre bien la doc

---

## Sentry

- [ ] **À faire avant la prod** : renseigner les mêmes variables Sentry sur l’hébergeur (ex. Vercel) pour que les erreurs en production remontent dans Sentry.
- [ ] Provoquer une erreur de test et confirmer qu’elle apparaît dans Sentry Issues

---

## Backups

- [ ] Lancer la vérification : `npm run db:verif-backups` (voir [GUIDE_VERIF_BACKUPS.md](./GUIDE_VERIF_BACKUPS.md))
- [ ] **Supabase Free** : pas de backups inclus → utiliser `npm run db:backup` (tester une fois, puis lancer régulièrement). **Supabase Pro** : vérifier Settings → Database → Backups.
- [ ] Ou s’assurer que `npm run db:backup` est lancé régulièrement (manuel, cron ou autre)

---

## Autres (optionnel)

- [ ] CI/CD : vérifier que le workflow GitHub Actions passe (Actions → dernier run)
- [ ] Variables d’environnement de prod (Clerk, Resend, etc.)
- [ ] **Tests E2E rôle employé** : mettre en place l’automatisation (setup-staff + secrets STAFF_EMAIL/STAFF_PASSWORD) pour exécuter les tests employé en CI — voir `GUIDE_TESTS_EMPLOYE_ETAPES.md` et `GUIDE_AUTOMATISATION_EMPLOYE_SIMPLE.md`