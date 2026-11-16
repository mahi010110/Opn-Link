# Le contrat des formats

Ce que le cœur écrit et relit, à l'octet près. C'est ce qu'une autre
version d'Opn-Link, ou un autre programme, doit produire pour être compris.

Brouillon du prototype, écrit le 16 novembre 2026. Les formats sont en
version 1, mais ils ne sont figés qu'avec l'accord du mainteneur. Une fois
figés, ils ne changent plus de nom : un format qui évolue prend une nouvelle
version, et l'app lit toujours l'ancienne ([regles.md](regles.md),
règle 10).

Chaque format a ses vecteurs de test, dans `coeur/tests/vecteurs.rs` et
`coeur/tests/vecteurs/`. Ils tournent en Rust et dans un navigateur. Ils ne
se régénèrent pas : une version future doit toujours les relire.

## Ce qui vaut partout

- Le texte est en UTF-8.
- Les octets s'écrivent en base64url, sans `=` à la fin.
- Les heures sont des millisecondes depuis le 1er janvier 1970 (UTC).
- Ce qu'on signe : une étiquette qui dit le format, puis un champ par ligne,
  séparés par `\n`. Un champ n'est jamais vide et ne contient aucun
  caractère de contrôle.
- Le cœur ne lit jamais l'horloge. On lui donne l'heure.

## Les clés

- P-256 pour signer (ECDSA avec SHA-256) et pour la boîte aux lettres
  (ECDH), deux clés séparées par appareil.
- Une clé publique s'écrit sur ses 65 octets (`04`, x, y), comme la donne
  WebCrypto : 87 caractères. C'est cette forme qui entre dans tout ce qu'on
  signe.
- La forme courte (33 octets, 44 caractères) sert seulement à faire tenir
  une clé dans un QR.
- Une signature fait 64 octets, r puis s, comme WebCrypto : 86 caractères.

## Le code de la classe

- 15 caractères pris dans `abcdefghjkmnpqrstuvwxyz23456789`. Il s'affiche
  en majuscules, en trois blocs de cinq. À la lecture, les espaces, les
  tirets et les majuscules ne comptent pas.
- PBKDF2-SHA-256 sur le code en minuscules, sel `opn-link·classe·v1`,
  100 000 tours, 48 octets :
  - les 16 premiers donnent l'étiquette que voient les relais :
    `opl-classe-` puis leur écriture hexadécimale ;
  - les 32 suivants sont la clé de la classe.

C'est le schéma des groupes d'OpenContact, avec un autre sel.

Vecteur : `RJ4KP 7MX2D W8QHN` donne
`opl-classe-48c4e5ebf83ef60682ad29918ce4ec5a`.

## La séance

L'identifiant d'une demi-journée. Il se calcule des deux côtés, sans rien
échanger.

- HMAC-SHA-256, avec la clé de la classe, sur
  `opn-link·seance·v1\n<date>\n<demi>`.
- `<date>` s'écrit `AAAA-MM-JJ`, `<demi>` vaut `matin` ou `apres-midi`.
- Les 9 premiers octets, en base64url : 12 caractères.

Vecteurs, pour le code ci-dessus et le 17 novembre 2026 : `rMP92Y86dEqy`
le matin, `Y79LPiRW-lpH` l'après-midi.

## Le QR de la salle

```
OPL1.<séance>.<fenêtre>.<code>
```

- Le formateur tire un secret de 32 octets quand il lance l'appel.
- La fenêtre compte les dix secondes depuis le lancement : 0, 1, 2…
- Le code de six chiffres : HMAC-SHA-256 avec le secret, sur
  `opn-link·code·v1` suivi de la fenêtre en 8 octets (gros-boutiste). Les 4
  premiers octets, lus comme un entier gros-boutiste, modulo 1 000 000,
  écrits sur six chiffres.
- L'engagement, publié à l'ouverture de la feuille : SHA-256 de
  `opn-link·engagement·v1` suivi du secret, en base64url. Le secret, lui,
  n'est révélé qu'à la clôture.
- Le QR ne porte aucun nom.

Vecteurs, avec un secret de 32 octets valant `07` : l'engagement
`zOUhGpib3ZPJ26Y1QWRH2e_IvxgGIY32rMkwC5aNG8g`, et les codes `218210`,
`490691`, `673754`, `055972` pour les fenêtres 0 à 3. Le QR de la fenêtre 3
le matin : `OPL1.rMP92Y86dEqy.3.055972` (26 caractères).

## La présence

```
OPS1.<séance>.<code>.<fenêtre>.<heure>.<clé courte>.<signature>
```

- `<fenêtre>` vaut `-` quand le code a été tapé à la main.
- `<heure>` est l'heure de l'appareil de l'apprenant. Elle se lit, mais ne
  prouve rien.
- La signature porte sur
  `opn-link·presence·v1\n<séance>\n<clé longue>\n<code>\n<fenêtre>\n<heure>`.
- C'est ce que montre le QR d'un apprenant sans réseau (environ 170
  caractères), et ce qui part, scellé, dans la boîte du formateur.

Le formateur l'accepte si :

- elle est pour sa séance ;
- elle est signée par l'appareil qu'un responsable a accepté pour cet
  apprenant ;
- le code est celui d'une fenêtre que l'écran a montrée. Par le réseau, la
  fenêtre a au plus une minute. Lue en face à face dans le QR de
  l'apprenant, elle peut être plus ancienne ;
- l'appel n'est pas clos.

Une deuxième présence du même apprenant ne change rien.

Vecteur : la clé de signature de 32 octets valant `21` signe la fenêtre 3 à
l'heure `1763366432000`. Le texte complet est dans `coeur/tests/vecteurs.rs`.

## La lettre

```
OPB1.<base64url de : clé jetable (65 octets), IV (12 octets), chiffré>
```

- Une clé P-256 jetable par lettre. ECDH avec la clé de la boîte du
  destinataire, puis HKDF-SHA-256 (sel `opn-link·boite·v1`, info `lettre`),
  32 octets pour AES-256-GCM.
- L'étiquette de la boîte, que voient les relais : `opl-boite-` puis les 16
  premiers octets, en hexadécimal, de SHA-256 sur `opn-link·boite·v1·`
  suivi de la clé de la boîte écrite en base64url.

C'est le schéma de la boîte aux lettres d'OpenContact (OCB1), avec d'autres
sels.

Vecteur : `coeur/tests/vecteurs/lettre-v1.txt`, scellée pour la boîte de 32
octets valant `12`. Elle contient la présence ci-dessus.

## L'acceptation

Un responsable accepte un apprenant et l'appareil qui a demandé à entrer. Il
signe
`opn-link·acceptation·v1\n<étiquette de la classe>\n<prénom>\n<nom>\n<clé>\n<boîte>\n<clé du responsable>\n<heure>`.
Seule une acceptation signée par un responsable compte.

## La feuille de présence

Un journal où l'on ne peut qu'ajouter. La première ligne vaut
`opn-link·feuille·v1`, puis une ligne par événement, ses champs séparés par
des tabulations :

```
<n>	<heure>	<sorte>	<champs…>
```

- `<n>` compte les lignes à partir de 0. `<heure>` est l'heure de
  l'appareil du formateur.
- L'empreinte d'une ligne : SHA-256 de `opn-link·feuille·v1`, de
  l'empreinte de la ligne d'avant (32 octets à zéro pour la première), et du
  texte de la ligne. On ne peut rien changer, retirer ou intercaler sans que
  les empreintes suivantes changent.
- Une ligne signée (`cloture`, `correction`) finit par la signature du
  formateur, faite sur l'empreinte du texte de la ligne sans sa signature.
- L'empreinte de la dernière ligne part au registre public, trente secondes
  après la clôture.

Les sortes de lignes :

| Sorte | Champs |
|---|---|
| `ouverture` | étiquette de la classe, séance, date, demi, clé du formateur, engagement, puis prénom, nom et clé de chaque inscrit |
| `presence` | `reseau` ou `qr`, la présence |
| `ici` | clé de l'apprenant, qui a signé sur l'appareil du formateur |
| `retard`, `depart` | clé de l'apprenant, heure |
| `cloture` | présents, absents, secret de l'appel, signature |
| `reouverture` | rien : la clôture est annulée, dans les trente secondes |
| `correction` | clé de l'apprenant, `present` ou `absent`, motif, signature |

Qui vérifie une feuille rejoue chaque ligne avec les règles de l'appel. Une
fois le secret révélé, il revérifie chaque code. Il n'a besoin de rien
d'autre que la feuille.

Vecteur : `coeur/tests/vecteurs/feuille-v1.txt`. Une présence par le
réseau, une clôture, puis une correction. Son empreinte :
`dbf1a4850aa7bf151b5208c11381da4a82002af7b2b5a2397e7a76ae9c873480`.

## Les durées de vie

Chaque donnée a une durée de vie ([regles.md](regles.md), règle 9). Le
tableau est dans [architecture.md](architecture.md), partie « Le moins de
données possible ». Pour l'appel :

- le secret de l'appel vit sur les appareils du formateur jusqu'à la
  clôture, puis dans la feuille ;
- la feuille vit chez le centre, ou chez le chef, de 5 à 10 ans. Chez les
  autres, jusqu'à la fermeture de la classe.

## Ce qui n'est pas encore écrit

- Les clés de stockage, dans le navigateur et dans l'app pour ordinateur.
- Les événements Nostr : la sorte, les étiquettes, l'expiration.
- L'annonce « l'appel est ouvert » sur le fil de la classe, et la réponse
  du formateur à une présence : reçue, ou refusée avec sa raison.
- Tout ce qui n'est pas l'appel : les annonces, les messages, les documents,
  les demandes.
