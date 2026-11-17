// Construit le site dans dist/ : le cœur compilé en WebAssembly, le matériel des maquettes,
// et l'interface en TypeScript. Puis mesure ce que pèse le premier chargement.

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const SITE = fileURLToPath(new URL('..', import.meta.url));
const COEUR = join(SITE, '..', 'coeur');
const MAQUETTES = join(SITE, '..', 'maquettes');
const DIST = join(SITE, 'dist');

if (!existsSync(join(MAQUETTES, 'kit'))) {
  console.error('Le matériel manque : lance « npm install && npm run style » dans maquettes/.');
  process.exit(1);
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

execFileSync('cargo', ['build', '--release', '--target', 'wasm32-unknown-unknown'], { cwd: COEUR, stdio: 'inherit' });
execFileSync('wasm-bindgen', [
  '--target', 'web', '--remove-name-section', '--remove-producers-section',
  '--out-dir', join(DIST, 'coeur'),
  join(COEUR, 'target', 'wasm32-unknown-unknown', 'release', 'opn_core.wasm'),
], { stdio: 'inherit' });

cpSync(join(MAQUETTES, 'kit'), join(DIST, 'kit'), { recursive: true });
cpSync(join(MAQUETTES, 'opn-link.css'), join(DIST, 'opn-link.css'));
cpSync(join(SITE, 'src', 'site.css'), join(DIST, 'site.css'));
writeFileSync(join(DIST, 'style.css'), readFileSync(join(MAQUETTES, 'style.css'), 'utf8') + '@import url("site.css");\n');
cpSync(join(SITE, 'index.html'), join(DIST, 'index.html'));

await build({
  entryPoints: [join(SITE, 'src', 'main.ts')],
  bundle: true,
  format: 'esm',
  target: 'es2020',
  minify: true,
  outfile: join(DIST, 'app.js'),
  external: ['./coeur/opn_core.js'],
  logLevel: 'warning',
});

// Les couleurs du manifeste et de l'icône viennent des jetons du matériel, jamais écrites à la main.
const jetons = readFileSync(join(DIST, 'kit', 'styles', 'tokens', 'colors.css'), 'utf8');
const jeton = (nom) => jetons.match(new RegExp(`--${nom}:\\s*(#[0-9A-Fa-f]{6})`))[1];
const [fond, encre, accent, papier] = [jeton('gray-2'), jeton('ink'), jeton('teal'), jeton('gray-1')];

// L'icône : le pictogramme « lien » du matériel, clair sur l'accent. Rendue en PNG par Chromium.
const lien = readFileSync(join(DIST, 'kit', 'assets', 'icons', 'link.svg'), 'utf8').match(/d="([^"]+)"/)[1];
const { chromium } = createRequire(import.meta.url)('playwright');
const navigateur = await chromium.launch();
for (const [nom, taille, part] of [['icone-180', 180, 0.6], ['icone-192', 192, 0.6], ['icone-512', 512, 0.6], ['icone-masquable-512', 512, 0.45]]) {
  const page = await navigateur.newPage({ viewport: { width: taille, height: taille } });
  await page.setContent(`<body style="margin:0"><div style="width:${taille}px;height:${taille}px;background:${accent};display:grid;place-items:center"><svg width="${part * 100}%" height="${part * 100}%" viewBox="0 0 24 24" fill="${papier}" shape-rendering="crispEdges"><path d="${lien}"/></svg></div>`);
  await page.screenshot({ path: join(DIST, `${nom}.png`) });
  await page.close();
}
await navigateur.close();

writeFileSync(join(DIST, 'manifest.webmanifest'), JSON.stringify({
  name: 'Opn-Link',
  short_name: 'Opn-Link',
  lang: 'fr',
  start_url: './index.html',
  scope: './',
  display: 'standalone',
  background_color: fond,
  theme_color: encre,
  icons: [
    { src: 'icone-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icone-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icone-masquable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));

// Ce que le service worker garde d'avance : de quoi ouvrir chaque écran sans réseau. Les polices
// des premiers écrans seulement, et les icônes que l'interface emploie : le reste se garde en passant.
const source = readdirSync(join(SITE, 'src')).filter((f) => f.endsWith('.ts')).map((f) => readFileSync(join(SITE, 'src', f), 'utf8')).join('\n');
// Tout nom d'icône cité dans le code, même posé par une condition.
const icones = [...new Set([...source.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]))].filter((n) => existsSync(join(DIST, 'kit', 'assets', 'icons', `${n}.svg`)));
const encoder = (chemin) => chemin.split('/').map(encodeURIComponent).join('/');
const gardes = [
  'index.html', 'app.js', 'style.css', 'opn-link.css', 'site.css', 'manifest.webmanifest', 'icone-180.png', 'icone-192.png',
  'coeur/opn_core.js', 'coeur/opn_core_bg.wasm',
  ...readdirSync(join(DIST, 'kit', 'styles', 'tokens')).map((f) => `kit/styles/tokens/${f}`),
  ...['IBMPlexMono-Regular.woff2', 'PublicSans[wght].woff2', 'Silkscreen-Regular.woff2'].map((f) => `kit/assets/fonts/${f}`),
  ...icones.map((n) => `kit/assets/icons/${n}.svg`),
];
const version = createHash('sha256');
for (const f of gardes) version.update(f).update(readFileSync(join(DIST, f)));
writeFileSync(join(DIST, 'sw.js'), readFileSync(join(SITE, 'src', 'sw.js'), 'utf8')
  .replace('__VERSION__', version.digest('hex').slice(0, 12))
  .replace('__FICHIERS__', JSON.stringify(gardes.map(encoder))));

const poids = (chemin) => gzipSync(readFileSync(chemin), { level: 9 }).length;
const ko = (o) => `${(o / 1024).toFixed(1)} Ko`;
const premier = {
  'le cœur (WebAssembly)': poids(join(DIST, 'coeur', 'opn_core_bg.wasm')),
  'le JavaScript du cœur': poids(join(DIST, 'coeur', 'opn_core.js')),
  "l'interface": poids(join(DIST, 'app.js')),
  'les styles': ['style.css', 'opn-link.css', 'site.css', ...readdirSync(join(DIST, 'kit', 'styles', 'tokens')).map((f) => join('kit', 'styles', 'tokens', f))]
    .map((f) => poids(join(DIST, f))).reduce((a, b) => a + b, 0),
  'la page': poids(join(DIST, 'index.html')),
};
const polices = readdirSync(join(DIST, 'kit', 'assets', 'fonts')).map((f) => statSync(join(DIST, 'kit', 'assets', 'fonts', f)).size).reduce((a, b) => a + b, 0);
const reserve = gardes.filter((f) => !f.endsWith('.woff2') && !f.endsWith('.png')).map((f) => poids(join(DIST, f))).reduce((a, b) => a + b, 0)
  + gardes.filter((f) => f.endsWith('.woff2') || f.endsWith('.png')).map((f) => statSync(join(DIST, f)).size).reduce((a, b) => a + b, 0);
for (const [nom, o] of Object.entries(premier)) console.log(`  ${nom.padEnd(24)} ${ko(o)}`);
console.log(`  ${'gardé hors ligne'.padEnd(24)} ${ko(reserve)}, ${gardes.length} fichiers, dont les polices et ${icones.length} icônes`);
const total = Object.values(premier).reduce((a, b) => a + b, 0);
console.log(`  ${'premier chargement'.padEnd(24)} ${ko(total)} compressés, sans les polices (${ko(polices)}, déjà compressées)`);
