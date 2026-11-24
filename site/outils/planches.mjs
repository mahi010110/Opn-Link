// Réunit les captures du scénario de la classe en planches, avec leur légende, pour les regarder d'un coup.

import { createRequire } from 'node:module';
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const SITE = fileURLToPath(new URL('..', import.meta.url));
const CAPTURES = join(SITE, 'captures');

const PLANCHES = [
  {
    nom: 'planche-1-rejoindre',
    titre: 'Créer la classe, la rejoindre, accepter',
    sous: 'Awa crée la classe et l’invite. Léa ouvre le lien du QR, Yanis tape le code, d’abord de travers, Noah ouvre le lien sans réseau. Awa accepte tout le monde sauf Kevin, qu’elle ne connaît pas.',
    colonnes: 4,
    largeur: 1360,
    images: [
      ['01-formateur-creer', 'Créer une classe', 'Son nom, la première fois, puis la classe et ses horaires.'],
      ['01b-formateur-heure-illisible', 'Une heure illisible', '« midi » à la place d’une heure : seul ce champ est marqué, et tout ce qui est tapé reste.'],
      ['02-formateur-classe-neuve', 'La classe neuve', 'Personne encore : la touche invite.'],
      ['03-formateur-inviter', 'Inviter', 'Le QR est un lien. Le code s’affiche dessous.'],
      ['04-apprenant-rejoindre', 'Léa ouvre le lien', 'La classe s’affiche tout de suite. Deux champs, une touche.'],
      ['05-apprenant-attente', 'En attente', 'Rien à faire : la classe s’ouvre quand c’est accepté.'],
      ['06-apprenant-sans-classe', 'Sans le lien', 'Yanis ouvre le site et tape le code.'],
      ['07-apprenant-code-faux', 'Un code de travers', 'L’erreur sous le champ. Ce qui est tapé reste.'],
      ['07b-apprenant-lien-sans-reseau', 'Le lien, sans réseau', 'Rien à faire : la classe s’affiche quand le réseau revient.'],
      ['09-formateur-demandes', 'Cinq demandent à entrer', 'Sur l’écran du cours, dans « À suivre ».'],
      ['10-formateur-accepter', 'Accepter', 'Tous cochés d’avance. Kevin est décoché : il reste dehors.'],
      ['11-apprenant-admis', 'Léa est dans la classe', 'Pas d’appel ouvert : rien à faire, donc pas de touche.'],
      ['12-formateur-membres', 'Les membres', 'Le chef, puis les apprenants acceptés.'],
    ],
  },
  {
    nom: 'planche-2-appel',
    titre: 'L’appel, avec les vrais membres',
    sous: 'Le fil annonce l’appel. Léa signe, Yanis se trompe puis signe, Inès n’a plus de réseau et tend son QR, Noah est absent. Awa clôt et annonce le prochain cours. Le réseau revenu, Inès reçoit la réponse. Sans réseau, le site se rouvre depuis le téléphone. Jeudi, Léa est en entreprise.',
    colonnes: 4,
    largeur: 1360,
    images: [
      ['13b-apprenant-appel-ouvert', 'L’appel est ouvert', 'Annoncé sur le fil : la barre passe en marine, la touche apparaît.'],
      ['13c-apprenant-viseur', 'Léa vise le mauvais QR', 'Celui de la classe : une phrase sous le code, rien ne part. Puis elle vise celui de l’appel, et sa présence part.'],
      ['14-apprenant-signee', 'Léa a signé', 'Reçue par Awa Diallo. Sur iPhone, l’app propose une fois de la garder sur l’écran d’accueil, avec les trois pas.'],
      ['15-apprenant-sans-reseau', 'Inès n’a plus de réseau', 'Au bout de dix secondes, le QR de sa présence s’affiche seul.'],
      ['15b-formateur-lire-qr', 'Awa lit son QR', 'Avec la caméra de son téléphone. Elle vise d’abord le QR de la salle : une phrase, et rien n’entre.'],
      ['16-formateur-clos', 'Clos et signé', 'Noah est absent. Kevin n’est pas sur la feuille.'],
      ['16b-apprenant-absence', 'Chez Noah', 'L’appel clos sans sa présence : une absence, et qui a clos. Sa semaine le montre.'],
      ['16c-formateur-prochain', 'Le prochain cours', 'L’app propose la demi-journée suivante. Awa choisit lundi 23 au matin et l’annonce à la classe.'],
      ['16e-formateur-prochain-part', 'Trente secondes pour annuler', 'Le prochain cours part à toute la classe et remplace le précédent : il attend, avec « Annuler ».'],
      ['16d-apprenant-en-regle', 'Chez Léa', 'En règle, avec le prochain appel. Sa présence dans la semaine, puis pas de cours jusqu’à lundi.'],
      ['17-formateur-clos-sombre', 'En sombre'],
      ['18-apprenant-en-regle-sombre', 'En sombre'],
      ['20-apprenant-entreprise', 'Jeudi, en entreprise', 'La barre et la case du moment en trame. Rien n’est dû : pas de touche.'],
      ['20b-apprenant-accueil-redemande', 'Plus de sept jours sans cours', 'Awa repousse le prochain cours au lundi 30. L’app redemande une seule fois l’écran d’accueil, avec la raison.'],
      ['21-apprenant-texte-200', 'Le texte agrandi à 200 %', 'À 360 pixels, la semaine se lit en rangs, un jour par rang.'],
      ['19-icone', 'L’icône', 'Le pictogramme « lien » du matériel, clair sur l’accent.'],
    ],
  },
  {
    nom: 'planche-4-responsables',
    titre: 'Les responsables : un adjoint, puis passer la main',
    sous: 'Awa nomme Julien adjoint par une invitation, et l’accepte dans « À suivre ». Julien voit la classe, sans les gestes du chef. Plus tard, Awa lui passe la main : trente secondes pour annuler, puis Julien est chef.',
    colonnes: 4,
    largeur: 1360,
    images: [
      ['12b-formateur-adjoint', 'Nommer un adjoint', 'Un formateur ou le centre. L’invitation est un lien, montré en QR ou envoyé.'],
      ['12c-adjoint-invitation', 'Julien ouvre l’invitation', 'La classe, et qui l’invite. Sa demande part au chef seul.'],
      ['12d-formateur-accepter-adjoint', 'Dans « À suivre »', 'Une demande sans le jeton d’une invitation ne s’affiche pas.'],
      ['12e-adjoint-cours', 'Julien est adjoint', 'La classe et ses apprenants, partagés par une lettre signée.'],
      ['12f-adjoint-membres', 'Les membres, chez Julien', 'Sans « Nommer un adjoint » : c’est un geste du chef.'],
      ['17b-formateur-passer', 'Passer la main', 'Le nouveau chef, parmi les adjoints.'],
      ['17c-formateur-passation-attend', 'Trente secondes pour annuler', 'Ensuite, seul le nouveau chef pourra la rendre.'],
      ['17d-julien-chef', 'Julien est chef', 'Il publie la porte où il est en premier. Awa y reste, comme adjoint.'],
      ['20c-julien-horaires', 'Les horaires', 'Dans les réglages, que seul le chef voit. Une heure illisible est refusée sous le champ, comme à la création.'],
      ['20d-julien-reglages', 'Trente secondes pour annuler', 'Puis la porte part, et les téléphones des apprenants la suivent.'],
      ['20e-apprenant-moi', 'Moi, chez Léa', 'Le nom que voient les responsables, avec « Corriger », et le thème.'],
      ['20f-apprenant-nom-part', 'Son nom corrigé', 'Il part aux responsables dans trente secondes : le temps d’annuler.'],
      ['20g-julien-membres-nom', 'Chez Julien', 'Le nouveau nom, et l’ancien à côté. Les appels suivants prennent le nouveau.'],
      ['20h-formateur-moi', 'Moi, chez Awa', 'Le nom que voit la classe, avec « Corriger », et le thème, comme chez l’apprenant.'],
      ['20i-formateur-nom-part', 'Son nom corrigé', 'Il part à la classe dans trente secondes : le temps d’annuler.'],
      ['20j-apprenant-nom-du-responsable', 'Chez Noah', 'Son absence dit le nouveau nom d’Awa : la correction voyage avec la porte.'],
      ['20k-julien-membres-responsable', 'Chez Julien', 'Le nouveau nom d’Awa, et l’ancien à côté.'],
    ],
  },
  {
    nom: 'planche-3-salle',
    titre: 'L’écran de la salle',
    sous: 'Le premier jour, le QR de la classe. Puis celui de l’appel, qui change toutes les dix secondes. Aucun nom d’apprenant, vérifié à chaque étape.',
    colonnes: 1,
    largeur: 1280,
    images: [
      ['08-salle-rejoindre', 'Rejoindre', 'Le lien et le code de la classe, et combien ont rejoint.'],
      ['13-salle-appel', 'L’appel'],
      ['25-salle-appel-autre-classe', 'L’appel d’une autre classe', 'Jeudi, Awa lance l’appel de BTS SIO 1 : la salle montre la classe de l’appel lancé.'],
    ],
  },
  {
    nom: 'planche-5-classes',
    titre: 'Plusieurs classes',
    sous: 'Jeudi, Awa crée BTS SIO 1 depuis « Mes cours ». Inès la rejoint : elle suit deux classes. L’appel qui s’ouvre en BTS SIO 1 montre cette classe sur son téléphone, qui montrait BTS SIO 2. Sandrine Robert, au centre, tient dix classes : c’est le plus.',
    colonnes: 4,
    largeur: 1360,
    images: [
      ['27-formateur-mes-cours', 'Mes cours, chez Awa', 'Rangées par l’heure du prochain cours. La classe de l’appel ouvert d’abord, « maintenant ».'],
      ['22-apprenant-deuxieme-classe', 'Inès rejoint BTS SIO 1', 'Sa demande attend. « Mes classes », dans la barre, ramène à BTS SIO 2.'],
      ['23-apprenant-deux-classes', 'Acceptée', 'Le nom de la classe est dans la barre, sous le lieu. Il ouvre « Mes classes ».'],
      ['24-apprenant-mes-classes', 'Mes classes', 'La classe à l’écran est marquée. Le prochain cours range les autres.'],
      ['26-apprenant-appel-autre-classe', 'L’appel s’ouvre en BTS SIO 1', 'Inès regardait BTS SIO 2, en entreprise : son téléphone montre BTS SIO 1.'],
      ['28-centre-dix-classes', 'Dix classes', 'Chez Sandrine Robert : à la place de « Créer une classe », la limite.'],
      ['29-centre-onzieme-classe', 'Une onzième', 'Ni créée, ni rejointe par son lien : l’écran dit pourquoi.'],
      ['30-centre-mes-cours-200', 'Le texte agrandi à 200 %', 'À 360 pixels, rien ne sort de l’écran : la liste défile en hauteur.'],
    ],
  },
  {
    nom: 'planche-6-annonces',
    titre: 'Les annonces de la classe',
    sous: 'Jeudi, Awa publie une annonce, l’annule pour la corriger, la publie, puis change la salle. Inès la lit sous « À lire », puis dans « Classe ». Le soir, Awa en écrit une qui n’arrivera que vendredi matin. Julien, dont l’horloge retarde de deux jours, retire la première.',
    colonnes: 3,
    largeur: 1100,
    images: [
      ['31-formateur-fil', 'Le fil, chez Awa', '« Classe » s’ouvre sur le fil. L’annonce s’écrit en bas, au-dessus de « Publier ».'],
      ['32-formateur-annonce-part', 'Trente secondes pour annuler', 'L’annonce part à toute la classe. « Annuler » rend son texte, pour le corriger.'],
      ['33-apprenant-a-lire', 'Chez Inès', 'La dernière annonce de la semaine, sous « À lire ». « Écouter » la lit avec une voix française du téléphone, jamais une voix en ligne.'],
      ['34-apprenant-classe', 'Classe, chez Inès', 'Les annonces, la plus ancienne d’abord. Awa a changé la salle : « modifiée ».'],
      ['35-formateur-fil-le-soir', 'Le soir', 'En dehors des heures de la classe, la touche dit quand l’annonce arrivera : demain, une heure avant le cours.'],
      ['36-julien-fil', 'Chez Julien', 'Il peut retirer les annonces d’Awa, pas les modifier. Son horloge retarde de deux jours : la première lui semble encore à venir.'],
    ],
  },
];

const echappe = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/« /g, '« ').replace(/ »/g, ' »').replace(/ :/g, ' :');
const navigateur = await chromium.launch();
for (const p of PLANCHES) {
  const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><style>
    body { width: ${p.largeur}px; margin: 0; padding: 32px; background: #fff; color: #1d242c; font-family: system-ui, sans-serif; }
    h1 { font-size: 26px; margin: 0 0 4px; } .sous { font-size: 15px; color: #5c6672; margin: 0 0 24px; max-width: 75ch; }
    .grille { display: grid; grid-template-columns: repeat(${p.colonnes}, minmax(0, 1fr)); gap: 28px 24px; align-items: start; }
    figure { margin: 0; } img { display: block; width: 100%; border: 1px solid #1d242c; }
    figcaption { margin-top: 8px; font-size: 14px; line-height: 1.4; } figcaption b { display: block; font-size: 15px; }
  </style><h1>${echappe(p.titre)}</h1><p class="sous">${echappe(p.sous)}</p><div class="grille">${p.images
    .map(([f, nom, legende = '']) => `<figure><img src="${pathToFileURL(join(CAPTURES, `${f}.png`))}"><figcaption><b>${echappe(nom)}</b>${echappe(legende)}</figcaption></figure>`)
    .join('')}</div>`;
  const brouillon = join(CAPTURES, '.planche.html');
  writeFileSync(brouillon, html);
  const page = await navigateur.newPage({ viewport: { width: p.largeur + 64, height: 600 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(brouillon).href, { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(CAPTURES, `${p.nom}.png`), fullPage: true });
  await page.close();
  rmSync(brouillon);
  console.log(`✓ captures/${p.nom}.png`);
}
await navigateur.close();
