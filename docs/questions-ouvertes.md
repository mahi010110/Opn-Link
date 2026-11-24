# Questions ouvertes

Le 15 novembre 2026, toutes les questions de produit ont été tranchées, et ce
qui pouvait se mesurer à distance a été mesuré ([mesures.md](mesures.md)). Les
décisions sont dans [carnet.md](carnet.md) et reportées dans
[projet.md](projet.md), [ux.md](ux.md) et [architecture.md](architecture.md).

## Le prototype

Le cadrage, la conception, les maquettes et les règles sont validés. Le
prototype de l'appel a commencé le 16 novembre 2026, avec le feu vert du
mainteneur. Le plan et l'avancée sont dans [prototype.md](prototype.md).

### Les choix du cœur et des écrans

Le cœur et les écrans ont demandé des choix que la doc ne fixait pas. Ils
sont listés dans [prototype.md](prototype.md), partie « Les choix du
prototype, à valider », et décrits dans [contrat.md](contrat.md). Ceux du
17 novembre 2026 concernent l'entrée dans une classe : le code qui n'ouvre
que la porte, la demande laissée dehors sans réponse, le nom du formateur
demandé à la création. Puis les relais : ceux de secours ne servent que tant
que moins de deux principaux répondent, et un relais qui refuse est écarté
dix minutes. Puis l'appel annoncé sur le fil : « Pas d'appel ouvert » avant
l'appel, « Une absence » après, et la touche gardée sans réseau. Puis la
caméra : quircs au lieu de rqrr pour lire les QR, à cause du poids. Puis,
le 23 novembre 2026, l'écran d'entrée : le prochain cours annoncé à part
sur le fil, proposé en reprenant l'écart de la dernière fois, « En règle »
une fois l'appel clos, et les durées de vie sur le téléphone. Puis les
responsables : le jeton de l'invitation d'adjoint, sept jours, et la fusion
de l'état partagé entre responsables, où rien ne se retire. Puis, le 24
novembre 2026, plusieurs classes : la façon de choisir la classe du moment,
le nom de la classe dans la barre de l'apprenant, et les secrets de chaque
classe gardés sur l'appareil.

### Rejoindre une autre classe

Un apprenant qui a déjà une classe en rejoint une autre par le lien ou le
QR de la classe. Il ne peut pas taper son code : « Taper un code » n'est
que sur l'écran sans classe, comme dans la conception.

Recommandation : ajouter « Rejoindre une classe » en bas de « Mes
classes », qui mène à « Taper un code ». Le formateur montre le QR à la
salle, mais un apprenant au fond de la salle, ou absent ce jour-là, n'a que
le code.

### Refaire l'invitation

[contrat.md](contrat.md), partie « Le secret du fil », dit déjà : retirer un
membre change le secret du fil, et le code de la classe ne change que si le
chef refait l'invitation. [projet.md](projet.md), partie 5, dit encore
« Retirer un membre change le code de la classe », comme dans OpenContact.
Aucune maquette ne dessine « refaire l'invitation ».

Le code ne fait qu'ouvrir la porte : il permet de demander à entrer. Il sert
aussi d'identité à la classe : ses séances, son étiquette sur les relais et
ce que garde le téléphone en sont tirés. Le changer, c'est presque refaire la
classe.

Recommandation : suivre le contrat, et corriger projet.md. Retirer un membre
change le secret du fil, que les autres membres reçoivent par une lettre.
Refaire l'invitation ne sert que si une photo du QR circule et que des
inconnus demandent à entrer : « Laisser dehors » y répond déjà, et le
prototype ne refait pas le code.

## La conception

Le 15 novembre 2026, le mainteneur a laissé le choix de la direction, et veut
un concept d'UX plutôt qu'une maquette finie, pour laisser sa part de
créativité à Fable 5. Retenu : « une chose à la fois, au bon moment ». Tout ce
que Fable 5 doit savoir pour concevoir l'app est dans
[brief-conception.md](brief-conception.md). Les trois directions explorées
avant ce choix y sont résumées, partie 10.

### La conception de Fable 5

Le concept, « la réponse d'abord », est accepté (15 novembre 2026). Il est
dans [conception.md](conception.md), avec la navigation. Les six
recommandations de sa partie 10 sont retenues (« Go », 16 novembre 2026).
Les maquettes de [../maquettes/](../maquettes/) sont validées (« Tout est
bon pour moi », 16 novembre 2026). Ce qui reste à essayer avant de coder
ces écrans est en partie 11 de [conception.md](conception.md).

Les écrans qui restaient sont dessinés et validés depuis : 71 écrans en
tout (16 novembre 2026).

### Le ton

Retenu le 16 novembre 2026 (« Ok super, go ») : l'app tutoie l'apprenant,
le formateur et le centre, et vouvoie le tuteur. Les maquettes validées
parlent déjà ainsi.

### Quel appareil signe la présence

Tranché le 16 novembre 2026, comme recommandé : un seul appareil signe la
présence, le téléphone qu'un responsable a accepté. Le détail est dans
[projet.md](projet.md), partie 5, et [architecture.md](architecture.md),
partie « La preuve d'une présence ou d'une signature ».

### Les règles d'Opn-Link

Tranché le 16 novembre 2026 : les règles de [regles.md](regles.md) sont
validées (« Tout est bon pour moi »). Elles remplacent `exigences.md` et les
six règles du `CLAUDE.md`.

## Ce qui ne se saura qu'à l'usage

Il n'y a ni bêta ni essai avec une classe avant la sortie (décision du
17 novembre 2026). Ces points se découvriront à la première vraie
utilisation. L'app a déjà ses chemins de secours : le code de six chiffres
quand la caméra ne marche pas, le QR quand il n'y a pas de réseau.

- Le Wi-Fi d'un vrai centre : ce qu'il bloque, et si deux appareils peuvent se
  parler en direct.
- Trente vrais téléphones dans une salle, derrière la box du centre.
- La caméra de vrais iPhone et de vieux Android, avec le site ajouté à
  l'écran d'accueil ou non.
- La vitesse de lecture d'un QR sur un vieux téléphone.

## À fixer au prototype

- Le nombre maximum de classes. Les relais acceptent de 20 à 200 abonnements
  par connexion, et un seul abonnement peut suivre plusieurs classes : la
  limite viendra plutôt du volume de messages. Le prototype la fixe à dix le
  24 novembre 2026, à valider. Avec leurs secrets gardés, dix classes
  s'ouvrent en 73 ms dans Chromium ([prototype.md](prototype.md)).
- Le plafond de poids du site de l'apprenant : 300 Ko compressés au premier
  chargement sont retenus. Le cœur seul en pèse 186 ([mesures.md](mesures.md)).
- Les largeurs où l'écran passe à deux puis à trois fenêtres : 600 et 901 px
  sont retenus.

## À faire

- Créer l'organisation GitHub `opn-link`. C'est gratuit, et c'est au
  mainteneur de le faire depuis son compte. Le nom avait l'air libre le
  15 novembre 2026. L'adresse exacte du site (`opn-link.github.io`, avec ou
  sans chemin) se réglera au premier déploiement.
- Mettre le site en ligne pour l'essayer. Le mainteneur le demande le
  24 novembre 2026, et verra plus tard. Ce dépôt est privé : GitHub Pages
  gratuit ne publie qu'un dépôt public, et le site doit d'abord être
  construit. Recommandation : un dépôt public de l'organisation `opn-link`,
  qui ne reçoit que le site construit, déposé par un workflow à chaque
  fusion dans `main`. Ce dépôt-ci reste privé.
- Vérifier que le nom est libre ailleurs : nom de domaine, INPI. Des noms
  proches comme « OpenLink » existent déjà.
- Faire valider la feuille de présence exportée par deux ou trois OPCO et un
  certificateur Qualiopi avant qu'un centre compte dessus pour être payé.
- Signaler aux auteurs d'underskrift le bug de la signature ECDSA, si le
  mainteneur le veut.
- Remesurer les relais de temps en temps avec `mesures/sonde-relais.mjs`.
- Quand on fera le lien avec OpenContact, écrire dans son `CLAUDE.md` et son
  `CONTRAT.md` les deux nouveautés : le résumé envoyé aux responsables, et
  l'amitié automatique entre apprenants d'une même classe.
