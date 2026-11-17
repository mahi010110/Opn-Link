# Opn-Link

Ce fichier est lu au début de chaque session. Il dit comment on travaille et
ce qui est déjà décidé. Le détail est dans `docs/`.

## Où on en est

Le 16 novembre 2026 : le cadrage, la conception, les 71 maquettes et les
règles sont faits et validés.

Le prototype de l'appel a commencé le même jour, avec le feu vert du
mainteneur. Le cœur en Rust est dans `coeur/`, avec ses tests. Le site est
dans `site/` : l'appel s'y joue de bout en bout à six appareils. Les formats
sont dans `docs/contrat.md`. Ce qui reste ouvert est dans
`docs/questions-ouvertes.md`, et ce qui s'est décidé jour après jour dans
`docs/carnet.md`.

La suite est la première version complète, sans bêta ni essai avec une
classe (décision du 17 novembre 2026). Pour reprendre dans une nouvelle
discussion, lire d'abord `docs/prototype.md`, partie « Reprendre le
travail » : préparer les outils, vérifier que tout passe, puis la suite,
dans l'ordre.

## Comment on travaille

- En français, en tutoyant, avec des réponses courtes et simples.
- On discute avant d'agir. Rien ne se code, ne se lance ou ne se publie sans
  le feu vert du mainteneur.
- Avant de proposer quelque chose, relire `docs/projet.md`,
  `docs/regles.md`, `docs/conception.md`, `docs/ux.md`,
  `docs/architecture.md`, `docs/mesures.md`, `docs/questions-ouvertes.md` et
  `docs/carnet.md`.
- Pour concevoir l'app, son design ou sa navigation, lire d'abord
  `docs/brief-conception.md`.
- Ce qui dépend d'un service public (relais, OpenTimestamps) se mesure avant
  d'être décidé. Les sondes sont dans `mesures/`, et se relancent depuis
  l'environnement cloud « OpenContact et Opn-Link ».
- On ne décide pas à la place du mainteneur. Une question qu'il n'a pas
  tranchée va dans `docs/questions-ouvertes.md`, avec une recommandation.
- Une décision prise est notée dans `docs/carnet.md` avec sa date, puis
  reportée dans `projet.md` ou `architecture.md`.
- La doc est sur `main`, pas sur une branche à part.
- Un changement visible (un écran, un bouton) est montré au mainteneur en
  captures avant d'arriver dans `main` : avant et après, sur téléphone et sur
  ordinateur, en clair et en sombre.
- Pas de vraies données d'apprenants dans le dépôt. Les exemples et les
  captures utilisent des données inventées.

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

- Le matériel de design est celui d'OpenContact, « Utilitaire 98 » : ses
  jetons, ses polices, ses icônes et les règles de son kit `design/`, pris
  dans son dépôt par un script, jamais recopiés à la main (15 novembre 2026).
- Les écrans, la navigation et l'UX sont propres à Opn-Link, pensés pour ses
  usagers et pour leurs différents écrans. Rien n'est repris de l'interface
  d'OpenContact, qui est en refonte. Le concept : « la réponse d'abord »,
  qui élargit « une chose à la fois, au bon moment ». Il est dans
  `docs/conception.md`, avec la navigation. La conception est confiée à
  Fable 5, à partir de `docs/brief-conception.md` (15 novembre 2026).
- Les maquettes de `maquettes/` sont validées : 71 écrans, pour les cinq
  interfaces et la tablette (16 novembre 2026). Un écran nouveau part d'elles et de
  `maquettes/opn-link.css`.
- D'OpenContact, on ne garde que ce matériel (15 novembre 2026). Les règles
  d'Opn-Link sur les données, l'interface, l'accessibilité, les tests et la
  façon de livrer sont dans `docs/regles.md`, chacune avec la façon de la
  vérifier (16 novembre 2026). Elles ont remplacé `docs/exigences.md`.
- Une interface par personne et par écran : l'apprenant sur son téléphone,
  le formateur en cours avec l'appel sur l'écran de la salle, le centre à
  l'ordinateur, le tuteur sur une page ouverte depuis un e-mail. Chacune
  s'adapte au téléphone, à la tablette, à l'ordinateur et à l'écran de la
  salle (15 novembre 2026, `docs/ux.md`).
- Une app intuitive, simple et efficace, sans trop en faire. Les exigences
  d'UX et de design propres à Opn-Link sont dans `docs/ux.md`.
- Le nom : Opn-Link à l'écran, `opn-link` pour le dépôt et le code.
- Les mots à l'écran : formateur, apprenant, centre, tuteur, classe. Jamais
  prof, élève ou école. La liste complète est dans `docs/projet.md`,
  partie 4.
- Le ton : l'app tutoie l'apprenant, le formateur et le centre, et vouvoie
  le tuteur (16 novembre 2026).
- Peu de réglages : un réglage existe seulement quand les centres font
  vraiment différemment. Il a une valeur par défaut, et seul le chef le voit.
- Les clés : P-256 comme OpenContact, et des clés jetables pour les relais
  (`docs/architecture.md`, partie « Les clés »).
- Toutes les questions de produit ont été tranchées le 15 novembre 2026, et
  ce qui pouvait se mesurer à distance a été mesuré le même jour
  (`docs/mesures.md`). Ce qui reste se mesure sur place
  (`docs/questions-ouvertes.md`).
- Nostr est écrit à la main avec k256 : rust-nostr pèse 1,2 Mo de trop
  (mesuré).
- Le but : un outil utile, libre et gratuit. Pas pour gagner de l'argent.
- La licence : MIT ou Apache-2.0, comme Rust et Tauri.
- Une app en Rust qui marche aussi sur le web, avec le même cœur partout. La
  compatibilité et l'évolutivité comptent plus que la vitesse. L'architecture
  proposée est dans `docs/architecture.md`.
- Le moins de données possible, et une app légère. Chaque donnée a une durée
  de vie.
- La première version sort sur le web et en app pour ordinateur. Les apps de
  store pour téléphone viendront plus tard.
- Elle vise d'abord les centres de formation et le post-bac.
- Pas de serveur à payer : les données restent sur les appareils, les
  messages passent par des relais Nostr publics, un QR code sert quand il n'y
  a pas de réseau.
- Le site est publié par l'organisation GitHub `opn-link`, à une autre
  adresse qu'OpenContact.
- La classe est un fil d'annonces où seuls les responsables écrivent. Chaque
  apprenant écrit en privé à un formateur ou au centre. Les apprenants ne
  s'écrivent pas entre eux dans Opn-Link.
- La première version contient aussi ce qui était à la base : la présence,
  les documents à signer, l'envoi de documents et la documentation partagée.
  La présence se signe d'un geste, les documents d'un geste et d'un dessin.
- Le contenu de la première version : `docs/projet.md`, partie 5.

## Les règles à ne jamais casser

Validées le 16 novembre 2026. `docs/regles.md`, partie 1, dit comment chacune
se vérifie. Les règles de l'interface, de l'accessibilité, des tests et de
la livraison sont dans ses parties 2 à 5.

1. Ce qu'une personne n'a pas choisi d'envoyer ne part pas. Avant chaque
   envoi, l'écran dit à qui ça part. Un partage qui dure s'arrête quand elle
   le veut.
2. Chacun ne reçoit que ce qui est pour lui. Le tuteur reçoit les présences
   et les absences de son apprenti, jamais le motif. Un justificatif médical
   va aux seuls responsables. Un apprenant ne voit pas les messages d'un
   autre.
3. Rien ne dit à l'autre quand on a ouvert quelque chose : ni « vu », ni
   « en train d'écrire », ni « en ligne ».
4. La salle ne voit jamais un nom. Un écran qui montre le QR de l'appel ne
   montre aucun nom d'apprenant.
5. Une feuille close ne change plus. Une correction s'ajoute et reste
   visible. Une signature arrivée après la clôture ne compte pas.
6. On n'écrase rien sans prévenir : un aperçu avant, « Annuler » pendant
   trente secondes après. Fermer la classe est le seul geste qui ne se
   défait pas, et il a son écran.
7. L'app marche sans réseau, ou dit ce qui attend. L'appel marche sans
   réseau. Rien n'est téléchargé d'Internet au démarrage.
8. Pas de serveur Opn-Link, pas de compte Opn-Link, pas de statistiques
   envoyées.
9. Chaque donnée a une durée de vie, écrite dans le contrat. Passé ce délai,
   elle s'efface de l'appareil.
10. Un format ou une clé de stockage ne change jamais de nom. S'il évolue,
    il prend une nouvelle version, et l'app lit toujours l'ancienne. Une app
    garde intact ce qu'elle ne comprend pas.

## Les autres dépôts

- OpenContact (`mahi010110/Open-Contact`, public) : son `CLAUDE.md` décrit en
  détail la façon de livrer, son `CONTRAT.md` les formats qu'Opn-Link devra
  lire. Son kit `design/` et ses jetons donnent le matériel « Utilitaire 98 ».
  Son interface, elle, ne s'applique pas à Opn-Link.
- Le lab IA : sa doc est dans `mahi010110/Opn...` (public), branche
  `claude/sweet-hypatia-p4qlsl`, dossier `docs/projets/`.
- Ce dépôt est privé.
