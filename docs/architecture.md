# Architecture

Rédigée le 15 novembre 2026. Les principes sont à valider par le mainteneur
avant de coder, et les outils à confirmer par un prototype. Les choix encore
ouverts sont dans [questions-ouvertes.md](questions-ouvertes.md).

## La demande

Le mainteneur, le 15 novembre 2026 : « J'aimerais une véritable app Rust,
mais aussi dispo sur le web. Fais attention à la compatibilité et à
l'évolutivité. »

Concrètement :

- une app installée sur l'ordinateur, écrite en Rust, qui garde ses données
  sur le disque, et plus tard la même sur téléphone ;
- un site où un apprenant rejoint sa classe depuis son téléphone, sans rien
  installer ;
- le site et l'app ne se contredisent jamais, une ancienne version comprend
  une nouvelle, et on peut ajouter l'émargement, les documents ou plusieurs
  classes sans tout réécrire.

## Le principe

Toutes les règles de l'app sont écrites une seule fois, en Rust, dans une
bibliothèque qu'on appelle le cœur (`opn-core`) : la classe, les rôles, les
messages, les demandes, le suivi, le chiffrement et les formats.

Le cœur sert à deux endroits :

- dans l'app pour ordinateur, faite avec Tauri, il tourne en Rust normal ;
- sur le site, le même code est compilé en WebAssembly, que tous les
  navigateurs savent exécuter depuis 2017.

L'écran est une page web (HTML, CSS et TypeScript), la même dans le
navigateur et dans la fenêtre de l'app.

```
            l'écran : une page web, style « Utilitaire 98 »
                  │                                │
          dans le navigateur                dans l'app Tauri
                  │                                │
    cœur Rust compilé en WebAssembly       cœur Rust natif
    stockage du navigateur                 SQLite sur le disque
    relais tant que la page est ouverte    relais même fenêtre fermée
```

Element, l'app de messagerie de Matrix, fait pareil pour son chiffrement : il
est écrit une fois en Rust et tourne dans l'app comme dans le navigateur.

OpenContact fait l'inverse. Son moteur est en JavaScript, et son app
installée (`natif/`) l'embarque. Dans Opn-Link, le moteur est en Rust et
c'est le site qui l'embarque.

## Les couches

| Couche | Son rôle | Ce qu'elle ne fait pas |
|---|---|---|
| Le cœur | les règles, le chiffrement, les formats, la fusion des données | le réseau, le disque, l'écran. Il reçoit des événements et répond par des décisions |
| Les adaptateurs, un par plateforme | le stockage, le réseau, l'horloge, les secrets | les décisions. Ils transportent |
| L'interface | les écrans | les règles. Elle demande au cœur |

L'interface appelle le cœur, jamais l'inverse, comme dans OpenContact (son
`CLAUDE.md`, partie 3). On peut donc tester tout le cœur sans navigateur ni
réseau, et le téléphone, plus tard, demandera seulement un adaptateur de
plus.

| | App pour ordinateur | Navigateur |
|---|---|---|
| Stockage | SQLite, sur le disque | IndexedDB |
| Relais Nostr | en Rust, même fenêtre fermée | le WebSocket du navigateur, tant que la page est ouverte |
| Secrets | le trousseau du système | le stockage du navigateur, chiffré si l'utilisateur met un code |
| Prévenir | une notification du système, tant que l'app tourne | l'écran « Aujourd'hui », à l'ouverture |

## Ce que fait le site, ce que fait l'app

On garde la règle d'OpenContact (son `CLAUDE.md`, partie 0) :

- tout ce qui peut marcher dans un navigateur est sur le site. C'est le cas
  de toute la première version ;
- l'app ajoute ce qu'un navigateur ne fait pas de façon sûre : prévenir quand
  un message arrive, garder des données pendant des années (l'émargement
  demandera 5 à 10 ans d'archives), les gros fichiers, les exports ;
- le site marche sans l'app ;
- ce qui n'existe que dans l'app n'apparaît pas sur le site, même grisé.

## Compatibilité

### Entre le site et l'app

Ils utilisent le même cœur, donc les mêmes formats. Les tests du cœur
tournent deux fois : en Rust normal et dans un navigateur.

### Avec OpenContact

Juste après la première version, l'apprenant enverra un résumé de sa recherche
depuis OpenContact. Plus tard, les deux apps partageront aussi une identité.
OpenContact est en JavaScript et Opn-Link en Rust, et ils doivent produire
exactement les mêmes octets.

Chaque format commun est donc décrit dans un contrat, comme le `CONTRAT.md`
d'OpenContact, avec des vecteurs de test : des entrées, et le résultat exact
attendu. Les deux apps doivent passer ces tests.

Un exemple de piège : OpenContact signe les rôles de ses groupes en ECDSA
P-256 avec WebCrypto, qui donne une signature brute de 64 octets. Beaucoup de
bibliothèques donnent par défaut un autre format, le DER. Sans ces tests,
chaque app rejetterait les signatures de l'autre sans qu'on sache pourquoi.

Les algorithmes qu'OpenContact utilise aujourd'hui existent tous en Rust pur,
dans les bibliothèques RustCrypto, qui marchent en natif comme en
WebAssembly :

| Usage dans OpenContact | Algorithme |
|---|---|
| Code d'un groupe → étiquette et clé | PBKDF2-SHA-256, 100 000 tours |
| Boîte aux lettres (une lettre pour une seule personne) | ECDH P-256 + HKDF-SHA-256 + AES-256-GCM, une clé jetable par lettre |
| Rôles d'un groupe (chef, adjoints) | ECDSA P-256 |
| Identité d'un appareil | Ed25519 |
| Événements sur les relais | Nostr (secp256k1) |

Le site d'Opn-Link est publié par l'organisation GitHub `opn-link`, donc à
une autre adresse qu'OpenContact. Sur la même adresse
(`mahi010110.github.io`), les deux apps partageraient le stockage du
navigateur. OpenContact, lui, ne doit pas changer d'adresse : ses
utilisateurs perdraient les données gardées dans leur navigateur.

### Entre les versions

Sans serveur, les mises à jour n'arrivent pas chez tout le monde en même
temps. Un apprenant peut garder une version vieille de trois mois quand son
formateur a la dernière. On suit donc ces règles :

1. Chaque message et chaque donnée enregistrée porte un numéro de version
   (`v`).
2. On ne renomme et on ne supprime jamais un champ, une clé ou un format. Si
   un format change, il prend une nouvelle version, et l'app continue de lire
   l'ancienne.
3. Une app garde intact ce qu'elle ne comprend pas. Une ancienne version ne
   détruit jamais ce qu'une nouvelle a écrit.
4. Un message d'une version plus récente s'affiche ainsi : « Mets à jour
   Opn-Link pour lire ce message ». Il n'est ni mal lu, ni supprimé.
5. Une nouvelle fonction n'empêche pas une ancienne version de faire ce
   qu'elle faisait.

### Avec les appareils

- Le site s'en tient à ce que les navigateurs savent tous faire depuis
  quelques années. Les tests passent sur Chromium, WebKit (le moteur de
  Safari) et Firefox. OpenContact n'avait jamais été testé sur Safari, et il
  s'est cassé sur iPhone.
- Safari peut effacer les données d'un site qu'on n'a pas ouvert depuis sept
  jours. Une app web ajoutée à l'écran d'accueil a son propre compteur, et
  rien ne s'efface tant qu'on s'en sert. Le site propose donc de l'ajouter à
  l'écran d'accueil, et une copie de secours comme dans OpenContact.
- Certains apprenants ont un vieux téléphone ou un téléphone d'occasion (voir
  `recherche/emargement/notes/douleurs_et_local_first.md`, partie 6). Le site
  doit rester léger, et être testé sur un petit téléphone.
- L'app pour ordinateur vise Windows 10 et 11, macOS et Linux. Sous Linux, la
  fenêtre de Tauri n'a pas WebRTC par défaut. Ce qui passe en direct entre
  appareils, comme les appels de la version 2, sera donc fait en Rust.

### Avec les autres projets

Le lab IA, OpenContact et Opn-Link pourront partager une identité par
personne (une paire de clés), des formats ouverts (les badges de compétences
au format Open Badges 3.0) et le même système de relais. Voir
[recherche/ecosysteme/identite_et_multijoueur.md](recherche/ecosysteme/identite_et_multijoueur.md),
parties 6 et 8.

## Le moins de données possible

Le mainteneur veut une app légère, qui garde le moins de données possible et
seulement ce qui compte (15 novembre 2026). Chaque donnée a donc une durée de
vie, écrite dans le contrat.

| Donnée | Durée |
|---|---|
| Une annonce | jusqu'à ce qu'un responsable la retire |
| Un message privé | tant que la classe existe |
| Les autres (demandes, suivi, fin d'une classe) | à fixer, voir [questions-ouvertes.md](questions-ouvertes.md) |

Les relais ne gardent rien plus de 30 jours. Ce qui dure plus longtemps vit
sur les appareils. Comment un apprenant qui arrive en cours d'année reçoit les
annonces plus anciennes : à régler au prototype.

## Évolutivité

- Le cœur est découpé par fonction : la classe, les messages, les demandes,
  le suivi, puis l'émargement, les documents et la doc partagée. Chaque
  fonction peut être cachée derrière un interrupteur, comme avec
  `ui/perimetre.js` dans OpenContact. On peut ainsi construire et tester la
  version 2 sans la montrer.
- Le transport est séparé du reste. Aujourd'hui, ce sont les relais Nostr.
  Plus tard, on pourra passer en direct sur le Wi-Fi de la classe, ou faire
  de l'app du formateur un relais pour sa classe, sans toucher aux règles.
- Le stockage aussi : SQLite ou IndexedDB, avec les migrations faites à la
  lecture.
- Toutes les données sont rangées par classe, avec un identifiant. On peut
  être dans plusieurs classes dès la première version, et gérer tout un
  centre (version 3) ne demandera pas de tout reprendre.
- Les formats seront décrits et testés dans `contrat.md`, créé en même temps
  que le code.
- La licence est libre dès le début (MIT ou Apache-2.0), pour que d'autres
  puissent participer.

## Les risques à tester tôt

- Le Wi-Fi des centres de formation bloque souvent les connexions directes
  entre appareils (voir
  [identite_et_multijoueur.md](recherche/ecosysteme/identite_et_multijoueur.md),
  partie 2). La première version passe donc par les relais, et doit être
  essayée dans une vraie classe le plus tôt possible.
- Tous les téléphones d'un centre sortent par la même adresse Internet, et
  les relais publics peuvent limiter ce trafic.
- Un message sur un relais fait au plus 64 Ko environ, et reste 30 jours au
  maximum. Seuls les petits fichiers passent, et l'historique est gardé sur
  les appareils.
- Avant 15 ans, il faut l'accord des parents. Ce qui part sur des relais
  publics est presque impossible à effacer.
- Le fichier WebAssembly peut être lourd au premier chargement. À mesurer.
- Publier chez Apple coûte 99 $ par an, pour signer l'app macOS et publier
  sur iOS. La signature de l'app Windows est gratuite pour un projet sous
  licence libre, avec la SignPath Foundation. Linux ne coûte rien. En
  attendant les apps de store, les téléphones passent par le site.

## Les outils envisagés

À confirmer avec un petit prototype au début du code.

| Partie | Outil |
|---|---|
| App pour ordinateur | Tauri 2, comme le lab IA et l'app native d'OpenContact |
| Cœur sur le web | compilation en WebAssembly (`wasm-bindgen`) |
| Chiffrement | RustCrypto (`p256`, `aes-gcm`, `hkdf`, `pbkdf2`, `sha2`, `ed25519-dalek`) |
| Relais Nostr | `rust-nostr`, qui annonce marcher en natif et dans le navigateur (à vérifier) |
| Stockage | SQLite (`rusqlite`) dans l'app, IndexedDB dans le navigateur |
| Interface | HTML, CSS et TypeScript, avec le style du kit d'OpenContact. Avec ou sans React : au prototype |
| Tests | `cargo test` en natif, `wasm-bindgen-test` dans un navigateur, Playwright sur Chromium, WebKit et Firefox |
