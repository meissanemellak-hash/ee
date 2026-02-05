# Mail « Compte verrouillé » en français via Resend

Ce document décrit la prise en charge du template Clerk **Compte verrouillé** (Account Locked), dont le body est en lecture seule. On envoie nous-mêmes le mail en français via Resend.

## Mise en place

1. **Clerk**  
   - Configure → Customization → Emails → **Compte verrouillé**  
   - Désactiver **« Delivered by Clerk »** (toggle off).  
   - Clerk n’enverra plus ce mail et déclenchera un webhook à la place.

2. **Webhook Clerk**  
   - Clerk Dashboard → **Webhooks** → ton endpoint (ex. `https://ton-domaine.com/api/webhooks/clerk`).  
   - S’abonner à l’événement lié aux e-mails (nom exact à vérifier dans l’**Event Catalog**, ex. `email.created` ou similaire).

3. **Variables d’environnement (optionnel)**  
   - `EMAIL_FROM` : adresse d’envoi (ex. `noreply@ton-domaine.com`). Sinon Resend utilise la valeur par défaut.  
   - `NEXT_PUBLIC_APP_NAME` : nom affiché dans le pied de page du mail (défaut : « AI Operations »).

## Comportement

- Quand un compte est verrouillé, Clerk envoie un POST sur `/api/webhooks/clerk` avec un payload contenant au moins le type d’e-mail (slug `account_locked`), le destinataire et les variables (date, tentatives, durée de verrouillage, nom de l’app).
- Le handler détecte le slug `account_locked`, construit le HTML en français avec `lib/services/email-templates.ts`, et envoie le mail via Resend.

## Structure du template (Resend)

Le template reprend la structure du mail Clerk : titre « Compte verrouillé », paragraphe d’intro, détails (verrouillé le, tentatives échouées), section « Que se passe-t-il ensuite ? », pied de page. Style sobre, aligné avec les autres mails (couleur teal si besoin pour les liens).

## Si le webhook ne reçoit rien ou payload différent

- Vérifier dans Clerk → Webhooks → **Message Attempts** que l’événement est bien envoyé et que la requête retourne 200.
- Si le payload a une autre forme (noms de champs différents), adapter dans `app/api/webhooks/clerk/route.ts` l’extraction de `to`, `subject`, et des variables (`locked_date`, `failed_attempts`, `lockout_duration`, `app_name`).
