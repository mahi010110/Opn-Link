# Les maquettes

Les écrans d'Opn-Link en HTML, faits avec le matériel « Utilitaire 98 »
d'OpenContact, avec des données inventées. Rien n'y marche : on les regarde
avant de coder. Le concept et la navigation sont dans
[../docs/conception.md](../docs/conception.md).

## Les refaire

```
npm install
npm run style
npm run qr
npm run captures
npm run planches
```

- `npm run style` copie le matériel dans `kit/` : les jetons, les polices et
  les icônes d'OpenContact, pris dans son dépôt posé à côté de celui-ci
  (`../../Open-Contact`, ou le chemin donné par `OC_REPO`), à la version
  notée dans `outils/prendre-style.mjs`. Rien n'est recopié à la main, et
  rien ne vient de l'interface d'OpenContact.
- `npm run qr` refait les QR de `images/`.
- `npm run captures` photographie chaque écran dans `captures/`, en clair et
  en sombre. La classe du `<body>` dit pour quel écran la maquette est
  faite : `tel` (390 × 844 et 360 × 640), `tab` (820 × 1180 et 1180 × 820),
  `ordi` (1280 × 800), `salle` (1280 × 800 et 1920 × 1080). Il s'arrête en erreur si une page plante, si
  un fichier manque, si quelque chose sort de l'écran ou de sa boîte, ou si
  le bas de l'écran sort de la fenêtre.
- `node outils/captures.mjs --texte=200` refait les écrans de téléphone à
  360 px avec le texte agrandi à 200 %.
- `npm run planches` réunit les captures par moment dans `planches/`, avec
  leur légende. La liste est dans `outils/liste-planches.mjs`.
- `node outils/planches.mjs --revue=petit-tel-clair` réunit toutes les
  captures d'une taille et d'un thème sur une seule image, pour tout relire
  d'un coup.

Il faut Playwright et Chromium. `kit/`, `captures/` et `planches/` ne sont
pas dans le dépôt : ils se refont avec ces commandes. Un écran s'ouvre aussi
seul dans un navigateur, et `?theme=sombre` le montre en sombre.

## Les fichiers

- `opn-link.css` : les pièces d'Opn-Link (la touche, les cases, les pavés,
  les fenêtres), faites avec les jetons du kit.
- `maquette.js` : le thème, les icônes, et les cases de la semaine écrites à
  partir d'une ligne de données.
- `ecrans/` : un fichier par écran.

## Les écrans

L'apprenant, au téléphone :

| Écran | Le moment |
|---|---|
| `apprenant-rejoindre` | rejoindre une classe |
| `apprenant-jour-appel` | l'écran du jour, l'appel est ouvert |
| `apprenant-signer` | signer sa présence, avec ou sans caméra |
| `apprenant-jour-signe` | la présence est signée, la touche passe à la suite |
| `apprenant-jour-en-regle` | tout est fait |
| `apprenant-jour-entreprise` | une semaine en entreprise |
| `apprenant-sans-reseau` | signer sans réseau |
| `apprenant-document-lire`, `apprenant-document-dessiner` | signer un document |
| `apprenant-demande` | répondre à une demande |
| `apprenant-absence` | justifier une absence |
| `apprenant-presences` | relire ses présences, ce que voit le tuteur |
| `apprenant-classe` | lire une annonce, y répondre en privé |
| `apprenant-message-soir` | écrire à un formateur, le soir |
| `apprenant-iphone` | garder l'app sur l'écran d'accueil de l'iPhone |
| `apprenant-fin` | la classe ferme |
| `apprenant-jour-variante` | la variante des entrées en lignes |
| `apprenant-messages` | écrire à un responsable |
| `apprenant-documents` | retrouver un document |
| `apprenant-documentation` | les supports de la classe |
| `apprenant-moi` | son nom, ses appareils, sa phrase de secours, le thème |
| `apprenant-suivi` | répondre au questionnaire de suivi |
| `apprenant-sans-classe`, `apprenant-code-classe` | ouvrir l'app sans classe, taper un code qui ne marche pas |
| `apprenant-attente` | attendre qu'un responsable accepte |
| `apprenant-code-faux` | taper un code d'appel qui a changé |
| `apprenant-mise-a-jour` | une annonce écrite par une version plus récente |
| `apprenant-relier`, `apprenant-relier-oui` | relier un autre appareil |
| `apprenant-phrase` | noter sa phrase de secours |
| `apprenant-reprendre`, `apprenant-reprendre-apercu` | reprendre sa place sur un téléphone neuf |

Le formateur :

| Écran | Le moment |
|---|---|
| `cours-avant` | lancer l'appel |
| `cours-liste`, `cours-nom` | voir qui manque, noter un retard, faire signer sans téléphone ou sans réseau |
| `cours-apres` | clore et signer, prévenir l'entreprise, relancer |
| `cours-publier` | publier une annonce, un dimanche soir |
| `cours-envoyer` | envoyer un document à signer |
| `cours-ordinateur` | le cours à l'ordinateur, avec le suivi de la classe |
| `cours-recherche` | le suivi de la recherche de stage ou d'alternance |
| `cours-creer`, `cours-inviter`, `cours-accepter` | créer une classe et y faire entrer les apprenants |
| `cours-signer-ici`, `cours-identite` | faire signer sur son téléphone, vérifier une identité |
| `cours-membres`, `cours-reglages`, `cours-tuteur` | les membres, les réglages du chef, inviter un tuteur |
| `cours-fermer` | fermer la classe |
| `cours-messages`, `cours-message` | ses messages, répondre à un apprenant |
| `cours-support`, `cours-support-lourd` | ajouter un support, trop lourd ou non |
| `cours-adjoint`, `cours-passer` | nommer un adjoint, passer la main |

L'écran de la salle : `salle-rejoindre`, `salle-appel`, `salle-bande`
(l'appel réduit au-dessus des diapositives), `salle-ensemble` (signer un
document en classe).

Le centre, à l'ordinateur : `bureau-a-completer`, `bureau-presences`,
`bureau-complet`, `bureau-feuille` (une feuille et la preuve d'une
signature), `bureau-apprenant`, `bureau-archives`.

Le tuteur : `tuteur-mail` (le mail préparé par l'app), `tuteur-absent`,
`tuteur-present`.

La tablette, deux fenêtres debout et trois couchée : `tablette-appel` (le
formateur pendant l'appel), `tablette-cours` (après l'appel, avec une
conversation), `tablette-bureau` (le centre, à l'accueil).

## Ce qui n'est pas encore dessiné

La liste est dans [../docs/conception.md](../docs/conception.md), partie 11.
