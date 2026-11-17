# Les règles d'Opn-Link

Proposées par Fable 5 le 16 novembre 2026, et validées le même jour par le
mainteneur (« Tout est bon pour moi »). Elles remplacent `exigences.md`, qui
résumait les règles d'OpenContact, et les six règles que portait le
`CLAUDE.md`.

- Elles gardent ce qui protège les usagers dans les règles d'OpenContact.
- Elles reprennent les décisions de [projet.md](projet.md).
- Elles ajoutent ce que les maquettes validées ont fixé
  ([conception.md](conception.md)).

Chaque règle dit comment on la vérifie. Une règle qu'on ne sait pas vérifier
n'est pas dans ce fichier.

## 1. Les règles à ne jamais casser

1. Ce qu'une personne n'a pas choisi d'envoyer ne part pas. Avant chaque
   envoi, l'écran dit à qui ça part. Un partage qui dure s'arrête quand
   elle le veut.
   - Vérifié par un scénario pour chaque envoi, qui lit ce qui arrive sur
     les relais et chez chaque destinataire, et par un scénario où un
     partage est arrêté : plus rien ne part ensuite.
2. Chacun ne reçoit que ce qui est pour lui. Le tuteur reçoit les présences
   et les absences de son apprenti, jamais le motif. Un justificatif médical
   va aux seuls responsables. Un apprenant ne voit pas les messages d'un
   autre.
   - Vérifié par les mêmes scénarios, joués à plusieurs : deux apprenants,
     un formateur, le centre, un tuteur.
3. Rien ne dit à l'autre quand on a ouvert quelque chose : ni « vu », ni
   « en train d'écrire », ni « en ligne ».
   - Vérifié par un scénario où un apprenant ouvre une annonce, un message
     et une demande : rien ne part.
4. La salle ne voit jamais un nom. Un écran qui montre le QR de l'appel ne
   montre aucun nom d'apprenant.
   - Vérifié par un contrôle sur chaque écran qui porte ce QR.
5. Une feuille close ne change plus. Une correction s'ajoute et reste
   visible. Une signature arrivée après la clôture ne compte pas.
   - Vérifié par les tests du cœur sur le journal de la feuille.
6. On n'écrase rien sans prévenir : un aperçu avant, « Annuler » pendant
   trente secondes après. Fermer la classe est le seul geste qui ne se
   défait pas, et il a son écran.
   - Vérifié par un scénario pour chaque geste important : clore un appel,
     envoyer à toute la classe, retirer un membre, reprendre sa place avec
     la phrase de secours.
7. L'app marche sans réseau, ou dit ce qui attend. L'appel marche sans
   réseau. Rien n'est téléchargé d'Internet au démarrage.
   - Vérifié par les scénarios de l'appel rejoués réseau coupé, et par le
     relevé des requêtes au démarrage.
8. Pas de serveur Opn-Link, pas de compte Opn-Link, pas de statistiques
   envoyées.
   - Vérifié par la liste des adresses que l'app contacte pendant les
     scénarios : les relais, le registre public, rien d'autre.
9. Chaque donnée a une durée de vie, écrite dans le contrat. Passé ce
   délai, elle s'efface de l'appareil.
   - Vérifié par les tests du cœur, avec une horloge qu'on avance.
10. Un format ou une clé de stockage ne change jamais de nom. S'il évolue,
    il prend une nouvelle version, et l'app lit toujours l'ancienne. Une app
    garde intact ce qu'elle ne comprend pas.
    - Vérifié par les vecteurs de test du contrat, gardés pour chaque
      version.

## 2. L'interface

- Chaque interface s'ouvre sur la réponse à la question de sa personne.
  Vérifié sur les captures des cinq écrans d'entrée : la réponse est le
  premier texte sous la barre, et le plus gros.
- Une seule touche pleine par écran, en bas. Sur un écran d'entrée, elle
  n'existe que si quelque chose est dû. Vérifié en comptant les boutons
  pleins de chaque écran.
- Un seul écran d'entrée par interface, et deux niveaux au plus au
  téléphone. « Retour » est en bas à gauche, et le retour du téléphone ferme
  la fenêtre. Vérifié par un scénario qui ouvre chaque fenêtre et revient.
- Une fenêtre sert à une seule chose, et sa barre de titre la nomme en un
  mot. Vérifié par un relevé des barres de titre.
- L'écran montre une fenêtre sous 600 px de large, deux à partir de 600 px,
  trois à partir de 901 px. L'écran de la salle en montre une seule, très
  grande. Vérifié par les captures à chaque largeur.
- Le matériel est celui du kit d'OpenContact, pris par un script, jamais
  recopié à la main ([brief-conception.md](brief-conception.md), partie 3).
  Aucune couleur en dur, aucune autre police, aucun emoji. Vérifié par un
  relevé des feuilles de style.
- Un état du matériel a un seul sens ([conception.md](conception.md),
  partie 3). Une pièce nouvelle prend un sens qui existe, ou la règle change
  d'abord. Vérifié sur les captures.
- Une personne ne voit que les gestes de son rôle, même pas grisés. Ce qui
  n'existe que dans l'app pour ordinateur n'apparaît pas sur le site.
  Vérifié par un scénario par rôle.
- Aucun mot ne s'accorde avec la personne : l'app ne connaît pas son genre.
  Vérifié par un relevé des textes.
- Un objet, un mot ([projet.md](projet.md), partie 4). Vérifié par le même
  relevé.
- Aucun chiffre ne compte à la place de la personne : pas de pastille, pas
  de compteur de choses à faire. Vérifié sur les captures.
- Aucun message qui passe et disparaît. Ce qui change se lit à sa place, et
  la ligne de faits dit ce qui est parti et ce qui attend. Vérifié par le
  relevé des textes : aucun n'est affiché pour un temps.
- Une erreur dit ce qui ne va pas et quoi faire, sous le champ concerné, et
  ce qui a été tapé reste. Une erreur technique ne s'affiche jamais telle
  quelle. Toute impasse a une sortie. Vérifié par un scénario pour chaque
  chemin d'échec.
- Ce qui est envoyé en dehors des heures de la classe arrive à l'ouverture
  suivante, et l'écran le dit avant l'envoi. Vérifié par les tests du cœur,
  avec une horloge qu'on avance.
- Un réglage existe seulement quand les centres font vraiment différemment.
  Il a une valeur par défaut, et seul le chef le voit. Vérifié à chaque
  réglage ajouté : il est noté dans le carnet avec sa raison.
- Jamais de code technique à l'écran, jamais de cadre vide. Vérifié sur les
  captures.

## 3. Lisible par tous

La référence est le RGAA, qui suit le WCAG 2.2 au niveau AA.

- Une cible fait 44 px au doigt et 32 px à la souris. Ce qu'on voit fait la
  taille de ce qu'on touche. Deux gestes aux conséquences différentes sont
  séparés d'au moins 8 px. Mesuré sur chaque écran.
- Une fenêtre où l'on écrit se place au-dessus du clavier, et le champ où
  l'on tape reste visible. Vérifié par un scénario qui réduit la zone
  visible, comme le fait le clavier d'un iPhone.
- Le survol ne s'applique qu'aux appareils qui en ont un : sur un iPhone, il
  reste collé après un tap. Un geste au doigt qui s'interrompt, comme le
  dessin d'une signature, revient à son état de départ. Vérifié par un
  relevé des feuilles de style et par un scénario qui coupe le geste.
- Avec le texte agrandi à 200 %, à 360 px, rien ne sort de l'écran. Un nom
  se replie, il n'est jamais coupé. Aucune page ne défile de côté, même à
  320 px. Vérifié par l'outil de captures.
- Les tailles de texte sont en `rem`. Silkscreen reste en `px`, à 16 ou
  24 px, et ne porte jamais seul une information à 8 px.
- Clair et sombre, avec un contraste AA dans les deux. Mesuré sur les
  paires de couleurs des jetons.
- Jamais la couleur seule. Une absence est rouge et dit « abs. », une
  présence porte son heure, une touche qui attend le dit en mots. Vérifié
  sur les captures passées en gris.
- La trame ne passe jamais derrière un texte.
- Chaque champ a un vrai libellé et ouvre le bon clavier. Un nom ou une
  adresse ne passe pas par la correction automatique. Vérifié par un
  balayage des champs.
- À l'ordinateur, tout se fait au clavier. Le focus se voit, avec un trait
  de 2 px. Une touche du clavier est écrite sur ce qu'elle commande. Vérifié
  par un scénario sans souris, chez le formateur et chez le centre.
- Ce qui change sans prendre le focus est lu par un lecteur d'écran. Quand
  un élément disparaît, le focus passe à son voisin. Ouvrir une fenêtre
  change le titre de la page et met le focus sur son titre.
- Aucun geste de tous les jours ne demande de lire une phrase. Un
  pictogramme a toujours son mot. Aucun geste n'est caché : tout ce qui se
  fait a un bouton qu'on voit.
- Sur l'écran de la salle, un texte fait 4 mm de haut par mètre de salle, le
  QR fait un dixième de la distance, et il reste noir sur blanc dans les
  deux thèmes. Mesuré sur les captures.
- Les objets réagissent tout de suite. `prefers-reduced-motion` coupe tout
  mouvement.

## 4. Les tests

- Le cœur d'abord. Ses tests tournent deux fois : en Rust, et compilés en
  WebAssembly dans un navigateur.
- Chaque format du contrat a ses vecteurs de test. Ceux qu'Opn-Link partage
  avec OpenContact passent dans les deux apps.
- Trois moteurs : Chromium, WebKit et Firefox. Rien n'est livré sur la foi
  de Chromium seul.
- Les scénarios se jouent à plusieurs appareils. L'appel se joue avec
  l'ordinateur du formateur, son téléphone et deux apprenants, avec et sans
  réseau.
- Un contrôle de fuite part de l'app telle qu'elle tourne, et lit ce qui
  sort par le vrai bouton.
- Les gestes de chaque moment sont comptés par un scénario, face au tableau
  de [conception.md](conception.md), partie 11.
- Chaque écran est capturé en 390 × 844, en 360 × 640, à la tablette
  (820 × 1180 et 1180 × 820), en 1280 × 800 et sur l'écran de la salle, en
  clair et en sombre, puis à 200 % en 360 px.
- Un contrôle neuf se prouve : on casse exprès ce qu'il garde, et il doit
  échouer.
- Ce qui dépend d'un vrai appareil ou d'un vrai lieu a un chemin de
  secours : le code de six chiffres sans caméra, le QR sans réseau. Il n'y a
  pas d'essai sur place avant la sortie (17 novembre 2026). Vérifié par les
  scénarios qui jouent ces chemins.
- Le site de l'apprenant pèse au plus 300 Ko compressés au premier
  chargement. Mesuré à chaque livraison.

## 5. Livrer

1. Le cœur et ses tests, puis l'écran.
2. Un écran nouveau part des maquettes validées et des pièces de
   `maquettes/opn-link.css`.
3. Un changement visible se montre au mainteneur en captures avant d'arriver
   sur `main` : avant et après, au téléphone et à l'ordinateur, en clair et
   en sombre. Un test vert dit que c'est conforme, pas que c'est ce qu'il
   veut.
4. Le contrat et ses tests changent dans le même commit que le format.
5. Le service worker change de version quand un fichier qu'il garde change.
6. Ce qui dépend d'un service public se mesure avant d'être décidé.
7. Avant d'ajouter une fonction : marche-t-elle sur le site, sans compte et
   sans rien installer ? Sinon, elle va dans l'app pour ordinateur.
   Oblige-t-elle le mainteneur à une démarche qui dure ? Alors elle est
   reportée.
8. Une fonction nouvelle prend une place qui existe. Sur un écran d'entrée,
   elle passe par la touche, par « Ensuite » ou par « À lire », jamais par
   un bouton de plus.
9. Un contrôle qu'on retire emporte son style.
10. Les commits sont en français, clairs, et ne traitent que d'un sujet. Pas
    de vraies données d'apprenants dans le dépôt.

## 6. Ce qui n'est pas repris d'OpenContact

- Le seuil unique de 901 px. Opn-Link montre une, deux ou trois fenêtres
  selon la place.
- Les quatre onglets, l'onglet qui change de couleur et le scanner au milieu
  de la barre. L'écran d'entrée et la touche les remplacent.
- Le toast. La ligne de faits le remplace.
- Tout ce qui ne concerne que les pistes et les contacts.

## 7. Ce qui se confirme au prototype

Deux chiffres sont retenus sans avoir été essayés. Le prototype les confirme
ou les change, et le changement se note dans [carnet.md](carnet.md).

- Le plafond de 300 Ko compressés pour le site de l'apprenant. Le cœur seul
  en pèse 186 aujourd'hui ([mesures.md](mesures.md)).
- Les largeurs de 600 et 901 px, où l'on passe à deux puis à trois fenêtres.

## 8. Ce que le mainteneur a tranché

Le 16 novembre 2026, sur les quatre questions de la proposition :

1. Ces règles prennent la place d'`exigences.md` et des six règles du
   `CLAUDE.md`.
2. « Aucun message qui passe et disparaît » est retenu.
3. Le plafond de 300 Ko est retenu, à confirmer au prototype.
4. Les largeurs de 600 et 901 px sont retenues, à confirmer au prototype.

En reportant les règles, sept lignes ont été reprises des six règles du
`CLAUDE.md`, d'`exigences.md` et du concept. Elles valaient toujours, et la
proposition les avait oubliées :

- un partage qui dure s'arrête quand la personne le veut ;
- une fenêtre sert à une seule chose ;
- le matériel est pris par script, sans couleur en dur ;
- 8 px entre deux gestes aux conséquences différentes ;
- la fenêtre où l'on écrit se place au-dessus du clavier ;
- le survol, et le geste au doigt qui s'interrompt ;
- le titre de la page change quand une fenêtre s'ouvre.
