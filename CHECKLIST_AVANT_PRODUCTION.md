# Checklist avant production

À vérifier avant de lancer l’app en production.

---

## Documentation (Aide utilisateur)

- [ ] Créer le workspace Notion avec les articles essentiels
- [ ] Publier en lien public
- [ ] Ajouter le lien « Aide » ou « Documentation » dans l’app (header ou paramètres)
- [ ] Tester que le lien ouvre bien la doc

---

## Sentry

- [ ] Vérifier que les variables Sentry sont configurées sur l’hébergeur
- [ ] Provoquer une erreur de test et confirmer qu’elle apparaît dans Sentry Issues

---

## Backups

- [ ] Vérifier les backups Supabase (ou passer au Pro si besoin)
- [ ] Ou s’assurer que `npm run db:backup` est lancé régulièrement

---

## Autres (optionnel)

- [ ] CI/CD : vérifier que le workflow GitHub Actions passe (Actions → dernier run)
- [ ] Variables d’environnement de prod (Clerk, Resend, etc.)
