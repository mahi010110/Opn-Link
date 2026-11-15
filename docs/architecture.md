# L'architecture — une vraie app en Rust, aussi sur le web

*Proposition du 15 novembre 2026, **à valider avec le mainteneur** avant la
première ligne de code. Les choix encore ouverts sont dans
[`questions-ouvertes.md`](questions-ouvertes.md).*

---

## 1. Ce qui est demandé

> « J'aimerais une véritable app Rust, mais aussi dispo sur le web. Fais
> attention à la compatibilité et à l'évolutivité. »
> — le mainteneur, 15 novembre 2026

Trois exigences, donc :

1. **Une vraie app en Rust** : installée sur l'ordinateur (puis sur le
   téléphone), rapide, qui garde ses données sur le disque.
2. **Aussi sur le web** : un élève ouvre un lien sur son téléphone et
   rejoint sa classe, sans rien installer.
3. **Compatible et évolutive** : le web et l'app ne divergent jamais, une
   vieille version et une nouvelle se comprennent, et le projet peut grandir
   (émargement, documents, plusieurs classes) sans tout refaire.

## 2. L'idée : un seul cœur en Rust, servi de deux façons

```
                 ┌──────────── L'INTERFACE (une seule) ────────────┐
                 │   une page web, style « Utilitaire 98 »          │
                 └──────────┬──────────────────────────┬────────────┘
                            │                          │
              dans le navigateur                dans l'app installée
              (le web, rien à installer)        (Tauri : Windows, macOS,
                            │                    Linux ; plus tard iOS, Android)
                            │                          │
              le cœur compilé en WebAssembly    le cœur en Rust natif
              stockage du navigateur            SQLite sur le disque
              relais tant que la page est       relais même fenêtre fermée
              ouverte                           (l'app reste en arrière-plan)
                            │                          │
                 └──────────── LE CŒUR RUST (le même code) ─────────┘
```

- **Le cœur est écrit une fois, en Rust.** Il contient toutes les règles :
  la classe, les rôles, les messages, les demandes, le suivi, le
  chiffrement, les formats.
- **Dans l'app installée**, il tourne en Rust natif, dans une app Tauri.
- **Dans le navigateur**, le même code est compilé en **WebAssembly**, un
  format que tous les navigateurs savent exécuter depuis 2017.
- **L'interface est la même des deux côtés** : une page web, affichée par le
  navigateur ou par la fenêtre de l'app.

C'est ce que fait Element, l'app de messagerie de Matrix : son chiffrement
est écrit une fois en Rust, et tourne aussi bien dans l'app que dans le
navigateur.

**La différence avec OpenContact.** OpenContact part du web : son moteur est
en JavaScript, et son app installée (`natif/`) l'emballe. opn-link part du
Rust : le moteur est en Rust, et c'est le web qui le reçoit.

## 3. Les trois couches

| Couche | Ce qu'elle fait | Ce qu'elle n'a pas le droit de faire |
|---|---|---|
| **Le cœur** (`opn-core`) | les règles, le chiffrement, les formats, la fusion des données | toucher au réseau, au disque ou à l'écran : il reçoit des événements et rend des décisions |
| **Les adaptateurs** (un par plateforme) | le stockage, le réseau, l'horloge, le trousseau | décider quoi que ce soit : ils transportent |
| **L'interface** | les écrans | contenir une règle : elle demande au cœur |

C'est la règle de sens unique d'OpenContact (son `CLAUDE.md`, §3),
appliquée dès le premier jour : l'interface appelle le cœur, jamais
l'inverse. Deux effets comptent ici :

- **le cœur se teste entièrement**, sans navigateur ni réseau ;
- **une plateforme de plus ne touche pas aux règles** : le téléphone, plus
  tard, n'est qu'un adaptateur de plus.

Les adaptateurs, concrètement :

| | Dans l'app installée | Dans le navigateur |
|---|---|---|
| Stockage | SQLite, sur le disque | IndexedDB, le stockage du navigateur |
| Réseau (relais Nostr) | en Rust, même fenêtre fermée | le WebSocket du navigateur, tant que la page est ouverte |
| Secrets | le trousseau du système | le stockage du navigateur, chiffré par un code facultatif |
| Prévenir | une notification du système, tant que l'app tourne | l'écran « Aujourd'hui », à l'ouverture |

## 4. Qui fait quoi : le web d'abord, l'app en plus

La règle d'OpenContact (`CLAUDE.md`, §0) s'applique telle quelle :

- **Tout ce qui marche dans un navigateur est sur le web.** Rejoindre la
  classe, se parler, les demandes, le suivi, « Aujourd'hui » : tout le MVP.
- **L'app installée ajoute ce qu'un navigateur ne peut pas garantir** :
  prévenir quand un message arrive, garder les données sur le disque pendant
  des années (l'émargement de la version 2 demandera 5 à 10 ans
  d'archives), les gros fichiers, les exports.
- **Les deux partagent des données, jamais des dépendances** : le web reste
  entier sans l'app.
- **Une capacité absente n'apparaît pas** : sur le web, rien de grisé ni de
  « bientôt ».

## 5. La compatibilité

Cinq endroits où deux choses doivent se comprendre.

### Entre le web et l'app

Le même cœur, donc les mêmes formats, par construction. La même suite de
tests tourne deux fois : en natif, et dans un vrai navigateur.

### Avec OpenContact

Les deux apps se parleront : le résumé de recherche que l'élève envoie
depuis OpenContact, et plus tard une même identité. OpenContact est écrit en
JavaScript, opn-link en Rust. Pour qu'ils produisent exactement les mêmes
octets :

- chaque format partagé est écrit dans un contrat (comme le `CONTRAT.md`
  d'OpenContact) ;
- il est livré avec des **vecteurs de test** : une entrée, et le résultat
  exact attendu. Les deux apps doivent les passer.

Ce n'est pas du luxe. Un exemple : OpenContact signe les rôles de ses
groupes en ECDSA P-256 avec WebCrypto, qui rend une signature brute de 64
octets ; beaucoup de bibliothèques rendent par défaut un autre format (DER).
Sans vecteurs de test, chaque app croirait que l'autre ment, et rien ne le
dirait.

Ce qu'OpenContact utilise aujourd'hui, et que le cœur Rust saura faire avec
les bibliothèques RustCrypto (en Rust pur, elles marchent en natif comme en
WebAssembly) :

| Usage dans OpenContact | Algorithme |
|---|---|
| Code d'un groupe → étiquette et clé | PBKDF2-SHA-256, 100 000 tours |
| Boîte aux lettres (une lettre pour une seule personne) | ECDH P-256 + HKDF-SHA-256 + AES-256-GCM, une clé jetable par lettre |
| Rôles d'un groupe (chef, adjoints) | ECDSA P-256 |
| Identité d'un appareil | Ed25519 |
| Événements sur les relais | Nostr (secp256k1) |

**Deux adresses différentes.** Sur la même adresse (`mahi010110.github.io`),
les deux apps partageraient le stockage du navigateur. opn-link vit donc
ailleurs (question ouverte n° 5). Et **OpenContact ne doit pas
déménager** : changer son adresse ferait perdre aux gens les données qu'il
garde dans leur navigateur.

### Entre les versions

Sans serveur, personne ne met à jour en même temps : un élève aura encore la
version d'il y a trois mois quand son prof aura la dernière. Cinq règles :

1. **Chaque message et chaque donnée porte sa version** (`v`).
2. **On ne renomme ni ne supprime jamais un champ, une clé ou un format.**
   Un format qui change = une nouvelle version, et l'app continue de lire
   l'ancienne (la règle d'OpenContact).
3. **Ce qu'on ne connaît pas, on le garde intact** : une vieille app ne
   détruit jamais ce qu'une nouvelle a écrit.
4. **Un message d'une version plus récente s'annonce** (« mets à jour
   opn-link pour le lire ») : il n'est jamais mal lu, ni jeté.
5. **Une fonction nouvelle n'empêche jamais une vieille app de faire ce
   qu'elle faisait déjà.**

### Avec les appareils

- **Le web vise le socle commun** : ce que tous les navigateurs savent faire
  depuis plusieurs années. Les tests tournent sur Chromium, **WebKit
  (Safari)** et Firefox. C'est une leçon d'OpenContact : Safari n'y avait
  jamais été mesuré, et l'app s'est cassée sur un iPhone.
- **Safari peut effacer les données d'un site** qu'on n'a pas ouvert depuis
  sept jours. Une app ajoutée à l'écran d'accueil a son propre compteur :
  tant qu'on s'en sert, rien ne s'efface. D'où : proposer l'installation, et
  une copie de secours, comme OpenContact.
- **Les vieux téléphones** : une minorité d'élèves a un appareil ancien ou
  d'occasion (`recherche/emargement/notes/douleurs_et_local_first.md`, §6).
  La page reste légère et se mesure sur un petit téléphone.
- **L'app installée** : Windows 10 et 11, macOS, Linux. Une limite connue :
  sous Linux, la fenêtre de Tauri n'a pas WebRTC par défaut. Tout ce qui
  passe en direct entre appareils (les appels de la version 2) vivra donc
  côté Rust.

### Avec la suite de la famille

Le lab IA et OpenContact, plus tard : une même identité par personne (une
paire de clés), des formats ouverts (les badges de compétences au format
Open Badges 3.0), le même moteur de relais. Voir
[`recherche/ecosysteme/identite_et_multijoueur.md`](recherche/ecosysteme/identite_et_multijoueur.md),
§6 et §8.

## 6. L'évolutivité : grandir sans tout refaire

- **Le cœur est découpé par fonction** : la classe, les messages, les
  demandes, le suivi ; puis l'émargement, les documents, la doc partagée.
  Chaque fonction peut dormir derrière un interrupteur : la version 2 se
  construit et se teste sans apparaître à l'écran (comme les drapeaux de
  `ui/perimetre.js` dans OpenContact).
- **Le transport est derrière une porte** : aujourd'hui les relais Nostr ;
  demain le direct sur le même Wi-Fi, ou l'app du prof qui sert de relais à
  sa classe, sans toucher aux règles.
- **Le stockage aussi** : SQLite ou IndexedDB, avec des migrations faites à
  la lecture.
- **Tout est rangé par classe dès le premier jour**, avec son identifiant :
  plusieurs classes, puis tout un centre (version 3), n'obligeront pas à
  tout reprendre.
- **Les formats sont écrits et testés** dans `contrat.md`, à créer avec la
  première ligne de code.
- **Une licence libre choisie tôt**, pour que d'autres puissent contribuer.

## 7. Les pièges à mesurer tôt

- **Le Wi-Fi des écoles** bloque souvent les connexions directes entre
  appareils
  ([`identite_et_multijoueur.md`](recherche/ecosysteme/identite_et_multijoueur.md),
  §2) : le MVP passe par les relais, et se teste dans une vraie classe le
  plus tôt possible.
- **Tous les téléphones d'une école sortent par la même adresse** : les
  relais publics peuvent limiter ce trafic.
- **Les relais portent environ 64 Ko par message** et gardent 30 jours au
  plus : petits fichiers seulement, et l'historique vit sur les appareils.
- **Les mineurs** : avant 15 ans, il faut l'accord des parents, et ce qui
  part sur des relais publics est presque impossible à effacer.
- **La taille du WebAssembly** au premier chargement : à mesurer.
- **Les stores** : Apple coûte 99 $ par an (macOS signé, iOS) ; la signature
  Windows est gratuite pour un projet open source (SignPath Foundation) ;
  Linux ne coûte rien. En attendant, le téléphone passe par le web.

## 8. Les outils pressentis

*À confirmer par un petit prototype au début du code.*

| Partie | Piste |
|---|---|
| App installée | Tauri 2, comme le lab IA et la coquille native d'OpenContact |
| Cœur → web | compilation en WebAssembly (`wasm-bindgen`) |
| Chiffrement | RustCrypto (`p256`, `aes-gcm`, `hkdf`, `pbkdf2`, `sha2`, `ed25519-dalek`) |
| Relais Nostr | `rust-nostr`, annoncé en natif et dans le navigateur (à vérifier au prototype) |
| Stockage | SQLite (`rusqlite`) dans l'app, IndexedDB dans le navigateur |
| Interface | technos web et TypeScript (question ouverte n° 7), style pris dans le kit d'OpenContact |
| Tests | `cargo test` en natif, `wasm-bindgen-test` dans un navigateur, Playwright sur Chromium, WebKit et Firefox |
