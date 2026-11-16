// Lance les tests du cœur compilés en WebAssembly dans un vrai navigateur, par Playwright.
// Le pilote Chrome livré avec l'environnement ne suit pas la version de Chromium : on passe par
// le mode interactif de wasm-bindgen-test-runner, qui sert la page des tests sans piloter de navigateur.
//
// Cargo l'appelle avec le chemin du fichier .wasm (voir .cargo/config.toml).
// NAVIGATEUR=chromium (par défaut), firefox ou webkit.

import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { createRequire } from 'node:module';

const playwright = createRequire(import.meta.url)('playwright');
const [wasm, ...args] = process.argv.slice(2);
const nom = process.env.NAVIGATEUR ?? 'chromium';

const port = await new Promise((ok) => {
  const s = createServer().listen(0, '127.0.0.1', () => {
    const { port } = s.address();
    s.close(() => ok(port));
  });
});

const lanceur = spawn('wasm-bindgen-test-runner', [wasm, ...args], {
  env: { ...process.env, NO_HEADLESS: '1', WASM_BINDGEN_TEST_ADDRESS: `127.0.0.1:${port}` },
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((ok, echec) => {
  lanceur.on('exit', (code) => echec(new Error(`wasm-bindgen-test-runner s'est arrêté (${code})`)));
  lanceur.stdout.on('data', (d) => d.toString().includes('now available at') && ok());
});

let sortie = '';
let reussi = false;
const navigateur = await playwright[nom].launch();
console.log(`${nom} ${navigateur.version()}`);
try {
  const page = await navigateur.newPage();
  await page.goto(`http://127.0.0.1:${port}`);
  await page.waitForFunction(() => /test result: (ok|FAILED)/.test(document.getElementById('output')?.textContent ?? ''), null, { timeout: 180_000 });
  sortie = await page.locator('#output').textContent();
  reussi = /test result: ok/.test(sortie);
} finally {
  await navigateur.close();
  lanceur.kill();
}
console.log(sortie);
process.exit(reussi ? 0 : 1);
