// Réunit les captures du scénario de l'appel en planches, avec leur légende, pour les regarder d'un coup.

import { createRequire } from 'node:module';
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const SITE = fileURLToPath(new URL('..', import.meta.url));
const CAPTURES = join(SITE, 'captures');

const PLANCHES = [
  {
    nom: 'planche-1-telephones',
    titre: 'Le prototype de l’appel, au téléphone',
    sous: 'Les écrans branchés sur le cœur, joués par Playwright. Léa et Yanis signent par le réseau, Inès n’a pas de réseau. La caméra viendra au prochain pas : ici, on tape les six chiffres.',
    colonnes: 4,
    largeur: 1360,
    images: [
      ['01-formateur-avant', 'Le formateur, avant l’appel', 'Une touche : « Lancer l’appel ».'],
      ['02-apprenant-avant', 'L’apprenant, pendant le cours', 'Une touche : « Signer ma présence ».'],
      ['04-apprenant-signer', 'Léa tape le code', 'Le code de l’écran de la salle, au doigt ou au clavier.'],
      ['05-apprenant-signee', 'Sa présence est reçue', 'L’appareil du formateur l’a vérifiée et a répondu.'],
      ['06-apprenant-code-faux', 'Yanis se trompe de code', 'Refusé par le formateur, dit avec une phrase. Il retape.'],
      ['07-apprenant-sans-reseau', 'Inès n’a pas de réseau', 'Au bout de dix secondes, le QR de sa présence s’affiche seul.'],
      ['08-formateur-liste', 'La liste du formateur', 'Ceux qui manquent en haut. La salle, elle, ne voit aucun nom.'],
      ['09-formateur-nom', 'Les gestes d’un nom', '« Lire son QR » pour Inès.'],
      ['11-formateur-clos', 'Clos et signé', 'Noah est absent. Trente secondes pour annuler.'],
      ['13-formateur-clos-sombre', 'En sombre'],
      ['14-apprenant-sans-reseau-sombre', 'En sombre', 'Le QR reste sombre sur blanc.'],
      ['15-apprenant-signee-sombre', 'En sombre'],
    ],
  },
  {
    nom: 'planche-2-salle',
    titre: 'Le prototype de l’appel, sur l’écran de la salle',
    sous: 'Le QR change toutes les dix secondes et ne porte que la séance, la fenêtre et le code : 25 × 25 cases. Aucun nom, vérifié à chaque étape.',
    colonnes: 1,
    largeur: 1280,
    images: [
      ['03-salle-appel', 'L’appel est ouvert'],
      ['10-salle-trois', 'Trois sur quatre', 'Les pavés comptent sans dire qui.'],
      ['12-salle-close', 'Appel clos', 'Trois secondes, puis la fenêtre se ferme.'],
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
