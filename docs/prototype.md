# Le prototype

Proposé par Fable 5 le 16 novembre 2026, une fois les maquettes et les
règles validées. Le mainteneur a donné son feu vert le même jour (« En
attendant tu peux commencer toi même »). Le travail se fait sur une branche,
et n'arrive sur `main` qu'avec son accord.

## Reprendre le travail

Pour une nouvelle discussion, dans un conteneur neuf.

1. Partir de `main`, et travailler sur la branche que donne la session.
2. Préparer les outils. Le script de démarrage de l'environnement « OpenContact
   et Opn-Link » le fait tout seul, s'il est enregistré. Sinon, depuis le
   dossier qui contient `opn-link` et `Open-Contact` :

   ```sh
   rustup target add wasm32-unknown-unknown
   cargo install wasm-bindgen-cli --version 0.2.130 --locked
   (cd opn-link/maquettes && npm install && npm run style)
   (cd opn-link/site && npm install)
   ```

   `npm run style` prend le matériel dans le dépôt d'OpenContact posé à côté.
   Si son clone est trop court pour la version voulue (`VERSION_OC` dans
   `maquettes/outils/prendre-style.mjs`) : `git -C Open-Contact fetch
   --depth=1 origin <version>`.
3. Vérifier que tout passe, comme le 16 novembre 2026 :
   - `cd coeur && cargo test` : 38 tests ;
   - `cargo test --target wasm32-unknown-unknown` : les mêmes, dans
     Chromium ;
   - `cd ../site && npm run construire && npm run appel` : le scénario,
     sans aucun échec ;
   - `node outils/planches.mjs` : les captures en planches, à regarder.
4. Reprendre la suite, dans l'ordre de « La suite » plus bas. Les
   questions qui attendent le mainteneur sont dans
   [questions-ouvertes.md](questions-ouvertes.md), partie « Le prototype ».

Deux choses à savoir :

- Pousser sur `main` demande l'accord explicite du mainteneur, à chaque
  fois. La session le bloque sinon.
- Seul Chromium est installé. Le pilote Chrome de l'environnement n'a pas la
  version de Chromium : les tests du cœur dans le navigateur passent par
  `coeur/outils/navigateur.mjs`, et télécharger un autre pilote a été
  refusé.

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

## La suite : la première version complète

Le mainteneur ne veut ni bêta ni essai avec une classe (17 novembre 2026) :
on construit directement la première version complète
([projet.md](projet.md), partie 5), dans cet ordre.

1. Rejoindre une classe et être accepté, les responsables et les réglages.
2. L'appel complet : la caméra, l'appel annoncé sur le fil de la classe, les
   relais publics, l'écran d'entrée de chacun.
3. Les annonces et les messages privés.
4. Les absences, et la page du tuteur.
5. Les documents à signer, la feuille exportée en PDF et le registre
   public.
6. Les demandes suivies et la documentation partagée.
7. Le suivi de la recherche et le tableau de bord, dans l'app pour
   ordinateur.
8. Plusieurs appareils et la phrase de secours.
9. Fermer la classe.

Chaque morceau se livre comme l'appel : le cœur et ses tests, puis les
écrans des maquettes, puis le scénario joué à plusieurs appareils et ses
captures, montrées au mainteneur avant `main`.

À chaque morceau : le texte agrandi à 200 %, la tablette et l'ordinateur, et
WebKit et Firefox dès qu'ils sont installés. La caméra s'essaie avec la
caméra simulée de Chromium.

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
- La durée de validité du code de 6 chiffres, vue à l'écran : une minute.

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
