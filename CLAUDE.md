# Opn-Link

Ce fichier est lu au début de chaque session. Il dit comment on travaille et
ce qui est déjà décidé. Le détail est dans `docs/`.

## Comment on travaille

- En français, en tutoyant, avec des réponses courtes et simples.
- On discute avant d'agir. Rien ne se code, ne se lance ou ne se publie sans
  le feu vert du mainteneur.
- Avant de proposer quelque chose, relire `docs/projet.md`,
  `docs/architecture.md`, `docs/questions-ouvertes.md` et `docs/carnet.md`.
- On ne décide pas à la place du mainteneur. Une question qu'il n'a pas
  tranchée va dans `docs/questions-ouvertes.md`, avec une recommandation.
- Une décision prise est notée dans `docs/carnet.md` avec sa date, puis
  reportée dans `projet.md` ou `architecture.md`.
- La doc est sur `main`, pas sur une branche à part.
- Un changement visible (un écran, un bouton) est montré au mainteneur en
  captures avant d'arriver dans `main` : avant et après, sur téléphone et sur
  ordinateur.
- Pas de vraies données d'élèves dans le dépôt. Les exemples et les captures
  utilisent des données inventées.

## Comment on écrit

Le mainteneur ne veut ni texte ni code qui sentent l'IA.

Dans la doc :

- des phrases courtes et normales, comme quand on explique à un camarade ;
- pas de tiret cadratin (—), une virgule ou un point suffit ;
- le gras rarement, pour un mot qu'on doit retrouver d'un coup d'œil ;
- pas de phrase qui annonce la liste suivante (« Trois raisons : »), on
  donne la liste ;
- pas de formules toutes faites (« ce n'est pas X, c'est Y », « le vrai
  problème, c'est… »), ni de conclusion qui répète ce qu'on vient de dire ;
- pas de mots creux : crucial, essentiel, robuste, véritable, fluide,
  garantir, en somme, notamment ;
- pas d'images ni de métaphores, on dit la chose ;
- un tableau seulement pour comparer plusieurs choses sur plusieurs points.

Dans le code :

- un commentaire seulement quand le code ne peut pas dire pourquoi : une
  contrainte, un piège, une source. Jamais pour répéter ce que fait la ligne ;
- un nom clair plutôt qu'un commentaire ;
- pas de bandeaux, pas de code commenté laissé en place, pas d'emoji ;
- une doc courte (`///`) sur ce que le cœur expose aux autres parties, et
  rien de plus.

## Ce qui est décidé

Le détail et les dates sont dans `docs/carnet.md`.

- Le nom : Opn-Link à l'écran, `opn-link` pour le dépôt et le code.
- Le but : un outil utile, libre et gratuit. Pas pour gagner de l'argent.
- La licence : MIT ou Apache-2.0, comme Rust et Tauri.
- Une app en Rust qui marche aussi sur le web, avec le même cœur partout. La
  compatibilité et l'évolutivité comptent plus que la vitesse. L'architecture
  proposée est dans `docs/architecture.md`.
- La première version sort sur le web et en app pour ordinateur. Les apps de
  store pour téléphone viendront plus tard.
- Elle vise d'abord les centres de formation et le post-bac.
- Pas de serveur à payer : les données restent sur les appareils, les
  messages passent par des relais Nostr publics, un QR code sert quand il n'y
  a pas de réseau.
- Le site est publié par l'organisation GitHub `opn-link`, à une autre
  adresse qu'OpenContact.
- Le style d'OpenContact (« Utilitaire 98 »), pris dans son dépôt, jamais
  recopié à la main.
- La messagerie est dans la première version, même si la recherche la
  déconseillait. C'est un choix du mainteneur.
- Le contenu de la première version : `docs/projet.md`, partie 4.

## Les règles à ne jamais casser

Elles viennent d'OpenContact.

1. Ce que l'élève n'a pas choisi de partager ne part pas. Il voit ce qui va
   partir avant l'envoi, et peut arrêter quand il veut.
2. On n'écrase jamais des données sans prévenir : un aperçu avant, un bouton
   « Annuler » après les gestes importants.
3. Un écran sert à une seule chose.
4. L'app marche sans réseau, ou dit ce qui ne marche pas. Rien n'est
   téléchargé d'Internet au démarrage.
5. Pas de serveur Opn-Link, pas de compte Opn-Link, pas de statistiques
   envoyées.
6. Un format ou une clé de stockage ne change jamais de nom. S'il évolue, il
   prend une nouvelle version, et l'app sait toujours lire l'ancienne.

## Les autres dépôts

- OpenContact (`mahi010110/Open-Contact`, public) : son `CLAUDE.md` décrit le
  style et les règles d'interface, son `CONTRAT.md` les formats qu'Opn-Link
  devra lire.
- Le lab IA : sa doc est dans `mahi010110/Opn...` (public), branche
  `claude/sweet-hypatia-p4qlsl`, dossier `docs/projets/`.
- Ce dépôt est privé.
