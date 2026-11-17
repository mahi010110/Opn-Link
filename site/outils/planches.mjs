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
      ['11-apprenant-admis', 'Léa est dans la classe', 'L’écran du jour : sa présence à signer.'],
      ['12-formateur-membres', 'Les membres', 'Le chef, puis les apprenants acceptés.'],
    ],
  },
  {
    nom: 'planche-2-appel',
    titre: 'L’appel, avec les vrais membres',
    sous: 'Léa signe, Yanis se trompe puis signe, Inès n’a plus de réseau et tend son QR, Noah est absent. Le réseau revenu, Inès reçoit la réponse. Sans réseau, le site se rouvre depuis le téléphone.',
    colonnes: 4,
    largeur: 1360,
    images: [
      ['14-apprenant-signee', 'Léa a signé', 'Reçue par Awa Diallo. Sur iPhone, l’app propose une fois de la garder sur l’écran d’accueil, avec les trois pas.'],
      ['15-apprenant-sans-reseau', 'Inès n’a plus de réseau', 'Au bout de dix secondes, le QR de sa présence s’affiche seul.'],
      ['16-formateur-clos', 'Clos et signé', 'Noah est absent. Kevin n’est pas sur la feuille.'],
      ['17-formateur-clos-sombre', 'En sombre'],
      ['18-apprenant-signee-sombre', 'En sombre'],
      ['19-icone', 'L’icône', 'Le pictogramme « lien » du matériel, clair sur l’accent.'],
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
