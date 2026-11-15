# Les mesures du 15 novembre 2026

Faites avant les maquettes, à la demande du mainteneur : « je veux tout
savoir avant les maquettes ». Les sondes sont dans `mesures/` et se relancent
(voir [../mesures/README.md](../mesures/README.md)). Les chiffres bruts sont
dans `mesures/resultats/`.

Une mesure vaut pour le jour où elle a été faite. Les relais publics changent,
il faut les remesurer de temps en temps, comme dans OpenContact.

## Les relais Nostr

Les 7 relais par défaut d'OpenContact, mesurés quatre fois dans
l'après-midi. Pour chacun : écrire un message, le relire depuis une autre
connexion, la taille maximum d'un message, 20 messages d'un coup, et 30
téléphones qui signent en même temps depuis la même adresse Internet, comme
une classe derrière la box d'un centre. Le pays vient de l'adresse IP du
relais (base GeoLite, par le service du RIPE).

| Relais | Pays | Écrit et relu | Taille max | Classe de 30 | Verdict |
|---|---|---|---|---|---|
| nostr.sathoarder.com | France | 4 fois sur 4 | 60 Ko | 30 sur 30 | fiable |
| nos.lol | Allemagne | 4 sur 4 | 60 Ko | 30 sur 30 | fiable |
| nostr-relay.corb.net | États-Unis | 4 sur 4 | 200 Ko | 30 sur 30 | fiable |
| nostr-01.yakihonne.com | Singapour | 4 sur 4 | 60 Ko | 30 sur 30 | fiable |
| nostr.data.haus | Allemagne | 2 sur 4 | 60 Ko | 0 à 30 | instable |
| bucket.coracle.social | États-Unis | 3 sur 4 | 60 Ko | 20 à 30 | instable |
| relay.froth.zone | Finlande | 0 sur 4 | aucune | 0 | en panne |

- Les relais fiables acceptent aussi 20 messages envoyés d'un coup.
- La limite de 60 Ko vient des relais strfry, qui refusent un événement de plus
  de 64 Ko (« event too large »).
- nostr.data.haus a cessé de rendre nos messages, puis a refusé toutes les
  signatures de notre adresse, juste après l'envoi d'un fichier de 1 Mo.
  Quelques minutes plus tard, il acceptait de nouveau les signatures, sans
  toujours rendre ce qu'il avait reçu.
- bucket.coracle.social échoue par moments à ouvrir la connexion.
- relay.froth.zone répond, mais refuse toute écriture (« relay experienced an
  error »).

Ce qu'on en tire :

- les relais par défaut d'Opn-Link sont nostr.sathoarder.com et nos.lol, en
  Europe, puis nostr-relay.corb.net et nostr-01.yakihonne.com en secours
  (décidé le 15 novembre 2026) ;
- une classe entière qui signe en même temps depuis la même adresse passe ;
- comme OpenContact, l'app écarte d'elle-même un relais qui refuse ses
  messages.

## Les gros fichiers

Quatre serveurs Blossom, en déposant un fichier chiffré de 600 Ko puis de
2 Mo :

| Serveur | Réponse |
|---|---|
| blossom.primal.net | refusé, type de fichier non accepté |
| cdn.nostrcheck.me | refusé, type de fichier non reconnu |
| cdn.satellite.earth | refusé, il faut un abonnement |
| blossom.band | refusé, type non accepté, offre payante proposée |

Ce sont des hébergeurs d'images et de vidéos. Ils regardent le type du
fichier, et un fichier chiffré n'en a pas. La liste publique des serveurs
(blossomservers.com) ne se lit qu'avec un navigateur, les autres n'ont pas été
testés.

Par les relais, un fichier chiffré de 1 Mo découpé en 23 morceaux :

| Relais | Envoi | Relecture |
|---|---|---|
| nostr-relay.corb.net | 23 sur 23, en 2 s | identique, en 0,1 s |
| nostr.sathoarder.com | 23 sur 23, en 20 s | identique, en 0,9 s |
| nos.lol | 23 sur 23, en 6,5 s | identique, en 0,8 s |
| nostr.data.haus | 20 sur 23, puis plus de réponse | rien |

Ce qu'on en tire (décidé le 15 novembre 2026, le mainteneur a laissé le
choix) :

- jusqu'à 1 Mo, un fichier passe par les relais, en morceaux répartis entre
  plusieurs relais, et les photos sont compressées avant l'envoi ;
- quand les deux appareils sont connectés en même temps, le fichier passe en
  direct, sans limite ;
- au-delà, un lien vers l'espace où le centre range ses fichiers ;
- les hébergeurs gratuits sans compte (0x0.st, catbox) n'ont pas été retenus :
  ils sont tenus par des particuliers et peuvent fermer ou changer leurs
  règles du jour au lendemain.

## La date des feuilles (OpenTimestamps)

- Dépôt d'une empreinte : les 4 serveurs testés répondent, en 0,9 à 1,9 s. Leur
  réponse autorise n'importe quel site à la lire, donc un navigateur peut
  déposer. Il doit envoyer une requête simple : les serveurs ne répondent pas
  aux pré-vérifications des navigateurs.
- Une preuve en attente pèse 584 octets.
- Déposée à 17 h 56 (heure de Paris), la preuve avait sa transaction Bitcoin à
  18 h 15, et elle était complète au contrôle de 19 h 06, dans les blocs
  975993 et 975994. La preuve complète pèse 2,4 Ko.
- Pour compléter une preuve, il faut relire les serveurs, et cette réponse-là
  n'autorise pas les autres sites : un navigateur ne peut pas le faire. C'est
  l'app pour ordinateur qui complète les preuves. Celui qui vérifie peut aussi
  le faire lui-même, avec l'outil `ots`.

## Le poids du cœur dans le navigateur

Compilé en WebAssembly, optimisé pour la taille, puis compressé (gzip) :

| Ce que contient le cœur | Poids compressé |
|---|---|
| le chiffrement (P-256, AES-GCM, HKDF, PBKDF2) | 56 Ko |
| + la signature des événements Nostr, écrite à la main avec k256 | 78 Ko |
| + la bibliothèque Nostr complète (rust-nostr) | 1 279 Ko |
| + la création et la lecture des QR | 163 Ko |
| le téléphone d'un apprenant (chiffrement, Nostr à la main, QR) | 186 Ko |
| + le travail sur les PDF (lopdf), pour les responsables | 486 Ko |

Ce qu'on en tire :

- rust-nostr se compile pour le navigateur, à condition de lui donner une
  horloge, mais il ajoute 1,2 Mo, surtout des tables Unicode pour lire les
  adresses web. Opn-Link écrit lui-même le peu de Nostr dont il a besoin
  (signer, envoyer, lire), avec k256 ;
- le travail sur les PDF ne se charge que chez les responsables.

## Les QR codes

Mesurés sur un ordinateur, avec une correction d'erreur moyenne et un contenu
réaliste :

| QR | Contenu | Taille | Relu en |
|---|---|---|---|
| l'appel (classe, séance, code, heure) | 64 caractères | 37 × 37 cases | 7 ms |
| la signature sans réseau | 172 caractères | 53 × 53 cases | 12 ms |
| l'invitation à une classe | 163 caractères | 53 × 53 cases | 12 ms |

Le QR de l'appel reste lisible projeté au fond d'une salle. Un téléphone lira
plus lentement qu'un ordinateur, mais la marge est large.

## Les PDF

Sur une convention fictive faite avec un autre outil (pyHanko), qui contient
une case de signature vide :

- Opn-Link trouve la case (son nom, sa page, son cadre) avec lopdf, y pose le
  dessin, et ajoute une page de signature. Les accents s'affichent bien.
- Le sceau PAdES, signé en ECDSA P-256, est fait avec la bibliothèque
  underskrift. Sa version 0.1.4 a un bug : elle hache une seconde fois
  l'empreinte avant de signer en ECDSA, et la signature ne se vérifie pas.
  pyHanko et OpenSSL l'ont refusée tous les deux.
- Avec notre propre signataire, une vingtaine de lignes qui signent
  l'empreinte telle quelle, le sceau est accepté par pyHanko (intact, valide,
  couvre tout le fichier, format PAdES) et par OpenSSL.
- Ce même signataire permet de signer avec une clé qui ne quitte jamais le
  trousseau du système ou le navigateur.
- Le document scellé est dans `mesures/resultats/convention-scellee.pdf`.

## Trouvé par recherche, à vérifier sur un vrai iPhone

- La caméra d'un site ajouté à l'écran d'accueil d'un iPhone a des bugs
  signalés de 2019 à 2025 : image figée, autorisation redemandée, image tournée
  sur iPadOS 26.
- Sans cet ajout, Safari efface les données d'un site après 7 jours sans
  visite. Un apprenti qui passe trois semaines en entreprise perdrait tout.
- Choisi par Claude, le mainteneur ayant laissé le choix : on propose
  l'installation sur l'écran d'accueil, et un code de 6 chiffres, affiché sous
  le QR et qui change en même temps que lui, sert de secours quand la caméra
  ne marche pas.

Sources : [WebKit, bug 185448](https://bugs.webkit.org/show_bug.cgi?id=185448),
[WebKit, bug 273938](https://bugs.webkit.org/show_bug.cgi?id=273938),
[WebKit, bug 275527](https://bugs.webkit.org/show_bug.cgi?id=275527),
[WebKit, bug 215884](https://bugs.webkit.org/show_bug.cgi?id=215884),
[WebKit, bug 299591](https://bugs.webkit.org/show_bug.cgi?id=299591),
[notes de Maximiliano Firtman sur les PWA iOS](https://firt.dev/notes/pwa-ios/).

## Ce qui ne se mesure que sur place

- Le Wi-Fi d'un vrai centre : ce qu'il bloque.
- Trente vrais téléphones dans une salle, derrière la box du centre.
- La caméra de vrais iPhone et de vieux Android, installés ou non.
- La vitesse de lecture d'un QR sur un vieux téléphone.
