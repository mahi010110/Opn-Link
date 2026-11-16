# Les règles d'Opn-Link

Proposées par Fable 5 le 16 novembre 2026. Rien n'est décidé ici : le
mainteneur dit ce qu'il garde. Une fois validées, elles remplacent
[exigences.md](exigences.md), qui résume les règles d'OpenContact, et les six
règles du `CLAUDE.md`.

- Elles gardent ce qui protège les usagers dans les règles d'OpenContact.
- Elles reprennent les décisions de [projet.md](projet.md).
- Elles ajoutent ce que les maquettes validées ont fixé
  ([conception.md](conception.md)).

Chaque règle dit comment on la vérifie. Une règle qu'on ne sait pas vérifier
n'est pas dans ce fichier.

## 1. Les règles à ne jamais casser

1. Ce qu'une personne n'a pas choisi d'envoyer ne part pas. Avant chaque
   envoi, l'écran dit à qui ça part.
   - Vérifié par un scénario pour chaque envoi, qui lit ce qui arrive sur
     les relais et chez chaque destinataire.
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
  Vérifié par le test des cinq secondes, sur les cinq écrans d'entrée.
- Une seule touche pleine par écran, en bas. Sur un écran d'entrée, elle
  n'existe que si quelque chose est dû. Vérifié en comptant les boutons
  pleins de chaque écran.
- Un seul écran d'entrée par interface, et deux niveaux au plus au
  téléphone. « Retour » est en bas à gauche, et le retour du téléphone ferme
  la fenêtre. Vérifié par un scénario qui ouvre chaque fenêtre et revient.
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
  taille de ce qu'on touche. Mesuré sur chaque écran.
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
  un élément disparaît, le focus passe à son voisin.
- Aucun geste de tous les jours ne demande de lire une phrase. Un
  pictogramme a toujours son mot. Aucun geste n'est caché : tout ce qui se
  fait a un bouton qu'on voit.
- Sur l'écran de la salle, un texte fait 4 mm de haut par mètre de salle, le
  QR fait un dixième de la distance, et il reste noir sur blanc dans les
  deux thèmes. Mesuré sur les captures, puis dans une vraie salle.
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
- Chaque écran est capturé en 390 × 844, en 360 × 640, en 1280 × 800 et sur
  l'écran de la salle, en clair et en sombre, puis à 200 % en 360 px.
- Un contrôle neuf se prouve : on casse exprès ce qu'il garde, et il doit
  échouer.
- Ce qui dépend d'un vrai appareil ou d'un vrai lieu s'essaie sur place
  avant qu'on compte dessus : un iPhone, un vieux Android, une salle, le
  Wi-Fi d'un centre.
- Le poids du site est mesuré à chaque livraison.

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

## 7. Ce que j'attends du mainteneur

1. Ces règles à la place d'[exigences.md](exigences.md) et des six règles
   du `CLAUDE.md` : oui, non, ou lesquelles changer ?
2. « Aucun message qui passe et disparaît » est une règle nouvelle. Je la
   recommande : quelqu'un qui lit lentement rate un message affiché trois
   secondes.
3. Un plafond de poids pour le site de l'apprenant. Je propose 300 Ko
   compressés au premier chargement, à confirmer au prototype. Le cœur seul
   en pèse 186 aujourd'hui ([mesures.md](mesures.md)).
4. Les largeurs où l'on passe à deux puis à trois fenêtres. Je propose 600
   et 901 px, à confirmer au prototype.
