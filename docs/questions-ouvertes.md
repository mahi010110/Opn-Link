# Les questions ouvertes

*Ce qui reste à décider. Chaque question a une recommandation, mais c'est
le mainteneur qui tranche. Une question tranchée part dans
[`carnet.md`](carnet.md), avec sa date, et sa réponse rejoint
[`projet.md`](projet.md) ou [`architecture.md`](architecture.md).*

---

## Le produit — à trancher avant les maquettes

### 1. Qui crée la classe ?

La fiche dit deux choses à la fois : « un prof volontaire peut commencer
sans attendre l'école » et « l'école est responsable, les profs adjoints ».
Si c'est le prof qui démarre, l'école n'est pas encore là pour être cheffe.

**Recommandation** : le prof crée la classe et en est le chef. L'école la
rejoint ensuite comme responsable, quand elle le veut. C'est ce qui permet
de partir de la base.

### 2. Pour qui d'abord ?

Les centres de formation et le post-bac, ou aussi le collège et le lycée ?

**Recommandation** : commencer par les centres de formation et le post-bac.
Avant 15 ans, il faut l'accord des parents, et c'est là que les règles sur
les données sont les plus lourdes.

### 3. Le lien avec OpenContact est-il dans le MVP ?

Il demande aussi de modifier OpenContact (envoyer le résumé), et c'est une
exception à sa promesse « ton suivi privé ne sort jamais ».

**Recommandation** : commencer par le questionnaire, qui marche pour tout
le monde, et ajouter le lien avec OpenContact juste après.

### 4. Sur quelles surfaces sort le MVP ?

Le web, l'app pour ordinateur, les deux ? Le téléphone en app de store ?

**Recommandation** : le web et l'app pour ordinateur ensemble, puisque c'est
le même code. Les élèves passent par le web sur leur téléphone ; le prof
gagne, avec l'app, les notifications et des données gardées sur son disque.
Les apps de store pour téléphone viennent plus tard (Apple coûte 99 $ par
an).

### 5. À quelle adresse vit le web ?

Il faut une autre adresse qu'OpenContact (`mahi010110.github.io`), sinon les
deux apps partagent le stockage du navigateur.

**Recommandation** : une organisation GitHub, gratuite, qui donne sa propre
adresse (`<organisation>.github.io/opn-link`). Un nom de domaine coûterait
une dizaine d'euros par an. OpenContact, lui, reste où il est : changer son
adresse ferait perdre leurs données à ses utilisateurs.

### 6. Comment le nom s'écrit-il à l'écran ?

« opn-link », « OpnLink », « Opn Link » ? Il en faut une seule, partout :
l'écran, les fichiers, la doc.

**Recommandation** : « opn-link », le même mot que le dépôt. Rien à
traduire, rien à retenir en plus.

## La technique — à trancher au début du code

### 7. L'interface : technos web, ou tout en Rust ?

Le cœur est en Rust de toute façon. L'interface peut être en technos web
(TypeScript, avec ou sans React) ou en Rust aussi (Dioxus, Leptos).

**Recommandation** : technos web et TypeScript. Le web en a besoin de toute
façon, le kit de style d'OpenContact est du CSS, et ces outils sont mûrs
(accessibilité, claviers des téléphones). Choisir la même chose que le lab
IA (React) ferait une seule façon de faire pour les deux projets.

### 8. Quelle clé d'identité commune ?

La recherche propose une même identité pour les trois apps (une clé
Nostr). Mais OpenContact utilise déjà P-256 pour sa boîte aux lettres,
Ed25519 pour ses appareils et secp256k1 pour Nostr. Changer plus tard
coûterait une migration.

**Recommandation** : trancher avec un petit prototype, au tout début du
code. La contrainte : rester compatible avec la boîte aux lettres
d'OpenContact.

### 9. Où vit le style ?

Le style d'OpenContact sert à tous les projets. Recopié à la main, il
divergera (c'est déjà arrivé au site `Opn...`).

**Recommandation** : opn-link prend le kit dans le dépôt d'OpenContact, à
une version notée, par un petit script, jamais à la main. Plus tard, quand
trois projets s'en serviront, le kit pourra avoir son propre dépôt.

### 10. Quelle licence ?

**Recommandation** : « MIT OR Apache-2.0 », la double licence de Rust et de
Tauri. Libre, simple, et compatible avec presque tout.

## À faire (pas des questions)

- Vérifier que le nom est libre : un nom de domaine, l'INPI, GitHub. Des
  noms proches comme « OpenLink » existent déjà chez d'autres.
- Trouver une classe et un prof pour tester tôt : le Wi-Fi d'une vraie école
  et la limite des relais publics ne se mesurent que sur place.
