# Les maquettes

Des écrans d'Opn-Link en HTML, faits avec le matériel « Utilitaire 98 »
d'OpenContact, avec des données inventées. Rien n'y marche : on les regarde
avant de coder.

Pour l'instant, l'écran de la présence est dessiné dans les trois directions
de [questions-ouvertes.md](../docs/questions-ouvertes.md) : A (une chose à la
fois), B (le fil de la classe) et C (la semaine). Chacune a deux écrans : le
téléphone de l'apprenant (`a-telephone.html`) et l'écran de la salle pendant
l'appel (`a-salle.html`).

```
npm install
npm run style
npm run qr
npm run captures
```

`npm run style` copie le matériel dans `kit/` : les jetons, les polices et
les icônes d'OpenContact, pris dans son dépôt posé à côté de celui-ci
(`../../Open-Contact`, ou le chemin donné par `OC_REPO`), à la version notée
dans `outils/prendre-style.mjs`. Rien n'est recopié à la main, et rien ne
vient de l'interface d'OpenContact.

`npm run qr` refait les QR de `images/`. `npm run captures` photographie
chaque écran dans `captures/`, au téléphone (390 × 844 et 360 × 640) ou en
1280 × 800 pour l'écran de la salle, en clair et en sombre. Il lui faut
Playwright et Chromium. Il s'arrête en erreur si une page plante, si un
fichier manque, ou si quelque chose sort de l'écran ou de son cadre.
`npm run captures a-salle` ne refait qu'un écran.

`kit/` et `captures/` ne sont pas dans le dépôt : ils se refont avec ces
commandes. Un écran s'ouvre aussi seul dans un navigateur, et `?theme=sombre`
le montre en sombre.
