// Construit le site dans dist/ : le cœur compilé en WebAssembly, le matériel des maquettes,
// et l'interface en TypeScript. Puis mesure ce que pèse le premier chargement.

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
for (const [nom, o] of Object.entries(premier)) console.log(`  ${nom.padEnd(24)} ${ko(o)}`);
const total = Object.values(premier).reduce((a, b) => a + b, 0);
console.log(`  ${'premier chargement'.padEnd(24)} ${ko(total)} compressés, sans les polices (${ko(polices)}, déjà compressées)`);
