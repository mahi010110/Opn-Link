// Les captures avant/après d'un écran, à montrer au mainteneur avant `main` (CLAUDE.md) : la
// version d'une référence git, construite à part, à côté de celle du dossier de travail, au
// téléphone et à l'ordinateur, en clair et en sombre.
//
// npm run construire, puis :
//   node outils/avant-apres.mjs jour      l'écran du jour de l'apprenant : avant l'appel, ouvert, clos
//   node outils/avant-apres.mjs signer    l'écran « Signer » : avec la caméra, sans caméra
//   node outils/avant-apres.mjs signer bc08a5f   comparer à un autre commit que main
//
// Léa est posée dans le stockage, déjà acceptée. Les annonces de l'appel partent d'un relais local.
// Un cas neuf s'ajoute à CAS : ses états, et le geste qui mène à l'écran.

import { execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';
import { lancerRelais } from './relais.mjs';

const [cas = 'jour', reference = 'main'] = process.argv.slice(2);
const SITE = fileURLToPath(new URL('..', import.meta.url));
const RACINE = join(SITE, '..');
const CAPTURES = join(SITE, 'captures');
const SORTIE = join(CAPTURES, `.avant-apres-${cas}`);
mkdirSync(SORTIE, { recursive: true });
const { chromium } = createRequire(import.meta.url)('playwright');

// La version d'avant, construite dans un dossier à part : le cœur et le matériel sont partagés.
const AVANT = mkdtempSync(join(tmpdir(), 'opn-link-avant-'));
symlinkSync(join(RACINE, 'coeur'), join(AVANT, 'coeur'));
symlinkSync(join(RACINE, 'maquettes'), join(AVANT, 'maquettes'));
execSync(`git archive ${reference} site | tar -x -C ${AVANT}`, { cwd: RACINE });
symlinkSync(join(SITE, 'node_modules'), join(AVANT, 'site', 'node_modules'));
execSync('node outils/construire.mjs', { cwd: join(AVANT, 'site'), stdio: 'ignore' });

const coeur = await import(pathToFileURL(join(SITE, 'dist', 'coeur', 'opn_core.js')).href);
await coeur.default({ module_or_path: readFileSync(join(SITE, 'dist', 'coeur', 'opn_core_bg.wasm')) });

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
async function servir(dist) {
  const serveur = createServer((requete, reponse) => {
    const chemin = normalize(decodeURIComponent(new URL(requete.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    try {
      const contenu = readFileSync(join(dist, chemin === '/' ? 'index.html' : chemin));
      reponse.writeHead(200, { 'Content-Type': TYPES[extname(chemin)] ?? 'application/octet-stream' });
      reponse.end(contenu);
    } catch {
      reponse.writeHead(404).end();
    }
  });
  await new Promise((ok) => serveur.listen(0, '127.0.0.1', ok));
  return { url: `http://127.0.0.1:${serveur.address().port}`, fermer: () => serveur.close() };
}
const VERSIONS = [
  ['avant', `Avant (${reference})`, await servir(join(AVANT, 'site', 'dist'))],
  ['apres', 'Après', await servir(join(SITE, 'dist'))],
];

// Une classe inventée : Awa la tient, Léa y est acceptée. Le matin du mardi 17 novembre 2026.
const OUVERTURE = new Date('2026-11-17T09:01:00+01:00').getTime();
const CLOTURE = new Date('2026-11-17T09:12:00+01:00').getTime();
const awa = new coeur.Appareil();
const lea = new coeur.Appareil();
const code = coeur.nouveau_code_de_classe().replace(/\s/g, '').toLowerCase();
const porte = coeur.signer_porte(code, 'BTS SIO 2', 'Centre Exemple', '9:00-12:30', '13:30-17:00', ['Awa', 'Diallo', 'formateur', awa.cle(), awa.boite()].join('\t'), awa, OUVERTURE - 3600_000);
const acceptation = awa.accepter(code, lea.demander_entree(code, 'Léa', 'Martin', OUVERTURE - 3000_000), OUVERTURE - 2000_000);
const fil = coeur.nouveau_secret_du_fil();
const appel = coeur.Appel.ouvrir(code, '2026-11-17', 'matin', awa, ['Léa', 'Martin', lea.cle(), lea.boite()].join('\t'), OUVERTURE);

async function relaisAvec(...annonces) {
  const relais = await lancerRelais();
  for (const annonce of annonces) {
    const s = Math.floor(Date.now() / 1000);
    const ws = new WebSocket(relais.url);
    await new Promise((ok) => ws.on('open', ok));
    ws.send(`["EVENT",${coeur.evenement_nostr(coeur.etiquette_du_fil(fil), s + 3600, coeur.chiffrer_pour_le_fil(fil, annonce), s)}]`);
    await new Promise((ok) => ws.on('message', ok));
    ws.close();
  }
  return relais;
}
const relaisVide = await relaisAvec();
const relaisOuvert = await relaisAvec(appel.annonce(fil, OUVERTURE));
appel.clore(CLOTURE);
const relaisClos = await relaisAvec(appel.annonce(fil, CLOTURE));

// La caméra simulée de Chromium filme un mur gris, sans QR : le viseur reste ouvert.
const MUR = join(SORTIE, 'mur.y4m');
writeFileSync(MUR, Buffer.concat([Buffer.from('YUV4MPEG2 W640 H480 F10:1 Ip A1:1 C420jpeg\nFRAME\n'), Buffer.alloc(640 * 480, 140), Buffer.alloc(640 * 240, 128)]));
const navigateur = await chromium.launch();
const navigateurCamera = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${MUR}`] });

const signer = async (page) => {
  await page.locator('[data-geste="signer"]').click({ timeout: 15_000 });
  await page.waitForFunction(() => !document.querySelector('.viseur video') || document.querySelector('.viseur video').readyState >= 2, null, { timeout: 15_000 });
};
const CAS = {
  jour: {
    titre: 'L’écran du jour de l’apprenant',
    etats: [
      { nom: 'Avant l’appel', relais: relaisVide, heure: OUVERTURE - 6 * 60_000 },
      { nom: 'L’appel est ouvert', relais: relaisOuvert, heure: OUVERTURE + 4 * 60_000 },
      { nom: 'L’appel clos sans sa présence', relais: relaisClos, heure: CLOTURE + 3 * 60_000 },
    ],
  },
  signer: {
    titre: 'L’écran « Signer »',
    etats: [
      { nom: 'Avec la caméra (elle filme un mur gris)', relais: relaisOuvert, heure: OUVERTURE + 4 * 60_000, camera: true, geste: signer },
      { nom: 'Sans caméra', relais: relaisOuvert, heure: OUVERTURE + 4 * 60_000, geste: signer },
    ],
  },
};
if (!CAS[cas]) throw new Error(`Cas inconnu : ${cas}. Cas connus : ${Object.keys(CAS).join(', ')}`);

const ECRANS = [
  ['tel', 'Téléphone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['ordi', 'Ordinateur', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 }],
];
const THEMES = [
  ['light', 'clair'],
  ['dark', 'sombre'],
];
const classe = { code, role: 'apprenant', porte, fil, acceptation };
const rangs = [];
for (const [n, etat] of CAS[cas].etats.entries()) {
  for (const [version, libelle, site] of VERSIONS) {
    const images = [];
    for (const [ecran, nomEcran, options] of ECRANS) {
      for (const [theme, nomTheme] of THEMES) {
        const nav = etat.camera ? navigateurCamera : navigateur;
        const contexte = await nav.newContext({ ...options, colorScheme: theme, locale: 'fr-FR', timezoneId: 'Europe/Paris', ...(etat.camera ? { permissions: ['camera'] } : {}) });
        await contexte.clock.setSystemTime(new Date(etat.heure));
        await contexte.addInitScript(
          ([cles, classe, liste]) => {
            localStorage.setItem('opl_proto_lea_cles', JSON.stringify(cles));
            localStorage.setItem('opl_proto_lea_classes', JSON.stringify([classe]));
            localStorage.setItem('opl_proto_lea_relais', JSON.stringify(liste));
            localStorage.setItem('opl_proto_lea_accueil-propose', '1');
          },
          [lea.secrets(), classe, { principaux: [etat.relais.url], secours: [] }],
        );
        const page = await contexte.newPage();
        await page.goto(`${site.url}/index.html?appareil=lea`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
        await etat.geste?.(page);
        await page.waitForTimeout(500);
        const fichier = join(SORTIE, `${n}-${version}-${ecran}-${theme}.png`);
        await page.screenshot({ path: fichier });
        images.push([fichier, `${nomEcran}, ${nomTheme}`]);
        await contexte.close();
      }
    }
    rangs.push([`${etat.nom} · ${libelle}`, images]);
  }
}

const echappe = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><style>
  body { width: 1800px; margin: 0; padding: 32px; background: #fff; color: #1d242c; font-family: system-ui, sans-serif; }
  h1 { font-size: 26px; margin: 0 0 8px; } h2 { font-size: 18px; margin: 24px 0 10px; }
  .rang { display: grid; grid-template-columns: 195px 195px 1fr 1fr; gap: 16px; align-items: start; }
  img { display: block; width: 100%; border: 1px solid #1d242c; } figure { margin: 0; } figcaption { font-size: 13px; margin-top: 6px; }
</style><h1>${echappe(CAS[cas].titre)}, avant et après</h1>${rangs
  .map(([titre, images]) => `<h2>${echappe(titre)}</h2><div class="rang">${images.map(([f, l]) => `<figure><img src="${pathToFileURL(f)}"><figcaption>${l}</figcaption></figure>`).join('')}</div>`)
  .join('')}`;
const brouillon = join(SORTIE, 'planche.html');
writeFileSync(brouillon, html);
const page = await navigateur.newPage({ viewport: { width: 1864, height: 600 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(brouillon).href, { waitUntil: 'networkidle' });
const planche = join(CAPTURES, `avant-apres-${cas}.png`);
await page.screenshot({ path: planche, fullPage: true });
await navigateur.close();
await navigateurCamera.close();
for (const r of [relaisVide, relaisOuvert, relaisClos]) await r.fermer();
for (const [, , site] of VERSIONS) site.fermer();
rmSync(AVANT, { recursive: true, force: true });
console.log(`✓ captures/avant-apres-${cas}.png`);
