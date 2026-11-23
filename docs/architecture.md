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
  une nouvelle, et on peut ajouter des fonctions ou tout un centre sans tout
  réécrire.

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
| Secrets | le trousseau du système | des clés WebCrypto non exportables, que la page ne peut pas lire |
| Prévenir | une notification du système, tant que l'app tourne | l'écran « Aujourd'hui », à l'ouverture |

## Ce que fait le site, ce que fait l'app

On garde la règle d'OpenContact (son `CLAUDE.md`, partie 0) :

- tout ce qui peut marcher dans un navigateur est sur le site. C'est le cas
  de presque toute la première version. Sur le site, le centre exporte ses
  feuilles de présence et ses documents signés en fichiers, qu'il range
  lui-même ;
- l'app ajoute ce qu'un navigateur ne fait pas de façon sûre : prévenir quand
  un message arrive, garder des données pendant des années (les feuilles de
  présence et les documents signés, de 5 à 10 ans), les gros fichiers, les
  exports ;
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

## Les clés

Décidé le 15 novembre 2026. Le mainteneur a laissé le choix : « les
meilleurs ».

- P-256 pour chiffrer et pour signer, avec deux clés séparées : une pour la
  boîte aux lettres (ECDH), une pour signer (ECDSA). Ce sont les mêmes
  familles de clés qu'OpenContact.
- Des clés jetables secp256k1 pour signer les événements Nostr, comme dans
  OpenContact : un relais ne peut pas relier deux messages à la même
  personne.
- Opn-Link sait aussi lire Ed25519, qu'OpenContact utilise pour ses
  appareils, si le lien avec OpenContact en a besoin.

Pourquoi P-256 :

- OpenContact l'utilise déjà pour sa boîte aux lettres et pour les rôles de
  ses groupes, donc les deux apps se comprennent sans traduction ;
- les lecteurs de PDF signés (Adobe et les autres) savent vérifier une
  signature sur cette courbe, ce qui compte pour la feuille de présence et
  les documents signés ;
- les portefeuilles d'identité européens s'appuient sur la même courbe, ce
  qui laisse la porte ouverte à une signature qualifiée plus tard ;
- sur le site, le navigateur peut garder la clé sans jamais la donner à la
  page (une clé « non exportable » de WebCrypto). Le cœur demande alors à
  l'adaptateur de signer.

## Les responsables

Décidé le 23 novembre 2026, sur la recommandation de
[questions-ouvertes.md](questions-ouvertes.md) (« Ok go, continue »).

- La porte de la classe, signée par le chef, dit qui sont les responsables :
  le chef en premier, puis les adjoints. Nommer un adjoint, c'est signer une
  nouvelle porte qui le compte.
- Le chef passe la main par une passation qu'il signe seul. Le nouveau chef
  signe aussitôt une porte où il est en premier. Chaque appareil suit les
  passations depuis le chef qu'il connaît : un apprenant qui a rejoint avec
  l'ancien lien retrouve le chef actuel.
- Les responsables partagent l'état de la classe par des lettres signées,
  dans leurs boîtes. Leurs boîtes sont dans la porte, que tout apprenant peut
  lire : sans signature, un apprenant pourrait écrire à leur place.
- L'adjoint entre par une invitation que le chef montre ou envoie, avec un
  jeton tiré pour elle, puis le chef accepte sa demande.
- Les adjoints d'OpenContact, ses lettres `adjoint` signées entre membres
  d'un groupe, ne sont pas repris. Le lien avec OpenContact passe par le
  résumé envoyé aux responsables.

Les formats sont dans [contrat.md](contrat.md), parties « La porte », « La
passation » et « La lettre entre responsables ».

## La preuve d'une présence ou d'une signature

La recherche dit ce qu'il faut pour qu'une feuille de présence ou un document
signé tienne lors d'un contrôle. Voici comment Opn-Link le fait.

- Qui a signé : la clé de l'appareil de l'apprenant. Quand le centre le
  demande, le formateur a validé cette clé en face à face, pièce d'identité à
  l'appui, et sa validation est signée. Un seul appareil par apprenant signe
  la présence : celui qu'un responsable a accepté. Un appareil relié n'a pas
  ce droit, et la phrase de secours le fait passer au nouveau téléphone.
- Quand : la signature contient le code du QR, qui change toutes les quelques
  secondes et que l'appareil du formateur a affiché à un moment connu. À la
  clôture, l'empreinte de la feuille part vers OpenTimestamps, un registre
  public gratuit, qui prouve qu'elle existait à cette date.
- Rien n'a changé : chaque signature, chaque contreseing et chaque correction
  entre dans un journal où l'on peut seulement ajouter, et chaque ligne
  contient l'empreinte de la précédente. Ce journal est gardé chez le centre,
  le formateur et l'apprenant. Un appareil perdu n'efface pas la preuve, et
  une modification se voit.
- Pas de rattrapage : après la clôture, aucune signature n'entre plus, sauf
  une correction du formateur, qui reste dans le journal.
- Lisible par un contrôleur : l'export est un PDF/A signé (PAdES), avec un
  paquet de preuve (le journal, les clés publiques, les vérifications
  d'identité, les preuves OpenTimestamps) et une notice qui explique comment
  tout vérifier.

Ce que les mesures ont montré :

- un navigateur peut déposer l'empreinte chez OpenTimestamps, mais pas
  relire la preuve complète. C'est l'app pour ordinateur qui complète les
  preuves, en général dans l'heure qui suit. Celui qui vérifie peut aussi le
  faire lui-même avec l'outil `ots` ;
- le sceau PAdES se fait avec la bibliothèque underskrift et notre propre
  signataire. Le sien, en version 0.1.4, hache deux fois l'empreinte et rend
  une signature fausse. Le nôtre signe l'empreinte telle quelle, et c'est
  aussi lui qui permet de garder la clé dans le trousseau du système ou dans
  le navigateur.

## Ce qui ne passe pas par le fil de la classe

- Le tuteur ne reçoit pas le code de la classe, qui ouvrirait les annonces.
  Il a sa propre clé, et les responsables lui envoient par sa boîte aux
  lettres seulement les présences et les absences de ses apprentis.
- Le mail préparé pour l'entreprise est un lien `mailto:`. Il s'ouvre dans la
  messagerie du responsable, et Opn-Link n'envoie rien lui-même.
- Un justificatif médical part dans la boîte aux lettres des seuls
  responsables. Il expire au bout de 7 jours sur les relais. Quand un
  responsable l'a reçu, son app le dit à celle de l'apprenant, qui l'efface.

## Les gros fichiers

Les serveurs Blossom gratuits ont été mesurés le 15 novembre 2026 : tous
refusent un fichier chiffré ([mesures.md](mesures.md)). Un fichier passe donc
ainsi :

- jusqu'à 1 Mo, chiffré, en morceaux de 45 Ko par les relais, répartis entre
  plusieurs relais. Les photos sont compressées avant l'envoi. Un fichier de
  1 Mo a fait l'aller-retour en 2 à 20 secondes sur trois relais sur quatre ;
- quand les deux appareils sont connectés en même temps, en direct, sans
  limite de taille ;
- au-delà, un lien vers l'espace où le centre range déjà ses fichiers.

Un relais a refusé toutes nos signatures juste après un envoi de 1 Mo. C'est
pour ça que les morceaux se répartissent, et que l'app écarte un relais qui
refuse.

## Les relais par défaut

Mesurés quatre fois le 15 novembre 2026 ([mesures.md](mesures.md)) :

1. nostr.sathoarder.com (France) ;
2. nos.lol (Allemagne) ;
3. nostr-relay.corb.net (États-Unis), en secours ;
4. nostr-01.yakihonne.com (Singapour), en secours.

Tout est chiffré de bout en bout, les relais ne voient que du bruit. Comme
dans OpenContact, l'utilisateur peut changer la liste, et l'app écarte
d'elle-même, sur l'appareil, un relais qui refuse ses messages. La liste se
remesure avec `mesures/sonde-relais.mjs`.

## Nostr, écrit à la main

La bibliothèque rust-nostr se compile pour le navigateur, mais elle ajoute
1,2 Mo au site, surtout des tables Unicode dont Opn-Link n'a pas besoin
(mesuré). Opn-Link n'utilise que trois choses de Nostr : signer un événement,
l'envoyer à un relais, lire ceux qui portent une étiquette. Il les écrit
lui-même, avec la bibliothèque k256, pour 22 Ko de plus.

## Le moins de données possible

Le mainteneur veut une app légère, qui garde le moins de données possible et
seulement ce qui compte (15 novembre 2026). Chaque donnée a donc une durée de
vie, écrite dans le contrat.

| Donnée | Durée |
|---|---|
| Une annonce | jusqu'à ce qu'un responsable la retire, au plus jusqu'à la fermeture de la classe |
| Un message privé, une demande, le suivi, la documentation | jusqu'à la fermeture de la classe |
| Une feuille de présence, un document signé | chez le centre (ou le chef), de 5 à 10 ans ; chez les autres, jusqu'à la fermeture de la classe |
| Un justificatif médical | au plus 7 jours sur les relais, effacé du téléphone de l'apprenant une fois reçu ; chez les responsables, jusqu'à la fermeture de la classe |
| L'adresse du tuteur | jusqu'à la fermeture de la classe |
| Un fichier en morceaux sur les relais | 30 jours au plus sur les relais ; sur les appareils, jusqu'à la fermeture de la classe |
| Une classe | fermée par le chef, ou toute seule après 6 mois sans activité ; ensuite, 30 jours pour télécharger ses documents, puis tout s'efface |

Les relais ne gardent rien plus de 30 jours. Ce qui dure plus longtemps vit
sur les appareils, et les archives du centre vivent dans son app pour
ordinateur et dans les fichiers qu'il exporte. Comment un apprenant qui
arrive en cours d'année reçoit les annonces plus anciennes : à régler au
prototype.

## Évolutivité

- Le cœur est découpé par fonction : la classe, les annonces, les messages,
  la présence, les documents, les demandes, la documentation, le suivi. Chaque
  fonction peut être cachée derrière un interrupteur, comme avec
  `ui/perimetre.js` dans OpenContact. On peut ainsi construire et tester une
  fonction sans la montrer.
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

## Les risques

Sans bêta ni essai avant la sortie (17 novembre 2026), ceux qui dépendent
d'un vrai centre se découvriront à la première vraie utilisation.

- Le Wi-Fi des centres de formation bloque souvent les connexions directes
  entre appareils (voir
  [identite_et_multijoueur.md](recherche/ecosysteme/identite_et_multijoueur.md),
  partie 2). La première version passe donc par les relais, et l'appel a sa
  solution par QR.
- Tous les téléphones d'un centre sortent par la même adresse Internet, et
  les relais publics peuvent limiter ce trafic.
- Un message sur un relais fait au plus 64 Ko environ, et reste 30 jours au
  maximum. Seuls les petits fichiers passent, et l'historique est gardé sur
  les appareils.
- Avant 15 ans, il faut l'accord des parents. Ce qui part sur des relais
  publics est presque impossible à effacer.
- Le poids du site : 186 Ko compressés de WebAssembly pour un apprenant, 486
  Ko pour un responsable qui travaille sur les PDF (mesuré).
- La caméra d'un site ajouté à l'écran d'accueil d'un iPhone a des bugs
  connus jusqu'en 2025. Un code de 6 chiffres sous le QR sert de secours. À
  vérifier sur de vrais iPhone et de vieux Android.
- La feuille de présence exportée doit être acceptée par les financeurs. La
  recherche conseille de la faire valider par deux ou trois OPCO et un
  certificateur Qualiopi avant qu'un centre compte dessus pour être payé.
- Les justificatifs médicaux passent par les relais, chiffrés, par choix du
  mainteneur. La loi sur l'hébergement des données de santé (HDS) n'est pas
  tranchée pour des relais qui ne voient que du chiffré.
- Un relais peut bloquer quelques minutes toute une adresse après un gros
  envoi (mesuré sur nostr.data.haus). Derrière la box d'un centre, c'est tout
  le centre qui serait bloqué sur ce relais : d'où les morceaux répartis, et le
  relais écarté dès qu'il refuse.
- La bibliothèque underskrift (0.1.4) signe mal en ECDSA : on lui donne notre
  propre signataire. Le bug peut être signalé à ses auteurs.
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
| Relais Nostr | écrit à la main avec `k256` ; `rust-nostr` ajoute 1,2 Mo au site (mesuré) |
| Stockage | SQLite (`rusqlite`) dans l'app, IndexedDB dans le navigateur |
| PDF | `lopdf` pour lire un PDF, trouver ses cases de signature et ajouter une page ; `underskrift` avec notre signataire pour le sceau PAdES (mesuré) |
| Date des feuilles | OpenTimestamps, un registre public gratuit |
| Gros fichiers | en morceaux par les relais jusqu'à 1 Mo, en direct entre deux appareils, sinon un lien |
| QR | `qrcode` pour les créer, `rqrr` pour les lire. Le prototype prend `quircs` : `rqrr` pèse 85 Ko de plus (mesuré le 17 novembre 2026, à valider) |
| Mail à l'entreprise | un lien `mailto:` |
| Interface | HTML, CSS et TypeScript, avec le style du kit d'OpenContact. Sans React au prototype : 6 Ko compressés pour trois interfaces |
| Tests | `cargo test` en natif, `wasm-bindgen-test` dans un navigateur ouvert par Playwright (essayé au prototype, dans Chromium), Playwright sur Chromium, WebKit et Firefox |
