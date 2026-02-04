# Checklist avant production

À vérifier avant de lancer l’app en production. Plan détaillé : [PLAN_OPTION_B_AVANT_PRODUCTION.md](./PLAN_OPTION_B_AVANT_PRODUCTION.md).

**Rappel** : Renseigner les mêmes variables Sentry sur l'hébergeur (ex. Vercel) pour que les erreurs en production remontent dans Sentry.

---

## À faire avant la prod (rappels)

- [ ] **Nom de domaine** : avoir un domaine pour l’app (ex. app.tonnom.com ou tonnom.com) et le configurer sur l’hébergeur.
- [ ] **Mail pro** : utiliser une adresse email professionnelle (ex. contact@tonnom.com) pour Clerk, support, Stripe, etc. (plus de confiance qu’un Gmail perso).
- [ ] **Webhook Stripe en prod** : dans le Dashboard Stripe (mode **Live**), créer un endpoint webhook avec l’URL `https://ton-domaine.com/api/webhooks/stripe`, sélectionner les événements (customer.subscription.*, invoice.payment_*), puis mettre le **Signing secret** dans les variables d’environnement de prod (`STRIPE_WEBHOOK_SECRET`). Sans ça, les abonnements réels ne sont pas enregistrés en base.
- [ ] Variables Stripe en prod : `STRIPE_SECRET_KEY` (clé Live), `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO` (ou les price IDs utilisés).
- [ ] **Clerk – Redirection après invitation** : dans le Dashboard Clerk (Configure → Paths / Redirect URLs), configurer la redirection après acceptation d’invitation vers **`/pricing`** (URL de prod, ex. `https://ton-domaine.com/pricing`). Le nouveau client verra la page Tarifs ; l’employé (dont l’organisation a déjà un abonnement) sera redirigé automatiquement vers le dashboard.

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