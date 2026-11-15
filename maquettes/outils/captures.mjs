import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const MAQUETTES = fileURLToPath(new URL('..', import.meta.url));
const SORTIE = join(MAQUETTES, 'captures');

const TAILLES = {
  tel: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  'petit-tel': { viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true },
  poste: { viewport: { width: 1280, height: 800 } },
};
const ECRANS = [
  ['aujourdhui-apprenant', ['tel', 'petit-tel', 'poste']],
  ['aujourdhui-apprenant-signee', ['tel']],
  ['presence-scanner', ['tel', 'petit-tel']],
  ['presence-code', ['tel', 'petit-tel']],
  ['aujourdhui-formateur', ['tel', 'petit-tel', 'poste']],
  ['appel', ['tel', 'petit-tel', 'poste']],
];
const seul = process.argv[2];

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const serveur = createServer((requete, reponse) => {
  const chemin = normalize(decodeURIComponent(new URL(requete.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  try {
    const contenu = readFileSync(join(MAQUETTES, chemin));
    reponse.writeHead(200, { 'Content-Type': TYPES[extname(chemin)] ?? 'application/octet-stream' });
    reponse.end(contenu);
  } catch {
    reponse.writeHead(404).end();
  }
});
await new Promise((ok) => serveur.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${serveur.address().port}`;

mkdirSync(SORTIE, { recursive: true });
const navigateur = await chromium.launch();
const erreurs = [];
for (const [ecran, tailles] of ECRANS) {
  if (seul && ecran !== seul) continue;
  for (const taille of tailles) {
    for (const theme of ['clair', 'sombre']) {
      const contexte = await navigateur.newContext({ ...TAILLES[taille], deviceScaleFactor: 2 });
      const page = await contexte.newPage();
      page.on('pageerror', (e) => erreurs.push(`${ecran} : ${e.message}`));
      page.on('console', (m) => m.type() === 'error' && erreurs.push(`${ecran} : ${m.text()}`));
      page.on('requestfailed', (r) => erreurs.push(`${ecran} : ${r.url()} introuvable`));
      page.on('response', (r) => r.status() >= 400 && erreurs.push(`${ecran} : ${r.url()} ${r.status()}`));
      await page.goto(`${base}/ecrans/${ecran}.html?theme=${theme}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const debordement = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (debordement > 0) erreurs.push(`${ecran} ${taille} : la page défile de côté (${debordement} px)`);
      // Une feuille coupe ce qui dépasse (overflow-x:hidden) : on cherche ce qui sort de sa boîte, pas le défilement.
      const releve = await page.evaluate(() => {
        const nom = (e) => `${e.tagName.toLowerCase()}${[...e.classList].map((c) => '.' + c).join('')} « ${e.textContent.trim().slice(0, 32)} »`;
        const sortent = [];
        const elides = [];
        for (const boite of document.querySelectorAll('.modal-b, .view')) {
          const b = boite.getBoundingClientRect();
          for (const e of boite.querySelectorAll('*')) {
            const r = e.getBoundingClientRect();
            if (!r.width || !r.height) continue;
            if (r.right > b.right + 0.5 || r.left < b.left - 0.5) sortent.push(nom(e));
            if (getComputedStyle(e).textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1) elides.push(nom(e));
          }
        }
        return { sortent, elides };
      });
      for (const s of releve.sortent) erreurs.push(`${ecran} ${taille} : sort de sa boîte, ${s}`);
      for (const s of releve.elides) console.log(`  élidé (${taille}) : ${s}`);
      await page.screenshot({ path: join(SORTIE, `${ecran}-${taille}-${theme}.png`) });
      await contexte.close();
    }
  }
  console.log('✓', ecran);
}
await navigateur.close();
serveur.close();
if (erreurs.length) {
  console.error([...new Set(erreurs)].join('\n'));
  process.exitCode = 1;
}
