import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PLANCHES } from './liste-planches.mjs';

// Une planche réunit quelques captures et leur légende sur une seule image, pour les regarder d'un coup.
// node outils/planches.mjs            toutes les planches, dans planches/
// node outils/planches.mjs --revue=petit-tel-clair   toutes les captures d'une taille et d'un thème, dans captures/

const { chromium } = createRequire(import.meta.url)('playwright');
const MAQUETTES = fileURLToPath(new URL('..', import.meta.url));
const CAPTURES = join(MAQUETTES, 'captures');
const SORTIE = join(MAQUETTES, 'planches');
const revue = process.argv.slice(2).find((a) => a.startsWith('--revue='))?.slice(8);
const seule = process.argv.slice(2).find((a) => !a.startsWith('--'));

// Les espaces qui ne se coupent pas : dans les guillemets et avant les deux-points.
const echappe = (t) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/« /g, '«\u00a0').replace(/ »/g, '\u00a0»').replace(/ :/g, '\u00a0:');
const page = ({ titre, sous, largeur, colonnes, images }) => `<!doctype html><html lang="fr"><meta charset="utf-8">
<link rel="stylesheet" href="${pathToFileURL(join(MAQUETTES, 'style.css'))}">
<style>
  html, body { height: auto; }
  body { width: ${largeur}px; padding: 32px; background: #fff; color: #1d242c; font-family: var(--font-ui); }
  h1 { font-size: 26px; line-height: 1.2; margin: 0 0 4px; }
  .sous { font-size: 15px; color: #5c6672; margin: 0 0 24px; max-width: 70ch; }
  .grille { display: grid; grid-template-columns: repeat(${colonnes}, minmax(0, 1fr)); gap: 28px 24px; align-items: start; }
  figure { margin: 0; }
  figure img { display: block; width: 100%; border: 1px solid #1d242c; }
  figcaption { margin-top: 8px; font-size: 14px; line-height: 1.4; }
  figcaption b { display: block; font-size: 15px; }
</style>
<h1>${echappe(titre)}</h1>${sous ? `<p class="sous">${echappe(sous)}</p>` : '<p class="sous"></p>'}
<div class="grille">${images
  .map(([fichier, nom, legende = '']) => `<figure><img src="${pathToFileURL(join(CAPTURES, fichier))}"><figcaption><b>${echappe(nom)}</b>${echappe(legende)}</figcaption></figure>`)
  .join('')}</div>`;

const navigateur = await chromium.launch();
const photographier = async (definition, chemin, echelle) => {
  for (const [fichier] of definition.images) {
    if (!existsSync(join(CAPTURES, fichier))) throw new Error(`${fichier} manque : lance d'abord « npm run captures »`);
  }
  const contexte = await navigateur.newContext({ viewport: { width: definition.largeur + 64, height: 600 }, deviceScaleFactor: echelle });
  const p = await contexte.newPage();
  // Une page écrite à la volée ne peut pas lire les fichiers du disque : on passe par un fichier.
  const brouillon = join(MAQUETTES, '.planche.html');
  writeFileSync(brouillon, page(definition));
  await p.goto(pathToFileURL(brouillon).href, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: chemin, fullPage: true });
  rmSync(brouillon);
  await contexte.close();
};

if (revue) {
  const forme = /^(.+?)-(petit-tel|tel|ordi|grande-salle|salle)-(clair|sombre|texte\d+)\.png$/;
  const fichiers = readdirSync(CAPTURES).filter((f) => { const m = f.match(forme); return m && !f.startsWith('revue-') && `${m[2]}-${m[3]}` === revue; }).sort();
  const large = !revue.includes('tel');
  await photographier(
    { titre: `Revue : ${revue}`, largeur: large ? 1280 : 1500, colonnes: large ? 1 : 5, images: fichiers.map((f) => [f, f.replace(`-${revue}.png`, '')]) },
    join(CAPTURES, `revue-${revue}.png`),
    1,
  );
  console.log('✓', `captures/revue-${revue}.png`, fichiers.length, 'écrans');
} else {
  mkdirSync(SORTIE, { recursive: true });
  for (const planche of PLANCHES) {
    if (seule && planche.nom !== seule) continue;
    const suffixe = `-${planche.taille}-${planche.theme}.png`;
    const images = planche.ecrans.map(([ecran, nom, legende]) => [ecran.endsWith('.png') ? ecran : ecran + suffixe, nom, legende]);
    await photographier({ ...planche, images }, join(SORTIE, `${planche.nom}.png`), 2);
    console.log('✓', `planches/${planche.nom}.png`);
  }
}
await navigateur.close();
