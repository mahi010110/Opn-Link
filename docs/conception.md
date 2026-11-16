# La conception : le concept, la navigation, les maquettes

Proposé par Fable 5 le 15 novembre 2026, à partir du
[brief](brief-conception.md).

- Le concept, « la réponse d'abord », est accepté par le mainteneur le 15
  novembre 2026 (« Ok pour le concept »).
- Les questions 2 à 7 de la partie 10 attendent son avis. Les maquettes
  suivent mes recommandations.
- Les maquettes des moments clés sont dans [../maquettes/](../maquettes/),
  et ce qu'elles ont changé est en partie 11. Elles ne sont pas validées.

## 1. Le concept : la réponse d'abord

Chaque personne ouvre Opn-Link avec une question en tête. L'écran d'entrée y
répond tout de suite, avant qu'elle cherche.

| Qui | Sa question | L'écran d'entrée quand tout va bien | Sinon |
|---|---|---|---|
| L'apprenant | Je suis en règle ? | « En règle », et sa semaine | ce qu'il doit faire, une seule chose |
| Le formateur | C'est bon pour ce cours ? | la bonne classe et « Lancer l'appel » | l'appel à clore, qui n'a pas répondu |
| La salle | On fait quoi ? | le QR, le code, l'avancée | |
| Le centre | Qu'est-ce qui manque ? | « Complet jusqu'au 13 novembre » | ce qui manque, le plus ancien d'abord |
| Le tuteur | Il était là ? | « Karim était au centre cette semaine » | « Karim a été absent mardi matin » |

Je garde « une chose à la fois, au bon moment » et je l'élargis. Il décrit
bien les moments où il y a un geste à faire. Mais souvent il n'y en a pas :
les semaines en entreprise, le soir, après l'appel, chez le tuteur, au centre
quand tout est complet. Un concept bâti sur le geste laisse ces écrans vides.
Bâti sur la réponse, l'écran a toujours quelque chose à dire. Et quand il y a
un geste à faire, la réponse est ce geste, un seul.

## 2. Les règles du concept

Ces règles valent dans les cinq interfaces, et chacune se vérifie sur une
capture.

### La touche

- Un seul bouton plein par écran, en bas, à la même place dans toutes les
  interfaces.
- Sur l'écran d'entrée, il n'existe que pour ce que la personne doit faire
  maintenant : signer sa présence, signer un document, lancer l'appel, clore.
- Le geste fait, la case de la demi-journée s'enfonce, avec l'heure, et
  l'écran dit « Présent · 9 h 02 · reçu par Awa Diallo ». L'apprenant garde
  sous les yeux la preuve qu'il a signé.
- Quand rien n'est dû, il n'y a pas de touche. Karim n'a rien à lire : il
  regarde le bas de l'écran.
- S'il y a plusieurs choses dues, la touche porte la première, puis passe à
  la suivante. L'ordre : l'appel ouvert, ce qui est en retard, l'échéance la
  plus proche. Les autres se lisent sous « Ensuite », sans compteur.
- Une touche en trame attend quelque chose : « Signer », tant que le
  document n'est pas lu jusqu'au bout.
- Dans une fenêtre ouverte pour faire quelque chose, la touche est le geste
  qui la termine : « Publier », « Envoyer », « Valider ».
- Les boutons qui mènent ailleurs gardent leur relief 98, sans jamais être
  pleins.

Écarté : le compteur de choses à faire. Un chiffre oblige à ouvrir pour
savoir quoi, et il compte à la place de la personne.

### La ligne

La présence se dessine pareil partout : une case par demi-journée.

- L'apprenant voit sa ligne : les dix cases de sa semaine.
- Le tuteur voit la même ligne.
- Le formateur voit une colonne : une demi-journée, tous les apprenants.
- La salle voit cette colonne sans les noms, en pavés.
- Le centre voit toute la grille.

Les documents et les demandes suivent la même grille : une colonne par chose
demandée, une case par apprenant.

La raison : on apprend à lire une case une fois, et les cinq interfaces ont
l'air d'un seul produit. L'apprenant voit aussi exactement ce que voit son
tuteur.

### Le QR et les noms ne sont jamais sur le même écran

L'écran qui montre le QR de l'appel est fait pour être vu de tous. Les noms
sont ailleurs : sur le téléphone du formateur, ou plus tard, quand il les
demande. Le détail est dans la carte du cours, partie 4.

### Le lien d'entrée fixe le rôle

Personne ne choisit « apprenant » ou « formateur » dans une liste. Le QR
d'une classe ouvre l'interface de l'apprenant. « Créer une classe » et
l'invitation d'un responsable ouvrent celle du formateur ou du centre. Le
lien reçu par e-mail ouvre la page du tuteur.

### Les heures de la classe

La classe a déjà ses horaires. Opn-Link s'en sert pour le repos de chacun,
sans réglage.

- Ce qui est envoyé en dehors des heures de la classe arrive à l'ouverture
  suivante, une heure avant le début du matin.
- Celui qui écrit le lit sur sa touche : « Envoyer · arrivera lundi à 8 h ».
- Le message part tout de suite, chiffré, avec son heure d'arrivée dedans.
  C'est l'app de celui qui reçoit qui attend pour le montrer. L'appareil de
  celui qui écrit peut donc s'éteindre.
- Lire, signer un document et répondre à une demande restent possibles à
  toute heure.

Awa peut écrire son annonce le dimanche soir : elle arrive lundi matin.

### Un écran d'entrée, et des fenêtres

- Chaque interface a un seul écran d'entrée. Tout le reste est une fenêtre
  qu'on ouvre depuis lui et qu'on ferme pour y revenir.
- Au téléphone, deux niveaux au plus sous l'écran d'entrée. « Retour » est
  en bas à gauche, toujours à la même place, et le bouton retour du
  téléphone fait la même chose.
- Une fenêtre sert à une seule chose, et sa barre de titre la nomme en un
  mot.
- Le téléphone montre une fenêtre, la tablette deux, l'ordinateur trois,
  l'écran de la salle une seule, très grande. Ce sont les mêmes fenêtres.

La raison : Karim craint de ne pas savoir revenir. Avec un seul écran
d'entrée et un seul « Retour », il ne peut pas se perdre.

## 3. La grammaire du matériel

Je pars du tableau du brief (partie 9) et je le resserre : un état, un sens.

| État du matériel | Son sens, partout |
|---|---|
| bouton plein, teal, en relief | ce que tu dois faire maintenant : la touche |
| relief enfoncé | fait : signé, envoyé, clos |
| en creux | là où tu écris ou dessines |
| barre de titre marine, case marine | maintenant : l'appel ouvert, la demi-journée en cours |
| trame | pas maintenant : en entreprise, centre fermé, classe fermée |
| pavés | ce que la classe fait ensemble, sans noms |
| ligne en mono | les faits : l'heure, parti, reçu, en attente du réseau |
| rouge | ce qui manque et qui est en retard |

Silkscreen ne sert qu'aux barres de titre, à 16 ou 24 px. Une information
qui compte est en Public Sans ou en mono.

## 4. Les cartes de navigation

### L'apprenant, au téléphone

#### Par où on entre

- La première fois, par le QR de la classe. C'est un lien : l'appareil photo
  du téléphone l'ouvre dans le navigateur, sans rien installer. L'écran
  montre déjà le nom de la classe et du centre, et demande le prénom et le
  nom. « Rejoindre », puis un responsable accepte.
- Ensuite, par l'icône ou par le site : l'écran du jour.
- Sans classe : « Viser le QR de ma classe », « Taper le code de ma
  classe », « J'ai une phrase de secours ».

#### L'écran du jour, de haut en bas

1. La date et le lieu, en mono : « MAR. 17 NOV. · AU CENTRE ». Le lieu vaut
   « au centre », « en entreprise » ou « centre fermé ». L'apprenant voit ce
   que l'app a compris. Avec plusieurs classes, le nom de la classe est
   écrit à côté et permet d'en changer.
2. Quatre entrées, en mots, toujours à la même place : Classe, Messages, Mes
   documents, Moi.
3. Ma semaine : dix cases. Enfoncée avec l'heure pour une présence signée,
   marine pour maintenant, en trame pour l'entreprise, rouge pour une
   absence.
4. La réponse : « En règle », ou ce qui est dû.
5. À lire : la dernière annonce, affichée en entier, et « Awa Diallo t'a
   écrit ».
6. La touche, seulement si quelque chose est dû.
7. Une ligne de faits : « Tout est parti », ou « 1 envoi attend le réseau ».

```
L'écran du jour
├─ la touche        → Signer ma présence
│                   → Lire et signer un document
│                   → Répondre à une demande
│                   → Justifier une absence
├─ Ma semaine       → Mes présences : les semaines passées, ce que voit mon tuteur
│                      une absence → Justifier · C'est une erreur (écrire au formateur)
├─ une annonce      → Répondre en privé à son auteur
├─ Classe           → le fil des annonces · Documentation
├─ Messages         → une ligne par responsable → la conversation
├─ Mes documents    → à signer · signés · reçus
└─ Moi              → mon nom · mes appareils · ma phrase de secours · le thème
```

#### Comment on revient

« Retour », en bas à gauche. Après un geste dû, l'apprenant revient seul à
l'écran du jour, où la touche est enfoncée.

#### Les idées

- Signer : le viseur et les six cases du code sont sur le même écran, avec
  un pavé de chiffres dessiné dans la page. Il n'y a pas de bascule entre
  « caméra » et « code ». Si la caméra refuse, les chiffres sont déjà là.
- Sans réseau : si la signature n'est pas reçue par l'appareil du formateur
  au bout de dix secondes, l'écran affiche seul le QR à lui montrer.
- Après la signature : la touche passe à la chose suivante. L'apprenant a
  l'app ouverte à ce moment-là, et le site ne peut pas le prévenir
  autrement.
- En entreprise : les cases de la semaine sont en trame, l'écran dit « En
  règle » et « Retour au centre : lundi 23, 9 h », puis « Pour lundi » : ce
  qui est dû avant le retour.
- Une absence mal comptée : la case rouge mène à « Justifier » ou à « C'est
  une erreur », qui écrit au formateur qui a clos l'appel.
- « Écouter » sur chaque annonce : le téléphone la lit à voix haute, avec la
  voix française qu'il a déjà. Pour Karim, et pour ceux qui lisent mal.
- L'écran d'accueil de l'iPhone : l'app le demande une fois, juste après la
  première présence signée, avec la raison. Elle le redemande une seule
  fois, à la dernière demi-journée avant plus de sept jours sans cours. Sur
  iPhone, l'ajout se fait dans Safari : l'écran montre les trois pas, sans
  touche. Sur Android, la touche « Installer » le fait.
- « Mes documents » et « Documentation » se ressemblent trop pour quelqu'un
  qui lit mal. Ils ne sont jamais côte à côte : la documentation est dans
  « Classe ».

### Le cours, pour le formateur

#### Par où on entre

L'app s'ouvre sur le cours du moment. Elle choisit la
classe avec l'heure, les horaires de chaque classe et ce qu'elle a appris des
appels passés (le mardi matin, c'est BTS SIO 2). Si elle se trompe, « Mes
cours » range les classes par heure du prochain cours, pas par nom.

#### L'écran d'entrée, avant, pendant et après l'appel

- Avant l'appel : la classe, le centre, et la touche « Lancer l'appel ».
- Pendant : sur l'ordinateur, l'écran de la salle. Sur le téléphone, la
  liste.
- Après : « Clos et signé · 9 h 12 · 22 présents, 2 absents », enfoncé.
  Dessous, « Prochain cours : jeudi 19, matin », proposé par l'app, qu'on
  peut changer.

Sous l'état, « À suivre » pour cette classe : « Convention de stage · 5 sans
réponse », avec « Relancer ». « Karim Benali, absent ce matin », avec
« Prévenir l'entreprise ». « 3 apprenants demandent à entrer », avec
« Accepter ». Les messages reçus.

```
Le cours (la classe du moment)
├─ la touche        → Lancer l'appel   [ordinateur : l'écran de la salle]
│                                      [téléphone : la liste]
│                   → Clore et signer
├─ À suivre         → Relancer · Prévenir l'entreprise · un message reçu
├─ Classe           → Fil : écrire, publier
│                      Suivi : la grille des demandes et des documents
│                        → Nouvelle demande · Nouveau document à signer
│                        → Montrer à la salle
│                      Présences : la grille des demi-journées → une feuille
│                      Documentation
│                      Membres : inviter, tuteurs, adjoints
│                      Réglages, chez le chef seulement
├─ Messages         → une conversation
├─ Mes cours        → une autre classe · Créer une classe
└─ Moi
```

#### La liste, sur le téléphone pendant l'appel

- Ceux qui n'ont pas signé sont en haut. Ceux qui signent descendent.
- Un nom ouvre ses gestes : Retard, Départ, « Signer sur mon téléphone »,
  « Lire son QR », « Vérifier son identité » si le centre le demande.
- La touche dit ce qu'on signe : « Clore et signer · 22 présents, 2
  absents ». Un geste, et « Annuler » pendant trente secondes.

Le téléphone a la caméra, il se déplace dans la salle et il n'est pas
projeté. C'est lui qui lit le QR d'un apprenant sans réseau et qu'on tend à
celui qui n'a pas de téléphone. Awa a déjà les deux appareils.

#### Avec un seul appareil, ou deux écrans

- Un téléphone seul montre le QR. « Liste » le remplace par les noms, et on
  revient au QR. Jamais les deux ensemble.
- Un ordinateur seul et projeté montre le QR et le compte. « Clore et
  signer » y montre le nombre d'absents, pas leurs noms. Les noms
  n'apparaissent que si le formateur ouvre « Voir les noms », et le bouton
  le dit.
- Un ordinateur avec un second écran branché en écran étendu : la salle sur
  l'écran branché, la liste sur l'ordinateur.

Quand tout va bien, le formateur n'a pas besoin des noms. Il compare le
compte de l'écran au nombre de têtes dans la salle. S'ils sont égaux, il
clôt.

À l'ordinateur, hors de la salle : « Mes cours » à gauche, le cours au
milieu, la classe ou les messages à droite.

### L'écran de la salle

Il n'a pas de navigation. Il montre ce que la classe fait ensemble
maintenant, puis il se ferme.

| Ce qu'il montre | Quand | Ce qu'on y voit |
|---|---|---|
| Rejoindre | le premier jour | le QR de la classe, son code, « 18 ont rejoint » en pavés |
| L'appel | chaque demi-journée | le QR qui change, les six chiffres, les pavés, l'heure |
| Ensemble | quand le formateur le lance | un document à signer ou une demande : son titre, « 14 sur 24 » en pavés |
| Fermer | le dernier jour | « Téléchargez vos documents », les pavés |

- Aucun nom, jamais.
- Un texte fait au moins 4 mm de haut par mètre de salle. Le QR fait au
  moins un dixième de la distance.
- Le QR reste noir sur blanc dans les deux thèmes.
- Il se réduit en une bande, avec les six chiffres et le compte, qui reste
  au-dessus des diapositives du formateur. Les six chiffres se lisent encore
  quand le QR est trop petit : les retardataires tapent le code.
- À la clôture : « Appel clos · 9 h 12 » pendant trois secondes, puis la
  fenêtre se ferme.

« Ensemble » est nouveau. Aujourd'hui, un règlement intérieur se signe en
salle, sur papier, en deux minutes. Envoyé sur les téléphones, il se signe
quand chacun y pense, et le centre relance. Montré à la salle, tout le monde
le signe au même moment, et les pavés montrent qu'il en manque, sans dire
qui.

### Le bureau, pour le centre

#### Par où on entre

« À compléter » : ce qui manque dans toutes les classes, le
plus ancien d'abord. Chaque ligne porte son geste. Quand rien ne manque,
l'écran dit « Complet jusqu'au vendredi 13 novembre ».

#### Deux dates par classe, à la place des graphiques

- « Complet jusqu'au » : avant cette date, chaque feuille est close et
  contresignée, et chaque absence est traitée.
- « Exporté jusqu'au » : avant cette date, tout est rangé dans les fichiers
  du centre.

Les logiciels de comptabilité font pareil avec leur date de clôture. Lors
d'un contrôle, Sandrine sait jusqu'où elle peut exporter sans vérifier.

L'écran : une colonne à gauche (À compléter, les classes avec leurs deux
dates, Archives), le contenu à droite, le chemin en haut (« Centre Exemple ›
BTS SIO 2 › Novembre › Mardi 17, matin »), une ligne de faits en bas.

```
Le bureau
├─ À compléter      → une feuille pas close      → Relancer le formateur
│                   → une absence pas traitée    → Prévenir l'entreprise
│                   → un document pas signé      → Relancer
├─ Classes          → une classe · Créer une classe
│    ├─ Présences   → la grille du mois → la touche : Exporter le mois
│    │                 → une feuille → une signature et sa preuve
│    ├─ Documents · Demandes · Recherche : la même grille, d'autres colonnes
│    ├─ Fil · Documentation · Membres
│    └─ un apprenant → sa ligne : présences, documents, demandes, messages, tuteur
├─ Archives         → les classes fermées, par année, « à garder jusqu'en 2036 »
└─ Chercher         → un nom, même mal écrit
```

#### Comment on revient

Par le chemin en haut, où chaque morceau se clique. Au
clavier, les flèches se déplacent dans la grille, Entrée ouvre, Retour
arrière remonte, « / » cherche. Chaque touche du clavier est écrite sur ce
qu'elle commande.

### Le lien du tuteur

Il entre par un e-mail du centre ou du formateur, et revient en fermant
l'onglet.

- L'objet du mail porte la réponse : « Karim Benali : absent mardi 17
  novembre, matin ». Michel le sait sans rien ouvrir.
- Le lien du mail ouvre une page. Le même lien montre toujours la semaine
  en cours : un vieux mail mène à l'état d'aujourd'hui.
- La page : une phrase (« Karim était au centre cette semaine. »), sa ligne
  de dix cases, les semaines d'avant dessous, « Écrire au centre ».
- Pas de menu, pas de compte, pas de touche : Michel ne doit rien.
- La clé est dans le lien. Rien n'a besoin de rester dans le téléphone.
- Avec deux apprentis, deux lignes sur la même page.

## 5. Les gestes comptés

| Moment | Objectif | Prévu |
|---|---|---|
| Rejoindre une classe | moins d'une minute | viser le QR, écrire prénom et nom, « Rejoindre » |
| Signer sa présence | 2 gestes | 2 : la touche, viser. 1 seul si le QR est un lien (partie 8) |
| Signer sans caméra | 6 chiffres | 6 chiffres sur le même écran, envoi au sixième |
| Signer sans réseau | montrer un QR | rien de plus : le QR s'affiche seul |
| Lancer l'appel | 1 geste | 1 |
| Voir qui manque | sans que la salle le voie | ouvrir l'app sur son téléphone |
| Clore et signer | 1 geste | 1, avec « Annuler » trente secondes |
| Signer un document | ouvrir, lire, signer, dessiner, valider | la touche, lire, « Signer », dessiner, « Valider » |
| Répondre à une demande | ouvrir, joindre, envoyer | la touche, joindre, « Envoyer » |
| Lire une annonce | sans la chercher | 0 : elle est sur l'écran du jour |
| Écrire à un formateur | parfois | Messages, son nom, écrire |
| Publier une annonce | écrire, publier | Classe, écrire, « Publier » |
| Voir qui n'a pas répondu, relancer | 1 geste depuis l'entrée | 1 : « Relancer » est sur l'écran d'entrée |
| Prévenir l'entreprise | 1 geste | 1 |
| Exporter les feuilles | 1 geste | 1 depuis la classe, 2 depuis l'entrée |
| Voir les présences de son apprenti | sans app | 0 : c'est dans l'objet du mail |

## 6. Les défis du brief

| Défi | La réponse évidente | Ce que je propose |
|---|---|---|
| L'appel, vu par trois écrans | une fenêtre projetée, les noms derrière un bouton | le QR sur l'ordinateur, les noms sur le téléphone du formateur |
| Être en règle | un compteur | la touche, présente ou absente, « En règle », la semaine en dix cases |
| Les semaines en entreprise | le même écran, vide | les cases en trame, la date du retour, « Pour lundi » |
| Lire peu | des icônes partout | une touche, des places fixes, un mot avec son pictogramme, « Écouter » |
| Trois centres, cinq classes | une liste de classes | la classe choisie par l'heure et l'habitude |
| Le tuteur | un compte et un tableau de bord | la réponse dans l'objet du mail, un lien toujours à jour |
| Le centre et ses preuves | des graphiques | « À compléter », et deux dates |
| Le soir et le week-end | un réglage | les heures de la classe |
| Sans réseau | un message d'erreur | la ligne de faits, et le QR qui s'affiche seul |
| L'iPhone | une bannière au premier lancement | demandé une fois, après la première signature, avec la raison |
| La première minute | un accueil et un tutoriel | le QR ouvre « Rejoindre », la classe déjà affichée |
| La fin | un e-mail | la classe se ferme en salle, le dernier jour |

Pour la fin : « Télécharge tes documents » devient la dernière demande de la
classe. Elle se suit et se relance comme les autres pendant les trente
jours, et l'écran de la salle montre son avancée le dernier jour.

Pour l'iPhone : tout ce qui compte est aussi chez les responsables. Un
apprenant qui a tout perdu rejoint sa classe en une minute à son retour, un
responsable le reconnaît, et son appareil lui renvoie ses documents.
L'écran d'accueil est un confort, on le demande sans faire peur.

## 7. Les pistes écartées

- Une barre d'onglets en bas (Aujourd'hui, Classes, Messages, Moi). C'est
  l'interface d'OpenContact. Elle met quatre endroits au même niveau alors
  que l'apprenant en utilise un seul tous les jours, et elle prend la place
  du pouce, que je réserve à la touche.
- Un compteur ou une pastille. Voir « La touche ».
- La liste des noms derrière un bouton, sur la fenêtre projetée. Un clic de
  trop, et la salle voit qui manque.
- Écrire les noms en petit, pour qu'ils se lisent de près et pas de loin.
  Projeté sur deux mètres de large, un texte de 12 px fait 2 cm de haut et
  se lit à cinq mètres.
- Ouvrir la caméra dès l'ouverture de l'app, comme Snapchat. Sur un iPhone,
  l'app ajoutée à l'écran d'accueil redemande l'autorisation à chaque fois,
  et une caméra qui s'allume seule inquiète.
- Un calendrier de l'alternance saisi par le chef. C'est une corvée, et un
  réglage de plus. L'app apprend les jours au centre avec les appels, et le
  formateur confirme le prochain cours en clôturant.
- Un mode « ne pas déranger ». C'est un réglage, et ceux qui en ont besoin
  ne le trouvent pas.
- Des graphiques pour le centre. Ils ne disent ni ce qui manque, ni quoi
  faire.
- Un compte ou une app pour le tuteur. Il n'installera rien.
- Un écran « Qui es-tu ? » au premier lancement. Le lien d'entrée le sait.
- Un fil unique où tout arrive (la direction B). Un geste à faire se perd
  sous les messages. Je garde le fil pour lire.
- Le semainier avec ses heures (la direction C). Trop serré à 360 px. Je
  garde dix cases, sans heures.
- Des gestes de balayage entre les écrans. Il faudrait les deviner.
- Bloquer l'app le soir. Seule l'arrivée chez l'autre attend. Lire et signer
  restent possibles.
- Des notifications par un service payant. Voir la partie 8 pour une piste
  sans serveur.

## 8. Ce que j'ai trouvé en cherchant, à mesurer avant d'y compter

Rien de tout ça n'est décidé. La conception marche sans, sauf le premier
point, qui change un moment.

1. Sur iPhone, l'app ajoutée à l'écran d'accueil a son propre stockage,
   séparé de celui de Safari. L'apprenant qui rejoint sa classe dans Safari
   puis ajoute l'icône arrive dans une app vide. La doc ne le prévoit pas.
   Il faut dessiner ce passage. Deux pistes à essayer sur un vrai iPhone :
   faire passer l'identité dans l'adresse au moment de l'ajout, ou afficher
   dans Safari un code à taper dans l'app.
2. Sur iPhone, l'app ajoutée à l'écran d'accueil redemande l'autorisation de
   la caméra. C'est pour ça que le viseur et les chiffres sont sur le même
   écran.
3. Le QR de l'appel pourrait être un lien. L'apprenant viserait alors avec
   l'appareil photo de son téléphone, sans ouvrir l'app, et la page
   signerait en s'ouvrant : un seul geste. Ça marche sur Android, et sur un
   iPhone resté dans Safari. Sur un iPhone où l'app est ajoutée, le lien
   ouvre Safari, qui n'a pas la clé, et la page renvoie vers l'icône et le
   code. À mesurer : le QR passe d'environ 37 à 41 cases.
4. Des notifications sans serveur. L'app pour ordinateur du formateur
   pourrait envoyer elle-même une notification aux téléphones (« L'appel est
   ouvert »), par le service de notifications d'Apple, de Google ou de
   Mozilla. Web Push utilise P-256, HKDF et AES-GCM, que le cœur a déjà. Un
   navigateur ne peut pas l'envoyer, une app installée devrait pouvoir. Je
   n'ai trouvé personne qui l'ait fait ainsi : c'est à essayer.
5. Tauri sait lister les écrans et mettre une fenêtre en plein écran sur
   l'un d'eux. Il ne dit sans doute pas si l'écran est recopié sur un
   projecteur. La règle « le QR et les noms » tient dans les deux cas.
6. « Écouter » dépend de la voix française du téléphone. Elle existe sur
   iPhone et sur Android, de qualité inégale. À essayer sur un Android
   d'entrée de gamme.

## 9. Les trois points ouverts du brief

- Le ton. Tutoyer l'apprenant, le formateur et le centre. Vouvoyer le
  tuteur, comme le recommande [questions-ouvertes.md](questions-ouvertes.md).
  L'écran de la salle parle à un groupe : « Visez le QR ».
- Les annonces plus anciennes. Quand un responsable accepte un apprenant
  arrivé en cours d'année, son appareil lui envoie les annonces encore
  affichées, avec leur date. Elles vont dans le fil, pas dans « À lire ».
- Les règles d'Opn-Link. Je propose de les écrire avec les maquettes, à
  partir des six règles de la partie 2, chacune avec sa façon de la
  vérifier : compter les boutons pleins, chercher un nom sur un écran qui
  porte un QR, compter les niveaux sous l'écran d'entrée, montrer chaque
  écran d'entrée cinq secondes.

## 10. Ce que j'attends du mainteneur

1. « La réponse d'abord » à la place de « une chose à la fois, au bon
   moment » : oui ou non ?
2. Les noms sur le téléphone du formateur, le QR sur l'ordinateur. Et sur un
   ordinateur seul, les noms seulement quand il les demande.
3. Les jours au centre : appris des appels, avec « Prochain cours » à la
   clôture. Ou un calendrier saisi par le chef. Je recommande le premier.
4. Le soir : tout attend l'ouverture, sans exception. Je recommande sans
   exception pour la première version.
5. « Ensemble » sur l'écran de la salle, pour signer un document en classe :
   dans la première version ?
6. « Écouter » : dans la première version, ou plus tard ?
7. Les entrées de l'apprenant en haut de l'écran, en mots. Je montrerai
   aussi la variante en lignes dans la page, pour comparer sur images.

Après l'avis du mainteneur : les maquettes des moments clés, en captures, au
téléphone (390 × 844 et 360 × 640), à l'ordinateur, sur l'écran de la salle,
en clair et en sombre.

## 11. L'étape 2 : les maquettes

Faites les 15 et 16 novembre 2026, dans [../maquettes/](../maquettes/) :
33 écrans, capturés en clair et en sombre, au téléphone (390 × 844 et
360 × 640), à l'ordinateur (1280 × 800) et sur l'écran de la salle
(1280 × 800 et 1920 × 1080). La liste des écrans est dans
[../maquettes/README.md](../maquettes/README.md).

### Ce que le dessin a changé

- La barre de titre dit le lieu : « Au centre », « En entreprise », ou le
  nom du centre chez le formateur, qui en a trois. Elle est marine quand
  l'appel est ouvert, et en trame en entreprise. La date est à sa droite.
- La réponse est un titre posé sur la page, sans cadre : « L'appel est
  ouvert », « Présent », « En règle », « Clos et signé », « Complet
  jusqu'au vendredi 13 novembre ».
- La trame ne passe jamais derrière un texte : dans une barre en trame, le
  titre a son fond plein.
- Chez le centre, « Complet jusqu'au » compte les feuilles et les absences.
  Un document pas signé est dans la liste de ce qui manque, sans faire
  reculer la date.
- Dans la colonne des classes, une date en retard est écrite plus fort que
  les autres.
- Après « Clore et signer », le formateur a trente secondes pour annuler.
  L'empreinte de la feuille part au registre public après ce délai.

### Les gestes, comptés sur les maquettes

| Moment | Objectif | Sur la maquette |
|---|---|---|
| Rejoindre une classe | moins d'une minute | viser le QR, 2 champs, « Rejoindre » |
| Signer sa présence | 2 gestes | 2 : « Signer ma présence », viser |
| Signer sans caméra | 6 chiffres | 6 chiffres, sur le même écran |
| Signer sans réseau | montrer un QR | 0 geste de plus |
| Lancer l'appel | 1 geste | 1 |
| Voir qui manque | sans que la salle le voie | 0 : la liste est l'écran d'entrée du téléphone |
| Clore et signer | 1 geste | 1 |
| Signer un document | ouvrir, lire, signer, dessiner, valider | « Lire et signer », lire, « Signer », dessiner, « Valider » |
| Répondre à une demande | ouvrir, joindre, envoyer | 3 |
| Justifier une absence | motif et justificatif | le motif, joindre, « Envoyer aux responsables » |
| Lire une annonce | sans la chercher | 0 |
| Publier une annonce | écrire, publier | « Classe », écrire, « Publier » |
| Relancer | 1 geste depuis l'entrée | 1 |
| Prévenir l'entreprise | 1 geste | 1 |
| Exporter | 1 geste | 1 depuis la classe |
| Voir les présences de son apprenti | sans app | 0 : l'objet du mail |

### Le texte agrandi à 200 %

Essayé sur tous les écrans de téléphone, à 360 px. Rien ne sort de l'écran.
La barre de titre passe sur deux lignes, les quatre entrées sur deux rangs,
la semaine se lit en rangs (un jour par rang), les boutons se replient.

- Silkscreen ne grandit pas : c'est la règle du matériel. Le lieu, écrit
  dans la barre, reste donc à 16 px.
- Il faut faire défiler plus souvent. Sur l'écran « Signer », le 0 passe
  sous le pli.
- Dans la maquette, la semaine passe en rangs avec `?texte=200`. Dans
  l'app, elle le fera quand une heure ne tient plus dans sa case.

### Ce qui reste à essayer avant de coder ces écrans

- Sur un vrai iPhone : le passage des données de Safari à l'icône (partie
  8, point 1). L'écran `apprenant-iphone` montre la demande, pas ce
  passage.
- Dans une vraie salle : le temps qu'il faut pour taper six chiffres lus de
  loin. Le code doit rester valable ce temps-là, même si le QR change plus
  vite.
- Le test des cinq secondes, sur les cinq écrans d'entrée, avec quelqu'un
  qui ne connaît pas l'app.
- WebKit et Firefox : les captures sont faites avec Chromium seulement.

### Ce qui n'est pas encore dessiné

Messages, Mes documents, Moi, la documentation, les membres et les réglages
de la classe, créer une classe, accepter les apprenants, vérifier une
identité, signer sur le téléphone du formateur, la preuve d'une signature
chez le centre, les archives, le questionnaire de suivi.

## Sources

- Le stockage séparé sur iPhone : [web.dev, le stockage sur le web](https://web.dev/articles/storage-for-the-web),
  [WebKit, bug 181849](https://bugs.webkit.org/show_bug.cgi?id=181849),
  [notes de Maximiliano Firtman](https://firt.dev/notes/pwa-ios/),
  [Netguru, partager un état entre Safari et l'app](https://www.netguru.com/blog/how-to-share-session-cookie-or-state-between-pwa-in-standalone-mode-and-safari-on-ios).
- La caméra redemandée : [WebKit, bug 215884](https://bugs.webkit.org/show_bug.cgi?id=215884),
  [forum des développeurs Apple](https://developer.apple.com/forums/thread/788518).
- Le téléphone du présentateur, l'écran pour la salle :
  [Mentimeter, Mentimote](https://help.mentimeter.com/en/articles/2233579-mentimote-our-presentation-remote),
  [Pear Deck, vue projetée et tableau de l'enseignant](https://docs.goguardian.com/products/pear-deck/use-projector-view-and-teacher-dashboard).
- Une chose par page : [GOV.UK, One thing per page](https://designnotes.blog.gov.uk/2015/07/03/one-thing-per-page/).
- Les messages qui attendent les heures de travail :
  [Viva Insights dans Teams](https://m365admin.handsontek.net/microsoft-viva-schedule-send-suggestions-from-viva-insights-in-teams-chat/).
- La date de clôture : [QuickBooks, clore les comptes](https://quickbooks.intuit.com/learn-support/en-us/help-articles/how-to-close-the-books/00/239822).
- Les écrans dans Tauri : [Monitor](https://docs.rs/tauri/2.1.1/tauri/window/struct.Monitor.html).
- Web Push : [Chrome, l'interopérabilité de Web Push](https://developer.chrome.com/blog/web-push-interop-wins),
  [Mozilla, VAPID](https://blog.mozilla.org/services/?p=635),
  [liste du W3C, sur l'envoi depuis un navigateur](https://lists.w3.org/Archives/Public/public-webapps-github/2023Mar/0605.html).
- La lecture à voix haute : [Readium, SpeechSynthesis selon les navigateurs](https://readium.org/speech/docs/WebSpeech.html),
  [caniuse](https://caniuse.com/speech-synthesis).
