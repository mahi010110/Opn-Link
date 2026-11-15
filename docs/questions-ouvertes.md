# Questions ouvertes

Le 15 novembre 2026, toutes les questions de produit ont été tranchées, et ce
qui pouvait se mesurer à distance a été mesuré ([mesures.md](mesures.md)). Les
décisions sont dans [carnet.md](carnet.md) et reportées dans
[projet.md](projet.md), [ux.md](ux.md) et [architecture.md](architecture.md).

## À choisir avant les maquettes

Le mainteneur a refusé les premières maquettes le 15 novembre 2026 : elles
reprenaient le style et l'UX d'OpenContact. La recherche faite le même jour
est dans [recherche/usagers-et-ecrans.md](recherche/usagers-et-ecrans.md).

### Les interfaces

Proposé : une interface par public, chacune pensée pour ses écrans. Le même
cœur dessous, et chacun ne voit que les gestes de son rôle.

- L'apprenant : son téléphone, une action à la fois.
- Le formateur : son cours, au téléphone ou à l'ordinateur, et l'écran de la
  salle pour l'appel, lu de loin.
- Le centre : son bureau, à l'ordinateur, avec des listes, des filtres et des
  exports.
- Le tuteur : une page ouverte depuis un e-mail, sans app ni compte.

### La direction du design

#### A. Une chose à la fois

- L'apprenant ouvre l'app sur ce qu'il doit faire maintenant, en grand :
  signer sa présence, signer un document, envoyer un fichier. Une fois fait,
  la chose suivante prend la place. Quand il n'y a rien, il lit les nouvelles
  de sa classe.
- L'appel s'ouvre en plein écran sur l'écran de la salle : un code géant, le
  QR, et le nombre de présents qui monte, comme l'écran d'attente de Wooclap
  ou de Kahoot que les apprenants connaissent. On y voit combien sont là,
  jamais qui manque : la liste des absents reste sur l'appareil du formateur.
- L'apparence vient de la signalétique : de grands caractères, des contrastes
  nets, peu de couleurs, des pictogrammes toujours avec leur mot, une couleur
  par classe. Le texte en Luciole.
- Pour : le moins de décisions possible, lisible de loin et par ceux qui
  lisent mal. Contre : moins de vue d'ensemble, que le formateur et le centre
  retrouvent dans leurs interfaces.

#### B. Le fil de la classe

- Chaque classe est une conversation, comme un groupe d'annonces WhatsApp.
  Les annonces, les documents à signer et l'appel y arrivent comme des
  messages, avec leur bouton. Les messages privés aux formateurs sont à côté.
- L'apparence d'une messagerie sobre : des bulles et des cartes d'action.
- Pour : rien à apprendre, et ça remplace le groupe WhatsApp de la classe,
  sans numéro de téléphone et avec des heures calmes. Contre : une action
  importante peut se perdre sous les messages, et Opn-Link devient une
  messagerie de plus.

#### C. La semaine

- L'app s'ouvre sur la semaine. Chaque demi-journée dit où l'on est (au
  centre, en entreprise) et ce qui s'y passe : l'appel, un document à rendre
  vendredi.
- L'apparence d'un agenda calme : la date en grand, le matin et l'après-midi
  bien séparés, une couleur par classe.
- Pour : on voit venir, et ça suit le rythme de l'alternance. Contre : il faut
  savoir quels jours l'apprenant est au centre, ce que la première version ne
  gère pas, et les messages trouvent mal leur place dans un agenda.

Recommandation : A, avec les quatre interfaces. C'est la direction qui sert
le mieux le geste de tous les jours (la présence en deux gestes), ceux qui
lisent mal et l'écran de la salle. Le plus sûr pour choisir : dessiner
l'écran de la présence dans les trois directions et comparer les images.

### Ce qu'on garde d'OpenContact

Proposé : les règles sur les données et la vie privée, l'accessibilité, les
tests et la façon de livrer. Le design, la navigation et l'UX sont propres à
Opn-Link.

## À mesurer sur place

Rien de tout ça ne change les écrans. Ça change le code, et ça se mesure avec
un vrai centre.

- Le Wi-Fi d'un vrai centre : ce qu'il bloque, et si deux appareils peuvent se
  parler en direct.
- Trente vrais téléphones dans une salle, derrière la box du centre.
- La caméra de vrais iPhone et de vieux Android, avec le site ajouté à
  l'écran d'accueil ou non.
- La vitesse de lecture d'un QR sur un vieux téléphone.

## À fixer au prototype

- Le nombre maximum de classes. Les relais acceptent de 20 à 200 abonnements
  par connexion, et un seul abonnement peut suivre plusieurs classes : la
  limite viendra plutôt du volume de messages. Une dizaine semble un bon point
  de départ.

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
- Signaler aux auteurs d'underskrift le bug de la signature ECDSA, si le
  mainteneur le veut.
- Remesurer les relais de temps en temps avec `mesures/sonde-relais.mjs`.
- Ajouter les fichiers de licence (MIT et Apache-2.0) avec le premier commit
  de code.
- Quand on fera le lien avec OpenContact, écrire dans son `CLAUDE.md` et son
  `CONTRAT.md` les deux nouveautés : le résumé envoyé aux responsables, et
  l'amitié automatique entre apprenants d'une même classe.
