# Exigences

Le mainteneur, le 15 novembre 2026 : « Je souhaite les mêmes exigences
qu'OpenContact ! »

Opn-Link reprend donc les règles du `CLAUDE.md` d'OpenContact (dépôt
`mahi010110/Open-Contact`). Ce fichier les résume. Le `CLAUDE.md`
d'OpenContact donne le détail et les raisons de chaque règle, souvent avec la
mesure ou la photo qui l'a fait naître. Ce qui ne concerne que les pistes et
les contacts d'OpenContact ne s'applique pas ici.

Le même jour, après les premières maquettes, le mainteneur a précisé que
chaque projet a ses écrans, sa navigation et son UX (« Chaque concept a son
design et sa navigation et son ux/ui »), mais qu'Opn-Link utilise « le même
matériel design 98 utilitaire ». Puis il a décidé de ne garder d'OpenContact
que ce matériel. La partie « Le matériel « Utilitaire 98 » » s'applique donc.
Les autres règles de ce fichier viennent d'OpenContact : elles ne
s'appliquent plus telles quelles, et serviront de point de départ quand on
repensera les règles d'Opn-Link
([questions-ouvertes.md](questions-ouvertes.md)).

## Avant d'ajouter une fonction

- Est-ce que ça marche pour quelqu'un qui ouvre le site sur son téléphone,
  sans compte et sans rien installer ? Si oui, c'est sur le site. Sinon,
  c'est dans l'app pour ordinateur.
- Est-ce que ça oblige le mainteneur à une démarche qui dure (une
  déclaration chez un fournisseur, un certificat à renouveler) ? Si oui,
  c'est reporté.
- Le site marche sans l'app. Ce qui n'existe que dans l'app n'apparaît pas
  sur le site, même grisé.
- Une fonction nouvelle prend une place qui existe déjà, elle ne se pose pas
  à côté. On met la capture d'avant à côté de celle d'après : si on ne
  reconnaît plus l'écran d'avant, on a ajouté au lieu d'intégrer.
- Pour chaque élément d'un écran : sert-il à ce moment-là ? Est-ce une
  information, ou seulement un lien vers ailleurs ? L'app pourrait-elle le
  faire toute seule au bon moment ? Ce qui ne sert pas maintenant
  n'apparaît pas.
- Jamais de code technique à l'écran (un identifiant, un numéro interne).
  Jamais de cadre vide.
- Un écran sert à une seule chose. Si on ne peut pas dire son but en un mot,
  il faut deux écrans.

## Les données

- Ce que la personne n'a pas choisi de partager ne part pas. Elle voit ce
  qui va partir avant l'envoi.
- On n'écrase jamais en silence. Une fusion complète les vides, une
  différence se compte et se montre, et ce qui existait est gardé.
- Un aperçu avant chaque geste lourd (fusion, restauration, suppression,
  synchro), et un « Annuler » d'environ 30 secondes après. Le « Annuler »
  remplace la question de confirmation, il ne s'y ajoute pas. Seuls les
  gestes qu'on ne peut pas défaire demandent une confirmation.
- Le moins de données possible, et chaque donnée a une durée de vie
  ([architecture.md](architecture.md), partie « Le moins de données
  possible »).
- Les formats et les clés de stockage sont décrits dans `docs/contrat.md` (à
  créer avec le code). Ils ne changent jamais de nom : un format qui évolue
  prend une nouvelle version, et l'app lit toujours l'ancienne. Le contrat
  et ses tests changent dans le même commit.
- Pas de serveur Opn-Link, pas de compte, pas de statistiques envoyées.
- Chaque fonction marche sans réseau, ou le dit en une phrase courte et
  propose une autre voie. Rien n'est téléchargé d'Internet au démarrage :
  les bibliothèques sont dans le dépôt, avec leur licence.

## Le matériel « Utilitaire 98 »

Il vient du dépôt d'OpenContact : ses jetons (`styles/tokens/`), ses polices,
ses icônes, et les règles de son kit (`design/`). Les écrans, la navigation
et l'UX qu'on construit avec, eux, sont propres à Opn-Link.

- Les couleurs passent toujours par les jetons (`var(--…)`), jamais en dur.
  Le teal est pour ce qui se touche, le bleu marine seulement pour la
  sélection et les barres de titre.
- Une ligne cochée dans une liste ne change pas de couleur : c'est sa case
  qui se coche.
- Des reliefs nets : biseaux, ombres dures, coins droits (0 ou 2 px), traits
  de 1 px. Pas de flou, pas de dégradé.
- Les boutons ont le relief 98. Un seul bouton principal par écran, rempli
  d'accent. Un geste qui détruit est rouge, nommé, à part et en dernier.
- Trois polices et pas d'autre : Silkscreen pour les titres (à 8, 16 ou
  24 px seulement), IBM Plex Mono pour les données (dates, compteurs),
  Public Sans pour le texte.
- Les tailles de texte sont en `rem`, pour suivre le réglage du navigateur.
  Seule la police pixel reste en `px`.
- Les icônes viennent de pixelarticons. Pas d'emoji.
- Les objets réagissent tout de suite. Seuls les passages d'un état à un
  autre glissent, et vite. `prefers-reduced-motion` coupe tout mouvement.
- Le thème sombre est obligatoire : un anthracite aux traits clairs, pas une
  inversion. Le thème se règle sur automatique, clair ou sombre.

## Téléphone et ordinateur

- Deux dessins, chacun pensé pour son usage. Pas une page qui s'étire. Un
  seul seuil : 901 px de large.
- La taille d'une cible suit la main : 44 px au doigt, 32 px à la souris
  (`pointer:fine`). Ce qu'on voit fait la taille de ce qu'on touche.
- Au téléphone, l'action principale est en bas, à portée de pouce, et
  toujours au même endroit.
- Deux gestes aux conséquences différentes sont séparés d'au moins 8 px.
- Quand on tape, ce qu'on cherche reste au-dessus du clavier, et une feuille
  où l'on écrit se place au-dessus du clavier.
- Le bouton retour du téléphone ferme la feuille ouverte, pas l'écran. Un
  onglet garde sa place, et le retaper remonte en haut. Changer d'écran
  change le titre de la page et met le focus sur le titre de l'écran.
- Le survol (`:hover`) ne s'applique qu'aux appareils qui en ont un
  (`@media (hover:hover)`). Sinon il reste collé après un tap sur iPhone.
- Un geste au doigt qui déplace quelque chose gère aussi `touchcancel`.

## Lisible par tous

- Le texte peut être agrandi jusqu'à 200 % sans rien perdre. Un nom se
  replie sur plusieurs lignes, il n'est jamais coupé. Une donnée secondaire
  peut finir par « … ».
- Aucune page ne défile de côté, même sur un écran de 320 px.
- Le contour du focus se voit, avec un trait de 2 px.
- Un message qui apparaît sans prendre le focus est lu par les lecteurs
  d'écran. Quand un élément disparaît, le focus passe à son voisin, jamais en
  haut de la page.
- Chaque champ a un vrai libellé, le texte gris dans le champ ne compte pas.
  Il ouvre le bon clavier, et un nom ou une adresse ne passe pas par la
  correction automatique.
- Une erreur dit ce qui ne va pas et quoi faire, sous le champ concerné, et
  ce qui a été tapé reste. Une erreur technique ne s'affiche jamais telle
  quelle.
- Toute impasse a une sortie.

## Les textes

- Français, tutoiement, phrases courtes, mots de tous les jours. Pas de
  jargon.
- Un objet, un mot, partout dans l'app : la liste est dans
  [projet.md](projet.md), partie « Les mots ».
- Le plus court qui reste compris. Un mot vaut mieux qu'une icône qu'on ne
  devine pas.
- Une phrase d'explication ne reste que si elle prévient d'une perte ou
  d'une erreur qu'on ne peut pas voir venir.
- Un toast seulement si son message n'est pas déjà à l'écran.
- Aucun chiffre sur un onglet, aucune notification qui compte à la place de
  la personne. Ce qui attend change seulement la couleur de l'onglet.
- La doc et le code suivent aussi la partie « Comment on écrit » du
  `CLAUDE.md`.

## Livrer

1. Le cœur d'abord, avec ses tests, puis l'écran.
2. Essayer pour de vrai : le site dans Chromium, WebKit et Firefox, en 390 ×
   844 et en 1280 × 800, en clair et en sombre, sans erreur dans la console.
   Mesurer aussi en 320 px de large, et avec le texte agrandi à 125 % et à
   200 %.
3. Tout changement visible finit par une capture qu'on regarde. Un test vert
   dit que c'est conforme, pas que c'est ce que veut le mainteneur.
4. Tous les tests passent : `cargo test`, les tests du cœur dans un
   navigateur, les scénarios Playwright.
5. `docs/contrat.md` est à jour si un format ou une clé change.
6. Le service worker du site (ce qui le fait marcher hors ligne) change de
   version quand un fichier qu'il garde en cache change.
7. Le poids du site est mesuré à chaque livraison, pour qu'il reste léger.
8. Un contrôle qu'on retire emporte son style avec lui.
9. Les commits sont en français, clairs, et ne traitent que d'un sujet.
