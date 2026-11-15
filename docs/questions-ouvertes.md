# Questions ouvertes

Le 15 novembre 2026, toutes les questions de produit ont été tranchées. Les
décisions sont dans [carnet.md](carnet.md) et reportées dans
[projet.md](projet.md), [ux.md](ux.md) et [architecture.md](architecture.md).

Ce qui reste ne se décide pas : ça se mesure. Aucun de ces points ne change
les écrans, donc les maquettes peuvent commencer. Ils changent le code, et se
mesurent au début du code, ou avant si le mainteneur le veut.

## À mesurer

- Le nombre maximum de classes. Chaque classe ajoute des abonnements sur les
  relais. Une dizaine semble un bon point de départ.
- Les relais : lesquels portent vraiment les messages et la boîte aux
  lettres, en Europe d'abord. OpenContact a déjà les sondes pour ça.
- La limite des relais quand tous les téléphones d'un centre sortent par la
  même adresse Internet.
- Le Wi-Fi d'un vrai centre : ce qu'il bloque.
- Le scan du QR par la caméra, depuis le site, sur iPhone et sur de vieux
  Android, aussi quand le site est ajouté à l'écran d'accueil.
- Le poids du site avec le cœur en WebAssembly, au premier chargement.
- `rust-nostr` dans le navigateur.
- Les serveurs Blossom publics : lesquels acceptent un fichier sans compte, et
  combien de temps ils le gardent.
- OpenTimestamps depuis le navigateur : l'accès à ses serveurs, et le délai
  avant que la preuve soit complète.
- La signature PAdES d'un PDF, et la lecture des cases de signature d'un PDF
  existant, en Rust et en WebAssembly.

## À faire

- Créer l'organisation GitHub `opn-link`. C'est gratuit, et c'est au
  mainteneur de le faire depuis son compte. Le nom avait l'air libre le
  15 novembre 2026. L'adresse exacte du site (`opn-link.github.io`, avec ou
  sans chemin) se réglera au premier déploiement.
- Vérifier que le nom est libre ailleurs : nom de domaine, INPI. Des noms
  proches comme « OpenLink » existent déjà.
- Trouver un formateur et une classe pour tester tôt.
- Faire valider la feuille de présence exportée par deux ou trois OPCO et un
  certificateur Qualiopi avant qu'un centre compte dessus pour être payé.
- Ajouter les fichiers de licence (MIT et Apache-2.0) avec le premier commit
  de code.
- Quand on fera le lien avec OpenContact, écrire dans son `CLAUDE.md` et son
  `CONTRAT.md` les deux nouveautés : le résumé envoyé aux responsables, et
  l'amitié automatique entre apprenants d'une même classe.
