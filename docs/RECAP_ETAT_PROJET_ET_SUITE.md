# Récapitulatif – État du projet et suite

Document de référence : état actuel du SaaS AI Operations et prochaines étapes.

---

## 1. Ce qui a été fait (dev / config)

### Application
- **Onboarding** : supprimé (page + redirection `/dashboard/onboarding` → `/dashboard`).
- **Page setup** (`/dashboard/setup`) : supprimée ; redirection vers `/dashboard`. Connexion → toujours dashboard.
- **Paramètres** : correction espace vide en bas de page ; une seule barre de scroll (body) ; accès refusé uniquement après chargement du rôle (plus de flash pour admin/manager).
- **Sidebar** : lien « Paramètres » affiché dès le chargement (plus de délai).
- **Mail « Compte verrouillé »** : template Clerk en read-only → envoi en français via Resend. Webhook Clerk gère l’événement email `account_locked`, template HTML français dans `lib/services/email-templates.ts`. À activer en production (désactiver « Delivered by Clerk » + URL webhook prod).

### Mails Clerk (traduction FR)
- **Password changed** → Mot de passe modifié  
- **Password removed** → Mot de passe supprimé  
- **Primary email address changed** → Adresse e-mail mise à jour  
- **Reset password code** → Code de réinitialisation du mot de passe  
- **Sign in from new device** → Connexion depuis un nouvel appareil  
- **Organization invitation accepted** → Invitation à l’organisation acceptée  

Pour chaque template : Name, Subject et Body en français. **Boutons** : couleur teal **`#0d9488`** (à mettre en vue code dans Clerk si besoin).

### Production (rappels)
- **CHECKLIST_AVANT_PRODUCTION.md** : From / Reply-to des mails Clerk sur ton domaine ; rappel Compte verrouillé (Resend en prod) ; ne pas désactiver « Delivered by Clerk » avant d’avoir l’URL webhook prod et les variables Resend.
- **docs/CLERK_EMAIL_ACCOUNT_LOCKED_RESEND.md** : détail du flux Compte verrouillé via Resend.

---

## 2. État actuel du produit

- **Fonctionnel** : auth (Clerk), orgs, rôles (admin/manager/staff), invitations, Stripe, dashboard, restaurants, produits, ingrédients, ventes, stocks, alertes, prévisions, recommandations, rapports, paramètres, facturation.
- **Prêt à déployer** : déploiement possible ; suite = config prod (env, webhooks, domaine) puis premiers clients.
- **Prix visé** : 5 000 €/mois — cohérent pour chaînes/groupes si offre claire et preuve de valeur (ROI, cas client).

---

## 3. Prochaines étapes recommandées

1. **Mise en prod** : déployer, configurer domaine, variables d’env, webhooks Clerk + Stripe, From/Reply-to mails. Suivre la checklist avant prod.
2. **Premier client / pilote** : cibler une chaîne ou un groupe ; documenter les résultats (économies, gaspillage) pour justifier le prix.
3. **Offre 5 000 €/mois** : formaliser ce qui est inclus (restaurants, utilisateurs, support, engagement) et mettre à jour la page Pricing ou le doc commercial.
4. **Démo** : scénario clair, données de démo réalistes, message en 5 min (« ce que le client doit retenir »).

---

## 4. Références utiles

| Élément | Fichier / lieu |
|--------|-----------------|
| Checklist avant prod | `CHECKLIST_AVANT_PRODUCTION.md` |
| Mail Compte verrouillé (Resend) | `lib/services/email-templates.ts`, `app/api/webhooks/clerk/route.ts` |
| Doc Compte verrouillé | `docs/CLERK_EMAIL_ACCOUNT_LOCKED_RESEND.md` |
| Teal boutons / site | `#0d9488` |

---

*Dernière mise à jour : récap enregistré après finalisation du dev principal et des mails Clerk.*
