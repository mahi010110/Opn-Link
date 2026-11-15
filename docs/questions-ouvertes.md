# Questions ouvertes

Ce qui reste à décider. Chaque question a une recommandation, mais c'est le
mainteneur qui tranche. Une fois tranchée, la question part d'ici : la
décision est notée dans [carnet.md](carnet.md) avec sa date, et reportée dans
[projet.md](projet.md) ou [architecture.md](architecture.md).

## Le produit

### Que devient une classe à la fin de la formation ?

Les messages privés restent tant que la classe existe. Il faut donc un moment
où elle s'arrête, et savoir ce qui reste après. C'est aussi là que se règle la
durée des demandes et du suivi.

Recommandation : le chef ferme la classe. Les annonces, les messages, les
demandes et le suivi s'effacent alors de tous les appareils. Avant, le centre
peut exporter ce qu'il doit garder (le tableau de bord, les documents reçus).

### Combien de classes au plus ?

On peut être dans plusieurs classes, avec une limite. OpenContact s'arrête à
5 groupes, et un formateur peut avoir plus de classes que ça.

Recommandation : fixer le chiffre au prototype, en mesurant ce que coûte une
classe de plus (chaque classe ajoute des abonnements sur les relais). Une
dizaine semble un bon point de départ.

## La technique, à trancher au début du code

### Quelle clé d'identité commune aux trois apps ?

La recherche propose une même identité pour OpenContact, le lab IA et
Opn-Link, sous la forme d'une clé Nostr. Mais OpenContact utilise déjà P-256
pour sa boîte aux lettres, Ed25519 pour ses appareils et secp256k1 pour
Nostr. Changer plus tard coûterait une migration.

Recommandation : trancher avec un petit prototype, au tout début du code, en
restant compatible avec la boîte aux lettres d'OpenContact.

### Comment Opn-Link récupère-t-il le style d'OpenContact ?

Recopié à la main, le style finit par diverger. C'est déjà arrivé au site
`Opn...`.

Recommandation : un petit script prend le kit dans le dépôt d'OpenContact, à
une version notée. Quand trois projets s'en serviront, le kit pourra avoir
son propre dépôt.

## À faire

- Créer l'organisation GitHub `opn-link`. C'est gratuit, et c'est au
  mainteneur de le faire depuis son compte. Le nom avait l'air libre le
  15 novembre 2026. L'adresse exacte du site (`opn-link.github.io`, avec ou
  sans chemin) se réglera au premier déploiement.
- Vérifier que le nom est libre ailleurs : nom de domaine, INPI. Des noms
  proches comme « OpenLink » existent déjà.
- Trouver un formateur et une classe pour tester tôt. Le Wi-Fi d'un vrai
  centre et la limite des relais publics ne se mesurent que sur place.
- Ajouter les fichiers de licence (MIT et Apache-2.0) avec le premier commit
  de code.
- Quand on fera le lien avec OpenContact, écrire dans son `CLAUDE.md` et son
  `CONTRAT.md` les deux nouveautés : le résumé envoyé aux responsables, et
  l'amitié automatique entre apprenants d'une même classe.
