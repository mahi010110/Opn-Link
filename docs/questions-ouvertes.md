# Questions ouvertes

Ce qui reste à décider. Chaque question a une recommandation, mais c'est le
mainteneur qui tranche. Une fois tranchée, la question part d'ici : la
décision est notée dans [carnet.md](carnet.md) avec sa date, et reportée dans
[projet.md](projet.md) ou [architecture.md](architecture.md).

## Le produit

### Qui prend la place du chef quand il s'en va ?

Un prof ou l'école peut créer une classe, et celui qui la crée en est le
chef. Mais un prof peut changer d'école, ou l'école peut vouloir reprendre
une classe créée par un prof. Dans OpenContact, le chef d'un groupe ne peut
pas être remplacé.

Recommandation : le chef peut passer la main à un autre responsable, par un
geste signé. Sa clé est sauvée par la phrase de secours, comme dans
OpenContact, pour qu'un téléphone perdu ne bloque pas la classe.

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
- Trouver un prof et une classe pour tester tôt. Le Wi-Fi d'une vraie école
  et la limite des relais publics ne se mesurent que sur place.
- Ajouter les fichiers de licence (MIT et Apache-2.0) avec le premier commit
  de code.
