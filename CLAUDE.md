# opn-link — à lire avant tout

Ce fichier dit comment on travaille sur opn-link et ce qui est déjà décidé.
Le détail vit dans `docs/`. Si une idée ne rentre pas dans ces règles, on en
discute avec le mainteneur : jamais d'exception silencieuse.

## Comment on travaille

- **Français, tutoiement, réponses simples et courtes.** Le mainteneur a
  demandé « simplifie » : un mot de tous les jours vaut mieux qu'un terme
  technique, et une explication courte vaut mieux qu'un tableau.
- **On discute d'abord.** Rien ne se code, ne se lance ni ne se publie sans
  son feu vert explicite.
- **Relire `docs/` avant de proposer quoi que ce soit** : `projet.md`,
  `architecture.md`, `questions-ouvertes.md`, puis `carnet.md`.
- **Ne jamais trancher à sa place.** Une décision qui n'est pas prise va dans
  `docs/questions-ouvertes.md`, avec une recommandation.
- **Toute décision prise se note dans `docs/carnet.md`, avec sa date**, et sa
  réponse rejoint `projet.md` ou `architecture.md`. Un raisonnement qui
  compte finit dans la doc, jamais seulement dans une discussion qu'on
  perdra.
- **La doc vit sur `main`.** Pas de branche cachée.
- **Un changement qui se voit se montre avant d'arriver dans `main`** : la
  capture de l'avant et celle de l'après, au téléphone et à l'ordinateur,
  regardées par le mainteneur (règle venue d'OpenContact, `CLAUDE.md` §0).
- **Aucune vraie donnée d'élève dans le dépôt** : captures et exemples
  utilisent des données inventées.

## Ce qui est décidé

- **Le nom : opn-link.** Le lien entre l'école (ou le centre de formation),
  les profs et les élèves.
- **Le but** : un outil utile, libre et gratuit, pour se faire connaître.
  Pas pour gagner de l'argent.
- **Une vraie app en Rust, et aussi disponible sur le web.** La
  compatibilité et l'évolutivité passent avant la vitesse. La façon de faire
  est une proposition à valider : `docs/architecture.md`.
- **Sans serveur à payer**, comme OpenContact : données sur les appareils,
  relais Nostr publics, QR hors ligne en secours.
- **Le style d'OpenContact** (« Utilitaire 98 »), pris à sa source, jamais
  recopié à la main.
- **La messagerie est au cœur du MVP**, malgré l'avis contraire de la
  recherche : c'est un choix assumé du mainteneur.
- **Le MVP** : `docs/projet.md`, §4.

## Ce qui ne se casse jamais (repris d'OpenContact)

1. **Ce que l'élève n'a pas choisi de partager ne sort pas.** Il voit avant
   d'envoyer, et peut arrêter à tout moment.
2. **On n'écrase jamais en silence.** Un aperçu avant, un « Annuler » après
   tout geste lourd.
3. **Un écran, un but.**
4. **Ça marche hors ligne**, ou ça le dit et propose un repli. Rien ne se
   charge depuis Internet au démarrage.
5. **Aucun serveur opn-link, aucun compte opn-link, aucune télémétrie.**
6. **On ne renomme jamais un format ni une clé de stockage** : une nouvelle
   version, et l'app continue de lire l'ancienne.

## Où sont les autres projets

- **OpenContact** : `mahi010110/Open-Contact` (public). Son `CLAUDE.md` est
  la référence du style et des règles d'interface ; son `CONTRAT.md` décrit
  les formats qu'opn-link devra parler.
- **Le lab IA** : sa doc vit dans `mahi010110/Opn...` (public), branche
  `claude/sweet-hypatia-p4qlsl`, dossier `docs/projets/`.
- Ce dépôt-ci est **privé**.
