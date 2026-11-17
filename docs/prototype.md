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
3. Vérifier que tout passe, comme le 17 novembre 2026 :
   - `cd coeur && cargo test` : 48 tests ;
   - `cargo test --target wasm32-unknown-unknown` : les mêmes, dans
     Chromium ;
   - `cd ../site && npm run verifier && npm run construire && npm run
     classe` : les types de l'interface, puis le scénario, sans aucun
     échec ;
   - `node outils/planches.mjs` : les captures en planches, à regarder.
4. Reprendre la suite, dans l'ordre de « La suite » plus bas. Les
   questions qui attendent le mainteneur sont dans
   [questions-ouvertes.md](questions-ouvertes.md), partie « Le prototype ».

Trois choses à savoir :

- Le travail avance sur la branche `claude/design-navigation-concept-4c4fzs`
  avant d'arriver sur `main`. Si elle a des commits que `main` n'a pas,
  demander au mainteneur de les fusionner avant de reprendre.
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
- l'appel joué par Playwright avec six appareils (ce scénario est devenu
  `site/tests/classe.mjs` le 17 novembre) :
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

Fait le 17 novembre 2026, le premier morceau de la première version,
rejoindre une classe :

- dans le cœur : la porte de la classe, la demande d'entrée signée par
  l'appareil de l'apprenant, l'acceptation en texte, le secret du fil, et
  leurs vecteurs. 48 tests, en Rust et dans Chromium ;
- sur le site : créer une classe (le lien d'entrée `#creer`), inviter (le QR,
  qui est un lien, le code, « Montrer à la salle », « Envoyer le lien »),
  rejoindre par le lien ou en tapant le code, attendre d'être accepté,
  accepter en décochant ceux qu'on laisse dehors, voir les membres. L'écran
  de la salle montre le QR de la classe et combien ont rejoint ;
- l'état de chaque appareil (ses clés, ses classes) remplace la
  configuration que posaient les tests. L'appel se fait avec les vrais
  membres ;
- TypeScript vérifie les types de l'interface (`npm run verifier`) ;
- le scénario `site/tests/classe.mjs` remplace celui de l'appel seul. Awa
  crée la classe et l'invite à la salle. Léa, Inès, Noah et Kevin ouvrent le
  lien, Yanis tape le code, d'abord de travers. Awa accepte tout le monde
  sauf Kevin. Puis l'appel, comme avant. Le réseau revenu, Inès reçoit la
  réponse du formateur.

Ce que ce scénario vérifie en plus :

- le lien du QR de la classe reste court (96 caractères), et il ouvre la
  classe déjà affichée ;
- un code de classe faux et une heure illisible sont refusés avec une
  phrase, sous le champ, et seul le champ fautif est marqué ;
- Kevin, laissé dehors, ne reçoit rien : ni réponse, ni secret du fil, et il
  n'est pas sur la feuille ;
- ni un nom, ni le nom de la classe ne passent en clair sur le relais.

Mesuré le 17 novembre 2026 : le cœur pèse 128 Ko compressés, l'interface
11 Ko, et le premier chargement chez un apprenant 248 Ko, dont 88 Ko de
polices. C'est sous le plafond de 300 Ko.

Ce que les captures et le scénario ont montré, et qui est corrigé : le
champ d'heure de Chromium affichait « 01:30 » pour 13 h 30, il est remplacé
par un champ de texte qui lit « 9 h 30 » comme « 930 » ; et le code de la
classe était gardé sous deux formes, si bien que le formateur ne voyait pas
les demandes.

## La suite : la première version complète

Le mainteneur ne veut ni bêta ni essai avec une classe (17 novembre 2026) :
on construit directement la première version complète
([projet.md](projet.md), partie 5), dans cet ordre.

1. Rejoindre une classe et être accepté, les responsables et les réglages.
   Fait en partie le 17 novembre 2026 : créer, inviter, rejoindre, accepter,
   les membres. Reste : nommer un adjoint et passer la main, les réglages du
   chef, corriger son nom, plusieurs classes et « Mes cours », l'ajout à
   l'écran d'accueil de l'iPhone, refaire l'invitation.
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

La classe jouée de bout en bout, à huit appareils :

```sh
cd maquettes && npm install && npm run style    # le matériel, une fois
cd ../site && npm install
npm run verifier                                # les types de l'interface
npm run construire                              # le cœur, l'interface, et leur poids
npm run classe                                  # le scénario et ses captures
node outils/planches.mjs                        # les captures en planches
```

## Le plan de départ : l'appel, de bout en bout

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

Pour rejoindre une classe (17 novembre 2026) :

- le code de la classe n'ouvre que sa porte : il permet de trouver la classe
  et de demander à entrer. Le fil a son propre secret, remis à l'apprenant
  accepté. Une photo du QR de la salle ne suffit pas pour lire les annonces ;
- une demande laissée dehors ne reçoit pas de réponse, comme dans
  OpenContact. L'apprenant peut dire « Ce n'est pas ma classe » ;
- « Créer une classe » demande aussi le prénom et le nom du formateur, la
  première fois : la maquette ne les avait pas ;
- sur le site, on crée une classe par le lien d'entrée `#creer`. Le lien
  d'entrée fixe le rôle ;
- tant que la caméra n'est pas là, l'écran sans classe n'a pas de touche :
  on vise le QR avec l'appareil photo du téléphone, ou on tape le code ;
- une classe sans apprenant a pour touche « Inviter des apprenants » ;
- les heures se tapent comme du texte, « 9 h 30 », plutôt qu'avec le champ
  d'heure du téléphone, dont l'affichage change d'un appareil à l'autre ;
- en attendant « relier un appareil », le téléphone et l'ordinateur du
  formateur ont les mêmes clés. C'est ainsi que l'ordinateur reçoit l'état de
  la classe et montre la salle.

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
