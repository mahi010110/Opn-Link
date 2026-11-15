# Les maquettes

Des écrans d'Opn-Link en HTML, au style d'OpenContact, avec des données
inventées. Rien n'y marche : on les regarde avant de coder.

```
npm install
npm run style
npm run qr
npm run captures
```

`npm run style` copie le style d'OpenContact dans `kit/`. Il le lit dans le
dépôt d'OpenContact posé à côté de celui-ci (`../../Open-Contact`, ou le
chemin donné par `OC_REPO`), à la version notée dans
`outils/prendre-style.mjs`. Le style n'est jamais recopié à la main.

`npm run qr` refait les QR de `images/`. `npm run captures` photographie
chaque écran dans `captures/`, au téléphone (390 × 844 et 360 × 640) et à
l'ordinateur (1280 × 800), en clair et en sombre. Il lui faut Playwright et
Chromium. Il s'arrête en erreur si une page plante, si un fichier manque, ou
si quelque chose sort de son cadre. `npm run captures appel` ne refait qu'un
écran.

`kit/` et `captures/` ne sont pas dans le dépôt : ils se refont avec ces
commandes. Un écran s'ouvre aussi seul dans un navigateur, et `?theme=sombre`
le montre en sombre.
