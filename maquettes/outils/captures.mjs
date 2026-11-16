import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const MAQUETTES = fileURLToPath(new URL('..', import.meta.url));
const SORTIE = join(MAQUETTES, 'captures');

const TAILLES = {
  tel: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  'petit-tel': { viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true },
  tablette: { viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true },
  'tablette-couchee': { viewport: { width: 1180, height: 820 }, isMobile: true, hasTouch: true },
  ordi: { viewport: { width: 1280, height: 800 } },
  salle: { viewport: { width: 1280, height: 800 } },
  'grande-salle': { viewport: { width: 1920, height: 1080 } },
};
// La classe du <body> dit pour quel écran la maquette est faite.
const TAILLES_PAR_CLASSE = { tel: ['tel', 'petit-tel'], tab: ['tablette', 'tablette-couchee'], ordi: ['ordi'], salle: ['salle', 'grande-salle'] };

// node outils/captures.mjs [écran] [--texte=200] : un seul écran, ou le texte agrandi sur le petit téléphone.
const seul = process.argv.slice(2).find((a) => !a.startsWith('--'));
const texte = process.argv.slice(2).find((a) => a.startsWith('--texte='))?.slice(8);

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

const ecrans = readdirSync(join(MAQUETTES, 'ecrans'))
  .filter((f) => f.endsWith('.html'))
  .map((f) => f.slice(0, -5))
  .sort();

mkdirSync(SORTIE, { recursive: true });
const navigateur = await chromium.launch();
const erreurs = [];
for (const ecran of ecrans) {
  if (seul && ecran !== seul) continue;
  const classe = readFileSync(join(MAQUETTES, 'ecrans', `${ecran}.html`), 'utf8').match(/<body class="(\w+)/)?.[1];
  let tailles = TAILLES_PAR_CLASSE[classe];
  if (!tailles) {
    erreurs.push(`${ecran} : <body class="tel", "tab", "ordi" ou "salle"> manque`);
    continue;
  }
  if (texte) tailles = tailles.includes('petit-tel') ? ['petit-tel'] : [];
  for (const taille of tailles) {
    for (const theme of texte ? ['clair'] : ['clair', 'sombre']) {
      const contexte = await navigateur.newContext({ ...TAILLES[taille], deviceScaleFactor: 2 });
      const page = await contexte.newPage();
      page.on('pageerror', (e) => erreurs.push(`${ecran} : ${e.message}`));
      page.on('console', (m) => m.type() === 'error' && erreurs.push(`${ecran} : ${m.text()}`));
      page.on('requestfailed', (r) => erreurs.push(`${ecran} : ${r.url()} introuvable`));
      page.on('response', (r) => r.status() >= 400 && erreurs.push(`${ecran} : ${r.url()} ${r.status()}`));
      await page.goto(`${base}/ecrans/${ecran}.html?theme=${theme}${texte ? `&texte=${texte}` : ''}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const debordement = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (debordement > 0) erreurs.push(`${ecran} ${taille} : la page défile de côté (${debordement} px)`);
      // Un cadre peut couper ce qui dépasse sans que la page défile : on cherche ce qui sort de l'écran ou de son parent.
      // [data-decor] : une image de décor, tournée exprès (la salle vue dans le viseur).
      const releve = await page.evaluate(() => {
        const nom = (e) => `${e.tagName.toLowerCase()}${[...e.classList].map((c) => '.' + c).join('')} « ${e.textContent.trim().slice(0, 32)} »`;
        const sortent = [];
        const elides = [];
        for (const e of document.body.querySelectorAll('*')) {
          if (e.closest('[data-decor], svg')) continue;
          const r = e.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          const parent = e.parentElement.getBoundingClientRect();
          const horsEcran = r.left < -0.5 || r.right > innerWidth + 0.5;
          const horsParent = r.left < parent.left - 0.5 || r.right > parent.right + 0.5;
          if (horsEcran || horsParent) sortent.push(nom(e));
          if (getComputedStyle(e).textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1) elides.push(nom(e));
        }
        // Le bas de l'écran porte la touche : rien ne doit le pousser hors de la fenêtre.
        const bas = document.querySelector('.bas, .salle-bas');
        const basDehors = bas && bas.getBoundingClientRect().bottom > innerHeight + 0.5;
        return { sortent, elides, basDehors };
      });
      for (const s of releve.sortent) erreurs.push(`${ecran} ${taille} : sort de sa boîte, ${s}`);
      if (releve.basDehors) erreurs.push(`${ecran} ${taille} : le bas de l'écran sort de la fenêtre`);
      for (const s of releve.elides) console.log(`  élidé (${taille}) : ${s}`);
      const suffixe = texte ? `-texte${texte}` : `-${theme}`;
      await page.screenshot({ path: join(SORTIE, `${ecran}-${taille}${suffixe}.png`) });
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
