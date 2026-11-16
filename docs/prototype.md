# Le prototype

Proposé par Fable 5 le 16 novembre 2026, une fois les maquettes et les
règles validées. Le mainteneur a donné son feu vert le même jour (« En
attendant tu peux commencer toi même »). Le travail se fait sur la branche
`claude/design-navigation-concept-4c4fzs`, et n'arrive sur `main` qu'avec
son accord.

Le but est de confirmer les outils de [architecture.md](architecture.md),
partie « Les outils envisagés », sur le moment qui compte le plus :
l'appel.

## Où il en est

Fait le 16 novembre 2026 :

- le cœur de l'appel en Rust, dans `coeur/` (le paquet `opn-core`) : les
  clés d'un appareil, le code de la classe, la lettre scellée, la séance, le
  QR qui change avec son code de six chiffres, la présence signée, et la
  feuille tenue en journal, avec la clôture, son annulation et les
  corrections ;
- 38 tests, dont l'appel d'un mardi matin joué avec une horloge qu'on
  avance, et les vecteurs du contrat. Ils tournent en Rust et, compilés en
  WebAssembly, dans Chromium ;
- le peu de Nostr qu'il faut (un événement signé d'une clé jetable) et le
  dessin d'un QR, dans le cœur ;
- trois vérifications cassées exprès font bien échouer les tests, en Rust
  comme dans le navigateur ;
- ce que le cœur expose au navigateur (`coeur/src/web.rs`) ;
- [contrat.md](contrat.md), brouillon, avec ses vecteurs ;
- les fichiers de licence ;
- le site, dans `site/` : l'écran de la salle, le téléphone de l'apprenant
  et celui du formateur, branchés sur le cœur, en TypeScript, sans React,
  avec les pièces des maquettes ;
- un petit relais Nostr local pour les tests (`site/outils/relais.mjs`), qui
  vérifie chaque événement comme un vrai relais ;
- l'appel joué par Playwright (`site/tests/appel.mjs`) avec six appareils :
  l'ordinateur du formateur, son téléphone, et quatre apprenants. Léa signe,
  Yanis se trompe de code puis signe, Inès n'a pas de réseau et tend son QR,
  Noah est absent. Le formateur clôt. Les captures sont dans
  `site/captures/`, en planches.

Ce que le scénario vérifie, en plus du parcours :

- la salle ne montre aucun nom, à chaque étape ;
- un code faux est refusé avec une phrase, pas un code technique ;
- la feuille close se vérifie seule ;
- le relais accepte chaque événement signé par le cœur ;
- aucun nom ne passe en clair sur le relais ;
- les appareils ne contactent aucune autre adresse ;
- le premier chargement tient sous 300 Ko.

Ce qui est mesuré :

- le cœur pèse 116 Ko compressés, avec Nostr et le dessin des QR ;
- le premier chargement chez un apprenant fait 230 Ko compressés, dont 88
  Ko de polices : sous le plafond de 300 Ko ;
- l'interface pèse 6 Ko compressés, sans React ;
- le QR de la salle porte 26 caractères et fait 25 × 25 cases, au lieu des
  37 × 37 prévus : il se lira de plus loin. Celui d'un apprenant sans réseau
  porte 172 caractères.

Ce que les captures ont montré, et qui est corrigé : les lignes de la liste
du formateur étaient centrées et encadrées comme des boutons, et l'heure de
l'après-midi était mal lue, ce qui affichait « Après-midi » à 9 h.

Reste à faire :

1. lire un QR avec la caméra (`rqrr` et `getUserMedia`), essayé avec la
   caméra simulée de Chromium ;
2. annoncer l'appel ouvert sur le fil de la classe, pour que la barre de
   l'apprenant passe au marine ;
3. les relais publics, plusieurs à la fois ;
4. le texte agrandi à 200 %, la tablette et l'ordinateur du formateur ;
5. WebKit et Firefox ;
6. rejoindre une classe, à la place de la configuration posée par les
   tests.

## Lancer les tests

```sh
cd coeur
cargo test                                      # en Rust
cargo test --target wasm32-unknown-unknown      # compilés en WebAssembly, dans Chromium
```

Le second passe par `coeur/outils/navigateur.mjs` : le pilote Chrome de
l'environnement cloud n'a pas la même version que Chromium, alors le script
fait ouvrir la page des tests par Playwright. `NAVIGATEUR=firefox` ou
`NAVIGATEUR=webkit` choisit un autre moteur, une fois installé.

L'appel joué à six appareils :

```sh
cd maquettes && npm install && npm run style    # le matériel, une fois
cd ../site && npm install
npm run construire                              # le cœur, l'interface, et leur poids
npm run appel                                   # le scénario et ses captures
node outils/planches.mjs                        # les captures en planches
```

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

## Les choix du prototype, à valider

Le cœur a demandé des choix que la doc ne fixait pas. Ils sont dans le code,
et attendent l'avis du mainteneur
([questions-ouvertes.md](questions-ouvertes.md)) :

- le QR de la salle change toutes les dix secondes, et un code tapé reste
  bon une minute ;
- le QR de la salle ne porte que la séance, la fenêtre et le code. La
  séance se calcule des deux côtés avec la clé de la classe, sans rien
  échanger ;
- le secret de l'appel n'est révélé qu'à la clôture, dans la feuille. Avant,
  la feuille n'en porte que l'empreinte. Ensuite, n'importe qui peut
  revérifier chaque code avec la feuille seule ;
- une présence lue en face à face dans le QR d'un apprenant sans réseau est
  acceptée même si son code a plus d'une minute ;
- la feuille s'écrit en texte, une ligne par événement, et chaque ligne
  porte l'empreinte de la précédente.

## Ce qu'il tranche

- Le poids réel du site, face au plafond de 300 Ko compressés
  ([regles.md](regles.md), partie 7). `mesures/taille-coeur` en donne déjà
  une idée : 186 Ko pour le cœur seul.
- Les largeurs de 600 et 901 px, où l'on passe à deux puis à trois
  fenêtres.
- L'interface en TypeScript, avec React ou sans. Sans, elle pèse 6 Ko
  compressés pour trois interfaces : React n'a pas été nécessaire.
- La durée de validité du code de 6 chiffres, vue à l'écran. Le temps qu'il
  faut pour le taper dans une vraie salle se mesure sur place.

## Ce qui est venu avec le premier code

- Les fichiers de licence, MIT et Apache-2.0, à la racine.
- [contrat.md](contrat.md) : les formats, chacun avec ses vecteurs de test
  ([regles.md](regles.md), règle 10). Les clés de stockage viendront avec
  les écrans.

## Préparer un environnement neuf

- Rust 1.97 est installé dans l'environnement cloud. Il faut ajouter la
  cible et l'outil, à la version du crate `wasm-bindgen` :

  ```sh
  rustup target add wasm32-unknown-unknown
  cargo install wasm-bindgen-cli --version 0.2.130 --locked
  ```

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
