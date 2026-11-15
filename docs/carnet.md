# Le carnet d'opn-link

*Les décisions dans l'ordre où elles ont été prises. Les décisions à jour
sont dans [`projet.md`](projet.md) et [`architecture.md`](architecture.md) :
en cas de doute, elles priment sur ce carnet.*

---

## 12-15 novembre 2026 — la naissance de l'idée

*Repris du carnet tenu pendant une première discussion (dépôt `Opn...`,
branche `claude/sweet-hypatia-p4qlsl`, fichier
`docs/projets/carnet-de-discussion.md`), pour la partie qui concerne
opn-link. Le projet s'appelait alors « projet 1 — l'espace de vie ».*

- **Évolution de l'idée** : appli d'émargement (« faire l'appel ») + boîte
  de documents administratifs à signer → pont élève ↔ formation →
  **espace de vie complet** centre de formation / profs / élèves.
- **Ce qu'il veut** :
  - messagerie élève ↔ prof ↔ école ;
  - suivi de l'avancée de l'élève, surtout sa **recherche de stage ou
    d'alternance** (pas d'emploi), en **connectant OpenContact** à la
    nouvelle app ; si l'élève ne veut pas : questions-réponses régulières +
    preuves envoyées ;
  - appels et visios ;
  - documentation façon Classroom : doc de la formation pour tous, doc du
    prof pour les élèves, doc de l'école pour les profs ;
  - l'émargement et les documents signés (idée de départ).
- **Ce qu'on a établi** :
  - faisable sans serveur avec le moteur d'OpenContact ;
  - lien OpenContact → école : l'élève scanne le QR de l'école dans
    OpenContact, choisit ce qu'il partage, OpenContact envoie un résumé
    chiffré (boîte aux lettres). C'est une exception à la promesse « le
    suivi privé ne sort jamais » : chiffres seulement, jamais les notes,
    aperçu avant envoi, révocable, toujours facultatif ;
  - piège : deux apps sur `mahi010110.github.io` = même stockage du
    navigateur → adresse séparée ;
  - limites : pas de notification app fermée (l'appel quotidien fait ouvrir
    l'app) ; petits fichiers seulement par les relais ; appels à deux
    possibles mais échecs sans serveur relais ; visio de classe impossible en
    direct (plus de 4 ou 5 personnes) → lien Jitsi ;
  - ordre conseillé : messagerie + suivi de recherche → émargement +
    documents → documentation → appels ;
  - pitch : « le Pronote des centres de formation, libre et sans serveur » ;
  - noms proposés : Préau, Liaison, Relais, OpenPromo, Le Fil. À éviter :
    trop proche d'OpenClassrooms, des Cordées de la réussite, ou de
    « campus ».
- **La recherche sur l'émargement** (`recherche/emargement/rapport.md`). À
  retenir, le volet argent ne comptant plus :
  - aucune règle n'impose de serveur pour l'émargement (sauf le DPC santé ;
    l'Île-de-France et l'Auvergne-Rhône-Alpes imposent SoWeSign) ;
  - seule la signature qualifiée est présumée fiable (Cour de cassation,
    5 mars 2026) → contreseing du formateur, QR tournant, export au modèle
    du financeur, archive 5 à 10 ans, horodatage qualifié de l'empreinte ;
  - les applis élèves actuelles sont mal notées (Edusign Android autour de
    3,8/5, SoWeSign exige Bluetooth et localisation) ;
  - Qualiopi demande le suivi des absences, les relances, et pour
    l'alternance le lien avec l'entreprise ; aider à trouver un employeur
    est une mission légale des CFA.
- **Le but de tous les projets** : s'amuser, construire des outils utiles
  et open source, se faire connaître. Pas gagner de l'argent. Pas de budget,
  pas de serveur à payer.
- **La priorité, à ce moment-là** : le lab IA d'abord (projet fil rouge de
  l'examen de juillet 2027), opn-link ensuite.

## 15 novembre 2026 — le démarrage

- La doc des deux projets a été retrouvée sur une branche du dépôt `Opn...`,
  qui est **public**. Celle d'opn-link est rapatriée ici, dans un dépôt
  **privé**, sur `main` : plus de branche cachée.
- **Le nom : opn-link.** Il dit « le lien » entre l'école, les profs et les
  élèves, et range le projet dans la famille (OpenContact, Opn…). Restent à
  choisir comment il s'écrit à l'écran, et à vérifier qu'il est libre.
- **opn-link démarre maintenant**, dans cette discussion (le mainteneur :
  « avec toi on va commencer opn-link »).
- **La messagerie reste au cœur du MVP.** Le rapport sur l'émargement
  déconseillait un chat façon Discord ; le mainteneur la garde quand même
  (« il fallait quand même avoir la possibilité de discuter »). C'est un
  choix assumé, pas un oubli.
- **Une vraie app en Rust, aussi disponible sur le web**, avec une attention
  à la compatibilité et à l'évolutivité. La proposition d'architecture est
  dans `architecture.md`, à valider.
- **Le style d'OpenContact pour tous les projets**, pris à une seule source,
  pour que les projets ne divergent pas avec le temps.
- **La méthode** : (1) poser les fondations dans ce dépôt ; (2) trancher les
  questions ouvertes ; (3) faire les maquettes et les regarder avant de
  coder ; (4) coder. L'étape 1 est faite ce jour.
