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
   git clone --depth 1 https://github.com/mahi010110/Open-Contact
   rustup target add wasm32-unknown-unknown
   cargo install wasm-bindgen-cli --version 0.2.130 --locked
   (cd opn-link/maquettes && npm install && npm run style)
   (cd opn-link/site && npm install)
   ```

   `npm run style` prend le matériel dans le dépôt d'OpenContact posé à côté.
   Si son clone est trop court pour la version voulue (`VERSION_OC` dans
   `maquettes/outils/prendre-style.mjs`) : `git -C Open-Contact fetch
   --depth=1 origin <version>`.
3. Vérifier que tout passe, comme le 24 novembre 2026 :
   - `cd coeur && cargo test` : 83 tests ;
   - `cargo test --target wasm32-unknown-unknown` : les mêmes, dans
     Chromium ;
   - `cd ../site && npm run construire && npm run verifier && npm run
     classe` : le cœur d'abord, dont les types de l'interface ont besoin,
     puis le scénario, sans aucun échec ;
   - `node outils/planches.mjs` : les captures en planches, à regarder.
4. Reprendre la suite, dans l'ordre de « La suite » plus bas. Les
   questions qui attendent le mainteneur sont dans
   [questions-ouvertes.md](questions-ouvertes.md), partie « Le prototype ».

- Le travail avance sur une branche avant d'arriver sur `main`. Si une
  branche de travail a des commits que `main` n'a pas, demander au
  mainteneur de les fusionner avant de reprendre. Le 24 novembre 2026, c'est
  `claude/quirky-fermat-tgb4d4`.
- Pousser sur `main` demande l'accord explicite du mainteneur, à chaque
  fois. La session le bloque sinon.
- Seul Chromium est installé. Le pilote Chrome de l'environnement n'a pas la
  version de Chromium : les tests du cœur dans le navigateur passent par
  `coeur/outils/navigateur.mjs`, et télécharger un autre pilote a été
  refusé.
- Un écran qui change se montre au mainteneur avant `main`, avant et après :
  `node outils/avant-apres.mjs <cas>` dans `site/` (partie « Comment on
  livre »).

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

Fait ensuite le 17 novembre 2026, le site devient installable et marche sans
réseau une fois ouvert :

- un service worker garde le site sur l'appareil : le cœur, l'interface, les
  styles, les polices des premiers écrans et les icônes que le code emploie,
  253 Ko en 37 fichiers. Sa version est l'empreinte de ces fichiers : elle
  change dès que l'un d'eux change ;
- un manifeste, et l'icône : le pictogramme « lien » du matériel, clair sur
  l'accent, rendu en PNG à la construction. Ses couleurs viennent des jetons ;
- après la première présence signée, l'app propose une fois de la garder sur
  l'écran d'accueil : les trois pas de Safari sur iPhone, la touche
  « Installer » ailleurs, quand le navigateur le permet ;
- le scénario recharge le téléphone de Léa sans réseau : le site se rouvre
  depuis l'appareil, avec sa présence signée.

Le contrôle « rien en clair sur le relais » cherchait des prénoms dans du
base64, où trois lettres comme « Awa » tombent par hasard. Il vérifie
maintenant que chaque contenu est scellé ou chiffré, et qu'aucun nom complet
ne s'y lit. Une copie de la porte publiée exprès en clair le fait bien
échouer.

Fait ensuite le 17 novembre 2026, les relais publics :

- l'app passe par les relais de [architecture.md](architecture.md), partie
  « Les relais par défaut » : nostr.sathoarder.com et nos.lol, puis
  nostr-relay.corb.net et nostr-01.yakihonne.com tant que moins de deux
  principaux répondent ;
- un relais qui refuse un message est écarté dix minutes, sur l'appareil ;
- ce qu'aucun relais n'a accepté se garde sur l'appareil (`envois`), et
  repart dès qu'un relais répond, même après un rechargement de la page ;
- un relais qui se connecte reçoit ce qui est parti pendant la session et
  qu'il n'a pas : la porte publiée avant l'ouverture du secours y arrive
  aussi ;
- une recherche attend chaque relais en service, six secondes au plus. Un
  relais qui répond vite sans rien ne fait plus conclure « aucune classe »
  avant celui qui a la porte. Si aucun ne répond, l'écran dit « Pas de
  réseau » au lieu d'un code faux, et la recherche reprend toute seule.

Le scénario donne à chaque appareil deux principaux, dont un qui refuse
toute écriture, et deux secours, dont un qui ne répond pas. Le principal qui
marche tombe juste après l'invitation : tout le reste passe par le secours.
Noah ouvre le lien sans réseau, puis le réseau revient. Inès recharge son
téléphone pendant qu'elle n'a pas de réseau, et sa présence part au retour.
À la fin, la liste par défaut se vérifie sans toucher au réseau : Playwright
tient le rôle des quatre relais publics, et nos.lol refuse.

Six défauts posés exprès dans le client font chacun échouer le scénario
(`site/tests/classe.mjs`) : un relais qui refuse et n'est pas écarté, rien de
renvoyé à la connexion, rien de gardé sur l'appareil, les secours toujours
ouverts, une recherche qui conclut trop tôt, un relais mort retenté en
boucle. Le dernier a été trouvé en relisant le code : un secours mort était
retenté sans délai.

Mesuré le même jour : l'interface pèse 12,4 Ko compressés, et le premier
chargement chez un apprenant 250 Ko, sous le plafond de 300 Ko.

Une limite reste : un message parti seulement par les secours n'arrive à un
appareil resté sur les principaux que si celui qui l'a envoyé retrouve un
principal pendant qu'il a l'app ouverte.

Fait ensuite le 17 novembre 2026, l'appel annoncé sur le fil de la classe :

- le cœur écrit et lit l'annonce de l'appel ([contrat.md](contrat.md),
  partie « L'annonce de l'appel ») : signée par le responsable, pour ce fil
  et cette séance. Six tests de plus, dont un vecteur ;
- le formateur l'envoie quand il lance l'appel, quand il le clôt, et quand
  il annule la clôture ;
- le téléphone de l'apprenant écoute le fil. Avant l'appel, il dit « Pas
  d'appel ouvert », sans touche. Quand l'appel s'ouvre, la barre passe en
  marine, l'écran dit « L'appel est ouvert », avec la demi-journée et qui
  l'a ouvert, et la touche « Signer ma présence » apparaît. Clos sans sa
  présence, il dit « Une absence » et qui a clos ;
- l'apprenant signe pour la séance annoncée : un appel lancé un peu avant
  l'heure de l'après-midi ne se trompe plus de séance ;
- sans réseau, le téléphone ne peut pas savoir si l'appel est ouvert : au
  bout de cinq secondes sans relais, l'écran dit « Ta présence » et garde la
  touche, pour signer quand même.

Le scénario le joue : Léa avant l'appel, puis l'appel ouvert sur les quatre
téléphones, Kevin qui ne voit rien, Noah sans réseau qui garde la touche,
puis absent. Yanis, qui a le secret du fil comme tout membre, annonce
l'appel clos avec sa propre clé : le téléphone de Noah n'en tient pas
compte. Sans la vérification du responsable dans le cœur, ce contrôle
échoue. Mesuré : le premier chargement chez un apprenant pèse 253 Ko.

Fait ensuite le 17 novembre 2026, la caméra :

- le cœur lit un QR dans une image en niveaux de gris, avec la
  bibliothèque quircs. rqrr, prévu par l'architecture, ajoutait 85 Ko
  compressés au cœur, et le premier chargement passait à 337 Ko, au-dessus
  du plafond. quircs en ajoute 11,5 : le premier chargement pèse 265 Ko
  ([mesures.md](mesures.md)) ;
- l'écran « Signer » montre la caméra arrière dans le viseur, et les six
  chiffres dessous, comme la maquette. Le site lit cinq images par seconde,
  réduites à 640 pixels de large. Un QR de l'appel lu, la présence part ;
- un autre QR, celui de la classe par exemple, se dit sous le viseur, sans
  marquer le code en rouge, et rien ne part ;
- sans caméra, refusée ou absente, le viseur dit « La caméra ne s'ouvre
  pas » et les chiffres restent.

Le scénario fait signer Léa avec la caméra simulée de Chromium : elle vise
d'abord le QR de la classe, puis celui que montre la salle.

Fait le 23 novembre 2026, la fin de l'appel complet :

- le scénario échouait depuis le 18 novembre : il simule le mardi 17, mais
  le relais local jugeait l'expiration avec la vraie date, et l'annonce de
  l'appel, qui dure un jour, était refusée. Le relais prend maintenant
  l'horloge du scénario ;
- « Lire son QR », chez le formateur, ouvre la caméra de son téléphone au
  lieu du texte qu'on collait. Un autre QR se dit sous le viseur, et rien
  n'entre. Sans caméra, l'apprenant signe sur le téléphone du formateur ;
- le cœur signe et relit le prochain cours ([contrat.md](contrat.md),
  partie « Le prochain cours »), avec son vecteur. 63 tests ;
- à la clôture, l'app propose le prochain cours et l'annonce sur le fil.
  « Changer » ouvre la liste des demi-journées des trois semaines qui
  viennent ;
- l'écran du jour de l'apprenant montre sa semaine en dix cases : ses
  présences avec l'heure, ses absences en rouge, l'appel ouvert en marine,
  et en trame les demi-journées sans cours jusqu'au prochain. Avec le texte
  agrandi, elle passe en rangs ;
- la réponse devient « En règle » quand rien n'est dû, avec « Prochain
  appel » ou, les jours sans cours, « Retour au centre ». La barre dit alors
  « En entreprise », en trame, ou « Centre fermé » le week-end ;
- un écran qui n'a pas changé n'est plus redessiné : une reconnexion de
  relais remplaçait la page sous le doigt.

Le scénario le joue : Awa lit le QR d'Inès avec sa caméra, après avoir visé
celui de la salle. Elle clôt, l'app propose mardi après-midi, Awa choisit
lundi 23 au matin. Léa voit sa présence, puis la trame jusqu'à lundi. Noah
voit sa case rouge. Yanis annonce un autre prochain cours avec sa propre
clé : personne n'en tient compte. Jeudi, Léa est en entreprise, puis son
écran se relit avec le texte à 200 %, à 360 pixels.

Trois défauts posés exprès font échouer le scénario : la clé lue dans le
texte du prochain cours au lieu de celles des responsables, les jours sans
cours oubliés, la semaine qui ne passe pas en rangs.

Le scénario échouait aussi une fois sur cinq environ : la caméra simulée
filmait une seule image fixe, et quircs rate une présence filmée à 250
pixels et de travers une fois sur quarante (mesuré). Une image ratée l'était
pour toujours. La caméra simulée filme maintenant cinq poses un peu
différentes, comme une main qui bouge.

Mesuré : l'interface pèse 16,3 Ko compressés, et le premier chargement chez
un apprenant 269 Ko, sous le plafond de 300 Ko.

Corrigé ensuite le 23 novembre 2026, en relisant [regles.md](regles.md) :
changer le prochain cours l'envoie à toute la classe et remplace le
précédent. La règle 6 demande « Annuler » pendant trente secondes. Le
prochain cours attend donc trente secondes avant de partir, avec
« Annuler ». Proposé à la clôture, il part avec la feuille, quand la clôture
ne s'annule plus. Le scénario le vérifie en comptant les événements du fil
sur le relais : un changement annulé n'envoie rien. Deux défauts posés exprès
le font échouer : un « Annuler » sans effet, et un envoi immédiat.

Fait ensuite le 23 novembre 2026, les responsables, la façon de faire choisie
par le mainteneur ([architecture.md](architecture.md), partie « Les
responsables ») :

- dans le cœur, la passation et la lettre entre responsables, avec leurs
  vecteurs. Pour choisir la porte, le cœur suit les passations depuis le chef
  qu'il connaît. 70 tests ;
- le chef nomme un adjoint, formateur ou centre, depuis « Membres » : une
  invitation, montrée en QR ou envoyée, avec un jeton tiré pour elle. L'invité
  demande au chef seul, et le chef l'accepte dans « À suivre ». Une demande
  sans le jeton d'une invitation ne s'affiche pas ;
- les responsables partagent l'état de la classe par des lettres signées. La
  fusion unit les listes, et ne retire rien ;
- le téléphone de l'apprenant écoute la porte sur les relais : il envoie sa
  présence à chaque responsable et reconnaît leurs annonces ;
- un responsable ne répond qu'aux présences de l'appel qu'il tient ;
- le chef passe la main à un adjoint : trente secondes pour annuler, puis la
  passation signée part, et le nouveau chef publie la porte où il est en
  premier. Les gestes du chef passent chez lui ;
- la salle montre encore « Appel clos » quand la lettre de clôture arrive en
  retard, tant que la clôture a moins d'une minute ;
- une nouvelle porte, ou une passation, date d'après la précédente, même si
  l'horloge de l'appareil retarde sur celle d'un autre responsable ;
- le cœur garde les secrets d'une classe le temps de la page : les tirer du
  code prend 210 ms, et l'écran du formateur les recalculait à chaque dessin
  ([mesures.md](mesures.md), partie « Le code de la classe, dans le
  navigateur »).

Le scénario le joue avec Julien Morel, formateur. Awa l'invite, Kevin
demande aussi à être adjoint sans jeton, et rien ne s'affiche. Julien voit
la classe et ses quatre apprenants, sans « Nommer un adjoint ». La porte qui
le compte arrive chez Léa. Yanis signe une porte où il est chef, puis une
lettre entre responsables : personne n'en tient compte. Sans réseau, Inès a
deux envois en attente, un par responsable. Après l'appel, Awa passe la main
à Julien et annule, puis recommence : trente secondes après, Julien est
chef, les gestes du chef quittent l'écran d'Awa, et le téléphone de Léa suit.

Sept défauts posés exprès font chacun échouer le scénario : un jeton
ignoré, une lettre entre responsables dont on ne vérifie pas l'auteur, une
porte que l'apprenant ne suit plus, une porte acceptée sans suivre le chef,
une passation sans délai, un « Annuler » sans effet, une passation que
l'apprenant ne suit pas.

Fait ensuite le 23 novembre 2026, les réglages du chef, avec ce qui marche
déjà : les horaires. « Réglages » s'ouvre depuis « Membres », chez le chef
seulement. Les horaires se tapent comme à la création, et remplacent ceux de
toute la classe : trente secondes pour annuler, puis la porte qui les porte
part, et les téléphones des apprenants la suivent. Le scénario le joue : Julien,
devenu chef, avance le matin à 8 h 30, et Léa lit « Retour au centre : lun.
30 nov., 8 h 30 ». Deux défauts posés exprès le font échouer : des horaires
sans délai, et « Réglages » chez un adjoint.

Fait ensuite le 23 novembre 2026, corriger son nom, chez l'apprenant :

- dans le cœur, le nom corrigé, signé par l'appareil de la personne, avec
  son vecteur. 72 tests ;
- « Moi » s'ouvre depuis les entrées de l'écran du jour. Il montre le nom
  que voient les responsables, avec « Corriger », et le thème : comme le
  téléphone, clair ou sombre. Mes appareils et la phrase de secours
  viendront à l'étape 8 ;
- la fenêtre « Nom » dit à qui part la correction. Elle part aux
  responsables trente secondes après, avec « Annuler » entre-temps ;
- chez les responsables, le nouveau nom s'affiche, et l'ancien à côté. Les
  appels suivants prennent le nouveau. Une feuille déjà ouverte garde le nom
  de son ouverture.

Le scénario le joue : Léa devient Léa Martin-Dupont, et Julien voit « avant :
Léa Martin ». Le thème « Sombre » s'applique tout de suite et reste au
rechargement. Deux défauts posés exprès le font échouer : un nom envoyé sans
délai, et un thème qui ne se garde pas.

Le scénario regardait « Appel clos » à la salle après la capture du
formateur, alors que la salle ne le montre que trois secondes : une machine
chargée le manquait. Il guette maintenant la salle avant de clore.

Fait ensuite le 23 novembre 2026, un morceau de « Rejoindre une classe » :
l'app redemande l'écran d'accueil une seule fois quand le prochain cours est
à plus de sept jours, avec la raison : « Ton prochain cours est le lun. 30
nov. : d'ici là, sans visite, l'iPhone peut effacer tes données après 7
jours. » Le scénario le joue : jeudi, le retour lundi 23 ne déclenche rien.
Awa repousse au lundi 30, Léa voit la demande, touche « Plus tard », et elle
ne revient plus. Deux défauts posés exprès le font échouer : la demande qui
revient après « Plus tard », et une demande faite à trois jours.

Fait le 24 novembre 2026, plusieurs classes et « Mes cours », la suite de
« Rejoindre une classe » :

- chaque classe du téléphone a son suivi : il lit ses lettres, ses annonces
  et sa porte même quand une autre classe est à l'écran. La boîte, les fils
  et les portes passent chacun par un seul abonnement aux relais, pour toutes
  les classes ;
- ce qui était gardé à part rejoint sa classe : l'appel du formateur, et les
  présences, les annonces et le prochain cours de l'apprenant. Les anciennes
  clés sont relues une fois ;
- l'app s'ouvre sur la classe du moment : celle d'un appel ouvert, puis celle
  d'un cours connu aujourd'hui qui n'est pas fini, puis celle du prochain
  cours le plus proche, puis la dernière classe montrée. Quand un appel
  s'ouvre dans une autre classe, l'app la montre, si l'écran est sur l'entrée
  d'une classe. Au milieu d'un geste, rien ne bouge ;
- « Mes cours » s'ouvre depuis les entrées du formateur : ses classes, rangées
  par l'heure du prochain cours, et « Créer une classe », qui a son
  « Retour ». Chez l'apprenant qui a plusieurs classes, le nom de la classe
  est un bouton dans la barre, sous le lieu : il ouvre « Mes classes » ;
- la salle garde chaque classe à part, et montre celle dont le téléphone
  lance l'appel ou qu'il montre à la salle ;
- un téléphone suit dix classes au plus. Au-delà, on ne crée ni ne rejoint
  une classe, et l'écran dit pourquoi ;
- les secrets d'une classe se gardent avec elle : les tirer du code prend
  140 ms par classe, à chaque ouverture ([mesures.md](mesures.md)). Dans le
  cœur, leur format, avec son vecteur. 74 tests.

Corrigé en passant : rouvrir le lien de sa classe redemandait d'y entrer, et
effaçait l'acceptation de l'apprenant. Au rechargement, le reçu d'une
présence déjà reçue ramenait l'apprenant à l'écran du jour, même depuis
« Moi ». Un responsable qui n'avait pas l'appel de la séance pouvait
répondre « appel clos » à une présence.

Corrigé aussi, parce que le scénario a échoué une fois : une recherche
concluait « Aucune classe n'a ce code » au bout de six secondes, sur la
réponse vide d'un relais, avant que le seul relais qui avait la porte ne
réponde. Après une série d'échecs de connexion, un relais mort dans la liste
par exemple, Chromium retarde lui-même chaque nouvelle connexion d'une à cinq
secondes. Sans rien trouvé, la recherche attend maintenant les relais encore
en route, vingt secondes au plus en tout.

Le scénario le joue, jeudi. Awa crée BTS SIO 1 depuis « Mes cours » et la
montre à la salle. Inès la rejoint : elle suit deux classes, et passe à BTS
SIO 2, où elle est en entreprise. Awa lance l'appel de BTS SIO 1 : le
téléphone d'Inès montre BTS SIO 1, la salle aussi, et Inès signe. L'appel
clos de BTS SIO 2, chez Awa, ne lui répond rien. Léa rouvre le lien de sa
classe, qui s'ouvre. Sandrine Robert, au centre, tient dix classes : elle
n'en crée ni n'en rejoint une onzième. Avec leurs secrets gardés, ses dix
classes s'ouvrent en 73 ms, contre 1 443 ms sans. Nadia ouvre le lien de BTS
SIO 1 sur un réseau où le seul relais qui a la porte répond sept secondes
après l'autre : la classe s'affiche. 104 vérifications.

Quatorze défauts posés exprès font chacun échouer le scénario : l'app qui ne
change plus d'elle-même de classe, la séance qu'on ne compare plus avant de
répondre, « Mes classes » rangé sans le prochain cours, le nom de la classe
absent de la barre, la salle qui ignore la classe qu'on lui montre, une
limite à onze classes, des secrets qu'on ne garde pas, ou qu'on ne reprend
pas, le lien d'une classe connue qui redemande d'y entrer, l'appel ouvert
qui ne passe plus devant dans « Mes cours », une ligne de « Mes classes » qui
ne change pas de classe, « Créer une classe » sans « Retour », « Créer une
classe » ouvert par son lien au-delà de dix classes, et la recherche qui
conclut au bout de six secondes.

Un téléphone qui ne suit qu'une classe ne voit rien changer : l'écran du
jour, le formateur après la clôture et « Membres » sont identiques, au pixel
près, à ceux du 23 novembre 2026 (`node outils/avant-apres.mjs jour e39a689`).

Fait ensuite le 24 novembre 2026, corriger son nom chez un responsable :

- sa ligne est dans la porte, que seul le chef signe. Le responsable signe
  donc lui-même son nom corrigé, avec son appareil, comme l'apprenant. La
  correction voyage avec la porte, que toute la classe lit, et chaque
  responsable la republie chaque jour avec elle. Les noms corrigés des
  apprenants n'y passent jamais : qui a le code de la classe les lirait ;
- « Moi » s'ouvre depuis les entrées du formateur, comme chez l'apprenant :
  le nom que voit la classe, avec « Corriger », et le thème. La correction
  part trente secondes après, avec « Annuler » entre-temps ;
- les autres responsables voient l'ancien nom à côté du nouveau, dans
  « Membres ». Les apprenants lisent le nouveau partout : l'appel, une
  absence, le formateur à qui montrer son QR. L'écran « Rejoindre » le lit
  aussi, avant d'entrer.

Le scénario le joue : Awa, adjoint, devient Awa Diallo-Sow. Noah lit « appel
clos par Awa Diallo-Sow », et Julien voit « avant : Awa Diallo ». Jeudi,
l'app d'Awa republie sa correction avec la porte, et pas celle de Léa.
108 vérifications.

Cinq défauts posés exprès font chacun échouer le scénario : une correction
sans délai, un apprenant qui ignore les noms venus avec la porte, une
correction qui ne part pas avec la porte, « Membres » sans l'ancien nom, et
une republication qui emporte aussi les noms des apprenants. « Moi » chez
l'apprenant reste identique au pixel près
(`node outils/avant-apres.mjs moi e39a689`).

Fait ensuite le 24 novembre 2026, les annonces de la classe, le début de
l'étape 3 :

- dans le cœur, l'annonce à la classe, signée, avec son vecteur. L'auteur
  la modifie en signant une nouvelle version, et n'importe quel responsable
  la retire. 79 tests ;
- chez le formateur, « Classe » s'ouvre sur ses onglets, ceux qui marchent
  déjà : Fil et Membres. Le fil montre les annonces en vigueur, avec
  « Modifier » pour les siennes et « Retirer » pour toutes, puis de quoi
  écrire la sienne. Une annonce part trente secondes après, avec
  « Annuler », qui rend son texte ;
- écrite en dehors des heures de la classe, une annonce arrive à
  l'ouverture suivante, une heure avant le début du matin. La touche le
  dit : « Publier · arrivera demain à 7 h 30 ». C'est le téléphone de
  l'apprenant qui attend pour la montrer ;
- chez l'apprenant, « Classe » montre les annonces, et l'écran du jour la
  dernière de la semaine, sous « À lire ». « Écouter » la lit avec une voix
  française de l'appareil, jamais avec une voix en ligne, qui enverrait le
  texte sur Internet ;
- les relais gardent une annonce trente jours : passé trois semaines,
  chaque responsable la republie, pour qu'un apprenant qui arrive plus tard
  la reçoive encore ;
- la lettre qui tient l'ordinateur de la salle au courant ne porte plus que
  la porte, les membres et les demandes : avec les annonces, elle aurait pu
  dépasser les 60 Ko d'un relais.

Le scénario le joue, jeudi : Awa publie, annule, publie, puis modifie. Inès
lit l'annonce sous « À lire », l'écoute, puis voit « modifiée ». Noah, qui
n'a qu'une voix en ligne, n'a pas « Écouter ». Le soir, Awa écrit une
annonce qui n'arrive chez Inès que vendredi à 7 h 30. Julien, dont l'horloge
retarde de deux jours, retire la première : elle quitte la classe. Sur le
fil, rien de l'annonce annulée. 120 vérifications.

Sept défauts posés exprès font chacun échouer le scénario : une annonce qui
part sans délai, « Annuler » qui perd le texte, une annonce montrée avant
son heure, une voix en ligne prise pour lire, un retrait daté à l'heure de
l'appareil, des responsables qui n'écoutent pas le fil, et « À lire » sans
l'annonce. Les captures avant et après viennent de
`node outils/avant-apres.mjs classe` et `node outils/avant-apres.mjs fil`.

Fait ensuite le 24 novembre 2026, les messages privés, la fin de
l'étape 3 :

- dans le cœur, le message privé, signé par celui qui l'écrit, avec son
  vecteur. Il ne compte qu'entre les deux clés qu'il porte : un apprenant ne
  lit que ceux des responsables, un responsable ceux des responsables et des
  apprenants acceptés. 83 tests ;
- chez l'apprenant, « Messages » montre une ligne par responsable de la
  classe, puis la conversation. « Répondre », sous une annonce, ouvre celle
  de son auteur. Un message reçu s'annonce sous « À lire » jusqu'à ce qu'on
  l'ouvre ;
- chez le formateur, « À suivre » dit qui a écrit. « Messages » couvre
  toutes ses classes : ceux qui attendent une réponse, le plus ancien
  d'abord, puis ceux à qui il a répondu, et un champ pour chercher un nom ;
- un message part tout de suite, scellé dans la boîte de celui à qui il est
  écrit. Écrit en dehors des heures de la classe, il arrive à l'ouverture
  suivante, comme une annonce, et la touche le dit ;
- ouvrir un message n'envoie rien : il n'est marqué comme lu que sur le
  téléphone qui l'ouvre ;
- les relais gardent un message trente jours, et chaque appareil relit sa
  boîte sur trente jours.

Le scénario le joue, vendredi : Inès répond en privé à l'annonce d'Awa.
Awa le voit dans « À suivre », puis dans « Messages », et répond. Inès lit
la réponse, et rien ne part quand elle l'ouvre. Le soir, son message
n'arrive chez Awa que lundi à 7 h 30. Le message que Yanis, un apprenant,
écrit à Inès ne compte pas, celui de Julien, si. Noah rouvre l'app dix jours
après un message de Julien, et le reçoit. Un message ou une annonce de plus
de 8 Ko ne part pas. 139 vérifications.

Six défauts posés exprès dans le cœur font échouer ses tests : un message
lu sans regarder entre qui il est, sans vérifier sa signature, écrit à
soi-même, venu d'une autre classe, avec deux champs inversés, ou qui perd
son annonce. Onze défauts posés exprès dans le site font chacun échouer le
scénario : un message envoyé en clair, un apprenant qui croit l'auteur d'un
message, un message ouvert qui prévient l'autre, un message montré avant
son heure, un message reçu jamais marqué nouveau, ou jamais marqué lu,
« Répondre » qui oublie l'annonce, la boîte relue sur sept jours,
« Messages » réduit à une classe, « Retour » qui ramène au cours, et un
message du soir qui arrive tout de suite. Deux d'entre eux passaient
d'abord : une vérification regardait l'écran et pas ce que garde le
téléphone, l'autre envoyait le message de Julien à Noah l'app ouverte.
Elles sont renforcées. Les captures avant et après viennent de
`node outils/avant-apres.mjs messages` et
`node outils/avant-apres.mjs messages-formateur`.

Corrigé en passant : une annonce de plus de 8 Ko restait bloquée sur « part
à la classe », le cœur refusant de la signer. L'écran le dit maintenant
sous le champ, comme pour un message.

Le premier chargement de l'apprenant passe à 297 Ko compressés, pour un
plafond de 300 : une question ouverte, avec une recommandation, avant
l'étape 5 ([questions-ouvertes.md](questions-ouvertes.md)).

Fait ensuite le 25 novembre 2026, les feuilles closes chez chaque
responsable, le début de l'étape 4 :

- quand sa clôture ne s'annule plus, la feuille part aux autres
  responsables, dans une lettre que les relais gardent trente jours. Chacun
  vérifie le journal ligne à ligne, et garde huit semaines ce qu'il dit : les
  présents et l'heure de leur présence, les absents. Une feuille tenue par
  quelqu'un qui n'est pas responsable ne compte pas ;
- dans une conversation avec un apprenant, le formateur voit « Sa semaine »,
  d'après ces feuilles, comme dans la maquette ;
- les écrans des responsables et de la salle se chargent à part : un
  apprenant ne les télécharge pas. Son premier chargement redescend de 297 à
  289 Ko, et les absences peuvent s'ajouter.

Le scénario le joue : quand la clôture de mardi ne s'annule plus, Julien
reçoit la feuille d'Awa et la garde, trois présents et Noah absent. La
feuille du faux appel de Yanis, qui a le code, ne compte pas. Vendredi, la
conversation avec Noah montre son absence de mardi matin. Aucun script que
charge un apprenant ne contient les écrans des responsables. 143
vérifications.

Quatre défauts posés exprès font chacun échouer le scénario : une feuille
gardée sans partir aux autres, une feuille gardée quel que soit celui qui
l'a tenue, « Sa semaine » sans les feuilles, et les écrans des responsables
remis dans le chargement de l'apprenant. Ce dernier passait d'abord : il
pèse 299,2 Ko, sous le plafond. La vérification regarde maintenant ce que
l'apprenant télécharge. La capture avant et après vient de
`node outils/avant-apres.mjs sa-semaine`.

## La suite : la première version complète

Le mainteneur ne veut ni bêta ni essai avec une classe (17 novembre 2026) :
on construit directement la première version complète
([projet.md](projet.md), partie 5), dans cet ordre.

1. Rejoindre une classe et être accepté, les responsables et les réglages.
   Fait en partie le 17 novembre 2026 : créer, inviter, rejoindre, accepter,
   les membres, et le site installable qui marche sans réseau. L'écran
   d'accueil redemandé avant plus de sept jours sans cours est fait le 23
   novembre 2026. Nommer un adjoint, passer la main et les horaires dans les
   réglages du chef sont faits le même jour, et corriger son nom chez
   l'apprenant. Plusieurs classes, « Mes cours » et le nom corrigé d'un
   responsable sont faits le 24 novembre 2026. « Refaire l'invitation », qui
   donnerait un nouveau code à la classe, attend le mainteneur
   ([questions-ouvertes.md](questions-ouvertes.md)). Les
   interrupteurs des réglages viendront avec leurs fonctions : l'identité avec
   « Moi », les documents à l'étape 5, le suivi à l'étape 6. À l'ordinateur,
   la conception met « Mes cours » à gauche et le cours au milieu. Le site
   montre encore chaque écran du formateur comme au téléphone.
2. L'appel complet : la caméra, l'appel annoncé sur le fil de la classe, les
   relais publics, l'écran d'entrée de chacun. Il passe avant la fin du 1 :
   sans les relais publics, rien ne marchait hors des tests. Les relais
   publics, l'appel annoncé sur le fil et la caméra sont faits le 17
   novembre 2026. La caméra du formateur, la semaine de l'apprenant, « En
   règle » et le prochain cours sont faits le 23 novembre 2026. « À lire »
   montre les annonces depuis le 24 novembre 2026. Reste, pour l'écran
   d'entrée : « Ensuite » et les documents dans « À lire », qui viendront
   avec les documents, et l'écran d'entrée du centre et du tuteur, qui
   viendront avec eux.
3. Les annonces et les messages privés. Les annonces, puis les messages
   privés et « Répondre » à une annonce, sont faits le 24 novembre 2026.
   « Joindre » viendra avec les documents, à l'étape 5. La semaine de
   l'apprenant, en haut de sa conversation chez le formateur, viendra avec
   les absences, à l'étape 4 : le formateur ne garde pas encore les feuilles
   closes.
4. Les absences, et la page du tuteur. Fait en partie le 25 novembre 2026 :
   chaque responsable garde les feuilles closes de la classe, et voit la
   semaine d'un apprenant dans sa conversation. Restent, dans l'ordre :
   « Mes présences », « Justifier » et « C'est une erreur » chez
   l'apprenant ; le fichier en morceaux, pour le justificatif ; le tuteur,
   son lien, « Prévenir l'entreprise » et sa page.
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
npm run construire                              # le cœur, l'interface, et leur poids
npm run verifier                                # les types de l'interface, après le cœur
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
tests, les appareils se parlent par de petits relais Nostr lancés en local
(`site/outils/relais.mjs`). `mesures/relais.mjs`, lui, mesure les relais
publics.

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
- l'icône de l'app est le pictogramme « lien » du matériel, clair sur
  l'accent ;
- le service worker ne garde d'avance que les polices des premiers écrans.
  Les autres se gardent la première fois qu'un écran s'en sert ;
- en attendant « relier un appareil », le téléphone et l'ordinateur du
  formateur ont les mêmes clés. C'est ainsi que l'ordinateur reçoit l'état de
  la classe et montre la salle.

Pour les relais (17 novembre 2026) :

- les relais de secours ne servent que tant que moins de deux principaux
  répondent. Ils se referment quand deux principaux répondent de nouveau ;
- un relais qui refuse un message est écarté dix minutes, sur l'appareil
  seulement ;
- une connexion qui ne s'ouvre pas en huit secondes est abandonnée, et
  retentée trois secondes plus tard ;
- une recherche rend ce qu'elle a trouvé au bout de six secondes. Sans rien
  trouvé, elle attend encore les relais en route, vingt secondes au plus en
  tout (corrigé le 24 novembre 2026) ;
- l'appareil garde au plus 300 envois en mémoire pour les relais qui se
  connectent plus tard. Ce qu'aucun relais n'a accepté n'est jamais écarté
  avant son expiration.

Pour l'appel annoncé sur le fil (17 novembre 2026) :

- avant l'appel, l'écran dit « Pas d'appel ouvert » plutôt qu'« En règle » :
  sans « Ma semaine », le téléphone ne sait pas si une demi-journée
  d'avant manque ;
- clos sans présence, l'écran dit « Une absence », le mot de la conception,
  sans rouge et sans geste pour l'instant : « Justifier » viendra avec les
  absences ;
- sans réseau, la touche revient au bout de cinq secondes sans relais ;
- l'annonce reste un jour sur les relais.

Pour la caméra (17 novembre 2026) :

- quircs plutôt que rqrr pour lire les QR, à cause du poids mesuré ;
- cinq images lues par seconde, réduites à 640 pixels de large ;
- sans annonce de l'appel, un QR du matin ou de l'après-midi du jour est
  accepté : un appel se lance parfois un peu avant l'heure.

Pour l'écran d'entrée et le prochain cours (23 novembre 2026) :

- le prochain cours est sa propre annonce sur le fil, signée, plutôt qu'un
  champ de l'annonce de clôture : il reste sur les relais jusqu'au cours,
  alors que l'annonce de l'appel n'y reste qu'un jour ;
- l'app propose le prochain cours en reprenant l'écart de la dernière fois :
  la dernière fois que la classe a eu cours ce jour-là, à cette
  demi-journée, et le cours qui a suivi. Sans rien de tel, la demi-journée
  suivante. Une alternance revient ainsi d'elle-même ;
- « Changer » propose les demi-journées des trois semaines qui viennent,
  groupées par semaine. Le prochain cours part trente secondes après, avec
  « Annuler » entre-temps ;
- « Présence signée » reste à l'écran tant que l'appel n'est pas clos. Clos,
  la réponse devient « En règle », et la preuve reste dans la case de la
  semaine, comme dans les maquettes `apprenant-jour-signe` et
  `apprenant-jour-en-regle` ;
- une absence de la semaine passe avant « Pas d'appel ouvert » et « En
  règle » : « Une absence », avec le jour. « Justifier » viendra avec les
  absences ;
- une demi-journée passée dont le téléphone ne sait rien reste une case
  vide : ni présence, ni absence ;
- le week-end, la barre dit « Centre fermé » ;
- les présences signées restent huit semaines sur le téléphone, les
  annonces de l'appel sept jours, et les demi-journées de cours huit
  semaines chez le formateur. « Mes présences », avec les semaines d'avant,
  dira s'il faut garder les présences plus longtemps ;
- « Ma semaine » n'ouvre pas encore « Mes présences » : le chevron des
  maquettes viendra avec cette fenêtre ;
- dans « Membres », « des apprenants » reste une liste sous les
  responsables, comme le 17 novembre, plutôt que la ligne « 24 apprenants »
  de la maquette. « Inviter un tuteur » et « Fermer la classe » viendront
  avec leurs étapes ;
- « accepté le » devient « depuis le », dans « Membres » : l'app ne connaît
  pas le genre de la personne ;
- « Réglages » s'ouvre depuis « Membres », chez le chef, en attendant
  l'écran « Classe » de la conception. Il ne montre que les horaires : un
  interrupteur qui ne fait encore rien ne s'affiche pas ;
- les nouveaux horaires attendent trente secondes, avec « Annuler » : ils
  remplacent ceux de toute la classe ;
- la fenêtre pour corriger son nom n'était pas dessinée : elle reprend les
  champs de « Rejoindre », et sa barre dit « Nom ». Le nom corrigé attend
  trente secondes, avec « Annuler » ;
- le thème choisi dans « Moi » se garde sur l'appareil (`theme`). Sans
  choix, l'app suit le téléphone ;
- l'écran d'accueil se redemande dès que le prochain cours est à plus de
  sept jours, et pas seulement à la dernière demi-journée avant : un
  apprenant qui ouvre l'app le lendemain court le même risque. Ailleurs que
  sur iPhone, la raison reste « tu le retrouves d'un geste », car seul
  Safari efface après sept jours.

Pour plusieurs classes (24 novembre 2026) :

- la classe du moment : un appel ouvert passe d'abord, puis un cours connu
  aujourd'hui qui n'est pas fini, puis le prochain cours le plus proche, puis
  la dernière classe montrée. L'app ne change d'elle-même de classe que pour
  une classe plus pressée, et seulement depuis l'écran d'entrée ;
- chez le formateur, le cours de maintenant se reconnaît à son appel clos,
  au prochain cours annoncé, ou, quand ce prochain cours est passé, à
  l'habitude : un cours le même jour de la semaine, à la même demi-journée,
  dans les huit semaines gardées ;
- chez l'apprenant, une classe dont il ne sait rien ne passe pas devant une
  classe dont il connaît le cours ;
- au téléphone, « Mes cours » est un écran à part, ouvert depuis l'entrée du
  même nom. La maquette ne le dessine qu'à l'ordinateur. Ses lignes ont un
  chevron, comme les autres lignes qui ouvrent un écran au téléphone. Chez
  l'apprenant, il s'appelle « Mes classes », et n'a pas « Créer une classe » ;
- le nom de la classe, dans la barre de l'apprenant, est un bouton toujours
  sous le lieu, quelle que soit la longueur de la date. Tant que la demande
  attend, la barre porte déjà le nom de la classe : le bouton dit alors
  « Mes classes » ;
- un téléphone suit dix classes au plus
  ([questions-ouvertes.md](questions-ouvertes.md)). Au-delà, l'écran dit
  « Une classe fermée libère sa place » ;
- la salle montre la classe de la dernière lettre « appel » ou « montrer »
  du téléphone, et sa seule classe s'il n'en a qu'une ;
- les secrets d'une classe se gardent sur l'appareil, avec elle.

Pour le nom d'un responsable (24 novembre 2026) :

- le responsable signe lui-même son nom corrigé, plutôt que de demander au
  chef de signer une porte où il change. La porte garde l'ancien nom, que
  les autres responsables voient à côté du nouveau ;
- le nom se corrige classe par classe, comme chez l'apprenant. Le prénom et
  le nom de l'appareil, que reprend « Créer une classe », suivent la
  dernière correction ;
- « Moi » chez le formateur reprend celui de l'apprenant, sans maquette à
  lui : le nom et le thème.

Pour les annonces (24 novembre 2026) :

- « Classe » chez le formateur s'ouvre sur le fil. Ses onglets sont ceux de
  la maquette de l'ordinateur, à 44 px au téléphone : la maquette les
  dessine pour la souris ;
- « Modifier » et « Retirer » sont sous chaque annonce du fil : la maquette
  ne les dessine pas. Retirer attend aussi trente secondes ;
- « Annuler » rend le texte de l'annonce, pour la corriger ;
- « À lire » montre la dernière annonce arrivée dans la semaine ;
- une modification ou un retrait date d'après la version qu'il remplace,
  même si l'horloge de l'appareil retarde, comme pour la porte ;
- une annonce se republie passé trois semaines, et vit sur les appareils
  jusqu'à son retrait ;
- « Écouter » ne se montre que si l'appareil a une voix française à lui.

Pour les feuilles closes (25 novembre 2026) :

- la feuille part aux autres responsables quand sa clôture ne s'annule
  plus, et reste trente jours sur les relais ;
- chacun garde huit semaines ce qu'elle dit, pas le journal entier : le
  stockage du navigateur n'y suffirait pas. Le journal gardé des années
  viendra avec l'export, à l'étape 5 ;
- les écrans des responsables, de la salle et de « Créer une classe » se
  chargent à part.

Pour les messages privés (24 novembre 2026) :

- un message part tout de suite, sans « Annuler » : il ne remplace rien et
  ne va qu'à une personne. La règle 6 vise les envois à toute la classe ;
- les relais gardent un message trente jours, et chaque appareil relit sa
  boîte sur trente jours, au lieu de sept : un apprenant en entreprise trois
  semaines le reçoit encore ;
- « Répondre » garde l'annonce à laquelle on répond. La conversation le
  dit sous le message : « en réponse à l'annonce du ven. 20 nov. » ;
- « Messages » chez le formateur couvre toutes ses classes, comme le veut
  la maquette. Chercher un nom trouve aussi ceux à qui il n'a pas encore
  écrit. Un responsable qui partage plusieurs classes avec lui a une ligne
  par classe, avec le nom de la classe ;
- « À lire » et « À suivre » montrent une ligne par personne qui a écrit,
  jusqu'à ce qu'on ouvre la conversation. « T'ont écrit » la garde jusqu'à
  la réponse ;
- dans une conversation, la date s'écrit quand le jour change. Chez celui
  qui l'a écrit, un message qui attend l'ouverture de la classe dit
  « arrivera lundi à 7 h 30 ».

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
- `node outils/avant-apres.mjs <cas> [référence]`, dans `site/`, après
  `npm run construire`, fait cette planche : il construit à part la version
  de la référence (`main` par défaut), pose la même classe inventée dans
  les deux, et écrit `captures/avant-apres-<cas>.png`. Les cas `jour`,
  `signer`, `semaine`, `lire`, `prochain`, `redemande`, `membres`,
  `adjoint`, `passer`, `reglages`, `moi`, `moi-formateur`, `mes-cours`,
  `deux-classes`, `classe`, `fil`, `messages`, `messages-formateur` et
  `sa-semaine` existent. Un écran neuf ajoute le sien dans `CAS` : ses états, et le
  geste qui mène à l'écran.
- Un contrôle neuf se prouve en cassant exprès ce qu'il garde : le
  scénario doit échouer ([regles.md](regles.md), partie 4). On casse dans
  une copie du site hors du dépôt, faite comme le fait `avant-apres.mjs`
  (le cœur et les maquettes en liens), pour ne jamais laisser le dépôt dans
  un état cassé.
- Le scénario de la classe se relance après chaque morceau, et les
  planches se refont depuis ses captures (`node outils/planches.mjs`).
