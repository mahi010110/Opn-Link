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

C'est la porte de la classe : il permet de la trouver et de demander à
entrer, rien de plus. Il s'affiche sous le QR, et on peut le taper.

- 15 caractères pris dans `abcdefghjkmnpqrstuvwxyz23456789`. Il s'affiche
  en majuscules, en trois blocs de cinq. À la lecture, les espaces, les
  tirets et les majuscules ne comptent pas.
- PBKDF2-SHA-256 sur le code en minuscules, sel `opn-link·classe·v1`,
  100 000 tours, 48 octets :
  - les 16 premiers donnent l'étiquette que voient les relais :
    `opl-classe-` puis leur écriture hexadécimale ;
  - les 32 suivants sont la clé de la classe, qui chiffre sa porte.

C'est le schéma des groupes d'OpenContact, avec un autre sel. Comme pour
leurs groupes « sur demande », le code ne donne pas le fil : une photo du QR
de la salle permet de demander à entrer, pas de lire les annonces.

Vecteur : `RJ4KP 7MX2D W8QHN` donne
`opl-classe-48c4e5ebf83ef60682ad29918ce4ec5a`.

## Les secrets gardés

Tirer l'étiquette et la clé d'une classe de son code prend 140 ms dans un
navigateur, à chaque ouverture de l'app ([mesures.md](mesures.md)). Le
téléphone les garde donc avec la classe, en texte, une valeur par ligne :

```
opn-link·secrets·v1
<le code, en minuscules>
<l'étiquette>
<la clé de la classe, 32 octets en base64url>
```

Ils ne valent que pour le code qu'ils portent. Ils restent sur les
appareils de la personne, qui a déjà le code.

Vecteur : `coeur/tests/vecteurs/secrets-v1.txt`, pour le code ci-dessus.

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

## Les textes signés

La porte, la demande d'entrée et l'acceptation sont des textes signés : une
étiquette de format, un champ par ligne, puis la signature en dernière
ligne. Ce qui est signé, c'est le texte sans sa dernière ligne. On les lit
sans rien deviner, et la signature se vérifie à l'octet près.

## Le chiffrement par une clé partagée

```
OPC1.<base64url de : IV (12 octets), chiffré>
```

AES-256-GCM, un IV neuf à chaque fois. La porte se chiffre avec la clé de la
classe, le fil avec la clé du fil.

## La porte

Le chef la publie sur les relais, sous l'étiquette de la classe, chiffrée
avec sa clé. Elle dit à qui a le code ce qu'il rejoint, et à qui demander.

```
opn-link·porte·v1
<étiquette de la classe>
<nom de la classe>
<nom du centre>
<horaires du matin>
<horaires de l'après-midi>
<heure>
<prénom>  <nom>  <rôle>  <clé>  <boîte>   (cinq lignes par responsable, le chef en premier)
<signature du chef>
```

- Le rôle vaut `formateur` ou `centre`.
- Les horaires s'écrivent `9:00-12:30`.
- Le lien du QR de la classe porte la clé du chef. L'app suit ses
  passations (partie suivante) jusqu'au chef actuel, et prend la porte la
  plus récente qu'il a signée. Tant qu'il n'en a pas publié, celle de son
  prédécesseur vaut, si elle date d'avant la passation. Une porte signée par
  un ancien chef après sa passation ne compte pas.
- Un code tapé à la main ne porte pas de clé : si les portes publiées pour
  ce code ne mènent pas au même chef, l'app ne choisit pas.
- Nommer un adjoint, c'est signer une nouvelle porte qui le compte.

Vecteurs : `coeur/tests/vecteurs/porte-v1.txt`, et la même chiffrée,
`porte-chiffree-v1.txt`.

## La passation

Le chef passe la main à un autre responsable. Il signe seul : c'est sa clé
qui fait foi.

```
opn-link·passation·v1
<étiquette de la classe>
<clé de l'ancien chef>
<clé du nouveau chef>
<heure>
<signature de l'ancien chef>
```

- Un chef ne passe la main qu'une fois : sa première passation compte, et ce
  qu'il signe ensuite comme chef ne compte plus. Seul le nouveau chef peut la
  lui rendre, par une passation à lui.
- Le nouveau chef signe aussitôt une porte où il est en premier. L'ancien y
  reste, comme adjoint.
- Elle voyage comme la porte : sous l'étiquette de la classe, chiffrée par
  sa clé. Chaque responsable la republie avec la porte, et l'apprenant la
  garde avec elle.

Vecteur : `coeur/tests/vecteurs/passation-v1.txt`, Awa passe la main à la
clé tirée des octets `31` et `32`, le 17 novembre 2026 à midi.

## La lettre entre responsables

Les responsables s'écrivent pour partager l'état de la classe. Leurs boîtes
sont dans la porte, que tout apprenant peut lire : la lettre est donc signée
par celui qui l'écrit.

```
opn-link·responsables·v1
<étiquette de la classe>
<clé de celui qui écrit>
<heure>
<contenu, sur une ligne>
<signature>
```

- Elle ne compte que signée par un responsable de la porte.
- Le contenu est du JSON, sans retour à la ligne (partie « Les lettres du
  prototype »).

Vecteur : `coeur/tests/vecteurs/responsables-v1.txt`, signée par Awa le 17
novembre 2026 à 9 h 30, pour le contenu `{"v":1,"t":"classe"}`.

## Le nom corrigé

Chacun peut corriger son prénom et son nom. La correction est signée par
l'appareil de la personne : personne ne corrige le nom d'un autre.

```
opn-link·nom·v1
<étiquette de la classe>
<clé de la personne>
<prénom>
<nom>
<heure>
<signature de la personne>
```

- Celle d'un apprenant part scellée dans la boîte de chaque responsable, et
  voyage entre eux avec l'état de la classe.
- Celle d'un responsable voyage aussi avec la porte, chiffrée comme elle
  sous l'étiquette de la classe : toute la classe la lit, sans attendre le
  chef, dont la signature sur la porte garde l'ancien nom. Celle d'un
  apprenant n'y passe jamais : qui a le code de la classe lirait son nom.
- La plus récente compte. Les responsables voient l'ancien nom à côté du
  nouveau.
- Une feuille déjà ouverte garde le nom de son ouverture. Les appels
  suivants prennent le nouveau.

Vecteur : `coeur/tests/vecteurs/nom-v1.txt`, Léa devient Léa Martin-Dupont,
le 19 novembre 2026.

## La demande d'entrée

```
opn-link·entree·v1
<étiquette de la classe>
<prénom>
<nom>
<clé de l'apprenant>
<boîte de l'apprenant>
<heure>
<signature de l'apprenant>
```

Elle est signée par l'appareil qui signera la présence : personne ne peut
demander à entrer avec la clé d'un autre. Elle part scellée dans la boîte de
chaque responsable. Ses camarades ne la voient pas.

Vecteur : `coeur/tests/vecteurs/demande-v1.txt`.

## L'acceptation

```
opn-link·acceptation·v1
<étiquette de la classe>
<prénom>
<nom>
<clé>
<boîte>
<clé du responsable>
<heure>
<signature du responsable>
```

Seule une acceptation signée par un responsable de la porte compte.

Vecteur : `coeur/tests/vecteurs/acceptation-v1.txt`.

## Le secret du fil

Le fil porte les annonces et ce que la classe se dit. Son secret, 32 octets
tirés au hasard, n'est jamais affiché. Un responsable le remet à l'apprenant
qu'il accepte, scellé pour lui seul.

- HKDF-SHA-256 sur le secret, sel `opn-link·fil·v1`, info `fil`, 48 octets :
  les 16 premiers donnent l'étiquette `opl-fil-` et leur écriture
  hexadécimale, les 32 suivants la clé du fil.
- Retirer un membre change ce secret. Le code de la classe, lui, ne change
  que si le chef refait l'invitation.

Vecteurs : un secret de 32 octets valant `09` donne
`opl-fil-68e3771df5dddf4deb00bafc6ef946a7`, et
`coeur/tests/vecteurs/fil-chiffre-v1.txt` se déchiffre en
« Lundi 23, salle B12. ».

## L'annonce de l'appel

Le responsable qui tient l'appel dit à la classe, sur le fil, que l'appel
d'une demi-journée est ouvert, puis clos. Chaque membre a le secret du fil :
l'annonce est donc signée, pour qu'un apprenant ne puisse pas clore l'appel
sur le téléphone des autres.

```
opn-link·appel·v1
<étiquette du fil>
<séance>
<date>
<demi-journée>
<état>
<heure>
<clé du responsable>
<signature du responsable>
```

- La date s'écrit `2026-11-17`, la demi-journée `matin` ou `apres-midi`,
  l'état `ouvert` ou `clos`.
- Elle ne compte que signée par un responsable de la porte, pour ce fil, et
  si la séance est bien celle de sa date et de sa demi-journée.
- Pour une même séance, l'annonce la plus récente compte. Annuler une
  clôture se dit par une nouvelle annonce `ouvert`.
- L'apprenant signe sa présence pour la séance annoncée. Sans annonce, il
  la calcule avec l'heure et les horaires de la porte.

Elle voyage chiffrée par la clé du fil (`OPC1.`), dans un événement sous
l'étiquette du fil, qui expire au bout d'un jour.

Vecteur : `coeur/tests/vecteurs/appel-v1.txt`, signé par Awa pour le fil de
secret `09` et la classe des autres vecteurs, le matin du 17 novembre 2026.

## Le prochain cours

À la clôture, le responsable dit à la classe, sur le fil, la demi-journée du
prochain cours. C'est ainsi que le téléphone de l'apprenant sait quand
revient l'appel, et que les demi-journées d'ici là sont sans cours.

```
opn-link·prochain·v1
<étiquette du fil>
<date>
<demi-journée>
<heure>
<clé du responsable>
<signature du responsable>
```

- La date s'écrit `2026-11-23`, la demi-journée `matin` ou `apres-midi`.
  Une date écrite autrement ne se signe pas.
- Il ne compte que signé par un responsable de la porte, pour ce fil.
- Le plus récent compte. Changer le prochain cours, c'est en signer un
  nouveau.
- Les demi-journées entre son heure et le cours qu'il annonce sont sans
  cours : elles s'affichent en trame dans la semaine de l'apprenant.

Il voyage chiffré par la clé du fil (`OPC1.`), dans un événement sous
l'étiquette du fil, qui expire le surlendemain du cours, et au plus tôt un
jour après son envoi. Le téléphone relit le fil sur huit semaines : en
alternance, le prochain cours est parfois loin.

Vecteur : `coeur/tests/vecteurs/prochain-v1.txt`, signé par Awa pour le même
fil, à la clôture du 17 novembre 2026 à 9 h 12, pour le lundi 23 au matin.

## L'annonce à la classe

Seuls les responsables publient sur le fil. Toute la classe lit.

```
opn-link·annonce·v1
<étiquette du fil>
<identifiant>
<clé de l'auteur>
<créée>
<heure>
<arrivée>
<état>
<texte>
<clé du signataire>
<signature du signataire>
```

- L'identifiant fait 16 octets tirés au hasard, en base64url. Toutes les
  versions d'une annonce le portent, avec la même heure de création.
- L'état vaut `publiee` ou `retiree`. Une version publiée est signée par
  son auteur : lui seul modifie son annonce. Un retrait est signé par
  n'importe quel responsable de la porte, et vaut tout de suite.
- Le texte, en UTF-8, s'écrit en base64url : une annonce a souvent
  plusieurs lignes, et un champ n'en a qu'une. Il fait 8 Ko au plus. Un
  retrait n'a pas de texte : `-`.
- L'arrivée est l'heure où la montrer. Écrite pendant les heures de la
  classe, une annonce arrive tout de suite. Sinon, à l'ouverture suivante :
  une heure avant le début du matin, le prochain jour de semaine. C'est
  l'appareil qui la reçoit qui attend.
- Pour un même identifiant, la version la plus récente compte. Une version
  qui ne porte pas l'auteur et la création de la première ne compte pas.
- Elle montre « modifiée » quand son heure est après sa création.

Elle voyage chiffrée par la clé du fil (`OPC1.`), dans un événement sous
l'étiquette du fil, qui expire trente jours après son arrivée. Chaque
responsable republie, une fois par jour au plus, les annonces en vigueur qui
ont plus de trois semaines : un apprenant qui arrive plus tard les reçoit
encore. Sur les appareils, une annonce vit jusqu'à son retrait, et son
retrait jusqu'à la fermeture de la classe.

Vecteur : `coeur/tests/vecteurs/annonce-v1.txt`, publiée par Awa pour le
même fil le dimanche 22 novembre 2026 à 21 h 14, et qui arrive le lundi à
8 h.

## Le message privé

Un apprenant écrit à un responsable, un responsable à un apprenant ou à un
autre responsable. Deux apprenants ne s'écrivent pas.

```
opn-link·message·v1
<étiquette de la classe>
<clé de celui qui écrit>
<clé de celui à qui il écrit>
<heure>
<arrivée>
<annonce>
<texte>
<signature de celui qui écrit>
```

- Il part scellé dans la boîte de celui à qui il est écrit. Il est signé :
  la boîte d'un responsable est dans la porte, que tout apprenant lit.
- Il ne compte qu'entre les deux clés qu'il porte. Un apprenant ne lit que
  ceux des responsables de la porte, un responsable ceux des autres
  responsables et des apprenants acceptés.
- L'annonce est l'identifiant de l'annonce à laquelle il répond, ou `-`.
- Le texte s'écrit en base64url, comme celui d'une annonce, et fait 8 Ko
  au plus.
- L'arrivée suit les heures de la classe, comme pour une annonce. C'est
  l'appareil qui le reçoit qui attend pour le montrer.

L'événement qui le porte expire trente jours après son arrivée, et chaque
appareil relit sa boîte sur trente jours : un apprenant en entreprise trois
semaines le reçoit encore à son retour. Sur les appareils, il vit jusqu'à la
fermeture de la classe. Ouvrir un message n'envoie rien (règle 3).

Vecteur : `coeur/tests/vecteurs/message-v1.txt`, écrit par Léa à Awa le
lundi 23 novembre 2026 à 21 h 14, en réponse à l'annonce ci-dessus, et qui
arrive le mardi à 8 h.

## La justification d'une absence

L'apprenant dit pourquoi il était absent. Le motif ne va qu'aux
responsables.

```
opn-link·justification·v1
<étiquette de la classe>
<clé de l'apprenant>
<séance>
<date>
<demi>
<motif>
<heure>
<signature de l'apprenant>
```

- Elle est signée par l'appareil qui a manqué l'appel, et ne compte que pour
  la séance de sa demi-journée, dans cette classe.
- Le motif vaut `maladie`, `transport`, `entreprise` ou `autre`.
- Elle part scellée dans la boîte de chaque responsable, qui ne la garde que
  pour un apprenant de la classe. Pour une même absence, la plus récente
  compte.

Vecteur : `coeur/tests/vecteurs/justification-v1.txt`, Léa justifie son
absence du mardi 17 novembre 2026, le matin, par le transport, à midi.

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
  autres, jusqu'à la fermeture de la classe ;
- un envoi qu'aucun relais n'a encore accepté vit sur l'appareil jusqu'à ce
  qu'un relais l'accepte, au plus jusqu'à l'expiration de son événement :
  7 jours pour une lettre, 30 pour un message privé et pour la porte ;
- l'annonce de l'appel reste trente jours sur les relais : un apprenant qui
  rouvre l'app plus tard apprend encore son absence. Sur son téléphone, huit
  semaines, pour sa semaine et « Mes présences » ;
- une justification reste trente jours sur les relais. Sur les appareils,
  huit semaines ;
- le prochain cours reste sur les relais jusqu'au surlendemain du cours. Sur
  le téléphone de l'apprenant, le plus récent seulement, jusqu'à sept jours
  après sa date ;
- les présences signées restent huit semaines sur le téléphone de
  l'apprenant ;
- les demi-journées où l'appel a été clos restent huit semaines chez le
  formateur : l'app y apprend le rythme de la classe pour proposer le
  prochain cours ;
- une invitation d'adjoint vit sept jours chez le chef. Les passations vivent
  avec la porte, jusqu'à la fermeture de la classe ;
- les secrets gardés vivent avec la classe sur l'appareil, et partent avec
  elle ;
- un message privé reste trente jours après son arrivée sur les relais. Sur
  les appareils, il vit jusqu'à la fermeture de la classe ;
- la lettre qui porte une feuille close aux autres responsables reste trente
  jours sur les relais. Chacun garde huit semaines ce que dit la feuille. Le
  journal entier, gardé des années chez le chef ou le centre, viendra avec
  l'export de la feuille, à l'étape 5 de [prototype.md](prototype.md).

## L'événement Nostr

- La sorte 8571, celle de la boîte aux lettres d'OpenContact, gardée par six
  relais sur sept (mesuré).
- Les étiquettes : `["x", <étiquette de la boîte>]` et
  `["expiration", <secondes>]` (NIP-40).
- Le contenu : une lettre `OPB1.`.
- Une clé jetable secp256k1 par événement, qui signe l'identifiant calculé
  comme NIP-01 le demande (`coeur/src/nostr.rs`).

## Les lettres du prototype

Le prototype fait passer ces lettres, en JSON, scellées dans la boîte du
destinataire. Elles ne sont pas encore figées.

| Lettre | De qui, à qui | Ce qu'elle porte |
|---|---|---|
| `appel` | le formateur, à ses propres appareils | le code de la classe, le journal à l'ouverture et le secret, pour que l'écran de la salle montre le QR |
| `presence` | l'apprenant, au formateur | sa présence `OPS1.` |
| `recu`, `refus` | le formateur, à l'apprenant | l'heure de réception et qui l'a reçue, ou le code de l'erreur |
| `compte`, `clos`, `reouvert` | le formateur, à ses propres appareils | ce que la salle affiche : le compte, la clôture, son annulation |
| `entree` | l'apprenant, à chaque responsable | sa demande d'entrée |
| `admis` | le responsable, à l'apprenant | la porte, l'acceptation et le secret du fil |
| `classe`, `montrer` | le formateur, à ses propres appareils | la porte, les membres et les demandes d'une classe, et ce que la salle montre de quelle classe |
| `adjoint` | l'adjoint invité, au chef seul | sa demande, signée comme celle d'un apprenant, et le jeton de l'invitation |
| `nom` | l'apprenant, à chaque responsable | son nom corrigé (partie « Le nom corrigé ») |
| `responsables` | un responsable, à chacun des autres | la porte et les passations, puis une lettre entre responsables (partie du même nom) |
| `message` | l'apprenant ou un responsable, à celui à qui il écrit | le code de la classe, et le message privé signé (partie « Le message privé ») |
| `feuille` | le responsable qui a tenu l'appel, à chacun des autres | le code de la classe, et le journal de la feuille close, quand la clôture ne s'annule plus |
| `justification` | l'apprenant, à chaque responsable | le code de la classe, et la justification signée (partie « La justification d'une absence ») |

La lettre entre responsables porte en contenu
`{"v":1,"t":"classe","etat":{...}}` : la porte, les passations, le secret du
fil, les acceptations, les demandes, les clés laissées dehors, les
demi-journées de cours et le prochain cours. Celui qui la reçoit met d'abord
sa porte à jour avec celle qui voyage à côté, vérifie la signature avec les
responsables de cette porte, puis fusionne : les listes s'unissent, une
acceptation ne compte que signée par un responsable, la première acceptation
d'un apprenant gagne, et le prochain cours le plus récent gagne. Rien ne se
retire ainsi. S'il en sait plus que la lettre, il répond.

La porte voyage autrement : un événement sous l'étiquette de la classe, dont
le contenu est la porte chiffrée par la clé de la classe (`OPC1.`). Le chef
la publie à la création. Chaque responsable la republie une fois par jour au
plus, avec les passations et les noms corrigés des responsables, qui
voyagent de la même façon. L'apprenant écoute cette étiquette : sa porte
suit le chef, il envoie sa présence à chaque responsable, et il lit leurs
noms à jour.

Le lien du QR de la classe : l'adresse du site, puis
`#r=<code en minuscules>.<clé du chef, forme courte>`. Ce qui suit `#` ne
part jamais vers le serveur du site.

L'invitation d'un adjoint : l'adresse du site, puis
`#a=<code>.<clé du chef, forme courte>.<jeton>.<f ou c>`. Le jeton, 16
octets tirés au hasard en base64url, ne sert qu'à elle. Le chef ne voit une
demande d'adjoint que si elle porte le jeton d'une invitation qu'il a
montrée ou envoyée il y a moins de sept jours. La dernière lettre dit le
rôle proposé, formateur ou centre ; le chef garde le rôle de son côté.

Les clés de stockage du prototype commencent par `opl_proto_`, suivies du
nom de l'appareil. Elles disparaîtront avec lui.

- `cles`, `moi` : les clés de l'appareil, et le prénom et le nom de la
  personne ;
- `classes` : les classes que suit l'appareil, dix au plus ;
- `appels` : chez un responsable, l'appel qu'il tient dans chaque classe,
  son journal et son secret, par code de classe ;
- `derniere-classe` : le code de la dernière classe montrée ;
- `classes-de-la-salle` : sur l'ordinateur de la salle, l'état de chaque
  classe, par code ;
- `accueil-propose`, `accueil-redemande` : quand l'app a proposé l'écran
  d'accueil, puis quand elle l'a redemandé ;
- `theme` : le thème choisi dans « Moi », `clair` ou `sombre`, ou rien pour
  suivre le téléphone ;
- `relais` : la liste des relais, `{"principaux": [...], "secours": [...]}`.
  Seuls les tests l'écrivent ; sans elle, l'app prend la liste par défaut ;
- `envois` : les événements Nostr qu'aucun relais n'a encore acceptés, en
  texte.

Chaque classe de `classes` garde son code, le rôle de la personne, la porte
et ses passations (`passations`), le secret du fil, et ses secrets gardés
(`secrets`, partie « Les secrets gardés »). Le rôle `adjoint` marque un
responsable qui n'est pas chef, ou qui attend l'accord du chef tant qu'il
n'a pas le secret du fil. En plus :

- chez chacun : le nom corrigé qui part dans trente secondes
  (`nomEnAttente`), la correction la plus récente du nom de chaque
  responsable (`noms`), les annonces à la classe, signées, la dernière
  version de chacune, retraits compris (`annoncesDeLaClasse`), et les
  messages privés écrits et reçus, déjà vérifiés, ceux qu'on n'a pas encore
  ouverts marqués `nouveau` (`messages`) ;
- chez l'apprenant : son acceptation, ou sa demande tant qu'il attend, ses
  présences signées avec leur demi-journée et leur réception
  (`presences`), les annonces de l'appel des huit dernières semaines, une
  par séance, déjà vérifiées (`annoncesAppel`), ses absences justifiées
  (`justifications`), le dernier prochain cours
  vérifié (`prochain`), et son dernier nom corrigé (`nom`) ;
- chez les responsables : les acceptations, les demandes et les clés
  laissées dehors, les demi-journées où l'appel a été clos (`cours`), le
  dernier prochain cours annoncé (`prochain`) et celui qui attend la fin des
  trente secondes (`prochainEnAttente`), et l'annonce qui part dans trente
  secondes, une nouvelle version ou un retrait (`annonceEnAttente`). `noms`
  y garde aussi la correction la plus récente du nom de chaque membre, qui
  voyage entre eux. Les feuilles closes de la classe, huit semaines, déjà
  vérifiées : leur demi-journée, qui a tenu l'appel, l'heure de chaque
  présence et les absents (`feuilles`). Les absences que les apprenants ont
  justifiées, huit semaines (`justifications`) ;
- chez le chef : les invitations d'adjoint de moins de sept jours
  (`invitations`), les demandes d'adjoint qui attendent son accord
  (`candidats`), la main qu'il passe (`passationEnAttente`) et les horaires
  qui changent (`horairesEnAttente`), dans trente secondes.

Le 24 novembre 2026, ce que l'appareil gardait à part rejoint sa classe :
`appel` devient `appels`, `presences`, `annonces-appel` et `prochain` vont
dans la classe de l'apprenant, et `classe-de-la-salle` devient
`classes-de-la-salle`. L'app relit une fois les anciennes clés, puis les
efface. `presence`, qui gardait la seule présence du moment, avait été
remplacée par `presences` le 23 novembre 2026.

Le service worker garde le site dans une réserve nommée `opn-link-` suivi de
l'empreinte des fichiers gardés. Une nouvelle version efface l'ancienne.

## Ce qui n'est pas encore écrit

- Les clés de stockage, dans le navigateur et dans l'app pour ordinateur.
- Les documents et les demandes.
