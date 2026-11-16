# UX et design

Rédigé le 15 novembre 2026. Ce sont des propositions, à vérifier sur les
maquettes avant de coder. Les règles d'Opn-Link sont depuis dans
[regles.md](regles.md), qui passe avant ce fichier.

Le même jour, les premières maquettes ont été refusées : elles reprenaient
l'interface d'OpenContact. Opn-Link garde le matériel « Utilitaire 98 », mais
ses écrans, sa navigation et son UX sont à inventer pour lui. La partie
« Ce que font les autres » reste valable. Les
règles plus bas qui recopient le dessin d'OpenContact (une même app pour
tous, quatre onglets, le scanner au milieu de la barre, l'onglet qui change
de couleur) seront revues avec la direction choisie
([questions-ouvertes.md](questions-ouvertes.md)). La recherche sur les
usagers et leurs écrans est dans
[recherche/usagers-et-ecrans.md](recherche/usagers-et-ecrans.md). Pour
concevoir l'app, le brief ([brief-conception.md](brief-conception.md)) passe
avant ce fichier quand ils ne disent pas la même chose.

La direction est choisie depuis : le concept, la navigation et les maquettes
validées sont dans [conception.md](conception.md), qui passe avant ce fichier.

## Les interfaces

Décidé le 15 novembre 2026 : une interface par personne, chacune pensée pour
ses écrans.

- L'apprenant : son téléphone.
- Le formateur : son cours, au téléphone ou à l'ordinateur, et l'écran de la
  salle pour l'appel, lu de loin.
- Le centre : l'ordinateur, avec des listes, des filtres et des exports.
- Le tuteur : une page ouverte depuis un e-mail, sans app ni compte.

Chacune s'adapte au téléphone, à la tablette, à l'ordinateur et à l'écran de
la salle. Le cœur est le même dessous, et une personne ne voit que les gestes
de son rôle.

## Le but

Le mainteneur : « intuitive, simple, et efficace sans trop en faire ».

- Intuitive : on comprend quoi faire en regardant l'écran, sans lire
  d'explication. Un apprenant qui ouvre l'app pour la première fois rejoint
  sa classe et signe sa présence sans aide.
- Simple : peu d'écrans, peu de mots, un seul bouton principal par écran.
- Efficace : les gestes de tous les jours prennent quelques secondes.

## Ce que font les autres

Les notes de `recherche/emargement/` ont été complétées le 15 novembre 2026
par des recherches sur la façon de faire de chaque outil (sources à la fin).
L'aide en ligne d'Edusign n'a pas pu être lue depuis cette session, son site
étant bloqué par le réseau. Ce qui la concerne vient des résultats de
recherche et de sa fiche sur l'App Store.

### Edusign

- L'apprenant se connecte avec les identifiants donnés par son centre,
  choisit le cours, signe au doigt, puis scanne un QR code qui change toutes
  les 5 à 7 secondes. Il peut aussi signer par code, par e-mail, par NFC ou
  avec sa carte d'étudiant.
- On garde le QR code qui change, affiché ou projeté dans la salle.
- On évite le compte et ses identifiants, la signature dessinée à chaque
  cours, et les nombreuses façons de signer.

### SoWeSign

- L'app de l'apprenant demande d'allumer le Bluetooth et la localisation pour
  repérer une balise dans la salle, puis ouvre un cadre où signer. Le
  formateur se connecte avec un code de 16 chiffres.
- On évite de demander le Bluetooth ou la localisation, et les codes longs à
  taper.

### Les applis des apprenants en général

- Celle d'Edusign a environ 3,8 sur 5 sur Android. Les plaintes reviennent :
  déconnexions, cadre de signature qui ne s'affiche pas, caméra ou QR code
  qui ne marche plus après une mise à jour, « connexion impossible ».
- On évite tout ce qui demande de se connecter, et un scan sans autre
  solution quand la caméra ne marche pas.

### Google Classroom

- Chaque cours a un fil. L'enseignant choisit si les élèves peuvent y
  publier, seulement commenter, ou rien du tout. Sur un devoir, l'élève et
  l'enseignant ont des commentaires privés. Un devoir pas rendu à temps est
  marqué « Manquant ».
- On garde la réponse privée à une publication : c'est notre réponse à une
  annonce. Et des états courts et clairs pour ce qu'il faut rendre.
- On évite le fil où tout le monde publie (décidé le 15 novembre 2026).

### Pronote

- Une information peut demander un accusé de réception : le destinataire
  coche une case. Le casier numérique sert à déposer un document, signalé
  chez le destinataire tant qu'il ne l'a pas ouvert.
- On garde le document signalé tant qu'on ne l'a pas ouvert, chez celui qui
  le reçoit.
- On évite le « vu » envoyé à l'expéditeur. Ce qui doit être confirmé passe
  par un document à signer, comme le règlement intérieur.

### Yousign

- Le signataire reçoit un lien, lit le document, tape un code reçu par SMS,
  puis un seul bouton signe tous les documents d'un coup.
- On garde le document lisible en entier avant de signer, et plusieurs
  documents signés d'un seul coup.
- On évite le code par SMS, qui demande un prestataire payant. Ici, la preuve
  vient de la clé de l'appareil.

### WhatsApp

- Une communauté a un groupe d'annonces où seuls les administrateurs
  écrivent. Les membres leur répondent en privé.
- C'est le fil d'annonces de la classe, tel qu'il a été décidé.

## Les gestes de tous les jours

Ce sont des objectifs. On les compte sur les maquettes, puis des scénarios de
test les gardent.

| Geste | Qui | Objectif |
|---|---|---|
| Rejoindre une classe | apprenant | scanner le QR, écrire son prénom et son nom : moins d'une minute, rien à installer |
| Signer sa présence | apprenant | 2 gestes après l'ouverture : « Signer ma présence », viser le QR |
| Signer sa présence sans caméra | apprenant | taper les 6 chiffres affichés sous le QR |
| Faire l'appel | formateur | 2 gestes : « Lancer l'appel », puis « Clore et signer ». La liste se remplit toute seule |
| Signer un document | apprenant | ouvrir le document, « Signer », dessiner, « Valider » |
| Publier une annonce | formateur | écrire, « Publier » |
| Répondre à une demande | apprenant | ouvrir la demande, joindre le fichier, « Envoyer » |
| Voir qui n'a pas répondu | formateur | 1 geste depuis « Aujourd'hui » |
| Prévenir l'entreprise d'une absence | responsable | 1 geste : le mail s'ouvre déjà écrit |
| Vérifier une identité, si le centre le demande | formateur | une fois par apprenant : regarder sa pièce, scanner son QR |

## Les règles d'Opn-Link

1. Le premier écran dit quoi faire maintenant. « Aujourd'hui » s'ouvre au
   lancement, pour tout le monde. L'apprenant y voit sa présence à signer,
   ses documents à signer, ses demandes en attente et les nouvelles annonces.
   Le formateur y voit l'appel à lancer ou à clore, ce qui attend sa
   signature, qui n'a pas répondu, et ses messages. Ce qui ne demande rien
   n'y apparaît pas.
2. Une seule app pour tous. Les écrans sont les mêmes, seuls les gestes
   changent selon le rôle. Un apprenant ne voit jamais un geste de
   responsable, même grisé.
3. Quatre onglets au plus : Aujourd'hui, Classes, Messages, Moi. Tout le reste
   vit dans une classe ou dans une feuille.
4. Un seul scanner, toujours au même endroit, qui reconnaît tout ce qu'on lui
   montre : l'invitation d'une classe, l'appel d'un formateur. C'est le
   « Recevoir » d'OpenContact.
5. La présence se signe d'un geste, avec la clé de l'appareil. Pas de dessin,
   pas de compte, ni Bluetooth ni localisation. Si la caméra ne marche pas,
   l'apprenant tape le code de 6 chiffres affiché sous le QR, qui change en
   même temps que lui. Sans téléphone, il signe sur l'appareil du formateur.
6. L'appel marche même sans réseau dans la salle. Le QR du formateur contient
   tout ce qu'il faut pour signer. Un apprenant sans réseau montre au
   formateur un QR qui contient sa signature, avant la clôture.
7. Avant de clore, le formateur voit qui manque, et peut noter un retard ou un
   départ. À la clôture, chaque case vide devient « absent », et plus rien
   n'entre. Le formateur ne recopie rien.
8. Un document se lit en entier avant d'être signé. « Signer » est en bas, à
   portée de pouce. On dessine sa signature une fois (ou on tape son nom), et
   elle vaut pour tous les documents envoyés ensemble. Elle s'ajoute sur une
   page à la fin, et dans la case du PDF quand il y en a une.
9. Ce qu'on reçoit reste signalé chez soi tant qu'on ne l'a pas ouvert. Rien
   ne dit à l'autre quand on l'a ouvert.
10. Les mêmes mots pour les mêmes états, partout : une demande est envoyée ou
    faite, un document est à signer ou signé, un apprenant est présent ou
    absent, une classe est ouverte ou fermée.
11. Aucun chiffre sur un onglet. Quand quelque chose attend, l'onglet change
    de couleur, et « Aujourd'hui » le dit en mots.
12. Un écran vide montre le premier geste à faire. Un formateur sans classe
    voit « Créer une classe », un apprenant sans classe voit « Scanner le QR
    de ta classe ». Pas de tutoriel au premier lancement.
13. À l'ordinateur, le formateur a plus de place, pas plus de fonctions :
    « Aujourd'hui » en colonnes, le suivi en tableau, et l'appel en plein
    écran pour être projeté.
14. Peu de réglages. Un réglage existe seulement quand les centres font
    vraiment différemment. Il a une valeur par défaut, et seul le chef le
    voit, dans les réglages de la classe.
15. Quand le centre demande de vérifier les identités, ça se fait pendant le
    premier appel. La liste montre les apprenants pas encore vérifiés, et le
    formateur les vérifie un par un.
16. Le tuteur ne voit que ses apprentis : leurs présences et leurs absences.
    Ni les annonces, ni les messages, ni les autres apprenants. Il n'a que
    deux onglets, Aujourd'hui et Moi.
17. Un justificatif médical est annoncé comme tel avant l'envoi : l'apprenant
    sait qu'il ira seulement aux responsables.
18. Au premier passage, le site propose une seule fois de s'ajouter à l'écran
    d'accueil, avec la raison en une phrase : sans ça, le téléphone efface les
    données après 7 jours sans visite.

## Sans trop en faire

Ce que la première version ne fait pas, exprès :

- pas de fil où toute la classe discute ;
- pas de « vu », pas de « en train d'écrire », pas d'indicateur « en ligne » ;
- pas de réactions ni d'emoji sur les messages ;
- pas de photo de profil ;
- pas de points ni de classement ;
- pas de tutoriel ni de visite guidée ;
- pas de réglage là où une bonne valeur par défaut suffit.

## Les écrans de la première version

Chaque écran a un but qu'on peut dire en un mot. C'est la liste à dessiner.

Les onglets :

- Aujourd'hui : ce qui attend.
- Classes : mes classes. Une classe s'ouvre sur ses annonces.
- Messages : mes conversations privées.
- Moi : mon nom, mes appareils, ma phrase de secours, le thème.

Dans une classe :

- Annonces : le fil de la classe.
- Présence : les demi-journées et leurs feuilles.
- Documents : à signer, signés, reçus.
- Documentation : les supports de la formation.
- Suivi : le tableau de bord pour les responsables, ses propres réponses pour
  l'apprenant.
- Membres : qui est là et avec quel rôle, inviter, passer la main, fermer la
  classe.
- Réglages : seulement chez le chef.

Chez un tuteur :

- Aujourd'hui : les présences et les absences de ses apprentis.
- Moi : son nom, ses appareils, le thème.

Les feuilles, qui s'ouvrent par-dessus un écran :

- Scanner
- Rejoindre une classe (prénom et nom)
- Créer une classe
- L'appel : le QR en grand, la liste qui se remplit, « Clore et signer »
- Signer un document
- Nouvelle annonce
- Nouvelle demande
- Répondre à une demande
- Envoyer un document
- Le questionnaire de suivi : l'envoyer, y répondre
- Inviter : le QR et le code de la classe
- Inviter un tuteur : son lien à lui
- Vérifier une identité
- Justifier une absence

## Comment on vérifie

- Chaque écran est dessiné au téléphone (390 × 844 et 360 × 640) et à
  l'ordinateur (1280 × 800), en clair et en sombre, avec des données
  inventées.
- Le test des cinq secondes : on montre l'écran cinq secondes à quelqu'un qui
  ne connaît pas l'app, puis on lui demande à quoi il sert et ce qu'il
  ferait.
- Les gestes de tous les jours sont comptés sur les maquettes.
- Dès que possible, un vrai formateur et quelques apprenants essaient l'appel
  et la signature d'un document.

## Sources

- Les notes de la recherche :
  [concurrents.md](recherche/emargement/notes/concurrents.md) et
  [douleurs_et_local_first.md](recherche/emargement/notes/douleurs_et_local_first.md).
- Edusign : [fiche App Store de l'app apprenant](https://apps.apple.com/FR/app/id1488745609),
  [aide « Sign by QR code »](https://help.edusign.com/en/articles/4742566-sign-by-qr-code)
  (lue par les résultats de recherche),
  [page émargement](https://edusign.com/attendance-software).
- SoWeSign : [fiche App Store de SWS Student](https://apps.apple.com/FR/app/id1526138680),
  [tutoriel formateur de l'IUT de Tremblay, Paris 8](https://www.iutt.univ-paris8.fr/IMG/pdf/tutoriel_formateur_-_sowesign.pdf),
  [comparatif La Fabrique du Net](https://www.lafabriquedunet.fr/logiciels/alternatives/alternative-sowesign).
- Google Classroom : [guide utilisateur en français](https://services.google.com/fh/files/misc/google_classroom_user_guide_fr.pdf),
  [les commentaires privés, par Alice Keeler](https://alicekeeler.com/2020/03/29/private-comments-are-the-best-part-of-google-classroom/).
- Pronote : [communiquer avec Pronote, académie de Nice](https://www.pedagogie.ac-nice.fr/dane/documents-dane/editeurs/laffez/communication-pronote.pdf),
  [aide-mémoire de l'espace professeurs 2025](https://www.index-education.com/contenu/telechargement/pn/v2025.0/pdf/Aide-Memoire-espace-professeurs-pronote-fr-2025.pdf).
- Yousign : [signer des documents](https://help.youtrust.com/en/articles/74213-sign-documents),
  [la signature par code SMS](https://yousign.com/fr-fr/blog/signature-electronique-sms).
- WhatsApp : [réponses dans les groupes d'annonces, blog officiel](https://blog.whatsapp.com/new-to-communities-events-and-replies-in-announcement-groups?lang=fr),
  [guide Trengo des communautés](https://trengo.com/fr/blog/how-to-create-community-in-whatsapp-business).
