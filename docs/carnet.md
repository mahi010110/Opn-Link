# Carnet

Les décisions dans l'ordre où elles ont été prises. Si ce carnet ne dit pas
la même chose que [projet.md](projet.md) ou
[architecture.md](architecture.md), ce sont eux qui ont raison.

Les premières entrées disent « école », « prof » et « élève ». Ces mots ont
été remplacés le 15 novembre 2026 par « centre », « formateur » et
« apprenant ».

## Du 12 au 15 novembre 2026 : l'idée

Repris du carnet d'une première discussion (dépôt `Opn...`, branche
`claude/sweet-hypatia-p4qlsl`, fichier `docs/projets/carnet-de-discussion.md`),
pour la partie qui concerne Opn-Link. Le projet s'appelait alors « projet 1,
l'espace de vie ».

- L'idée a évolué : une app d'émargement avec une boîte de documents à
  signer, puis un pont entre l'élève et sa formation, puis un espace commun
  au centre de formation, aux profs et aux élèves.
- Ce que veut le mainteneur :
  - une messagerie entre élèves, profs et école ;
  - le suivi de la recherche de stage ou d'alternance de chaque élève (pas
    d'emploi), en connectant OpenContact, ou par des questions régulières et
    des preuves si l'élève ne veut pas ;
  - les appels et les visios ;
  - une documentation comme sur Classroom : celle de la formation pour tous,
    celle du prof pour ses élèves, celle de l'école pour les profs ;
  - l'émargement et les documents signés, l'idée de départ.
- Ce qui a été établi :
  - c'est faisable sans serveur avec le moteur d'OpenContact ;
  - le lien avec OpenContact : l'élève scanne le QR de l'école dans
    OpenContact, choisit ce qu'il partage, et OpenContact envoie un résumé
    chiffré par sa boîte aux lettres. C'est une exception à la promesse
    d'OpenContact (« le suivi privé ne sort jamais ») : des chiffres
    seulement, jamais les notes, un aperçu avant l'envoi, révocable et
    facultatif ;
  - deux apps sur `mahi010110.github.io` partageraient le même stockage du
    navigateur, il faut une autre adresse ;
  - les limites : pas de notification quand l'app est fermée (l'appel
    quotidien fera ouvrir l'app), seuls les petits fichiers passent par les
    relais, les appels à deux peuvent échouer sans serveur relais, et une
    visio de classe en direct ne marche pas au-delà de 4 ou 5 personnes (on
    passera par un lien Jitsi) ;
  - l'ordre conseillé : messagerie et suivi de recherche, puis émargement et
    documents, puis documentation, puis appels ;
  - la phrase pour le présenter : « le Pronote des centres de formation,
    libre et sans serveur » ;
  - les noms proposés : Préau, Liaison, Relais, OpenPromo, Le Fil. À éviter :
    trop proche d'OpenClassrooms, des Cordées de la réussite ou de
    « campus ».
- La recherche sur l'émargement
  ([recherche/emargement/rapport.md](recherche/emargement/rapport.md)). Ce
  qui compte encore, le volet argent mis à part :
  - aucune règle n'oblige à passer par un serveur, sauf pour le DPC santé.
    L'Île-de-France et l'Auvergne-Rhône-Alpes imposent SoWeSign ;
  - seule la signature qualifiée est présumée fiable (Cour de cassation,
    5 mars 2026). D'où le contreseing du formateur, le QR qui change,
    l'export au modèle du financeur, l'archive de 5 à 10 ans et l'horodatage
    qualifié de l'empreinte ;
  - les applis élèves actuelles ont de mauvaises notes (Edusign autour de
    3,8 sur 5 sur Android, SoWeSign demande le Bluetooth et la
    localisation) ;
  - Qualiopi demande le suivi des absences et des relances, et pour
    l'alternance le lien avec l'entreprise. Aider à trouver un employeur fait
    partie des missions légales des CFA.
- Le but de tous les projets : s'amuser, faire des outils utiles et open
  source, se faire connaître. Pas gagner de l'argent. Pas de budget, pas de
  serveur à payer.
- La priorité à ce moment-là : le lab IA d'abord, parce que c'est le projet
  de l'examen de juillet 2027, et Opn-Link ensuite.

## 15 novembre 2026 : le démarrage

- La doc des deux projets était sur une branche du dépôt `Opn...`, qui est
  public. Celle d'Opn-Link est copiée ici, dans un dépôt privé, sur `main`.
- Le mainteneur choisit le nom opn-link. Il dit « le lien », et range le
  projet avec les autres (OpenContact, Opn…).
- Opn-Link démarre dans cette discussion. Le mainteneur : « avec toi on va
  commencer opn-link ».
- La messagerie reste dans la première version, même si le rapport sur
  l'émargement déconseillait un chat comme Discord. Le mainteneur : « il
  fallait quand même avoir la possibilité de discuter ». Plus tard dans la
  journée, il a écarté le fil où toute la classe discute (voir plus bas).
- Le mainteneur demande une app en Rust qui marche aussi sur le web, et de
  faire attention à la compatibilité et à l'évolutivité. La proposition
  d'architecture est dans [architecture.md](architecture.md).
- Tous les projets prennent le style d'OpenContact, à une seule source, pour
  qu'ils ne divergent pas.
- La méthode : poser la doc dans ce dépôt, trancher les questions ouvertes,
  faire les maquettes et les regarder, puis coder.
- Le mainteneur demande que la doc et le code ne ressemblent pas à ce
  qu'écrit une IA : pas de tournures bizarres, pas de commentaires partout.
  La règle est dans `CLAUDE.md`, partie « Comment on écrit ».

### Les premières décisions

- Création d'une classe : un prof ou l'école peut créer une classe. Celui qui
  la crée en est le chef.
- Public : d'abord les centres de formation et le post-bac. Les élèves y ont
  presque tous 15 ans ou plus, donc l'accord des parents n'est pas
  nécessaire.
- Le lien avec OpenContact arrive juste après la première version. La
  première version a le questionnaire.
- La première version sort sur le web et en app pour ordinateur. Les apps de
  store pour téléphone viendront plus tard.
- Le site est publié par une organisation GitHub, à une autre adresse
  qu'OpenContact. Son nom : `opn-link`.
- À l'écran, le nom s'écrit « Opn-Link ».
- L'interface est en HTML, CSS et TypeScript. Le mainteneur a laissé le
  choix (« je ne sais pas, à toi de voir »). Les raisons : le site en a
  besoin de toute façon, le style d'OpenContact est du CSS, et ces outils
  sont plus mûrs que les interfaces écrites en Rust (Dioxus, Leptos). Avec ou
  sans React : au prototype.
- La licence : MIT ou Apache-2.0, comme Rust et Tauri. Le mainteneur avait
  d'abord demandé « comme OpenContact ? », mais la licence d'OpenContact est
  propriétaire à source visible, donc pas libre. Il a choisi la licence
  libre, qui permet aussi de signer gratuitement l'app Windows.

### Les décisions suivantes

- Les mêmes exigences qu'OpenContact. Le mainteneur : « Je souhaite les
  mêmes exigences que OpenContact ! ». Elles sont résumées dans
  [exigences.md](exigences.md).
- Si le chef s'en va, il passe la main à un autre responsable par un geste
  signé. Sa phrase de secours sauve sa clé si son téléphone est perdu.
- On peut être dans plusieurs classes dès la première version, avec une
  limite à fixer.
- Chacun apparaît avec son prénom et son nom.
- Les apprenants ne s'écrivent pas en privé entre eux dans Opn-Link. Le
  mainteneur ajoute une idée : les apprenants d'une classe qui connectent
  OpenContact deviennent amis dans OpenContact, automatiquement. Elle fait
  partie du lien avec OpenContact.
- Pas de « vu », comme dans OpenContact. Une demande est envoyée, puis faite.
- Une demande vise un apprenant, plusieurs, ou toute la classe. Le mainteneur
  trouvait les deux options proposées bien ; on garde celle qui couvre les
  deux.
- Le moins de données possible. Le mainteneur : « Le but c'est d'avoir le
  moins de données possible. Le plus important reste. Ce qui serait cool
  c'est de faire une app légère. »
- Pas de fil où toute la classe discute. Le mainteneur : « faire un groupe où
  toute la classe peut discuter, je pense pas que ce soit une bonne idée ».
  Avis de Claude, du même côté : les apprenants ont déjà leurs groupes, un fil
  ouvert demanderait de la modération alors que le signalement vient plus
  tard, et il garderait beaucoup de données. La classe devient un fil
  d'annonces où seuls les responsables écrivent, et un apprenant répond à une
  annonce en privé, à son auteur. Le mainteneur avait d'abord trouvé les
  trois formes proposées pour les annonces intéressantes.
- Les messages privés restent tant que la classe existe.
- Une annonce reste jusqu'à ce qu'un responsable la retire.
- Signaler un message : plus tard.
- On retrouve ses classes sur plusieurs appareils dès la première version.
- Les mots à l'écran : formateur, apprenant, centre.

### L'UX, et ce qui était à la base

- Le mainteneur veut des exigences d'UX et de design comme dans
  OpenContact, « afin de rendre l'app intuitive, simple, et efficace sans
  trop en faire ». Elles font partie de la maquette. Elles sont dans
  [ux.md](ux.md).
- Il veut aussi que tout ce qui était à la base soit fait : « la signature
  des docs et l'envoi, la présence etc. ». La première version contient donc
  aussi la présence, les documents à signer, l'envoi de documents et la
  documentation partagée. Il ne reste en version 2 que les appels et les
  visios.
- Il demande de regarder comment font les concurrents. La recherche sur
  Edusign, SoWeSign, Google Classroom, Pronote, Yousign et WhatsApp est
  résumée dans [ux.md](ux.md), partie « Ce que font les autres ».
- La présence se signe d'un geste, avec la clé de l'appareil. Les documents
  se signent d'un geste et d'un dessin au doigt.
- À la fin de la formation, le chef ferme la classe. Tout s'efface chez les
  apprenants et les formateurs, et le centre garde ce que la loi lui demande
  (les feuilles de présence et les documents signés, de 5 à 10 ans).

### Les zones d'ombre, éclaircies avant les maquettes

Le mainteneur : « Je préfère qu'on sache tout dès maintenant ! On fait la
maquette quand toutes les zones d'ombre sont élucidées. » Claude a relu toute
la doc et la recherche, et a posé une vingtaine de questions.

- Les rôles : le mainteneur voulait « les deux » (responsables à égalité, et
  selon la fonction). Par défaut, tous les responsables peuvent tout faire.
  Le chef peut réserver au centre les documents à signer et les archives,
  par un réglage.
- La vérification d'identité : « Si l'école le demande, sinon non. C'est un
  paramètre comme beaucoup d'autres choses. » C'est un réglage, éteint par
  défaut. Allumé, le formateur vérifie une fois chaque apprenant, en face à
  face.
- La règle des réglages : un réglage existe seulement quand les centres font
  vraiment différemment. Il a une valeur par défaut, et seul le chef le voit.
  Le suivi de recherche est aussi un réglage, éteint par défaut.
- Une signature de présence qui arrive après la clôture ne compte pas. Un
  apprenant sans réseau montre au formateur un QR qui contient sa signature,
  avant la clôture.
- La date d'une feuille est prouvée par un registre public gratuit
  (OpenTimestamps), qui ne reçoit que son empreinte.
- Les justificatifs médicaux : la recherche conseillait de ne pas les faire
  passer par les relais. Le mainteneur : « le passer quand même ». Avec des
  protections : chiffré pour les seuls responsables, 7 jours au plus sur les
  relais, l'apprenant prévenu avant l'envoi, effacé de son téléphone une fois
  reçu.
- L'export de présence est une feuille commune, avec tout ce que demandent
  les OPCO et France Travail. Les modèles propres à un financeur viendront à
  la demande.
- La présence se fait en salle. Les cours à distance viendront plus tard.
- Les horaires des demi-journées sont réglés une fois par classe.
- Un retard ou un départ : la feuille montre l'heure de chaque signature, et
  le formateur peut noter un retard ou un départ avant de clore.
- Les documents à signer sont ceux du centre. Opn-Link ne fabrique aucun
  document.
- La signature d'un document : « les deux ». Une page de signature s'ajoute
  toujours à la fin, et le dessin se pose aussi dans la case du PDF quand il
  y en a une.
- La documentation : « les deux ». Chaque classe a sa documentation, et la
  documentation du centre pour ses formateurs vit dans une classe pour son
  équipe.
- Le questionnaire de suivi est prêt à l'emploi et modifiable, chaque
  semaine par défaut.
- Quand une classe est fermée, chacun a 30 jours pour télécharger ses
  propres documents. Une classe sans activité pendant 6 mois se ferme toute
  seule.
- Les gros fichiers passent par des serveurs publics gratuits (Blossom),
  mesurés comme les relais. À défaut, un lien.
- Les clés : le mainteneur a laissé le choix (« les meilleurs »). P-256 comme
  OpenContact, pour la compatibilité, pour les lecteurs de PDF signés, pour
  les futurs portefeuilles d'identité européens, et parce que le navigateur
  sait protéger ces clés. Les raisons sont dans
  [architecture.md](architecture.md), partie « Les clés ».
- Prévenir l'employeur d'un apprenti dès la première version, de deux
  façons : un mail déjà écrit à son tuteur, et le tuteur qui suit son
  apprenti dans l'app, où il ne voit que ses présences et ses absences. Le
  mot à l'écran est « tuteur ».
- Les petits choix par défaut, acceptés en bloc : on peut corriger son nom ;
  une annonce peut être modifiée et joindre un document ou un lien ; un
  apprenant écrit à n'importe quel responsable, et les responsables entre
  eux ; une demande se répond par un texte, un fichier ou « C'est fait », et
  peut avoir une date limite ; le centre contresigne un document s'il le
  veut, et l'entreprise signe en dehors ; qui ne peut pas dessiner tape son
  nom ; une classe donne son nom et celui du centre ; le suivi s'exporte en
  tableur ; l'app est en français, prête à être traduite ; les relais en
  Europe passent d'abord ; pas de lien direct avec EDOF, Kairos ou Chorus
  Pro ; le style vient du dépôt d'OpenContact par un script.

### Les mesures, avant les maquettes

Le mainteneur : « Mesure d'abord, je veux tout savoir avant les maquettes. »
Un environnement « OpenContact et Opn-Link » a été créé pour ouvrir seulement
les adresses à mesurer. Les sondes sont dans `mesures/`, les résultats dans
[mesures.md](mesures.md).

- Les relais par défaut : nostr.sathoarder.com (France) et nos.lol
  (Allemagne), puis nostr-relay.corb.net (États-Unis) et
  nostr-01.yakihonne.com (Singapour) en secours. Choisi par le mainteneur,
  sur les mesures.
- Les gros fichiers : les serveurs Blossom gratuits refusent tous un fichier
  chiffré. Le mainteneur a demandé s'il existait autre chose, puis a laissé le
  choix. Choisi : jusqu'à 1 Mo par les relais en morceaux (mesuré), en direct
  quand les deux appareils sont connectés, au-delà un lien. Les hébergeurs
  gratuits sans compte (0x0.st, catbox) sont écartés : ils sont tenus par des
  particuliers.
- L'iPhone : la caméra d'un site ajouté à l'écran d'accueil a des bugs
  connus, et sans cet ajout Safari efface les données après 7 jours sans
  visite. Le mainteneur a laissé le choix (« honnêtement je sais pas »).
  Choisi : proposer l'ajout à l'écran d'accueil, et un code de 6 chiffres
  sous le QR comme secours.
- Nostr est écrit à la main avec k256, parce que rust-nostr ajoute 1,2 Mo au
  site (mesuré). C'est un choix technique, dans la ligne de « les meilleurs ».
- OpenTimestamps : le navigateur dépose l'empreinte, l'app pour ordinateur
  complète la preuve. La première preuve d'essai était complète en moins de
  1 h 10.
- Le sceau PAdES marche avec underskrift et notre propre signataire. La
  version 0.1.4 d'underskrift signe mal en ECDSA (vérifié avec pyHanko et
  OpenSSL).

### Le design, après les premières maquettes

Le 15 novembre 2026, six écrans de la présence ont été dessinés avec
l'interface d'OpenContact, sur la branche de travail. Le mainteneur les a
refusés.

- OpenContact est en pleine refonte : son interface d'aujourd'hui ne vaut
  plus.
- « Chaque concept a son design et sa navigation et son ux/ui. Donc veille à
  être original et à penser au bien des users, rendre simple et efficace
  l'appli, sans oublier les différents types d'interfaces car tout le monde
  n'a pas la même. Renseigne-toi. »
- Puis : « Juste que opn link utilise le même matériel design 98
  utilitaire. »
- Décidé : Opn-Link garde le matériel de design « Utilitaire 98 » (les
  jetons, les polices, les icônes et les règles du kit `design/`
  d'OpenContact). Ses écrans, sa navigation et son UX sont pensés pour lui,
  sans rien reprendre de l'interface d'OpenContact.
- Le mainteneur veut choisir la direction sur images : l'écran de la
  présence sera dessiné dans les trois directions, au téléphone et sur
  l'écran de la salle.
- Décidé : une interface par personne et par écran (l'apprenant, le
  formateur et l'écran de la salle, le centre, le tuteur).
- Décidé : d'OpenContact, on ne garde que le matériel de design
  (« Non, seulement le matériel »). Les règles sur les données,
  l'accessibilité, les tests et la façon de livrer sont à repenser pour
  Opn-Link.
- La recherche sur les usagers et leurs écrans est dans
  [recherche/usagers-et-ecrans.md](recherche/usagers-et-ecrans.md). La
  direction du design est à choisir
  ([questions-ouvertes.md](questions-ouvertes.md)).
