// Les planches : quelles captures, dans quel ordre, avec quelle légende.
// Un écran est donné par son nom (la taille et le thème de la planche s'ajoutent), ou par le nom entier de sa capture.

const TEL = { taille: 'tel', theme: 'clair', largeur: 1360, colonnes: 4 };
const GRAND = { taille: 'ordi', theme: 'clair', largeur: 1280, colonnes: 1 };

export const PLANCHES = [
  {
    nom: '01-apprenant-signer',
    titre: 'L’apprenant : signer sa présence',
    sous: 'Objectif : 2 gestes après l’ouverture. Ici : la touche, puis viser.',
    ...TEL,
    ecrans: [
      ['apprenant-jour-appel', '1. Il ouvre l’app', 'La barre est marine : l’appel est ouvert. Une seule touche, en bas.'],
      ['apprenant-signer', '2. La touche, puis il vise', 'Le viseur et les six chiffres sont sur le même écran. Si la caméra refuse, il tape le code.'],
      ['apprenant-jour-signe', '3. C’est signé', 'La case du mardi matin est enfoncée, avec l’heure. La touche passe à la chose suivante.'],
      ['apprenant-jour-en-regle', 'Quand tout est fait', '« En règle », et plus de touche : le bas de l’écran est vide.'],
    ],
  },
  {
    nom: '02-apprenant-calme',
    titre: 'L’apprenant : rien à faire, ou quelque chose coince',
    ...TEL,
    ecrans: [
      ['apprenant-jour-entreprise', 'En entreprise', 'La barre et les cases sont en trame. L’écran dit la date du retour.'],
      ['apprenant-sans-reseau', 'Sans réseau', 'La signature n’est pas arrivée au bout de dix secondes : le QR s’affiche seul. Le formateur le lit avec son téléphone.'],
      ['apprenant-message-soir', 'Le soir', 'Le message part, et arrive à l’ouverture. La touche le dit.'],
      ['apprenant-iphone', 'Sur iPhone, après la première présence', 'Les trois pas se font dans Safari, l’app ne peut pas les faire. Le passage des données de Safari à l’icône reste à essayer sur un vrai iPhone.'],
    ],
  },
  {
    nom: '03-apprenant-rendre',
    titre: 'L’apprenant : signer un document, répondre, justifier',
    ...TEL,
    ecrans: [
      ['apprenant-document-lire', 'Lire', 'La touche « Signer » est en trame tant que la page 4 n’est pas lue.'],
      ['apprenant-document-dessiner', 'Dessiner, valider', 'Un dessin pour tous les documents envoyés ensemble.'],
      ['apprenant-demande', 'Répondre à une demande', 'La touche, joindre, « Envoyer » : 3 gestes. Il voit à qui ça part.'],
      ['apprenant-absence', 'Justifier une absence', 'Prévenu avant l’envoi : le justificatif médical part aux seuls responsables.'],
    ],
  },
  {
    nom: '04-apprenant-reste',
    titre: 'L’apprenant : rejoindre, relire, finir',
    ...TEL,
    ecrans: [
      ['apprenant-rejoindre', 'La première minute', 'Le QR de la classe ouvre cet écran dans le navigateur. La classe est déjà affichée : deux champs, une touche.'],
      ['apprenant-presences', 'Mes présences', 'La même ligne que celle du tuteur. Une absence mène à « Justifier » ou à « C’est une erreur ».'],
      ['apprenant-classe', 'Classe', 'Le fil se lit. On répond en privé à l’auteur. « Écouter » lit l’annonce à voix haute.'],
      ['apprenant-fin', 'La classe ferme', 'Une touche pour tout télécharger. C’est aussi la dernière demande de la classe.'],
    ],
  },
  {
    nom: '05-apprenant-entrees',
    titre: 'Les entrées de l’apprenant : en haut, ou en lignes',
    sous: 'La question 7 de l’étape 1. En haut, quatre mots toujours à la même place. En lignes, des cibles plus grandes, mais sous le pli dès qu’il y a quelque chose à lire.',
    ...TEL,
    ecrans: [
      ['apprenant-jour-appel-tel-clair.png', 'En haut, 390 × 844'],
      ['apprenant-jour-variante-tel-clair.png', 'En lignes, 390 × 844', 'Deux entrées sur quatre se voient.'],
      ['apprenant-jour-appel-petit-tel-clair.png', 'En haut, 360 × 640'],
      ['apprenant-jour-variante-petit-tel-clair.png', 'En lignes, 360 × 640', 'Aucune entrée ne se voit sans faire défiler.'],
    ],
  },
  {
    nom: '06-formateur-telephone',
    titre: 'Le formateur, au téléphone',
    ...TEL,
    ecrans: [
      ['cours-avant', 'Avant l’appel', 'L’app a choisi la classe avec l’heure. 1 geste : « Lancer l’appel ».'],
      ['cours-liste', 'Pendant l’appel', 'L’ordinateur montre le QR à la salle, le téléphone montre les noms. Ceux qui manquent sont en haut.'],
      ['cours-nom', 'Un apprenant', 'Sans téléphone, sans réseau, ou en retard.'],
      ['cours-apres', 'Après', '1 geste pour clore, trente secondes pour annuler. « Prévenir l’entreprise » et « Relancer » sont sur l’écran d’entrée.'],
      ['cours-publier', 'Publier, un dimanche soir', 'Écrire, « Publier ». L’annonce arrive lundi à 8 h.'],
      ['cours-envoyer', 'Envoyer un document à signer', 'Toute la classe par défaut.'],
    ],
  },
  {
    nom: '07-salle',
    titre: 'L’écran de la salle',
    sous: 'Aucun nom. Le QR fait 62 % de la hauteur de l’écran, les six chiffres 11 % de sa largeur.',
    taille: 'salle',
    theme: 'clair',
    largeur: 1700,
    colonnes: 2,
    ecrans: [
      ['salle-appel', 'L’appel'],
      ['salle-bande', 'L’appel réduit en bande', 'Il reste au-dessus des diapositives. Les retardataires tapent le code.'],
      ['salle-ensemble', 'Ensemble', 'Tout le monde signe le règlement au même moment. Les pavés disent qu’il en manque dix, pas qui.'],
      ['salle-rejoindre', 'Rejoindre, le premier jour'],
    ],
  },
  {
    nom: '08-formateur-ordinateur',
    titre: 'Le formateur, à l’ordinateur',
    ...GRAND,
    ecrans: [
      ['cours-ordinateur', 'Trois fenêtres', 'À gauche ses cours, rangés par heure. Au milieu le cours du moment. À droite la classe : une ligne par apprenant, une colonne par chose demandée.'],
    ],
  },
  {
    nom: '09-centre',
    titre: 'Le centre',
    ...GRAND,
    ecrans: [
      ['bureau-a-completer', 'Ce qui manque', 'Deux dates à la place des graphiques. Chaque ligne porte son geste.'],
      ['bureau-presences', 'Une classe, un mois', 'Une case enfoncée par présence. La seule touche de l’écran exporte ce qui est complet.'],
      ['bureau-complet', 'Quand rien ne manque'],
    ],
  },
  {
    nom: '10-tuteur',
    titre: 'Le tuteur',
    ...TEL,
    largeur: 1020,
    colonnes: 3,
    ecrans: [
      ['tuteur-mail', 'Le mail', 'La réponse est dans l’objet.'],
      ['tuteur-absent', 'La page, une semaine avec une absence', 'Pas de menu, pas de touche : il ne doit rien.'],
      ['tuteur-present', 'La page, une semaine sans absence'],
    ],
  },
  {
    nom: '15-apprenant-ranger',
    titre: 'L’apprenant : ses messages, ses documents, lui',
    ...TEL,
    ecrans: [
      ['apprenant-messages', 'Messages', 'Une ligne par responsable, même sans message : écrire à un formateur prend deux gestes.'],
      ['apprenant-documents', 'Mes documents', 'Rangés par ce qu’il en fait : à signer, signés, reçus, envoyés.'],
      ['apprenant-documentation', 'Documentation', 'Dans « Classe », jamais à côté de « Mes documents ». Un gros fichier est un lien.'],
      ['apprenant-moi', 'Moi', 'Son nom, ses appareils, sa phrase de secours, le thème.'],
      ['apprenant-suivi', 'Le questionnaire de suivi', 'Trois nombres et un choix. Il voit à qui ça part.'],
    ],
  },
  {
    nom: '16-formateur-classe',
    titre: 'Le formateur : créer et tenir sa classe',
    ...TEL,
    ecrans: [
      ['cours-creer', 'Créer une classe', 'Deux noms et les horaires, déjà remplis.'],
      ['cours-inviter', 'Inviter', 'Le QR et le code de la classe.'],
      ['cours-accepter', 'Accepter', 'Tous cochés d’avance : 1 geste pour toute la classe.'],
      ['cours-membres', 'Membres', 'Ce qui ferme la classe est rouge, à part et en dernier.'],
      ['cours-reglages', 'Réglages', 'Chez le chef seulement. Le questionnaire n’apparaît que si le suivi est allumé.'],
      ['cours-tuteur', 'Inviter un tuteur', 'Le mail part de la messagerie du formateur.'],
      ['cours-fermer', 'Fermer la classe', 'Le seul geste qu’on ne peut pas défaire : il dit ce qui va se passer.'],
    ],
  },
  {
    nom: '17-formateur-cas-a-part',
    titre: 'Le formateur : pendant l’appel, les cas à part',
    ...TEL,
    largeur: 700,
    colonnes: 2,
    ecrans: [
      ['cours-signer-ici', 'Sans téléphone', 'Le formateur tend le sien. La feuille le dira.'],
      ['cours-identite', 'Vérifier une identité', 'Seulement si le centre le demande, une fois par apprenant.'],
    ],
  },
  {
    nom: '18-formateur-recherche',
    titre: 'Le formateur : le suivi de la recherche',
    ...GRAND,
    ecrans: [['cours-recherche', 'La classe, onglet Suivi', 'La réponse d’abord : combien ont trouvé, combien se taisent. Ceux qui ont besoin de lui sont en haut, avec leur geste.']],
  },
  {
    nom: '19-centre-preuves',
    titre: 'Le centre : une feuille, un apprenant, les archives',
    ...GRAND,
    ecrans: [
      ['bureau-feuille', 'Une feuille et la preuve d’une signature', 'Comment chacun a signé, la correction visible, et ce qui prouve la date.'],
      ['bureau-apprenant', 'Un apprenant', 'Sa ligne : la même que voit son tuteur. « Prévenir l’entreprise » est à côté de l’absence.'],
      ['bureau-archives', 'Les archives', 'Jusqu’à quand garder chaque classe, et quand elle a été exportée.'],
    ],
  },
  {
    nom: '11-sombre-telephone',
    titre: 'En sombre, au téléphone',
    ...TEL,
    theme: 'sombre',
    ecrans: [['apprenant-jour-appel', 'L’appel est ouvert'], ['apprenant-signer', 'Signer'], ['apprenant-jour-entreprise', 'En entreprise'], ['cours-liste', 'La liste du formateur']],
  },
  {
    nom: '12-sombre-grands-ecrans',
    titre: 'En sombre, la salle et le centre',
    ...GRAND,
    ecrans: [
      ['salle-appel-salle-sombre.png', 'L’écran de la salle', 'Le QR reste sombre sur blanc.'],
      ['bureau-a-completer-ordi-sombre.png', 'Le centre'],
    ],
  },
  {
    nom: '13-petit-telephone',
    titre: 'Le petit téléphone, 360 × 640',
    ...TEL,
    taille: 'petit-tel',
    ecrans: [
      ['apprenant-jour-appel', 'L’appel est ouvert'],
      ['apprenant-signer', 'Signer'],
      ['apprenant-document-dessiner', 'Dessiner'],
      ['apprenant-absence', 'Justifier'],
      ['cours-liste', 'La liste du formateur'],
      ['cours-apres', 'Après l’appel'],
      ['tuteur-absent', 'Le tuteur'],
      ['apprenant-jour-en-regle', 'En règle'],
    ],
  },
  {
    nom: '14-texte-agrandi',
    titre: 'Le texte agrandi à 200 %, à 360 px',
    sous: 'Rien ne sort de l’écran. La barre de titre passe sur deux lignes, la semaine se lit en rangs, les boutons se replient. Silkscreen ne grandit pas : c’est la règle du matériel. Il faut faire défiler plus souvent, par exemple pour atteindre le 0.',
    ...TEL,
    ecrans: [
      ['apprenant-jour-appel-petit-tel-texte200.png', 'L’appel est ouvert'],
      ['apprenant-signer-petit-tel-texte200.png', 'Signer'],
      ['apprenant-jour-en-regle-petit-tel-texte200.png', 'En règle'],
      ['apprenant-absence-petit-tel-texte200.png', 'Justifier'],
      ['cours-liste-petit-tel-texte200.png', 'La liste du formateur'],
      ['cours-apres-petit-tel-texte200.png', 'Après l’appel'],
      ['tuteur-absent-petit-tel-texte200.png', 'Le tuteur'],
    ],
  },
];
