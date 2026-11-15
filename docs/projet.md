# Opn-Link

Le lien entre l'école, les profs et les élèves. En une phrase : « le Pronote
des centres de formation, libre et sans serveur ».

Le nom a été choisi le 15 novembre 2026 et s'écrit « Opn-Link » à l'écran.
Les autres noms envisagés au départ : Préau, Liaison, Relais, OpenPromo,
Le Fil.

Rien n'est codé. Ce fichier dit ce qui est décidé, et
[questions-ouvertes.md](questions-ouvertes.md) ce qui reste à trancher.

## 1. D'où vient l'idée

Au départ, c'était une app pour faire l'appel (l'émargement) dans les centres
de formation, avec une boîte pour échanger et signer les documents
administratifs. L'idée est devenue un pont entre l'élève et sa formation,
puis un espace commun à l'école (ou au centre de formation), aux profs et aux
élèves.

## 2. Ce que l'app doit faire, à terme

- Se parler entre élèves, profs et école, en classe et en privé.
- Suivre l'avancée de chaque élève, surtout sa recherche de stage ou
  d'alternance (pas d'emploi). L'élève peut connecter OpenContact pour que
  l'école voie un résumé de sa recherche. S'il ne veut pas, l'école lui pose
  des questions régulières et il envoie des preuves.
- Se demander des choses (« envoie ta convention », « justifie ton
  absence ») et suivre la demande : envoyée, vue, faite.
- Faire l'appel et signer les documents administratifs.
- Partager de la documentation comme sur Classroom : celle de la formation
  pour tous, celle du prof pour ses élèves, celle de l'école pour les profs.
- S'appeler, en audio ou en vidéo.

## 3. Les principes

- Une app en Rust qui marche aussi sur le web, avec le même cœur partout. La
  compatibilité et l'évolutivité comptent plus que la vitesse. Voir
  [architecture.md](architecture.md).
- Pas de serveur à payer, comme OpenContact. Les données restent sur les
  appareils, des relais Nostr publics servent à se trouver et à garder les
  messages, les appareils se parlent aussi en direct, et un QR code sert
  quand il n'y a pas de réseau.
- On part de la base. Un prof volontaire et sa classe peuvent commencer sans
  attendre l'accord de toute l'école. Une école adopte difficilement un outil
  fait par un élève : elle a ses habitudes, le RGPD, et souvent Pronote ou
  Teams déjà en place.
- L'élève choisit ce qu'il partage et peut arrêter quand il veut.
- Libre et gratuit, sous licence MIT ou Apache-2.0. Le but est de faire un
  outil utile et de se faire connaître, pas de gagner de l'argent.
- Le style d'OpenContact (« Utilitaire 98 »), pour que les apps de la même
  famille se ressemblent.

## 4. La première version

Elle vise une classe : des élèves, un ou deux profs, et quelqu'un de l'école.
D'abord dans les centres de formation et le post-bac (CFA, BTS, BUT…), où les
élèves ont presque tous 15 ans ou plus.

Elle sort sur le web, pour les élèves qui sont sur leur téléphone, et en app
pour ordinateur, pour le prof. C'est le même code.

1. **Rejoindre une classe**
   - Une classe est un groupe qu'on rejoint avec un code ou un QR code, comme
     les groupes d'OpenContact.
   - Un prof ou l'école peut créer une classe. Celui qui la crée en est le
     chef, et il nomme les autres responsables : des profs, ou l'école si
     elle arrive après.
   - Les élèves entrent sur demande. Retirer un membre change le code de la
     classe.
2. **La messagerie**
   - Le fil de la classe, et des conversations privées entre un élève et un
     prof, ou entre un élève et l'école.
   - Des annonces que seuls les responsables peuvent écrire.
3. **Les demandes suivies**
   - Un prof ou l'école demande quelque chose à un élève, et on voit où en est
     la demande : envoyée, vue, faite.
   - L'élève répond avec un petit fichier, jusqu'à 500 Ko environ (une photo
     compressée, un PDF léger).
   - On relance en un geste.
4. **Le suivi de la recherche de stage ou d'alternance**
   - Le prof envoie un questionnaire régulier (« combien de candidatures
     cette semaine ? des entretiens ? ») et l'élève répond, avec des preuves
     s'il le veut.
   - Le lien avec OpenContact arrive juste après la première version (partie
     5).
5. **Le tableau de bord du prof et de l'école**
   - Pour chaque élève : trouvé, en cours, bloqué, sans nouvelles.
   - Les relances à faire, et un export du tableau.
6. **L'écran « Aujourd'hui »**
   - Ce qui attend : les messages non lus, les demandes, les relances. Sur le
     web, il remplace les notifications, qui ne marchent pas quand la page est
     fermée. L'app pour ordinateur ajoute des notifications.

Pas dans la première version : l'émargement et les documents signés, la
documentation partagée, les appels et les visios (version 2), le lien avec le
lab IA (version 3).

## 5. Les versions suivantes

### Juste après la première version

Le lien avec OpenContact. L'élève scanne le QR de l'école dans OpenContact,
choisit ce qu'il partage, et OpenContact envoie régulièrement un résumé
chiffré à l'école : le nombre de candidatures, de réponses, d'entretiens, et
« décroché ». Jamais les notes privées. L'élève voit ce qui part avant chaque
envoi, peut arrêter quand il veut, et rien n'est obligatoire. Il faut modifier
OpenContact pour ça, c'est pourquoi le lien vient après.

### Version 2

- L'émargement :
  - un QR code affiché par le prof, qui change toutes les quelques secondes ;
  - la signature de l'élève avec une clé propre à son appareil ;
  - la signature sur l'appareil du prof, pour les élèves sans smartphone ou
    sans téléphone autorisé ;
  - le contreseing du prof par demi-journée ;
  - un export PDF au modèle demandé par chaque financeur, et une archive
    gardée 5 à 10 ans par l'école.
- Les documents à signer : la convention, le règlement intérieur (accusé de
  remise), les attestations. Chaque document a son dossier de preuve :
  l'empreinte du document, l'heure, l'identité, le journal. En option, un
  prestataire certifié peut horodater l'empreinte seule, sans recevoir aucune
  donnée personnelle.
- La documentation en trois espaces. Les petits fichiers passent directement,
  les gros en direct quand on est sur le même Wi-Fi, ou par un lien vers
  l'endroit où l'école range déjà ses fichiers (Drive, Moodle…).
- Les appels à deux, en direct entre appareils. Pour une visio de classe, un
  lien vers une salle Jitsi.

### Version 3

- Le lien avec le lab IA : le prof lance des TP et des pannes, les résultats
  sont signés, et les compétences validées donnent des badges.
- Les apps de store pour téléphone (iOS, Android), pour les notifications.
- Plusieurs classes, puis tout un centre.

## 6. Les limites connues

- Sur le web, rien ne prévient quand la page est fermée : on voit les
  messages en l'ouvrant. L'appel quotidien de la version 2 fera ouvrir l'app
  tous les jours. L'app pour ordinateur, elle, peut prévenir tant qu'elle
  tourne en arrière-plan.
- Les relais gardent les messages 30 jours au plus. L'historique est gardé
  sur les appareils.
- Seuls les petits fichiers passent par les relais : environ 64 Ko par
  message, et 500 Ko environ par envoi découpé en morceaux.
- Les appels peuvent échouer sans serveur relais, surtout quand les deux
  personnes sont en 4G.
- Une visio de toute la classe en direct entre appareils ne marche pas
  au-delà de 4 ou 5 personnes.
- Tous les téléphones d'une école sortent par la même adresse Internet, et
  les relais publics risquent de limiter ce trafic. À tester tôt.
- Le Wi-Fi des écoles bloque souvent les connexions directes entre appareils.
  La première version passe donc par les relais. À tester tôt, dans une vraie
  classe.
- Le lien avec OpenContact fait une exception à sa promesse « ton suivi privé
  ne sort jamais ». Il doit rester volontaire, chiffré, limité à des
  chiffres, et l'élève doit pouvoir l'arrêter.
- Pour le RGPD, l'école est responsable des données de ses élèves. Avant 15
  ans, il faut l'accord des parents. Ce qui part sur des relais publics est
  presque impossible à effacer.

## 7. Ce que dit la recherche, pour la version 2

Le rapport complet est dans
[recherche/emargement/rapport.md](recherche/emargement/rapport.md).

- Aucune règle n'oblige à passer par un serveur pour l'émargement. Il y a
  deux exceptions : le DPC santé, où l'émargement se fait à la main, et deux
  Régions (Île-de-France, Auvergne-Rhône-Alpes) qui imposent SoWeSign.
- Seule la signature électronique « qualifiée » est présumée fiable (Cour de
  cassation, 5 mars 2026). Avec une signature simple, c'est à l'école de
  prouver. D'où le contreseing, le QR qui change, le dossier de preuve et
  l'archive.
- Les applis élèves actuelles ont de mauvaises notes : Edusign tourne autour
  de 3,8 sur 5 sur Android, SoWeSign demande le Bluetooth et la localisation.
  Un outil sans compte qui marche du premier coup a sa place.
- Qualiopi demande de suivre les absences, de garder la trace des relances,
  et pour l'alternance de faire le lien avec l'entreprise. Aider les jeunes à
  trouver un employeur fait même partie des missions légales des CFA. Le
  suivi de la première version répond à ces besoins.
- Les justificatifs médicaux sont des données de santé. Ils ne passent jamais
  par un relais.

## 8. Ce qu'on reprend d'OpenContact

Opn-Link reprend les idées et les formats qui marchent déjà dans
OpenContact. Le code, lui, est réécrit en Rust, puisqu'OpenContact est en
JavaScript. Quand les deux apps échangent des données, elles doivent produire
exactement les mêmes octets (voir [architecture.md](architecture.md), partie
« Compatibilité »).

| Dans OpenContact | Dans Opn-Link |
|---|---|
| Un groupe = un code, dont on tire la clé qui chiffre les messages | La classe |
| Les rôles chef et adjoint, signés ; retirer quelqu'un change le code | Les responsables (profs, école) et les élèves |
| La boîte aux lettres chiffrée pour une seule personne | Les messages privés, les demandes, plus tard le résumé de recherche |
| La demande suivie comme un colis | Les demandes suivies |
| La synchro entre ses appareils, la phrase de secours | La même chose |
| Le transport : relais Nostr, liaison directe, QR hors ligne | Le même |
| Le style « Utilitaire 98 » | Le même |
