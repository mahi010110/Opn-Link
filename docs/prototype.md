# Le prototype

Proposé par Fable 5 le 16 novembre 2026, une fois les maquettes et les
règles validées. Il attend le feu vert du mainteneur : rien ne se code tant
qu'il ne l'a pas donné.

Le but est de confirmer les outils de [architecture.md](architecture.md),
partie « Les outils envisagés », sur le moment qui compte le plus :
l'appel.

## Ce qu'il fait : l'appel, de bout en bout

1. Le cœur en Rust, avec ses tests (`cargo test`) :
   - une clé P-256 par appareil ;
   - créer une classe et la rejoindre ;
   - le QR de l'appel qui change, avec son code de 6 chiffres ;
   - signer sa présence, depuis le seul appareil qu'un responsable a
     accepté ;
   - clore la feuille, dans un journal où l'on ne peut qu'ajouter.
2. Le même cœur compilé en WebAssembly, et ses tests rejoués dans un
   navigateur (`wasm-bindgen-test`).
3. Trois interfaces branchées sur le cœur, reprises des maquettes validées
   et de `maquettes/opn-link.css` :
   - l'écran de la salle : `salle-appel` ;
   - le téléphone de l'apprenant : `apprenant-jour-appel`,
     `apprenant-signer`, `apprenant-jour-signe`, `apprenant-sans-reseau` ;
   - le téléphone du formateur : `cours-avant`, `cours-liste`,
     `cours-apres`.
4. L'appel joué par Playwright avec l'ordinateur du formateur, son téléphone
   et deux apprenants, avec et sans réseau ([regles.md](regles.md),
   partie 4).

Les relais publics et l'app pour ordinateur viennent après. Pendant les
tests, les appareils se parlent par un petit relais Nostr lancé en local. Il
n'existe pas encore : `mesures/relais.mjs` mesure les relais publics, il ne
sert pas de relais.

## Ce qu'il tranche

- Le poids réel du site, face au plafond de 300 Ko compressés
  ([regles.md](regles.md), partie 7). `mesures/taille-coeur` en donne déjà
  une idée : 186 Ko pour le cœur seul.
- Les largeurs de 600 et 901 px, où l'on passe à deux puis à trois
  fenêtres.
- L'interface en TypeScript, avec React ou sans.
- La durée de validité du code de 6 chiffres, vue à l'écran. Le temps qu'il
  faut pour le taper dans une vraie salle se mesure sur place.

## Ce qui vient avec le premier code

- Les fichiers de licence, MIT et Apache-2.0.
- `docs/contrat.md` : les formats et les clés de stockage, chacun avec ses
  vecteurs de test ([regles.md](regles.md), règle 10).

## Avant de commencer

- Rust 1.97 est installé dans l'environnement cloud. Il manque la cible
  `wasm32-unknown-unknown` et `wasm-bindgen`.
- Seul Chromium est installé. WebKit et Firefox sont à ajouter pour les
  tests.
- Les maquettes se refont en suivant
  [../maquettes/README.md](../maquettes/README.md). Il faut le dépôt
  d'OpenContact posé à côté de celui-ci.

## Comment on livre

- Le travail se fait sur une branche. Il arrive sur `main` après les
  captures et avec l'accord du mainteneur ([regles.md](regles.md),
  partie 5).
- Le cœur et ses tests d'abord, puis l'écran.
- Les captures se montrent en planches, comme celles de `maquettes/` : avant
  et après, au téléphone et à l'ordinateur, en clair et en sombre.
