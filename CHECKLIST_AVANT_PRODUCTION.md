# Checklist avant production

À vérifier avant de lancer l’app en production. Plan détaillé : [PLAN_OPTION_B_AVANT_PRODUCTION.md](./PLAN_OPTION_B_AVANT_PRODUCTION.md).

**Rappel** : Renseigner les mêmes variables Sentry sur l'hébergeur (ex. Vercel) pour que les erreurs en production remontent dans Sentry.

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