# Opn-Link

Le lien entre le centre de formation, les formateurs et les apprenants. En une
phrase : « le Pronote des centres de formation, libre et sans serveur ».

Le nom a été choisi le 15 novembre 2026 et s'écrit « Opn-Link » à l'écran.
Les autres noms envisagés au départ : Préau, Liaison, Relais, OpenPromo,
Le Fil.

Le prototype de l'appel a commencé ([prototype.md](prototype.md)). Ce
fichier dit ce qui est décidé,
[mesures.md](mesures.md) ce qui a été mesuré, et
[questions-ouvertes.md](questions-ouvertes.md) ce qui reste à mesurer. Les
règles sont dans [regles.md](regles.md), le concept et la navigation dans
[conception.md](conception.md).

## 1. D'où vient l'idée

Au départ, c'était une app pour faire l'appel (l'émargement) dans les centres
de formation, avec une boîte pour échanger et signer les documents
administratifs. L'idée est devenue un pont entre l'apprenant et sa
formation, puis un espace commun au centre, aux formateurs et aux apprenants.

## 2. Ce que l'app doit faire, à terme

- Faire passer les annonces du centre et des formateurs à la classe, et
  permettre à chaque apprenant d'écrire en privé à un formateur ou au centre.
- Faire l'appel, et faire signer les documents administratifs.
- Envoyer des documents, et partager la documentation de la formation comme
  sur Classroom.
- Se demander des choses (« envoie ta convention », « justifie ton
  absence ») et suivre la demande.
- Prévenir l'entreprise des absences d'un apprenti.
- Suivre l'avancée de chaque apprenant, surtout sa recherche de stage ou
  d'alternance (pas d'emploi), avec OpenContact ou par des questions
  régulières.
- S'appeler, en audio ou en vidéo.

## 3. Les principes

- Une app en Rust qui marche aussi sur le web, avec le même cœur partout. La
  compatibilité et l'évolutivité comptent plus que la vitesse. Voir
  [architecture.md](architecture.md).
- Le moins de données possible, et une app légère. Ce qui compte reste, le
  reste s'efface ou n'est jamais gardé.
- Peu de réglages. Un réglage existe seulement quand les centres font
  vraiment différemment. Il a une valeur par défaut, et seul le chef de la
  classe le voit.
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
- Le matériel de design « Utilitaire 98 » d'OpenContact, avec des écrans,
  une navigation et une UX propres à Opn-Link, pensés pour ses usagers et
  leurs écrans. D'OpenContact, on ne garde que ce matériel : les règles sur
  les données, l'accessibilité, les tests et la façon de livrer sont celles
  d'Opn-Link ([regles.md](regles.md)).

## 4. Les mots

Un objet, un mot, partout dans l'app, y compris dans les fichiers qu'elle
produit.

| L'objet | Le mot | Jamais |
|---|---|---|
| la personne qui suit la formation | apprenant | élève, étudiant, stagiaire |
| la personne qui enseigne | formateur | prof, professeur, enseignant |
| l'établissement | centre | école, organisme, établissement |
| la personne de l'entreprise qui suit l'apprenant | tuteur | maître d'apprentissage, référent entreprise |
| le groupe qu'on rejoint | classe | groupe, promo, session |
| celui qui a créé la classe, ou qui l'a reçue | chef | admin, propriétaire |
| un responsable nommé par le chef | adjoint | modérateur |
| le chef et ses adjoints | les responsables | l'équipe |
| un message du centre ou d'un formateur à toute la classe | annonce | post, publication |
| ce qu'on demande à un apprenant | demande | tâche, requête |
| la signature de chaque demi-journée | présence | émargement, pointage |
| la liste d'une demi-journée, signée et exportée | feuille de présence | feuille d'émargement |
| les supports de cours partagés | documentation | ressources, cours |

L'app tutoie l'apprenant, le formateur et le centre. Elle vouvoie le tuteur,
qui la découvre dans un e-mail.

## 5. La première version

Elle vise d'abord les centres de formation et le post-bac (CFA, BTS, BUT…),
où les apprenants ont presque tous 15 ans ou plus.

Elle sort sur le web, pour les apprenants qui sont sur leur téléphone, et en
app pour ordinateur, pour les formateurs et le centre. C'est le même code. Les
écrans et les gestes sont décrits dans [ux.md](ux.md).

1. **Rejoindre une classe**
   - Une classe se rejoint avec un code ou un QR code, comme les groupes
     d'OpenContact.
   - Le site propose alors de s'ajouter à l'écran d'accueil du téléphone.
     Sans ça, Safari efface ses données après 7 jours sans visite.
   - Un formateur ou le centre peut créer une classe. Il donne son nom, celui
     du centre, et les horaires du matin et de l'après-midi. Celui qui la crée
     en est le chef.
   - On peut être dans plusieurs classes, avec une limite comme pour les
     groupes d'OpenContact.
   - Chacun apparaît avec son prénom et son nom. Chacun peut corriger le
     sien, et les responsables voient l'ancien.
   - Les apprenants entrent sur demande. Retirer un membre change le code de
     la classe.
   - Si le centre le demande, le formateur vérifie une fois l'identité de
     chaque apprenant : il regarde sa pièce d'identité et valide son
     téléphone en scannant son QR.
2. **Les responsables et les réglages**
   - Le chef nomme des adjoints : d'autres formateurs, ou le centre s'il
     arrive après. À côté de chaque responsable s'écrit « formateur » ou
     « centre ».
   - Par défaut, tous les responsables peuvent tout faire : publier, faire
     l'appel, envoyer et faire signer des documents, voir le suivi. Seul le
     chef nomme les adjoints, règle la classe, passe la main à un autre
     responsable par un geste signé, et ferme la classe.
   - Les réglages de la classe, que seul le chef voit : vérifier l'identité
     des apprenants (éteint), réserver au centre les documents à signer et
     les archives (éteint), le suivi de recherche (éteint), les horaires des
     demi-journées, le questionnaire de suivi.
3. **Les annonces**
   - La classe est un fil d'annonces. Seuls les responsables y écrivent.
   - Une annonce peut joindre un document ou un lien. Son auteur peut la
     modifier, et elle montre alors « modifiée ».
   - Une annonce reste jusqu'à ce qu'un responsable la retire.
   - « Écouter » lit une annonce à voix haute, avec la voix du téléphone.
4. **Les messages privés**
   - Un apprenant écrit en privé à n'importe quel responsable de sa classe.
     Les responsables peuvent aussi s'écrire entre eux. Quand un apprenant
     répond à une annonce, sa réponse part en privé à l'auteur de l'annonce.
   - Les apprenants ne s'écrivent pas entre eux dans Opn-Link. Ils le font
     dans OpenContact (partie 6).
   - Ni « vu » ni « en train d'écrire », comme dans OpenContact.
   - Une annonce ou un message envoyé en dehors des heures de la classe
     arrive à l'ouverture suivante, une heure avant le début du matin. Celui
     qui écrit le voit avant d'envoyer. Il n'y a pas de réglage.
5. **La présence**
   - Pour chaque demi-journée, le formateur lance l'appel. L'app propose la
     demi-journée en cours, avec les horaires de la classe, qu'on peut
     changer. Le formateur affiche un QR code qui change toutes les quelques
     secondes, sur son écran ou projeté.
   - L'apprenant signe en visant le QR, d'un seul geste, avec la clé de son
     appareil. La signature est liée à cette demi-journée et ne peut pas
     resservir. Il n'y a rien à dessiner.
   - Si la caméra ne marche pas, l'apprenant tape le code de 6 chiffres
     affiché sous le QR, qui change en même temps que lui. Un apprenant sans
     smartphone ou sans téléphone autorisé signe sur l'appareil du formateur.
     Un apprenant sans réseau montre au formateur un QR qui contient sa
     signature.
   - Avant de clore, le formateur voit qui manque, et peut noter un retard ou
     un départ. La feuille montre l'heure de chaque signature.
   - Le QR est sur l'écran de la salle, les noms sur le téléphone du
     formateur. Un écran qui montre le QR ne montre jamais de noms.
   - À la clôture, l'app propose le prochain cours, que le formateur peut
     changer. Les jours au centre s'apprennent ainsi, sans calendrier à
     saisir.
   - Le formateur clôt l'appel et contresigne. Chaque case vide devient
     « absent ». Après la clôture, plus rien n'entre, sauf une correction du
     formateur, qui reste visible.
   - À la clôture, l'empreinte de la feuille part vers un registre public
     gratuit (OpenTimestamps), sans aucune donnée personnelle. Il prouve que
     la feuille existait à cette date, et personne ne peut plus l'antidater.
   - La feuille de présence s'exporte en PDF. C'est une feuille commune, qui
     contient tout ce que demandent les OPCO et France Travail : l'intitulé,
     les dates, les horaires, le centre, les noms, les signatures par
     demi-journée et les absences. Les modèles propres à un financeur
     viendront à la demande.
   - La présence se fait en salle. Les cours à distance viendront plus tard.
6. **Les absences**
   - L'apprenant peut dire pourquoi il était absent, et joindre un
     justificatif, même médical.
   - Un justificatif médical est chiffré pour les seuls responsables, jamais
     pour la classe. Il reste au plus 7 jours sur les relais. L'apprenant est
     prévenu avant l'envoi, et le justificatif disparaît de son téléphone une
     fois reçu.
   - Pour un apprenti, un responsable peut prévenir son entreprise. Un geste
     ouvre un mail déjà écrit à son tuteur : la date, la demi-journée,
     justifiée ou non, jamais le motif médical.
   - Le tuteur peut aussi suivre son apprenti dans l'app, invité par un
     responsable avec un lien à lui. Il ne voit que les présences et les
     absences de son ou ses apprentis, rien d'autre de la classe.
7. **Les documents**
   - Le centre ou un formateur envoie un document à un apprenant, à plusieurs
     ou à toute la classe.
   - Les documents à signer sont ceux du centre : ses propres PDF
     (convention, règlement intérieur, attestation). Opn-Link ne fabrique
     aucun document.
   - L'apprenant lit le document en entier, signe d'un geste avec la clé de
     son appareil, et dessine sa signature au doigt. S'il ne peut pas
     dessiner, il tape son nom. Un seul dessin vaut pour tous les documents
     envoyés ensemble.
   - Une page de signature s'ajoute toujours à la fin du document : le nom,
     la date, le dessin, et de quoi vérifier la signature. Si le PDF du
     centre contient déjà une case de signature, le dessin s'y pose aussi.
   - Le centre contresigne s'il le veut. L'entreprise, pour une convention de
     stage, signe en dehors d'Opn-Link.
   - Un document peut se signer en classe, tous ensemble : l'écran de la
     salle montre combien ont signé, sans dire qui.
   - Chaque document signé a son dossier de preuve : l'empreinte du
     document, l'heure, l'identité, le journal.
   - Jusqu'à 1 Mo, un fichier passe par les relais, en morceaux, et les
     photos sont compressées avant l'envoi. Quand les deux appareils sont
     connectés en même temps, il passe en direct, sans limite. Au-delà, on
     colle un lien vers l'endroit où le centre range déjà ses fichiers
     (Drive, Moodle…).
8. **Les demandes suivies**
   - Un formateur ou le centre demande quelque chose à un apprenant, à
     plusieurs, ou à toute la classe. Pour chaque apprenant, on voit si la
     demande est envoyée ou faite. Il n'y a pas d'état « vue » : rien ne dit
     au formateur quand l'apprenant l'a ouverte.
   - L'apprenant répond par un texte, un fichier, ou « C'est fait ».
   - Une demande peut avoir une date limite. Passé cette date, elle
     s'affiche « en retard » chez les responsables.
   - On relance en un geste.
9. **La documentation partagée**
   - Chaque classe a sa documentation. Un document peut être réservé aux
     responsables.
   - La documentation du centre pour ses formateurs vit dans une classe que
     le centre crée pour son équipe.
   - Les fichiers suivent les mêmes règles de taille que les documents.
10. **Le suivi de la recherche de stage ou d'alternance**
    - Le chef l'allume pour sa classe.
    - Un questionnaire tout prêt part chaque semaine : le nombre de
      candidatures, de réponses, d'entretiens, et « ça avance », « je bloque »
      ou « j'ai trouvé ». Le formateur peut changer la fréquence et les
      questions. L'apprenant joint des preuves s'il le veut.
    - Le lien avec OpenContact arrive juste après la première version
      (partie 6).
11. **Le tableau de bord des responsables**
    - Pour chaque apprenant : où en est sa recherche (trouvé, en cours,
      bloqué, sans nouvelles), ses absences, ce qu'il lui reste à signer ou à
      envoyer.
    - Les relances à faire, et un export du tableau en tableur.
12. **L'écran d'entrée**
    - Il répond à la question de chacun, et porte une seule touche pour ce
      qu'il doit faire maintenant. Sa forme est dans
      [conception.md](conception.md) : « la réponse d'abord ».
    - Ce qui attend : la présence à signer ou l'appel à clore, les documents
      à signer, les demandes, les nouvelles annonces, les messages non lus,
      les relances. Chez un tuteur, les absences de ses apprentis.
    - Sur le web, il remplace les notifications, qui ne marchent pas quand la
      page est fermée. L'app pour ordinateur ajoute des notifications.
13. **Plusieurs appareils**
    - On retrouve ses classes sur l'app de l'ordinateur et sur le site du
      téléphone. Les deux se synchronisent, avec une phrase de secours, comme
      dans OpenContact.
    - Pour relier un appareil, le téléphone montre un QR et un code, valables
      cinq minutes. Rien n'est relié sans un oui sur le téléphone, et les deux
      écrans montrent le même nombre.
    - Un seul appareil signe la présence : le téléphone qu'un responsable a
      accepté. Un appareil relié lit, écrit et signe les documents, mais pas
      la présence. Sinon, un apprenant pourrait relier le téléphone d'un
      camarade, qui signerait à sa place.
    - Reprendre sa place avec la phrase de secours donne ce droit au nouveau
      téléphone. L'ancien perd sa place.
14. **Fermer la classe**
    - À la fin de la formation, le chef ferme la classe. Chacun est prévenu
      et a 30 jours pour télécharger ses propres documents (sa convention,
      ses attestations). Ensuite tout s'efface chez les apprenants, les
      formateurs et les tuteurs.
    - Une classe sans aucune activité pendant 6 mois se ferme de la même
      façon.
    - Le centre garde ce que la loi lui demande, les feuilles de présence et
      les documents signés, de 5 à 10 ans. Il les garde dans son app pour
      ordinateur et dans des fichiers qu'il range où il veut. Si le centre
      n'est pas dans la classe, c'est le chef qui les garde et les lui
      transmet.
15. **La langue et les autres outils**
    - L'app est en français, et ses textes sont rangés pour être traduits
      plus tard.
    - Pas de lien direct avec EDOF, Kairos ou Chorus Pro : on exporte, et le
      centre ressaisit.

Pas dans la première version : signaler un message, les cours à distance,
les modèles de feuille propres à un financeur et l'horodatage qualifié (plus
tard), les appels et les visios (version 2), le lien avec le lab IA (version
3).

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

- Signaler un message aux responsables.
- La présence pour les cours à distance, avec les preuves que demandent les
  financeurs (temps de connexion, travaux rendus).
- Les modèles de feuille de présence propres à un financeur, à la demande.
- L'horodatage qualifié par un prestataire certifié, pour les centres qui en
  ont un.

### Version 2

Les appels à deux, en direct entre appareils. Pour une visio de classe, un
lien vers une salle Jitsi.

### Version 3

- Le lien avec le lab IA : le formateur lance des TP et des pannes, les
  résultats sont signés, et les compétences validées donnent des badges.
- Les apps de store pour téléphone (iOS, Android), pour les notifications.
- Tout un centre, avec toutes ses classes.

## 7. Les limites connues

- Sur le web, rien ne prévient quand la page est fermée : on voit les
  annonces et les messages en l'ouvrant. L'appel de chaque demi-journée fait
  ouvrir l'app. L'app pour ordinateur, elle, peut prévenir tant qu'elle tourne
  en arrière-plan.
- Les relais gardent les messages 30 jours au plus. Ce qui dure plus
  longtemps est gardé sur les appareils.
- Un message de relais fait au plus 60 Ko. Un fichier passe en morceaux
  jusqu'à 1 Mo, au-delà il faut un lien (mesuré, voir
  [mesures.md](mesures.md)).
- Sur iPhone, la caméra d'un site ajouté à l'écran d'accueil a des bugs
  connus. Le code de secours sous le QR est là pour ça.
- Les appels peuvent échouer sans serveur relais, surtout quand les deux
  personnes sont en 4G.
- Une visio de toute la classe en direct entre appareils ne marche pas
  au-delà de 4 ou 5 personnes.
- Tous les téléphones d'un centre sortent par la même adresse Internet, et
  les relais publics risquent de limiter ce trafic. À tester tôt.
- Le Wi-Fi des centres bloque souvent les connexions directes entre
  appareils. La première version passe donc par les relais, et l'appel a sa
  solution par QR. À tester tôt, dans une vraie classe.
- La signature d'Opn-Link est une signature électronique simple. Seule la
  signature « qualifiée » est présumée fiable devant un juge : avec une
  signature simple, c'est au centre de prouver. Le dossier de preuve, la
  vérification d'identité et le registre public servent à ça.
- Les justificatifs médicaux passent par les relais, chiffrés, par choix du
  mainteneur. La loi encadre l'hébergement des données de santé (HDS), et ce
  n'est pas tranché pour des relais qui ne voient que du chiffré. Les
  protections de la partie 5 limitent le risque.
- Le DPC santé exige un émargement à la main : Opn-Link ne convient pas à ces
  formations.
- Le lien avec OpenContact fait une exception à sa promesse « ton suivi privé
  ne sort jamais ». Il doit rester volontaire, chiffré, limité à des
  chiffres, et l'apprenant doit pouvoir l'arrêter.
- Pour le RGPD, le centre est responsable des données de ses apprenants.
  Avant 15 ans, il faut l'accord des parents. Ce qui part sur des relais
  publics est presque impossible à effacer.

## 8. Ce que dit la recherche sur la présence et les signatures

Le rapport complet est dans
[recherche/emargement/rapport.md](recherche/emargement/rapport.md), et la
réglementation dans
[recherche/emargement/notes/reglementation.md](recherche/emargement/notes/reglementation.md).

- Aucune règle n'oblige à passer par un serveur pour l'émargement. Il y a
  deux exceptions : le DPC santé, où l'émargement se fait à la main, et deux
  Régions (Île-de-France, Auvergne-Rhône-Alpes) qui imposent SoWeSign.
- Les financeurs demandent une signature de l'apprenant et du formateur par
  demi-journée. Plusieurs OPCO acceptent la forme électronique, à condition
  qu'elle identifie la personne, qu'on ne puisse pas la modifier, et qu'elle
  ne puisse pas resservir.
- Seule la signature électronique « qualifiée » est présumée fiable (Cour de
  cassation, 5 mars 2026). Avec une signature simple, c'est au centre de
  prouver. D'où le contreseing, le QR qui change, le dossier de preuve et
  l'archive.
- Une clé créée sur un téléphone prouve « ce téléphone », pas « cette
  personne ». D'où la vérification d'identité, quand le centre la demande.
- L'heure d'un appareil se règle à volonté, et l'émargement antidaté est la
  fraude typique. D'où le registre public, qui date la feuille sans rien
  savoir d'elle.
- Une signature scannée n'a pas la valeur d'une signature électronique (Cour
  de cassation, 13 mars 2024). Le dessin des documents rassure, mais la preuve
  vient de la clé et du journal.
- Les applis actuelles des apprenants ont de mauvaises notes : Edusign tourne
  autour de 3,8 sur 5 sur Android, SoWeSign demande le Bluetooth et la
  localisation. Un outil sans compte qui marche du premier coup a sa place.
- Qualiopi demande de suivre les absences, de garder la trace des relances,
  et pour l'alternance de faire le lien avec l'entreprise. Aider les jeunes à
  trouver un employeur fait même partie des missions légales des CFA.
- La recherche conseillait de ne jamais faire passer les justificatifs
  médicaux par un relais. Le mainteneur a choisi de les faire passer, avec
  les protections de la partie 5.
- Le test que conseille la recherche : faire valider la feuille de présence
  exportée par deux ou trois OPCO et un certificateur Qualiopi avant qu'un
  centre compte dessus pour être payé.

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
| La boîte aux lettres chiffrée pour une seule personne | Les messages privés, les demandes, les documents, le tuteur, plus tard le résumé de recherche |
| La demande suivie comme un colis | Les demandes suivies |
| Les clés P-256 | Les mêmes, pour chiffrer et pour signer |
| Le QR qui porte les données dans l'image | L'appel sans réseau |
| La synchro entre ses appareils, la phrase de secours | La même chose |
| Le transport : relais Nostr, liaison directe, QR hors ligne | Le même |
| Le style « Utilitaire 98 » | Le même matériel (jetons, polices, icônes, kit), avec des écrans et une navigation propres à Opn-Link |
