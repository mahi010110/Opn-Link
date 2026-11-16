# Le brief de conception

Pour Fable 5, qui va concevoir l'app. Écrit le 15 novembre 2026, à la demande
du mainteneur.

Le mainteneur veut une masterclass de design et de navigation : « J'aimerais
être surpris par des démarches audacieuses et une manière de faire
intelligente et perspicace. » Ce brief rassemble ce qui est su, ce qui est
décidé et ce qui reste à inventer, pour que tu passes ton temps sur la
conception elle-même. Lis-le en entier avant de dessiner.

## 1. Ce qu'on attend de toi

- Un concept d'UX pour Opn-Link, pensé pour ses usagers et pour chacun de
  leurs écrans. Rien qui ressemble à l'interface d'OpenContact, et pas une
  variante des explorations déjà faites (partie 10).
- La navigation de chaque interface : par où on entre, où l'on va, comment on
  revient.
- Les écrans des moments clés (partie 5), en maquettes HTML faites avec le
  matériel « Utilitaire 98 » (partie 3).
- Pour chaque choix fort, sa raison en une ou deux phrases, et ce que tu as
  écarté.
- Les gestes de chaque moment, comptés, à côté de leur objectif.

Montre d'abord le concept en mots et la carte de la navigation, puis les
maquettes. Les maquettes se montrent au mainteneur en captures avant
d'arriver sur `main` : au téléphone (390 × 844 et 360 × 640), à l'ordinateur
(1280 × 800), sur l'écran de la salle, en clair et en sombre.

## 2. Opn-Link en quelques lignes

Opn-Link relie un centre de formation, ses formateurs, ses apprenants et
leurs tuteurs en entreprise. On y signe sa présence chaque demi-journée, on y
signe des documents, le centre et les formateurs y publient des annonces et
des supports de cours, et chaque apprenant peut leur écrire en privé.

- Libre et gratuit. Pas de serveur, pas de compte : les données restent sur
  les appareils, les messages passent par des relais publics, et un QR code
  fait passer ce qu'il faut quand il n'y a pas de réseau.
- La première version sort sur le web, installable sur l'écran d'accueil, et
  en app pour ordinateur. Son contenu est dans [projet.md](projet.md),
  partie 5.
- Elle vise les centres de formation et le post-bac : CFA, BTS, BUT.

## 3. Ce qui est fixé

### Le concept directeur : une chose à la fois, au bon moment

L'app sait où en est chacun : la demi-journée en cours, si l'apprenant est au
centre ou en entreprise cette semaine, ce qui arrive à échéance. Elle met en
avant la seule chose à faire maintenant, en grand. Le reste (les annonces,
les messages, les documents déjà signés) se lit quand on veut, sans
insister.

Trois directions ont été explorées sur l'écran de la présence (partie 10).
Le mainteneur a laissé le choix, et celle-ci les réunit : l'action du moment
(A), le rythme de la semaine (C), et le fil de la classe pour lire (B). La
façon de la faire vivre, à l'écran et dans la navigation, est à toi.

### Une interface par personne et par écran

| Interface | Pour qui | Écrans | Ce qu'on y fait surtout |
|---|---|---|---|
| L'apprenant | l'apprenant | son téléphone, parfois un ordinateur | signer sa présence, signer et envoyer des documents, lire, écrire à ses formateurs |
| Le cours | le formateur | son téléphone, son ordinateur | lancer et clore l'appel, publier, demander, suivre, répondre |
| L'écran de la salle | toute la classe | le vidéoprojecteur ou l'écran de la salle | lire de loin le QR et le code de l'appel |
| Le bureau | le centre | l'ordinateur | suivre toutes les classes, exporter les feuilles de présence, garder les preuves |
| Le lien du tuteur | le tuteur | un e-mail, puis une page | voir les présences et les absences de son apprenti |

Une personne ne voit que les gestes de son rôle, même pas grisés. Le cœur est
le même sous toutes les interfaces. Chacune s'adapte au téléphone, à la
tablette, à l'ordinateur et à l'écran de la salle.

### Le matériel « Utilitaire 98 »

Opn-Link utilise le matériel de design d'OpenContact, et seulement lui : ses
jetons de couleurs, d'espacements, de reliefs et de trames, ses trois
polices, ses icônes. Il se prend dans le dépôt d'OpenContact par un script
(partie 11), jamais recopié à la main.

Ses règles viennent du kit d'OpenContact (`design/readme.md` et
`design/SKILL.md`).

- coins droits (0 ou 2 px), traits de 1 px à l'encre, ombres dures sans
  flou, aucun dégradé ;
- le teal pour ce qui se touche, le bleu marine seulement pour la sélection
  et les barres de titre, jamais les deux sur le même élément ;
- trois états de relief : relevé, enfoncé, en creux ;
- la trame en damier avec parcimonie : barres de titre inactives, ce qui
  n'est pas disponible, le voile derrière une fenêtre ; jamais derrière un
  texte ;
- Silkscreen pour les titres, seulement à 8, 16 ou 24 px ; IBM Plex Mono
  pour les données (heures, dates, compteurs, codes) ; Public Sans pour le
  texte ;
- les icônes pixelarticons, jamais d'emoji ;
- le focus en pointillé ;
- le thème sombre, obligatoire, est un anthracite aux traits clairs, pas une
  inversion ;
- les objets réagissent tout de suite, seuls les passages d'un état à un
  autre glissent, et vite.

Les composants et les écrans d'OpenContact (sa barre du bas, ses feuilles,
ses onglets, son accueil) ne s'appliquent pas tels quels. Prends le langage,
invente la navigation.

### Ce que la première version contient

Rejoindre une classe (par un QR ou un code, avec son prénom et son nom), les
responsables (le chef, ses adjoints, le centre), les annonces, les messages
privés, la présence, les absences et leurs justificatifs, les documents à
signer, les demandes, la documentation partagée, le suivi de la recherche de
stage ou d'alternance, le tableau de bord des responsables, plusieurs
appareils avec une phrase de secours, et la fermeture de la classe. Le
détail est dans [projet.md](projet.md), partie 5.

### Les décisions de produit qui encadrent le dessin

- La classe est un fil d'annonces : seuls les responsables y écrivent.
  L'apprenant répond en privé. Les apprenants ne s'écrivent pas entre eux.
- La présence se signe d'un geste, avec la clé de l'appareil, en visant le
  QR du formateur, qui change toutes les quelques secondes, ou en tapant le
  code de 6 chiffres affiché dessous. Sans téléphone, l'apprenant signe sur
  l'appareil du formateur. Sans réseau, il montre au formateur un QR qui
  contient sa signature.
- À la clôture de l'appel, le formateur contresigne, chaque case vide devient
  « absent », et plus rien n'entre, sauf une correction du formateur, qui
  reste visible.
- Un document se lit en entier avant d'être signé. On dessine sa signature au
  doigt, ou on tape son nom, une fois pour tous les documents envoyés
  ensemble.
- Ni « vu », ni « en train d'écrire », ni « en ligne » : rien ne dit à
  l'autre quand on a ouvert quelque chose.
- Peu de réglages : un réglage existe seulement quand les centres font
  vraiment différemment. Il a une valeur par défaut, et seul le chef le voit.
- Un justificatif médical part aux seuls responsables, et l'apprenant le sait
  avant l'envoi.
- Le tuteur ne voit que les présences et les absences de son apprenti. Le
  mail à l'entreprise est préparé par l'app et part de la messagerie du
  responsable.
- Quand le centre le demande, le formateur vérifie une fois l'identité de
  chaque apprenant, au premier appel.
- Ce que la personne n'a pas choisi de partager ne part pas, et elle voit ce
  qui va partir avant l'envoi. Rien ne s'écrase sans prévenir. Tout marche
  sans réseau, ou dit ce qui ne marche pas.

### Les mots

La liste complète est dans [projet.md](projet.md), partie 4 : un objet, un
mot, partout. On dit formateur, apprenant, centre, tuteur, classe, chef,
annonce, demande, présence, feuille de présence, documentation. Jamais prof,
élève, école, émargement, groupe.

### Ce qui n'est pas dans la première version

Une discussion où toute la classe écrit, les réactions, les photos de
profil, les points et les classements, les tutoriels et les visites guidées,
les cours à distance, les liens directs avec EDOF, Kairos ou Chorus Pro (on
exporte).

## 4. Les gens

Des personnes inventées, bâties sur la recherche
([recherche/usagers-et-ecrans.md](recherche/usagers-et-ecrans.md)).

### Léa, 19 ans, BTS SIO en alternance

- Deux jours au centre, trois jours en entreprise chaque semaine.
- Un Android d'entrée de gamme, la mémoire presque pleine.
- Elle vit sur Snapchat et Instagram, et ouvre une app quelques secondes
  entre deux choses.
- Elle veut être en règle sans y penser. Elle craint une absence mal comptée,
  que son employeur verra.

### Karim, 17 ans, CAP en alternance

- Une semaine au centre, deux semaines en entreprise.
- Il lit lentement et n'aime pas les longs textes. Le français n'est pas sa
  première langue.
- Un iPhone ancien, souvent sans batterie.
- Il veut comprendre sans lire. Il craint de se tromper de bouton et de ne
  pas savoir revenir.

### Awa Diallo, 41 ans, formatrice vacataire

- Elle fait cours dans trois centres, à cinq classes. Elle a son ordinateur
  portable, qu'elle branche au vidéoprojecteur de chaque salle, et son
  téléphone.
- Elle arrive cinq minutes avant le cours, branche, fait l'appel, commence.
- Elle veut que l'administratif lui prenne moins d'une minute. Elle craint une
  erreur sur une feuille de présence, qu'on lui reprochera.
- Le soir, elle ne veut plus de messages.

### Sandrine, 35 ans, assistante de formation au Centre Exemple

- Deux écrans, Ypareo, les plateformes des OPCO, un tableur.
- Elle suit douze classes : elle rassemble les feuilles de présence, relance
  les signatures, prévient les entreprises des absences.
- Elle veut voir d'un coup ce qui manque, et exporter juste. Elle craint un
  contrôle avec un trou dans les preuves.

### Michel, 58 ans, tuteur de Karim dans un garage

- Il lit ses e-mails le soir sur son téléphone. Il n'installera rien.
- Il veut savoir si Karim était au centre, et l'apprendre vite quand il n'y
  était pas.

## 5. Les moments

| Moment | Qui | Quand | Objectif |
|---|---|---|---|
| Rejoindre une classe | apprenant | une fois | scanner le QR de la classe, écrire son prénom et son nom : moins d'une minute, rien à installer |
| Signer sa présence | apprenant | chaque demi-journée au centre | 2 gestes après l'ouverture |
| Signer sans caméra | apprenant | quand la caméra refuse | taper 6 chiffres |
| Signer sans réseau | apprenant | quand le Wi-Fi bloque | montrer un QR au formateur |
| Lancer l'appel | formateur | au début de chaque demi-journée | 1 geste |
| Voir qui manque, noter un retard ou un départ | formateur | pendant l'appel | sans que la salle le voie |
| Clore et signer l'appel | formateur | à la fin de l'appel | 1 geste |
| Signer un document | apprenant | quelques fois par an | ouvrir, lire, signer, dessiner, valider |
| Répondre à une demande | apprenant | quelques fois par mois | ouvrir, joindre, envoyer |
| Justifier une absence | apprenant | après une absence | le motif et un justificatif, prévenu avant l'envoi si c'est médical |
| Lire une annonce | apprenant | quand il y en a une | sans la chercher |
| Écrire à un formateur | apprenant | parfois | depuis une annonce, ou directement |
| Publier une annonce | formateur, centre | chaque semaine | écrire, publier |
| Envoyer un document à signer, faire une demande | formateur, centre | quelques fois par mois | choisir qui, envoyer, suivre |
| Voir qui n'a pas répondu, relancer | formateur, centre | chaque semaine | 1 geste depuis l'entrée de l'app |
| Prévenir l'entreprise d'une absence | formateur, centre | après une absence | 1 geste, le mail s'ouvre déjà écrit |
| Exporter les feuilles de présence | centre | chaque mois, et pour un contrôle | une feuille juste, en un geste |
| Voir les présences de son apprenti | tuteur | chaque semaine | depuis un e-mail, sans app |
| Fermer la classe | chef | à la fin de la formation | chacun a 30 jours pour télécharger ses documents |

## 6. Les écrans et ce qu'ils imposent

- Le téléphone : 320 à 430 px de large, une main, un réseau incertain.
  Environ la moitié des apprenants ont un iPhone, les autres un Android,
  souvent d'entrée de gamme. L'app doit rester légère et rapide.
- L'iPhone : sans ajout à l'écran d'accueil, Safari efface les données d'un
  site après 7 jours sans visite. Un apprenti qui passe trois semaines en
  entreprise perdrait tout. La caméra d'un site ajouté à l'écran d'accueil a
  des bugs connus, d'où le code de 6 chiffres.
- Le site n'a pas de notification quand il est fermé. L'app pour ordinateur
  en a. Côté apprenant, c'est l'appel qui fait ouvrir l'app.
- L'ordinateur : 1 280 à 1 920 px, souris et clavier, de longues listes.
- L'écran de la salle : lu de 3 à 10 m. Un texte doit faire environ 4 mm de
  haut par mètre de distance, soit 3 cm au fond d'une salle de 8 m. Le QR de
  l'appel (37 × 37 cases) se lit à environ dix fois sa largeur. Le formateur
  projette souvent son propre écran : tout ce qu'il voit, la salle le voit.
- La tablette : à l'accueil d'un centre, ou dans les mains d'un formateur. Un
  grand écran, au doigt.
- Le réseau : le Wi-Fi d'un centre peut bloquer les relais. Ce qui compte
  doit pouvoir passer par un QR.

Les mesures sont dans [mesures.md](mesures.md), l'architecture dans
[architecture.md](architecture.md).

## 7. Ce que dit la recherche

Le détail et les sources sont dans
[recherche/usagers-et-ecrans.md](recherche/usagers-et-ecrans.md) et dans la
partie « Ce que font les autres » de [ux.md](ux.md).

- Un jeune sur cinq est peu à l'aise avec le numérique. Ceux qui lisent mal
  lisent mot à mot : une seule colonne, ce qui compte en haut, un texte qui
  ne bouge pas, une recherche qui pardonne les fautes. Ça aide aussi ceux qui
  lisent bien.
- Pronote est jugé lent, administratif et peu clair. Des lycéens ont écrit
  Papillon pour le remplacer : tout au même endroit, rapide, agréable.
- Edusign demande quatre étapes pour dire qu'on est là : se connecter,
  choisir le cours, dessiner, viser.
- Les groupes WhatsApp de classe montrent les numéros de tous et n'ont pas
  d'heure de fin.
- Le ministère de l'Éducation fait taire Pronote et les ENT de 20 h à 7 h
  depuis la rentrée 2025.
- Les formateurs abandonnent un outil de classe qui prend plus de quelques
  secondes.
- Les tuteurs manquent de temps, et la communication avec le centre est ce
  qui coince le plus.
- La feuille de présence sert de preuve à l'OPCO : l'heure réelle des
  retards, des départs et des absences, et un export lisible lors d'un
  contrôle.
- Une hiérarchie marquée (taille, couleur, forme) fait trouver le bouton
  principal plus vite, et aussi vite aux plus âgés qu'aux plus jeunes (étude
  de Google sur Material 3 Expressive, pas indépendante).

## 8. Les défis

Chaque défi dit le problème, ce qui le rend réussi, et la réponse évidente.
La réponse évidente est celle que n'importe qui trouverait : elle est là pour
que tu fasses mieux.

### L'appel, vu par trois écrans

Le téléphone de l'apprenant, l'appareil du formateur et l'écran de la salle
vivent le même moment. La salle doit voir le QR, le code et l'avancée. Le
formateur doit voir qui manque, noter un retard, faire signer quelqu'un sans
téléphone, lire le QR d'un apprenant sans réseau, puis clore. Il projette
souvent son propre écran.

- Réussi si la salle ne voit jamais qui manque, si le formateur ne fait que
  « Lancer l'appel » et « Clore et signer » quand tout va bien, et si tout se
  lit du fond de la salle.
- La réponse évidente : une fenêtre projetée, avec la liste des noms derrière
  un bouton.

### Être en règle, d'un coup d'œil

Ce qui inquiète un apprenti : une absence mal comptée, un document pas
signé, une demande oubliée. Aujourd'hui, il vérifie lui-même, écran par
écran.

- Réussi si, en ouvrant l'app, il sait s'il est en règle, et sinon ce qui lui
  manque, sans lire une phrase.
- La réponse évidente : un compteur de choses à faire.

### Les semaines en entreprise

Deux semaines sur trois, l'apprenti n'est pas au centre : pas d'appel, peu
d'annonces.

- Réussi si l'app reste utile et calme pendant ces semaines, et prépare le
  retour au centre.
- La réponse évidente : le même écran, vide.

### Lire peu, comprendre vite

Un jeune sur cinq est peu à l'aise avec le numérique. Certains apprentis
lisent mal, ou parlent mal français.

- Réussi si les gestes de tous les jours se font sans lire une phrase
  entière, et si rien d'important n'est caché derrière un geste à deviner.
- La réponse évidente : des icônes partout. Une icône qu'on ne devine pas
  coûte plus cher qu'un mot.

### Trois centres, cinq classes, une seule personne

Le formateur passe d'un centre à l'autre dans la même semaine, sans compte.

- Réussi si, en ouvrant l'app avant son cours, il tombe sur la bonne classe
  sans la chercher.
- La réponse évidente : une liste de classes à choisir.

### Le tuteur qui n'a pas le temps

Il lit ses e-mails le soir et n'installera rien.

- Réussi si, en dix secondes, il sait si son apprenti était là cette
  semaine.
- La réponse évidente : un compte et un tableau de bord.

### Le centre et ses preuves

Lors d'un contrôle, le centre doit montrer des feuilles de présence
complètes et signées, sur 5 à 10 ans.

- Réussi si Sandrine voit d'un coup ce qui manque (une feuille pas close, un
  document pas signé, une absence pas traitée) et exporte une feuille juste
  en un geste.
- La réponse évidente : un tableau de bord avec des graphiques.

### Le soir et le week-end

Les formateurs reçoivent des messages tard, et les apprentis aussi.

- Réussi si personne n'est dérangé en dehors des heures de cours, sans
  réglage à faire.
- La réponse évidente : un réglage « ne pas déranger ».

### Sans réseau

Le Wi-Fi d'un centre peut tout bloquer.

- Réussi si chacun sait toujours ce qui est parti et ce qui attend, et si
  l'appel marche quand même.
- La réponse évidente : un message d'erreur.

### Ne pas tout perdre sur iPhone

Safari efface les données après 7 jours sans visite, sauf si l'app est
ajoutée à l'écran d'accueil.

- Réussi si l'apprenant l'ajoute une fois, au bon moment, en comprenant
  pourquoi, sans qu'on le harcèle.
- La réponse évidente : une bannière au premier lancement.

### La première minute

Le premier jour, l'apprenant rejoint sa classe en salle, avec les autres.

- Réussi si ça prend moins d'une minute, sans aide et sans compte.
- La réponse évidente : un écran d'accueil et un tutoriel.

### La fin

À la fin de la formation, la classe ferme : 30 jours pour télécharger ses
documents, puis tout s'efface.

- Réussi si personne ne perd un document qu'il voulait garder, et si la fin
  se passe sans stress.
- La réponse évidente : un e-mail d'avertissement.

## 9. La grammaire du matériel

Le matériel 98 a des états. Donne à chacun un seul sens dans Opn-Link, et
tiens-le partout : c'est ce qui rendra l'app lisible sans explication.

| État du matériel | Un sens possible dans Opn-Link |
|---|---|
| fenêtre active, barre de titre marine | ce qui se passe maintenant |
| fenêtre inactive, barre en trame | ce qui vient ensuite |
| zone en trame | ce qui n'est pas pour maintenant : une semaine en entreprise, une classe fermée |
| sélection marine | où l'on est |
| relief enfoncé | ce qui est fait |
| barre de progression en pavés | ce qui avance : les présents d'un appel, les réponses à une demande |
| barre d'état en mono | les faits du système : l'heure, ce qui est parti, ce qui attend le réseau |

Ce tableau est une piste, tirée des explorations. Garde-le, change-le ou
remplace-le, mais tiens la même règle sur toutes les interfaces.

## 10. Ce que les explorations ont appris

Le 15 novembre 2026, l'écran de la présence a été dessiné dans trois
directions, au téléphone et sur l'écran de la salle. Elles sont sur la
branche `claude/vigilant-shannon-2cz85x`, dans `maquettes/ecrans/`. Ce sont
des essais : ne pars pas d'elles.

- A, une chose à la fois : une grande fenêtre active pour l'action du
  moment, et ce qui vient ensuite dans des fenêtres inactives en dessous.
  Forte pour le geste de tous les jours, faible pour la vue d'ensemble.
- B, le fil de la classe : l'appel arrive comme le dernier message du fil.
  Rien à apprendre, mais une action importante peut se perdre sous les
  messages.
- C, la semaine : la demi-journée en cours en sélection marine, les jours en
  entreprise en trame. Suit le rythme de l'alternance, mais il faut savoir
  quels jours l'apprenant est au centre, et la colonne des heures est à
  l'étroit sur un téléphone de 360 px.

### Ce qu'on en garde

- l'écran de la salle tient avec le QR, le code en très grand et une barre de
  progression en pavés, et il ne montre jamais qui manque ;
- Silkscreen à 8 px est trop petit pour une information qui compte ;
- un fil de classe s'ouvre sur son dernier message.

### Ce qui a été refusé

Une première série qui reprenait l'interface d'OpenContact, et un style
inspiré de la signalétique, avec la police Luciole, qui sortait du matériel.

## 11. Comment travailler

- Lis aussi [projet.md](projet.md), [architecture.md](architecture.md),
  [mesures.md](mesures.md), [carnet.md](carnet.md) et
  [questions-ouvertes.md](questions-ouvertes.md). Ce brief passe avant
  [ux.md](ux.md) quand ils ne disent pas la même chose.
- Le matériel vient du dépôt d'OpenContact (`mahi010110/Open-Contact`) :
  `styles/tokens/`, `assets/fonts/`, `assets/icons/`, et le kit `design/`
  pour ses règles. Sur la branche `claude/vigilant-shannon-2cz85x`,
  `maquettes/outils/prendre-style.mjs` les copie à une version fixée, et
  `maquettes/outils/captures.mjs` photographie les écrans dans toutes les
  tailles et les deux thèmes, et s'arrête si quelque chose sort de l'écran.
  Tu peux reprendre ces outils, pas les écrans.
- Données inventées seulement : le Centre Exemple, la classe BTS SIO 2, Awa
  Diallo, Léa Martin, et les autres prénoms du brief.
- Écris la doc comme le dit le `CLAUDE.md`, partie « Comment on écrit ».

## 12. Ce qui reste ouvert

- Le ton : tutoyer partout, comme OpenContact, ou vouvoyer le tuteur et le
  centre ? Tranché le 16 novembre 2026 : tutoyer l'apprenant, le formateur
  et le centre, vouvoyer le tuteur.
- Les règles d'Opn-Link sur les données, l'accessibilité, les tests et la
  façon de livrer sont à repenser (décision du 15 novembre 2026). Propose
  celles qui servent ta conception. Fait le 16 novembre 2026 : elles sont
  dans [regles.md](regles.md).
- Comment un apprenant qui arrive en cours d'année reçoit les annonces plus
  anciennes ([architecture.md](architecture.md), partie « Le moins de
  données possible »).

## 13. Ce qu'il faut éviter

- Reprendre l'interface d'OpenContact : son accueil, sa barre du bas, ses
  feuilles, son onglet « Réseau ».
- Un tableau de bord générique, des graphiques pour faire sérieux.
- Des chiffres sur les onglets, des notifications qui comptent à la place des
  gens.
- Des points, des séries, des badges.
- Un tutoriel, une visite guidée, un mode d'emploi.
- Un geste caché qu'il faut deviner pour une action importante.
- Un réglage là où une bonne valeur par défaut suffit.
- Du flou, des dégradés, des coins arrondis, des emoji : ils sortent du
  matériel.
- Les noms des absents sur l'écran de la salle.
- Un mur de texte.

## 14. Ce qui fera une masterclass

- Chaque écran sert à une seule chose, qu'on peut dire en un mot.
- Les gestes de tous les jours tiennent leur objectif, comptés.
- Un même état a la même apparence partout.
- Tout se lit à 360 px, avec le texte agrandi à 200 %, en thème sombre, et
  du fond d'une salle.
- Quelqu'un qui ne connaît pas l'app comprend chaque écran en cinq secondes.
- Aucun geste de tous les jours ne demande de lire une phrase.
- Chaque interface semble faite pour sa personne et son écran, et toutes ont
  l'air d'un seul produit.
- Chaque interface a au moins une idée à laquelle le mainteneur n'aurait pas
  pensé, et qui rend le moment plus simple.
