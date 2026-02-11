# Évolutions prévues après production

Rappels et idées à traiter **après** la mise en production, pour les prochaines versions du SaaS.

---

## Alertes effectifs (Sur-effectif / Sous-effectif)

**Constat :** Les types d’alertes « Sur-effectif » et « Sous-effectif » existent dans l’UI (filtres, etc.) mais ne peuvent pas être calculées aujourd’hui car le produit ne collecte pas l’**effectif prévu** par le restaurateur (combien de personnes il met par créneau chaque jour).

**Options envisagées :**

- **Option B (court terme, déjà recommandée)** : Masquer ou retirer « Sur-effectif » et « Sous-effectif » des filtres/listes d’alertes tant qu’aucune donnée ne les alimente, pour éviter la confusion.
- **Option C (évolution produit)** : Mettre en place la collecte de l’effectif prévu puis les alertes réelles :
  1. **Donnée à stocker** : effectif prévu par restaurant, par date, par créneau horaire.
  2. **Saisie** : soit lors de l’acceptation d’une recommandation d’effectifs (enregistrer les effectifs recommandés comme effectif prévu), soit via une page/écran « Planning effectifs » pour saisir ou modifier l’effectif prévu.
  3. **Alertes** : comparer effectif prévu vs effectif recommandé par créneau ; si prévu > recommandé → Sur-effectif ; si prévu < recommandé → Sous-effectif.
  4. **Déclenchement** : à chaque enregistrement/modification d’effectif prévu, et éventuellement via un job pour « aujourd’hui » et « demain ».

**Priorité :** Non critique pour la promesse actuelle de la landing (recommandations d’effectifs déjà en place). À planifier comme évolution lorsque la priorité sera de renforcer la partie « effectifs » et la cohérence des alertes.

---

*Dernière mise à jour : rappel ajouté après discussion produit (option B vs C, alignement avec la landing).*
