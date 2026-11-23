// Les captures avant/après d'un écran, à montrer au mainteneur avant `main` (CLAUDE.md) : la
// version d'une référence git, construite à part, à côté de celle du dossier de travail, au
// téléphone et à l'ordinateur, en clair et en sombre.
//
// npm run construire, puis :
//   node outils/avant-apres.mjs jour      l'écran du jour de l'apprenant : avant l'appel, ouvert, clos
//   node outils/avant-apres.mjs signer    l'écran « Signer » : avec la caméra, sans caméra
//   node outils/avant-apres.mjs semaine   l'écran du jour de l'apprenant : en règle, puis en entreprise
//   node outils/avant-apres.mjs lire      « Lire son QR », chez le formateur
//   node outils/avant-apres.mjs prochain  le formateur après la clôture, et « Changer »
//   node outils/avant-apres.mjs redemande l'écran d'accueil redemandé, plus de sept jours avant le cours
//   node outils/avant-apres.mjs membres   « Membres » chez le chef, avec un adjoint
//   node outils/avant-apres.mjs adjoint   la fenêtre « Adjoint »
//   node outils/avant-apres.mjs passer    la fenêtre « Passer la main »
//   node outils/avant-apres.mjs reglages  les réglages du chef, puis les horaires
//   node outils/avant-apres.mjs moi       « Moi » chez l'apprenant, puis la fenêtre « Nom »
//   node outils/avant-apres.mjs signer bc08a5f   comparer à un autre commit que main
//
// Léa et Awa sont posées dans le stockage, Léa déjà acceptée. Les annonces partent d'un relais local.
// Un geste qui n'existe pas dans une version laisse l'écran tel quel.
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
const julien = new coeur.Appareil();
const porteAvecJulien = coeur.signer_porte(
  code, 'BTS SIO 2', 'Centre Exemple', '9:00-12:30', '13:30-17:00',
  [['Awa', 'Diallo', 'formateur', awa.cle(), awa.boite()], ['Julien', 'Morel', 'formateur', julien.cle(), julien.boite()]].map((r) => r.join('\t')).join('\n'),
  awa, OUVERTURE - 1000_000,
);
const fil = coeur.nouveau_secret_du_fil();
const appel = coeur.Appel.ouvrir(code, '2026-11-17', 'matin', awa, ['Léa', 'Martin', lea.cle(), lea.boite()].join('\t'), OUVERTURE);
const appelOuvert = { journal: appel.journal(), secret: appel.secret() };
const JEUDI = new Date('2026-11-19T10:00:00+01:00').getTime();
const seance = coeur.seance(code, '2026-11-17', 'matin');
const signee = OUVERTURE + 60_000;
const presenceDeLea = lea.signer_code(seance, '123456', signee);
const recu = { quand: signee + 2000, par: 'Awa Diallo' };

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
const relaisProchain = await relaisAvec(appel.annonce(fil, CLOTURE), awa.prochain_cours(fil, '2026-11-23', 'matin', CLOTURE));
const relaisLoin = await relaisAvec(appel.annonce(fil, CLOTURE), awa.prochain_cours(fil, '2026-11-30', 'matin', CLOTURE));
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const appelClos = { journal: appel.journal(), secret: appel.secret() };

// Ce que gardent les appareils, sous les clés d'avant et d'après : chaque version y lit les siennes.
const leaASigne = {
  presence: { seance, presence: presenceDeLea, signee, recu },
  presences: [{ seance, date: '2026-11-17', demi: 'matin', presence: presenceDeLea, signee, recu }],
};
const awaTientLaClasse = (heure, appelGarde, enPlus = {}) => ({
  cles: awa.secrets(),
  moi: { prenom: 'Awa', nom: 'Diallo' },
  classes: [{ code, role: 'chef', porte, fil, membres: [acceptation], portePubliee: heure, ...enPlus }],
  appel: appelGarde,
});

// La caméra simulée de Chromium filme un mur gris, sans QR : le viseur reste ouvert.
const MUR = join(SORTIE, 'mur.y4m');
writeFileSync(MUR, Buffer.concat([Buffer.from('YUV4MPEG2 W640 H480 F10:1 Ip A1:1 C420jpeg\nFRAME\n'), Buffer.alloc(640 * 480, 140), Buffer.alloc(640 * 240, 128)]));
const navigateur = await chromium.launch();
const navigateurCamera = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${MUR}`] });

const lireSonQr = async (page) => {
  await page.locator('[data-geste="nom"]').first().click({ timeout: 5000 });
  await page.locator('[data-geste="lireQr"]').click({ timeout: 5000 });
  await page.waitForTimeout(1500);
};
const changerLeProchain = (page) => page.locator('[data-geste="changerProchain"]').click({ timeout: 5000 });
const ouvrirMembres = (page) => page.locator('[data-geste="classe"]').click({ timeout: 5000 });
const puis = (geste) => async (page) => {
  await ouvrirMembres(page);
  await page.locator(`[data-geste="${geste}"]`).click({ timeout: 5000 });
};
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
  semaine: {
    titre: 'L’écran du jour de l’apprenant, sa semaine',
    etats: [
      { nom: 'L’appel clos, sa présence reçue, le prochain cours lundi', relais: relaisProchain, heure: CLOTURE + 3 * 60_000, stockage: leaASigne },
      { nom: 'Jeudi, en entreprise', relais: relaisProchain, heure: JEUDI, stockage: leaASigne },
    ],
  },
  redemande: {
    titre: 'L’écran d’accueil, redemandé avant plus de sept jours sans cours',
    etats: [{ nom: 'Jeudi, sur iPhone, le prochain cours le lundi 30', relais: relaisLoin, heure: JEUDI, stockage: leaASigne, iphone: true }],
  },
  membres: {
    titre: '« Membres », chez le chef, avec un adjoint',
    etats: [{ nom: 'Awa est chef, Julien adjoint', qui: 'awa', relais: relaisVide, heure: OUVERTURE - 6 * 60_000, stockage: awaTientLaClasse(OUVERTURE, undefined, { porte: porteAvecJulien }), geste: ouvrirMembres }],
  },
  adjoint: {
    titre: 'La fenêtre « Adjoint »',
    etats: [{ nom: 'Nommer un adjoint', qui: 'awa', relais: relaisVide, heure: OUVERTURE - 6 * 60_000, stockage: awaTientLaClasse(OUVERTURE, undefined, { porte: porteAvecJulien }), geste: puis('nommer') }],
  },
  passer: {
    titre: 'La fenêtre « Passer la main »',
    etats: [{ nom: 'Passer la main à Julien', qui: 'awa', relais: relaisVide, heure: OUVERTURE - 6 * 60_000, stockage: awaTientLaClasse(OUVERTURE, undefined, { porte: porteAvecJulien }), geste: puis('passer') }],
  },
  moi: {
    titre: '« Moi », chez l’apprenant',
    etats: [
      { nom: 'Moi', relais: relaisProchain, heure: CLOTURE + 3 * 60_000, stockage: leaASigne, geste: (page) => page.locator('[data-geste="moi"]').click({ timeout: 5000 }) },
      {
        nom: 'Corriger son nom',
        relais: relaisProchain,
        heure: CLOTURE + 3 * 60_000,
        stockage: leaASigne,
        geste: async (page) => {
          await page.locator('[data-geste="moi"]').click({ timeout: 5000 });
          await page.locator('[data-geste="corrigerNom"]').click({ timeout: 5000 });
        },
      },
    ],
  },
  reglages: {
    titre: 'Les réglages du chef',
    etats: [
      { nom: 'Réglages', qui: 'awa', relais: relaisVide, heure: OUVERTURE - 6 * 60_000, stockage: awaTientLaClasse(OUVERTURE, undefined, { porte: porteAvecJulien }), geste: puis('reglages') },
      {
        nom: 'Les horaires',
        qui: 'awa',
        relais: relaisVide,
        heure: OUVERTURE - 6 * 60_000,
        stockage: awaTientLaClasse(OUVERTURE, undefined, { porte: porteAvecJulien }),
        geste: async (page) => {
          await puis('reglages')(page);
          await page.locator('[data-geste="horaires"]').click({ timeout: 5000 });
        },
      },
    ],
  },
  lire: {
    titre: '« Lire son QR », chez le formateur',
    etats: [
      { nom: 'Avec la caméra (elle filme un mur gris)', qui: 'awa', relais: relaisVide, heure: OUVERTURE + 4 * 60_000, camera: true, stockage: awaTientLaClasse(OUVERTURE, appelOuvert), geste: lireSonQr },
    ],
  },
  prochain: {
    titre: 'Le formateur après la clôture, et le prochain cours',
    etats: [
      { nom: 'Clos et signé', qui: 'awa', relais: relaisVide, heure: CLOTURE + 40_000, stockage: awaTientLaClasse(CLOTURE, appelClos, { cours: ['2026-11-17 matin'], prochain: { date: '2026-11-23', demi: 'matin', quand: CLOTURE } }) },
      { nom: '« Changer »', qui: 'awa', relais: relaisVide, heure: CLOTURE + 40_000, stockage: awaTientLaClasse(CLOTURE, appelClos, { cours: ['2026-11-17 matin'], prochain: { date: '2026-11-23', demi: 'matin', quand: CLOTURE } }), geste: changerLeProchain },
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
        const contexte = await nav.newContext({
          ...options,
          colorScheme: theme,
          locale: 'fr-FR',
          timezoneId: 'Europe/Paris',
          ...(etat.camera ? { permissions: ['camera'] } : {}),
          ...(etat.iphone ? { userAgent: IPHONE } : {}),
        });
        await contexte.clock.setSystemTime(new Date(etat.heure));
        const qui = etat.qui ?? 'lea';
        const stockage = qui === 'lea' ? { cles: lea.secrets(), classes: [classe], 'accueil-propose': 1, ...etat.stockage } : etat.stockage;
        await contexte.addInitScript(
          ([qui, stockage, liste]) => {
            for (const [cle, valeur] of Object.entries(stockage)) if (valeur !== undefined) localStorage.setItem(`opl_proto_${qui}_${cle}`, JSON.stringify(valeur));
            localStorage.setItem(`opl_proto_${qui}_relais`, JSON.stringify(liste));
          },
          [qui, stockage, { principaux: [etat.relais.url], secours: [] }],
        );
        const page = await contexte.newPage();
        await page.goto(`${site.url}/index.html?appareil=${qui}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
        await etat.geste?.(page).catch(() => {});
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
for (const r of [relaisVide, relaisOuvert, relaisClos, relaisProchain, relaisLoin]) await r.fermer();
for (const [, , site] of VERSIONS) site.fermer();
rmSync(AVANT, { recursive: true, force: true });
console.log(`✓ captures/avant-apres-${cas}.png`);
