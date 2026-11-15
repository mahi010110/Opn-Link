# opn-link — le lien entre l'école, les profs et les élèves

*Nom : **opn-link** (choisi le 15 novembre 2026). Pistes écartées : Préau,
Liaison, Relais, OpenPromo, Le Fil.*
*En une phrase : « le Pronote des centres de formation, libre et sans serveur ».*
*État : rien n'est codé. Ce document dit ce qui est décidé. Ce qui reste à
trancher est dans [`questions-ouvertes.md`](questions-ouvertes.md).*

---

## 1. D'où vient l'idée

L'idée a grandi en trois temps :

1. **Au départ** : une app pour faire l'appel (l'émargement) dans les centres
   de formation, plus une boîte pour échanger des documents administratifs et
   les signer.
2. **Ensuite** : un pont entre l'élève et sa formation.
3. **Aujourd'hui** : un **espace de vie** commun à l'école (le centre de
   formation), aux profs et aux élèves.

## 2. Ce que l'app doit faire

- **Se parler** : élève ↔ prof ↔ école, en groupe (la classe) et en privé.
- **Suivre l'avancée de l'élève**, surtout sa **recherche de stage ou
  d'alternance** (pas d'emploi) :
  - soit l'élève **connecte OpenContact**, et l'école voit un résumé de sa
    recherche ;
  - soit, s'il ne veut pas, l'école lui pose des **questions régulières** et
    il envoie des **preuves** de son avancée.
- **Se demander des choses** : « envoie ta convention », « justifie ton
  absence », avec un suivi (envoyée, vue, faite).
- **Faire l'appel** et **signer les documents administratifs**.
- **Partager de la documentation**, comme sur Classroom : la doc de la
  formation pour tous, la doc du prof pour les élèves, la doc de l'école pour
  les profs.
- **S'appeler**, en audio ou en vidéo.

## 3. Les principes

- **Une vraie app en Rust, et aussi disponible sur le web** *(décidé le
  15 novembre 2026)*. Le même cœur partout, avec une attention
  particulière à la **compatibilité** et à l'**évolutivité**. Le comment
  est dans [`architecture.md`](architecture.md).
- **Sans serveur à payer**, sur le modèle d'OpenContact : données sur les
  appareils, relais Nostr publics pour se trouver et garder les messages,
  liaison directe entre appareils, QR code hors ligne en secours.
- **Partir de la base** : une classe et un prof volontaire peuvent
  l'utiliser sans attendre l'accord de toute l'école. Une école adopte
  difficilement un outil fait par un élève (habitudes, RGPD, Pronote ou Teams
  déjà en place).
- **La vie privée d'abord** : l'élève choisit ce qu'il partage et peut
  arrêter à tout moment.
- **Libre et gratuit** : le but est de construire un outil utile, open
  source, et de se faire connaître. Pas de gagner de l'argent.
- **Le style d'OpenContact** (« Utilitaire 98 »), pris à sa source, pour que
  la famille se reconnaisse.

## 4. Le MVP (première version)

**Pour qui** : une classe (des élèves, un ou deux profs, un référent de
l'école).

### Fonctions du MVP

1. **Rejoindre une classe**
   - La classe est un groupe, rejoint par un code ou un QR code (comme les
     groupes d'OpenContact).
   - Rôles : l'école (responsable), les profs (adjoints), les élèves.
   - Entrée sur demande, retrait d'un membre (le code du groupe change).
2. **La messagerie**
   - Le fil de la classe, et des conversations privées élève ↔ prof et
     élève ↔ école.
   - Des annonces que seuls les responsables peuvent écrire.
3. **Les demandes suivies**
   - Un prof ou l'école demande quelque chose à un élève ; on suit l'état :
     envoyée, vue, faite.
   - L'élève répond avec un petit fichier (jusqu'à environ 500 Ko : photo
     compressée, PDF léger).
   - Relance en un geste.
4. **Le suivi de la recherche de stage ou d'alternance**
   - **Avec OpenContact** : l'élève scanne le QR de l'école dans
     OpenContact, choisit ce qu'il partage, et OpenContact envoie
     régulièrement un **résumé chiffré** à l'école (nombre de candidatures,
     de réponses, d'entretiens, « décroché »). Jamais les notes privées.
     Aperçu avant chaque envoi. Révocable à tout moment. Toujours facultatif.
   - **Sans OpenContact** : un questionnaire régulier envoyé par le prof
     (« combien de candidatures cette semaine ? des entretiens ? ») et des
     preuves jointes.
5. **Le tableau de bord du prof et de l'école**
   - Pour chaque élève : trouvé, en cours, bloqué, sans nouvelles.
   - Les relances à faire, et un export du tableau.
6. **L'écran « Aujourd'hui »**
   - Ce qui m'attend : messages non lus, demandes, relances. Sur le web, il
     remplace les notifications, qui n'existent pas quand la page est
     fermée.

*Sur quelles surfaces sort le MVP (le web, l'app pour ordinateur, les deux) :
question ouverte n° 4.*

### Hors du MVP (pour plus tard)

- l'émargement et les documents signés (version 2) ;
- la documentation façon Classroom (version 2) ;
- les appels et les visios (version 2) ;
- le lien avec le lab IA (version 3).

## 5. Les versions suivantes

### Version 2

- **L'émargement** :
  - un QR code qui change toutes les quelques secondes, affiché par le prof ;
  - la signature de l'élève avec une clé propre à son appareil ;
  - la signature sur l'appareil du prof, pour les élèves sans smartphone ou
    sans portable autorisé ;
  - le contreseing du prof par demi-journée ;
  - un export PDF au modèle demandé par chaque financeur, et une archive
    gardée 5 à 10 ans chez l'école.
- **Les documents à signer** : convention, règlement intérieur (accusé de
  remise), attestations, avec un dossier de preuve (empreinte du document,
  heure, identité, journal). En option, l'horodatage de la seule empreinte
  par un prestataire certifié, sans envoyer aucune donnée personnelle.
- **La documentation en trois espaces** : petits fichiers transportés
  directement, gros fichiers en direct quand on est sur le même Wi-Fi, ou par
  un lien vers là où l'école range déjà ses fichiers (Drive, Moodle…).
- **Les appels** : appels à deux en direct entre appareils ; pour une visio
  de classe, un lien vers une salle Jitsi.

### Version 3

- Le lien avec le lab IA : TP et pannes lancés par le prof, résultats signés,
  badges de compétences.
- Les apps pour téléphone (iOS, Android), pour les notifications. *(15/11 :
  l'architecture prévoit l'app installée dès le départ ; seul l'ordre de
  sortie des surfaces reste à trancher.)*
- Plusieurs classes et tout un centre.

## 6. Limites connues

- **Pas de notification quand la page web est fermée** : on découvre les
  messages en l'ouvrant. L'appel quotidien (version 2) fera ouvrir l'app tous
  les jours. L'app installée, elle, pourra prévenir tant qu'elle tourne en
  arrière-plan (à mesurer).
- **Les relais gardent les messages 30 jours au plus** : l'historique vit sur
  les appareils.
- **Seuls les petits fichiers passent par les relais** (environ 64 Ko par
  message, environ 500 Ko par envoi découpé).
- **Les appels peuvent échouer** sans serveur relais, surtout en 4G des deux
  côtés.
- **Une visio de toute la classe est impossible** en direct entre appareils
  (au-delà de 4 ou 5 personnes).
- **Tous les téléphones d'une école sortent par la même adresse Internet** :
  les relais publics risquent de limiter ce trafic. À tester tôt.
- **Le Wi-Fi des écoles bloque souvent** les connexions directes entre
  appareils. Le MVP passe donc par les relais. À tester tôt, dans une vraie
  classe.
- **Même origine** : deux apps hébergées sur `mahi010110.github.io`
  partagent le même stockage du navigateur. Il faudra une adresse séparée
  (question ouverte n° 5).
- **Le lien avec OpenContact** est une exception à sa promesse « ton suivi
  privé ne sort jamais » : elle doit rester explicite, chiffrée, limitée à
  des chiffres, et révocable.
- **RGPD** : l'école est responsable des données de ses élèves ; pour les
  mineurs de moins de 15 ans, le consentement des parents est nécessaire.
  Ce qui part sur des relais publics est presque impossible à effacer.

## 7. Ce que dit la recherche (pour la version 2)

Rapport complet : [`recherche/emargement/rapport.md`](recherche/emargement/rapport.md).

- Aucune règle n'impose un serveur pour l'émargement. Exceptions : le DPC
  santé (émargement à la main) et deux Régions (Île-de-France,
  Auvergne-Rhône-Alpes) qui imposent SoWeSign.
- Seule la signature électronique « qualifiée » est présumée fiable (Cour de
  cassation, 5 mars 2026). Avec une signature simple, c'est à l'école de
  prouver : d'où le contreseing, le QR tournant, le dossier de preuve et
  l'archive.
- Les applis élèves actuelles sont mal notées (Edusign autour de 3,8/5 sur
  Android ; SoWeSign exige Bluetooth et localisation) : un outil sans compte
  qui marche du premier coup a sa place.
- Qualiopi demande de suivre les absences et de tracer les relances, et pour
  l'alternance de faire le lien avec l'entreprise. Aider les jeunes à
  trouver un employeur est même une mission légale des CFA. Le suivi prévu
  dans le MVP répond directement à ces besoins.
- Les justificatifs médicaux sont des données de santé : ils ne doivent
  jamais passer par un relais.

## 8. Ce qui se reprend d'OpenContact

opn-link reprend les **idées et les formats** éprouvés d'OpenContact. Le
**code**, lui, est réécrit en Rust (OpenContact est en JavaScript). Là où
les deux apps se parlent, elles doivent produire exactement les mêmes
octets : c'est l'objet de [`architecture.md`](architecture.md) §5.

| Brique d'OpenContact | Usage ici |
|---|---|
| Groupe = code (clé dérivée, messages chiffrés) | La classe |
| Rôles chef / adjoint signés, retrait = nouveau code | École, profs, élèves |
| Boîte aux lettres chiffrée pour une personne | Messages privés, résumé de recherche, demandes |
| « Demande suivie comme un colis » | Les demandes suivies |
| Synchro entre ses appareils, phrase de secours | Pareil |
| Transport (relais Nostr, liaison directe, QR hors ligne) | Pareil |
| Le kit de style « Utilitaire 98 » | Pareil |

OpenContact est aujourd'hui sous « tous droits réservés ». opn-link ne
reprend pas son code : il lui faut sa propre licence libre (question
ouverte n° 10).
