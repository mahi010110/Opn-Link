// L'appel d'une demi-journée, joué par Playwright avec de vrais appareils :
// l'ordinateur du formateur (l'écran de la salle), son téléphone, et trois apprenants.
// Léa et Yanis signent par le réseau, Yanis se trompe d'abord de code, Inès n'a pas de réseau
// et tend son QR, Noah est absent. Le relais est local. Les captures vont dans captures/.
//
// npm run construire, puis npm run appel.

import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { lancerRelais } from '../outils/relais.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const SITE = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(SITE, 'dist');
const CAPTURES = join(SITE, 'captures');
mkdirSync(CAPTURES, { recursive: true });

const coeur = await import(pathToFileURL(join(DIST, 'coeur', 'opn_core.js')).href);
await coeur.default({ module_or_path: readFileSync(join(DIST, 'coeur', 'opn_core_bg.wasm')) });

const echecs = [];
const verifier = (condition, message) => {
  if (!condition) echecs.push(message);
  console.log(`${condition ? '✓' : '✗'} ${message}`);
};

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const serveur = createServer((requete, reponse) => {
  const chemin = normalize(decodeURIComponent(new URL(requete.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  try {
    const contenu = readFileSync(join(DIST, chemin === '/' ? 'index.html' : chemin));
    reponse.writeHead(200, { 'Content-Type': TYPES[extname(chemin)] ?? 'application/octet-stream' });
    reponse.end(contenu);
  } catch {
    reponse.writeHead(404).end();
  }
});
await new Promise((ok) => serveur.listen(0, '127.0.0.1', ok));
const site = `http://127.0.0.1:${serveur.address().port}`;
const relais = await lancerRelais();

// Une classe inventée, et les clés de chaque appareil.
const personne = (prenom, nom) => {
  const a = new coeur.Appareil();
  return { prenom, nom, secrets: a.secrets(), cle: a.cle(), boite: a.boite() };
};
const awa = personne('Awa', 'Diallo');
const [lea, yanis, ines, noah] = [['Léa', 'Martin'], ['Yanis', 'Haddad'], ['Inès', 'Roux'], ['Noah', 'Petit']].map(([p, n]) => personne(p, n));
const public_ = ({ prenom, nom, cle, boite }) => ({ prenom, nom, cle, boite });
const classe = { code: coeur.nouveau_code_de_classe(), nom: 'BTS SIO 2', centre: 'Centre Exemple', matin: '9:00-12:30', apresMidi: '13:30-17:00' };
const config = (role, qui, relaisUrl = relais.url) => ({
  role,
  secrets: qui.secrets,
  moi: { prenom: qui.prenom, nom: qui.nom },
  classe,
  formateur: public_(awa),
  inscrits: [lea, yanis, ines, noah].map(public_),
  relais: relaisUrl,
});

const navigateur = await chromium.launch();
const TEL = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const ORDI = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };
const adresses = new Set();
// Les appareils vivent le mardi 17 novembre 2026 au matin, comme dans les maquettes.
const MARDI_MATIN = new Date('2026-11-17T09:01:00+01:00');

async function appareil(nom, options, cfg) {
  const contexte = await navigateur.newContext({ ...options, locale: 'fr-FR', timezoneId: 'Europe/Paris' });
  await contexte.clock.setSystemTime(MARDI_MATIN);
  await contexte.addInitScript(([cle, valeur]) => localStorage.setItem(cle, valeur), [`opl_proto_${nom}_config`, JSON.stringify(cfg)]);
  const page = await contexte.newPage();
  page.on('pageerror', (e) => echecs.push(`${nom} : ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('WebSocket') && echecs.push(`${nom} : ${m.text()}`));
  page.on('request', (r) => adresses.add(new URL(r.url()).host));
  await page.goto(`${site}/index.html?appareil=${nom}`);
  return page;
}

const capturer = (page, nom) => page.screenshot({ path: join(CAPTURES, `${nom}.png`) });
const taper = async (page, code) => {
  for (const c of code) await page.click(`[data-geste="chiffre"][data-n="${c}"]`);
};
const sansNom = async (page, moment) => {
  const texte = await page.locator('body').innerText();
  const vus = [lea, yanis, ines, noah].filter((p) => texte.includes(p.nom) || texte.includes(p.prenom));
  verifier(vus.length === 0, `la salle ne montre aucun nom (${moment})`);
};

try {
  const salle = await appareil('awa-ordi', ORDI, config('salle', awa));
  const tel = await appareil('awa-tel', TEL, config('formateur', awa));
  const telLea = await appareil('lea', TEL, config('apprenant', lea));
  const telYanis = await appareil('yanis', TEL, config('apprenant', yanis));
  // Inès n'a pas de réseau : son relais ne répond pas.
  const telInes = await appareil('ines', TEL, config('apprenant', ines, 'ws://127.0.0.1:9'));

  await tel.getByText('Lancer l’appel').waitFor();
  verifier(await tel.getByText('Matin, 9 h à 12 h 30').count() === 1, 'à 9 h 01, l’appel est celui du matin');
  await capturer(tel, '01-formateur-avant');
  await capturer(telLea, '02-apprenant-avant');

  await tel.click('[data-geste="lancer"]');
  await tel.getByText('0 sur 4').first().waitFor();
  await salle.locator('[data-code]').waitFor({ timeout: 15_000 });
  await capturer(salle, '03-salle-appel');
  await sansNom(salle, 'pendant l’appel');
  const code = () => salle.locator('[data-code]').getAttribute('data-code');

  await telLea.click('[data-geste="signer"]');
  const codeLea = await code();
  await taper(telLea, codeLea.slice(0, 3));
  await capturer(telLea, '04-apprenant-signer');
  await taper(telLea, codeLea.slice(3));
  await telLea.getByText('Présence signée').waitFor({ timeout: 15_000 });
  await capturer(telLea, '05-apprenant-signee');
  verifier(await telLea.getByText('reçue par Awa Diallo').count() === 1, 'Léa voit que sa présence est reçue par Awa Diallo');

  await telYanis.click('[data-geste="signer"]');
  await taper(telYanis, '000000');
  await telYanis.locator('#erreur').waitFor({ timeout: 15_000 });
  await capturer(telYanis, '06-apprenant-code-faux');
  verifier((await telYanis.locator('#erreur').innerText()).includes('retape les 6 chiffres'), 'un code faux est refusé, avec une phrase et pas un code technique');
  await taper(telYanis, await code());
  await telYanis.getByText('Présence signée').waitFor({ timeout: 15_000 });

  await telInes.click('[data-geste="signer"]');
  await taper(telInes, await code());
  await telInes.getByText('Montre ce QR à Awa Diallo').waitFor({ timeout: 20_000 });
  await capturer(telInes, '07-apprenant-sans-reseau');
  const presenceInes = await telInes.locator('[data-presence]').getAttribute('data-presence');

  await tel.getByText('2 sur 4').first().waitFor({ timeout: 15_000 });
  await capturer(tel, '08-formateur-liste');
  await tel.click(`[data-geste="nom"][data-cle="${ines.cle}"]`);
  await capturer(tel, '09-formateur-nom');
  await tel.click('[data-geste="lireQr"]');
  await tel.fill('#texte-qr', presenceInes);
  await tel.click('[data-geste="validerQr"]');
  await tel.getByText('3 sur 4').first().waitFor();
  await salle.getByText('3 sur 4').waitFor({ timeout: 15_000 });
  await capturer(salle, '10-salle-trois');
  await sansNom(salle, 'après trois signatures');

  await tel.click('[data-geste="clore"]');
  await tel.getByText('Clos et signé').waitFor();
  await capturer(tel, '11-formateur-clos');
  await salle.getByText('Appel clos').waitFor({ timeout: 15_000 });
  await capturer(salle, '12-salle-close');
  await sansNom(salle, 'à la clôture');
  verifier(await tel.getByText('Noah Petit').count() === 1, 'Noah, qui n’a pas signé, est noté absent chez le formateur');

  const garde = JSON.parse(await tel.evaluate(() => localStorage.getItem('opl_proto_awa-tel_appel')));
  const empreinte = coeur.verifier_journal(garde.journal);
  verifier(/^[0-9a-f]{64}$/.test(empreinte), 'la feuille close se vérifie seule, sans rien d’autre');
  writeFileSync(join(CAPTURES, 'feuille.txt'), garde.journal);

  verifier(relais.refuses.length === 0, `le relais a accepté chaque événement signé par le cœur (${relais.gardes.length} événements)`);
  const surLeRelais = JSON.stringify(relais.gardes);
  verifier([lea, yanis, ines, noah, awa].every((p) => !surLeRelais.includes(p.nom)), 'aucun nom ne passe en clair sur le relais');
  verifier([...adresses].every((h) => h.startsWith('127.0.0.1')), `aucune autre adresse contactée (${[...adresses].join(', ')})`);

  for (const page of [tel, telLea, telInes, salle]) await page.emulateMedia({ colorScheme: 'dark' });
  await capturer(tel, '13-formateur-clos-sombre');
  await capturer(telInes, '14-apprenant-sans-reseau-sombre');
  await capturer(telLea, '15-apprenant-signee-sombre');

  const poids = [];
  const premier = await navigateur.newContext({ ...TEL });
  await premier.clock.setSystemTime(MARDI_MATIN);
  await premier.addInitScript(([cle, valeur]) => localStorage.setItem(cle, valeur), ['opl_proto_neuf_config', JSON.stringify(config('apprenant', noah))]);
  const pageNeuve = await premier.newPage();
  pageNeuve.on('response', async (r) => {
    try {
      const corps = await r.body();
      poids.push([new URL(r.url()).pathname, extname(r.url()) === '.woff2' ? corps.length : gzipSync(corps, { level: 9 }).length]);
    } catch {}
  });
  await pageNeuve.goto(`${site}/index.html?appareil=neuf`);
  await pageNeuve.getByText('Signer ma présence').waitFor();
  await pageNeuve.waitForLoadState('networkidle');
  const total = poids.reduce((s, [, o]) => s + o, 0);
  const polices = poids.filter(([c]) => c.endsWith('.woff2')).reduce((s, [, o]) => s + o, 0);
  console.log(`Premier chargement chez un apprenant : ${(total / 1024).toFixed(1)} Ko compressés, dont ${(polices / 1024).toFixed(1)} Ko de polices (${poids.filter(([c]) => c.endsWith('.woff2')).map(([c]) => c.split('/').pop()).join(', ')})`);
  verifier(total <= 300 * 1024, 'le premier chargement tient sous le plafond de 300 Ko');
} finally {
  await navigateur.close();
  await relais.fermer();
  serveur.close();
}

if (echecs.length) {
  console.error(`\n${echecs.length} échec(s) :\n${echecs.join('\n')}`);
  process.exitCode = 1;
}
