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
