# Opn-Link

Le lien entre le centre de formation, les formateurs et les apprenants. En une
phrase : « le Pronote des centres de formation, libre et sans serveur ».

Le nom a été choisi le 15 novembre 2026 et s'écrit « Opn-Link » à l'écran.
Les autres noms envisagés au départ : Préau, Liaison, Relais, OpenPromo,
Le Fil.

Rien n'est codé. Ce fichier dit ce qui est décidé, et
[questions-ouvertes.md](questions-ouvertes.md) ce qui reste à trancher. Les
règles de qualité, reprises d'OpenContact, sont dans
[exigences.md](exigences.md).

## 1. D'où vient l'idée

Au départ, c'était une app pour faire l'appel (l'émargement) dans les centres
de formation, avec une boîte pour échanger et signer les documents
administratifs. L'idée est devenue un pont entre l'apprenant et sa
formation, puis un espace commun au centre, aux formateurs et aux apprenants.

## 2. Ce que l'app doit faire, à terme

- Faire passer les annonces du centre et des formateurs à la classe, et
  permettre à chaque apprenant d'écrire en privé à un formateur ou au centre.
- Suivre l'avancée de chaque apprenant, surtout sa recherche de stage ou
  d'alternance (pas d'emploi). L'apprenant peut connecter OpenContact pour
  que le centre voie un résumé de sa recherche. S'il ne veut pas, le
  formateur lui pose des questions régulières et il envoie des preuves.
- Se demander des choses (« envoie ta convention », « justifie ton
  absence ») et suivre la demande.
- Faire l'appel et signer les documents administratifs.
- Partager de la documentation comme sur Classroom : celle de la formation
  pour tous, celle du formateur pour ses apprenants, celle du centre pour les
  formateurs.
- S'appeler, en audio ou en vidéo.

## 3. Les principes

- Une app en Rust qui marche aussi sur le web, avec le même cœur partout. La
  compatibilité et l'évolutivité comptent plus que la vitesse. Voir
  [architecture.md](architecture.md).
- Le moins de données possible, et une app légère. Ce qui compte reste, le
  reste s'efface ou n'est jamais gardé.
- Pas de serveur à payer, comme OpenContact. Les données restent sur les
  appareils, des relais Nostr publics servent à se trouver et à garder les
  messages, les appareils se parlent aussi en direct, et un QR code sert
  quand il n'y a pas de réseau.
- On part de la base. Un formateur volontaire et sa classe peuvent commencer
  sans attendre l'accord de tout le centre. Un centre adopte difficilement un
  outil fait par un apprenant : il a ses habitudes, le RGPD, et souvent
  Pronote ou Teams déjà en place.
- L'apprenant choisit ce qu'il partage et peut arrêter quand il veut.
- Libre et gratuit, sous licence MIT ou Apache-2.0. Le but est de faire un
  outil utile et de se faire connaître, pas de gagner de l'argent.
- Les mêmes exigences qu'OpenContact : le style « Utilitaire 98 »,
  l'ergonomie, l'accessibilité, les tests, la façon de livrer
  ([exigences.md](exigences.md)).

## 4. Les mots

Un objet, un mot, partout dans l'app, y compris dans les fichiers qu'elle
produit.

| L'objet | Le mot | Jamais |
|---|---|---|
| la personne qui suit la formation | apprenant | élève, étudiant, stagiaire |
| la personne qui enseigne | formateur | prof, professeur, enseignant |
| l'établissement | centre | école, organisme, établissement |
| le groupe qu'on rejoint | classe | groupe, promo, session |
| celui qui a créé la classe, ou qui l'a reçue | chef | admin, propriétaire |
| un responsable nommé par le chef | adjoint | modérateur |
| le chef et ses adjoints | les responsables | l'équipe |
| un message du centre ou d'un formateur à toute la classe | annonce | post, publication |
| ce qu'on demande à un apprenant | demande | tâche, requête |

## 5. La première version

Elle vise d'abord les centres de formation et le post-bac (CFA, BTS, BUT…),
où les apprenants ont presque tous 15 ans ou plus.

Elle sort sur le web, pour les apprenants qui sont sur leur téléphone, et en
app pour ordinateur, pour les formateurs et le centre. C'est le même code.

1. **Rejoindre une classe**
   - Une classe se rejoint avec un code ou un QR code, comme les groupes
     d'OpenContact.
   - Un formateur ou le centre peut créer une classe. Celui qui la crée en
     est le chef. Il nomme des adjoints (d'autres formateurs, ou le centre
     s'il arrive après), et peut passer la main à l'un d'eux par un geste
     signé.
   - On peut être dans plusieurs classes, avec une limite comme pour les
     groupes d'OpenContact.
   - Chacun apparaît avec son prénom et son nom.
   - Les apprenants entrent sur demande. Retirer un membre change le code de
     la classe.
2. **Les annonces**
   - La classe est un fil d'annonces. Seuls les responsables y écrivent.
   - Une annonce reste jusqu'à ce qu'un responsable la retire.
3. **Les messages privés**
   - Un apprenant écrit en privé à un formateur ou au centre. Il peut
     répondre à une annonce : sa réponse part en privé à l'auteur de
     l'annonce.
   - Les apprenants ne s'écrivent pas entre eux dans Opn-Link. Ils le font
     dans OpenContact (partie 6).
   - Ni « vu » ni « en train d'écrire », comme dans OpenContact.
   - Les messages restent tant que la classe existe.
4. **Les demandes suivies**
   - Un formateur ou le centre demande quelque chose à un apprenant, à
     plusieurs, ou à toute la classe. Pour chaque apprenant, on voit si la
     demande est envoyée ou faite. Il n'y a pas d'état « vue » : rien ne dit
     au formateur quand l'apprenant l'a ouverte.
   - L'apprenant répond avec un petit fichier, jusqu'à 500 Ko environ (une
     photo compressée, un PDF léger).
   - On relance en un geste.
5. **Le suivi de la recherche de stage ou d'alternance**
   - Le formateur envoie un questionnaire régulier (« combien de
     candidatures cette semaine ? des entretiens ? ») et l'apprenant répond,
     avec des preuves s'il le veut.
   - Le lien avec OpenContact arrive juste après la première version
     (partie 6).
6. **Le tableau de bord des responsables**
   - Pour chaque apprenant : trouvé, en cours, bloqué, sans nouvelles.
   - Les relances à faire, et un export du tableau.
7. **L'écran « Aujourd'hui »**
   - Ce qui attend : les nouvelles annonces, les messages non lus, les
     demandes, les relances. Sur le web, il remplace les notifications, qui
     ne marchent pas quand la page est fermée. L'app pour ordinateur ajoute
     des notifications.
8. **Plusieurs appareils**
   - On retrouve ses classes sur l'app de l'ordinateur et sur le site du
     téléphone. Les deux se synchronisent, avec une phrase de secours, comme
     dans OpenContact.

Pas dans la première version : signaler un message (plus tard),
l'émargement et les documents signés, la documentation partagée, les appels
et les visios (version 2), le lien avec le lab IA (version 3).

## 6. Les versions suivantes

### Juste après la première version

Le lien avec OpenContact. L'apprenant scanne le QR de sa classe dans
OpenContact, choisit ce qu'il partage, et OpenContact envoie régulièrement un
résumé chiffré aux responsables : le nombre de candidatures, de réponses,
d'entretiens, et « décroché ». Jamais les notes privées. L'apprenant voit ce
qui part avant chaque envoi, peut arrêter quand il veut, et rien n'est
obligatoire. Il faut modifier OpenContact pour ça, c'est pourquoi le lien
vient après.

Les apprenants d'une même classe qui ont connecté OpenContact deviennent
amis dans OpenContact, automatiquement (idée du mainteneur, 15 novembre
2026). C'est là qu'ils peuvent s'écrire entre eux. Comme pour toute amitié
dans OpenContact, chacun donne alors son profil aux autres, et l'apprenant le
voit avant de connecter (« Les 12 apprenants de ta classe qui l'ont fait
deviendront tes amis et auront ton profil »). Ce changement touche aux règles
d'OpenContact sur ce qui sort de l'app, et devra y être écrit.

### Plus tard, sans version fixée

Signaler un message aux responsables.

### Version 2

- L'émargement :
  - un QR code affiché par le formateur, qui change toutes les quelques
    secondes ;
  - la signature de l'apprenant avec une clé propre à son appareil ;
  - la signature sur l'appareil du formateur, pour les apprenants sans
    smartphone ou sans téléphone autorisé ;
  - le contreseing du formateur par demi-journée ;
  - un export PDF au modèle demandé par chaque financeur, et une archive
    gardée 5 à 10 ans par le centre.
- Les documents à signer : la convention, le règlement intérieur (accusé de
  remise), les attestations. Chaque document a son dossier de preuve :
  l'empreinte du document, l'heure, l'identité, le journal. En option, un
  prestataire certifié peut horodater l'empreinte seule, sans recevoir aucune
  donnée personnelle.
- La documentation en trois espaces. Les petits fichiers passent directement,
  les gros en direct quand on est sur le même Wi-Fi, ou par un lien vers
  l'endroit où le centre range déjà ses fichiers (Drive, Moodle…).
- Les appels à deux, en direct entre appareils. Pour une visio de classe, un
  lien vers une salle Jitsi.

### Version 3

- Le lien avec le lab IA : le formateur lance des TP et des pannes, les
  résultats sont signés, et les compétences validées donnent des badges.
- Les apps de store pour téléphone (iOS, Android), pour les notifications.
- Tout un centre, avec toutes ses classes.

## 7. Les limites connues

- Sur le web, rien ne prévient quand la page est fermée : on voit les
  annonces et les messages en l'ouvrant. L'appel quotidien de la version 2
  fera ouvrir l'app tous les jours. L'app pour ordinateur, elle, peut prévenir
  tant qu'elle tourne en arrière-plan.
- Les relais gardent les messages 30 jours au plus. Ce qui dure plus
  longtemps est gardé sur les appareils.
- Seuls les petits fichiers passent par les relais : environ 64 Ko par
  message, et 500 Ko environ par envoi découpé en morceaux.
- Les appels peuvent échouer sans serveur relais, surtout quand les deux
  personnes sont en 4G.
- Une visio de toute la classe en direct entre appareils ne marche pas
  au-delà de 4 ou 5 personnes.
- Tous les téléphones d'un centre sortent par la même adresse Internet, et
  les relais publics risquent de limiter ce trafic. À tester tôt.
- Le Wi-Fi des centres bloque souvent les connexions directes entre
  appareils. La première version passe donc par les relais. À tester tôt,
  dans une vraie classe.
- Le lien avec OpenContact fait une exception à sa promesse « ton suivi privé
  ne sort jamais ». Il doit rester volontaire, chiffré, limité à des
  chiffres, et l'apprenant doit pouvoir l'arrêter.
- Pour le RGPD, le centre est responsable des données de ses apprenants.
  Avant 15 ans, il faut l'accord des parents. Ce qui part sur des relais
  publics est presque impossible à effacer.

## 8. Ce que dit la recherche, pour la version 2

Le rapport complet est dans
[recherche/emargement/rapport.md](recherche/emargement/rapport.md).

- Aucune règle n'oblige à passer par un serveur pour l'émargement. Il y a
  deux exceptions : le DPC santé, où l'émargement se fait à la main, et deux
  Régions (Île-de-France, Auvergne-Rhône-Alpes) qui imposent SoWeSign.
- Seule la signature électronique « qualifiée » est présumée fiable (Cour de
  cassation, 5 mars 2026). Avec une signature simple, c'est au centre de
  prouver. D'où le contreseing, le QR qui change, le dossier de preuve et
  l'archive.
- Les applis actuelles des apprenants ont de mauvaises notes : Edusign tourne
  autour de 3,8 sur 5 sur Android, SoWeSign demande le Bluetooth et la
  localisation. Un outil sans compte qui marche du premier coup a sa place.
- Qualiopi demande de suivre les absences, de garder la trace des relances,
  et pour l'alternance de faire le lien avec l'entreprise. Aider les jeunes à
  trouver un employeur fait même partie des missions légales des CFA. Le
  suivi de la première version répond à ces besoins.
- Les justificatifs médicaux sont des données de santé. Ils ne passent jamais
  par un relais.

## 9. Ce qu'on reprend d'OpenContact

Opn-Link reprend les idées et les formats qui marchent déjà dans
OpenContact. Le code, lui, est réécrit en Rust, puisqu'OpenContact est en
JavaScript. Quand les deux apps échangent des données, elles doivent produire
exactement les mêmes octets (voir [architecture.md](architecture.md), partie
« Compatibilité »).

| Dans OpenContact | Dans Opn-Link |
|---|---|
| Un groupe = un code, dont on tire la clé qui chiffre les messages | La classe |
| Les rôles chef et adjoint, signés ; retirer quelqu'un change le code | Les responsables et les apprenants |
| La boîte aux lettres chiffrée pour une seule personne | Les messages privés, les demandes, plus tard le résumé de recherche |
| La demande suivie comme un colis | Les demandes suivies |
| La synchro entre ses appareils, la phrase de secours | La même chose |
| Le transport : relais Nostr, liaison directe, QR hors ligne | Le même |
| Le style « Utilitaire 98 » | Le même |
