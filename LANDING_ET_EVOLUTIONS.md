# Récapitulatif des évolutions – Landing & SaaS

Document de référence de tout ce qui a été mis en place sur la landing, les pages légales, le parcours client et les corrections effectuées.

---

## 1. Landing page – Structure et contenu

### Header
- **2 boutons uniquement** : « Se connecter » → `/sign-in`, « Démarrer » → `/sign-up`.
- Ancres et « Demander une démo » retirés du header pour alléger.

### Hero
- **3 pills d’ancres** : Pour qui (`#pour-qui`), Sécurité (`#confiance`), FAQ (`#faq`).
- **1 CTA principal** : « Demander une démo → » → `/sign-up?intent=demo`.
- Lien discret « Se connecter » sous le bouton.

### Section « Aperçu du produit »
- Sous-titre : *« Vue d’ensemble de vos économies, alertes et recommandations comme dans votre tableau de bord. »*
- Barre d’URL du mockup : « Tableau de bord · AI Operations » (plus de `app.example.com`).
- Contenu aligné sur le vrai dashboard :
  - Carte verte **« Économies générées ce mois-ci »** : 3 478 € (fond teal, texte blanc).
  - **Recommandations appliquées** : 51, avec « 3 478 € économisés » (icône TrendingUp) et « vs. 2 890 € période précédente ».
  - **Risque de rupture (7j)** : 1 restaurant concerné (icône orange).
  - **Gaspillage estimé** : 821 €.
- 3 vignettes : Tableau de bord, Restaurants, Alertes & rapports.
- Bloc placeholder « Vidéo de démonstration – Disponible sur demande ».

### Section « Preuve sociale »
- Sous-titre : *« Une plateforme pour tout piloter : centralisez vos restaurants, réduisez le gaspillage et les ruptures de stock, et dégagez des économies concrètes. »*
- **3 indicateurs** en cartes (teal) :
  1. **–20 %** de gaspillage en moins — Moins de perte, plus de marge.
  2. **–35 %** de ruptures de stock en moins — Service assuré, clients sereins.
  3. **–15 %** d’économies — Achats et stocks.
- Témoignages avec pourcentages :
  - M. D. (Directeur opérations, Chaîne de 12 restaurants) : « → 40 % de temps gagné sur le suivi de ses restaurants ».
  - S. L. (Responsable achats, Groupe multi-restaurants) : « → 50 % de ruptures de stock en moins grâce aux alertes ».

### Sections Douleurs, Solution, Pour qui
- **« Sites » remplacé par « restaurants »** partout (y compris « multi-sites » → « multi-restaurants » où pertinent).
- Section « Pour qui » détaillée avec 4 profils : Chaînes de restaurants, Groupes multi-restaurants, Direction opérations, Achats & supply chain.

### Section Tarifs
- Prix sur **une seule ligne** : « À partir de 5 000 € / mois » (`whitespace-nowrap`).
- **5 bienfaits** : Tableau de bord unifié multi-restaurants ; Ventes et analyse par restaurant ; Inventaire et stocks, suivi des ruptures ; Alertes, prévisions et rapports ; Support prioritaire et accompagnement.
- **2 boutons** : « Demander un devis personnalisé » → `/sign-up`, « Demander une démo » → `/sign-up?intent=demo`.

### Section Confiance (sécurité, support)
- 4 blocs : Sécurité des données, Accès sécurisé, Disponibilité, Support dédié.

### FAQ
- 4 questions en accordéon (`<details>` / `<summary>`) : Pour qui, Tarifs, Outils existants, Mise en place et support.

### CTA final
- Sous-titre : *« Moins de stress, plus de bénéfices et d’économies. Essayez la plateforme. »*
- 2 boutons : « Démarrer gratuitement » → `/sign-up`, « Demander une démo » → `/sign-up?intent=demo`.

### Footer
- Liens : Mentions légales, Confidentialité, Contact, Se connecter, Créer un compte.
- Toutes les pages légales et contact sont **accessibles sans connexion** (routes publiques dans le middleware).

---

## 2. Pages légales et Contact

### Mentions légales (`/mentions-legales`)
- Éditeur, Hébergeur, Responsable de la publication (à compléter).
- Propriété intellectuelle, Limitation de responsabilité, Liens hypertextes, Droit applicable, Contact.

### Politique de confidentialité (`/confidentialite`)
- Responsable du traitement, Données collectées, Finalités et base légale, Durée de conservation, Destinataires et sous-traitants, Droits RGPD, Sécurité, Cookies, Contact.

### Contact (`/contact`)
- Email : `contact@ai-operations.fr` (à remplacer par la vraie adresse).
- Actions : Demander une démo, Créer un compte, Envoyer un email (mailto).
- Bloc « Pourquoi nous contacter » (démo, devis, questions).

### Middleware
- **Routes publiques** : `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/mentions-legales`, `/confidentialite`, `/contact`, `/api/webhooks(.*)`, `/dashboard/setup(.*)`.
- Sans cela, les liens footer redirigeaient vers la page de connexion ; c’est corrigé.

---

## 3. Où mènent les boutons de la landing

| Zone        | Élément                    | Destination           |
|------------|----------------------------|------------------------|
| Header     | Logo                       | `/`                   |
| Header     | Se connecter               | `/sign-in`            |
| Header     | Démarrer                   | `/sign-up`            |
| Hero       | Pills Pour qui / Sécurité / FAQ | `#pour-qui`, `#confiance`, `#faq` |
| Hero       | Demander une démo          | `/sign-up?intent=demo` |
| Hero       | Se connecter              | `/sign-in`            |
| Tarifs     | Demander un devis          | `/sign-up`            |
| Tarifs     | Demander une démo          | `/sign-up?intent=demo` |
| CTA final  | Démarrer gratuitement      | `/sign-up`            |
| CTA final  | Demander une démo          | `/sign-up?intent=demo` |
| Footer     | Mentions légales / Confidentialité / Contact | `/mentions-legales`, `/confidentialite`, `/contact` |
| Footer     | Se connecter / Créer un compte | `/sign-in`, `/sign-up` |

---

## 4. Processus client actuel et recommandation (SaaS 5 000 €/mois)

### Processus actuel
1. Arrivée sur la landing.
2. Clic sur « Démarrer » ou « Demander une démo » → `/sign-up` (ou `?intent=demo`).
3. Inscription Clerk → setup organisation → **accès direct au dashboard sans paiement**.

**Problème :** Accès complet gratuit ; inadapté pour un abonnement à 5 000 €/mois.

### Recommandation
- **Sales-led** : « Demander une démo » → formulaire/calendrier → commercial → démo → contrat + paiement → création de compte par l’équipe.
- **Ou hybride** : démo = sales ; « Démarrer » = trial limité (ex. 1 restaurant, 14 jours) puis paywall ou contact commercial pour débloquer.

Détails et options (A, B, C) sont décrits dans la conversation ; à implémenter selon le choix (formulaire démo, trial, Stripe, etc.).

---

## 5. Fichiers modifiés ou créés

- `components/landing/landing-page.tsx` – Landing (header, hero, aperçu, preuve sociale, tarifs, CTA, footer, ancres, wording).
- `app/mentions-legales/page.tsx` – Page mentions légales (contenu complet, à personnaliser).
- `app/confidentialite/page.tsx` – Politique de confidentialité (contenu complet, à personnaliser).
- `app/contact/page.tsx` – Page contact (email, CTAs, à personnaliser).
- `middleware.ts` – Ajout des routes publiques `/mentions-legales`, `/confidentialite`, `/contact`.

---

## 6. À faire de ton côté

- Remplacer les **[À compléter]** dans les mentions légales et la confidentialité (raison sociale, adresse, RCS, hébergeur, responsable de publication).
- Remplacer `contact@ai-operations.fr` par ton adresse email réelle.
- Décider du parcours commercial : sales-led, trial, ou hybride, puis implémenter (formulaire démo, limitation trial, paiement).
- Utiliser `?intent=demo` sur la page sign-up si besoin (message, redirection, etc.).

---

## 7. Avant la production – Rappels

À faire avant de passer en production :

1. **Calendly**
   - Mettre en place Calendly (créer l’événement type « Démo »).
   - Récupérer l’URL de l’événement (ex. `https://calendly.com/ton-username/demo`).
   - Configurer dans le projet : ajouter dans `.env.local` la variable `NEXT_PUBLIC_CALENDLY_URL` avec cette URL (la page `/demo/merci` l’utilise pour le bouton « Choisir un créneau »).

2. **API envoi du formulaire démo**
   - Ajouter une API (ex. `POST /api/demo` ou appel depuis la page `/demo` ou `/demo/merci`) qui envoie le contenu du formulaire (nom, email, société, nombre de restaurants, douleurs, priorités, message) à chaque demande de démo.
   - Options : envoi par email (Resend, Nodemailer, etc.) vers l’équipe commerciale, ou enregistrement en base de données pour suivi des leads.

3. **Pages légales – Compléter avant production**
   - **Mentions légales** (`/mentions-legales`) : remplacer tous les **[À compléter]** et **[contact@votredomaine.fr]** par les vraies informations (raison sociale, forme juridique, siège, RCS, SIRET, capital, TVA, hébergeur, responsable de la publication, email).
   - **Politique de confidentialité** (`/confidentialite`) : remplacer **[À compléter]** et **[contact@votredomaine.fr]** (raison sociale, adresse, email DPO/contact). Vérifier les durées de conservation si vous les avez personnalisées.
   - **Contact** (`/contact`) : remplacer l'email de contact par l'adresse réelle.

4. **Vidéo de démonstration**
   - Réaliser la vidéo de démo (écran + voix, 2–3 min : tableau de bord, restaurant, alertes, CTA).
   - Héberger la vidéo (YouTube, Vimeo, etc.) et récupérer l’URL.
   - Intégrer l’URL dans la landing (section « Aperçu du produit ») : remplacer le placeholder « Vidéo de démonstration – Disponible sur demande » par le lecteur vidéo.

5. **Test du parcours onboarding**
   - **Créer un nouveau compte** (nouvelle organisation / nouvel utilisateur) afin de tester le wizard d’onboarding de bout en bout avant la mise en production.
   - Suivre le **guide étape par étape** : voir **[GUIDE_TEST_ONBOARDING.md](./GUIDE_TEST_ONBOARDING.md)** (création du compte, vérification de la redirection, test des 3 étapes du wizard, checklist finale, réinitialisation pour re-tester).

---

*Document généré pour garder trace de toutes les évolutions landing et parcours client.*
