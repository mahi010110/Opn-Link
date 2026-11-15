# Questions ouvertes

Le 15 novembre 2026, toutes les questions de produit ont été tranchées, et ce
qui pouvait se mesurer à distance a été mesuré ([mesures.md](mesures.md)). Les
décisions sont dans [carnet.md](carnet.md) et reportées dans
[projet.md](projet.md), [ux.md](ux.md) et [architecture.md](architecture.md).

## À mesurer sur place

Rien de tout ça ne change les écrans. Ça change le code, et ça se mesure avec
un vrai centre.

- Le Wi-Fi d'un vrai centre : ce qu'il bloque, et si deux appareils peuvent se
  parler en direct.
- Trente vrais téléphones dans une salle, derrière la box du centre.
- La caméra de vrais iPhone et de vieux Android, avec le site ajouté à
  l'écran d'accueil ou non.
- La vitesse de lecture d'un QR sur un vieux téléphone.

## À fixer au prototype

- Le nombre maximum de classes. Les relais acceptent de 20 à 200 abonnements
  par connexion, et un seul abonnement peut suivre plusieurs classes : la
  limite viendra plutôt du volume de messages. Une dizaine semble un bon point
  de départ.

## À faire

- Créer l'organisation GitHub `opn-link`. C'est gratuit, et c'est au
  mainteneur de le faire depuis son compte. Le nom avait l'air libre le
  15 novembre 2026. L'adresse exacte du site (`opn-link.github.io`, avec ou
  sans chemin) se réglera au premier déploiement.
- Vérifier que le nom est libre ailleurs : nom de domaine, INPI. Des noms
  proches comme « OpenLink » existent déjà.
- Trouver un formateur et une classe pour tester tôt.
- Faire valider la feuille de présence exportée par deux ou trois OPCO et un
  certificateur Qualiopi avant qu'un centre compte dessus pour être payé.
- Signaler aux auteurs d'underskrift le bug de la signature ECDSA, si le
  mainteneur le veut.
- Remesurer les relais de temps en temps avec `mesures/sonde-relais.mjs`.
- Ajouter les fichiers de licence (MIT et Apache-2.0) avec le premier commit
  de code.
- Quand on fera le lien avec OpenContact, écrire dans son `CLAUDE.md` et son
  `CONTRAT.md` les deux nouveautés : le résumé envoyé aux responsables, et
  l'amitié automatique entre apprenants d'une même classe.
