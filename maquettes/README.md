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
  faite : `tel` (390 × 844 et 360 × 640), `ordi` (1280 × 800), `salle`
  (1280 × 800 et 1920 × 1080). Il s'arrête en erreur si une page plante, si
  un fichier manque, si quelque chose sort de l'écran ou de sa boîte, ou si
  le bas de l'écran sort de la fenêtre.
- `node outils/captures.mjs --texte=200` refait les écrans de téléphone à
  360 px avec le texte agrandi à 200 %.
- `npm run planches` réunit les captures par moment dans `planches/`, avec
  leur légende. La liste est dans `outils/liste-planches.mjs`.

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

Le formateur :

| Écran | Le moment |
|---|---|
| `cours-avant` | lancer l'appel |
| `cours-liste`, `cours-nom` | voir qui manque, noter un retard, faire signer sans téléphone ou sans réseau |
| `cours-apres` | clore et signer, prévenir l'entreprise, relancer |
| `cours-publier` | publier une annonce, un dimanche soir |
| `cours-envoyer` | envoyer un document à signer |
| `cours-ordinateur` | le cours à l'ordinateur, avec le suivi de la classe |

L'écran de la salle : `salle-rejoindre`, `salle-appel`, `salle-bande`
(l'appel réduit au-dessus des diapositives), `salle-ensemble` (signer un
document en classe).

Le centre, à l'ordinateur : `bureau-a-completer`, `bureau-presences`,
`bureau-complet`.

Le tuteur : `tuteur-mail` (le mail préparé par l'app), `tuteur-absent`,
`tuteur-present`.

## Ce qui n'est pas encore dessiné

Messages, Mes documents, Moi, la documentation, les membres et les réglages
de la classe, créer une classe, accepter les apprenants, vérifier une
identité, signer sur le téléphone du formateur, la preuve d'une signature
chez le centre, les archives, le questionnaire de suivi.
