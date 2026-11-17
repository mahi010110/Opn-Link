// Une classe de bout en bout, jouée par Playwright avec de vrais appareils et un relais local.
// Awa crée la classe et l'invite à la salle. Léa, Inès, Noah et Kevin ouvrent le lien du QR,
// Yanis tape le code, d'abord de travers. Awa accepte tout le monde sauf Kevin, qu'elle ne
// connaît pas. Puis l'appel : Léa signe, Yanis se trompe de code puis signe, Inès n'a plus de
// réseau et tend son QR, Noah est absent. Awa clôt. Les captures vont dans captures/.
//
// npm run construire, puis npm run classe.

import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { lancerPasserelle, lancerRelais } from '../outils/relais.mjs';

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
const reseauDInes = await lancerPasserelle(relais.url);

const navigateur = await chromium.launch();
const TEL = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const ORDI = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };
// Les appareils vivent le mardi 17 novembre 2026 au matin, comme dans les maquettes.
const MARDI_MATIN = new Date('2026-11-17T08:55:00+01:00');
const NEUF_HEURES = new Date('2026-11-17T09:01:00+01:00');
const adresses = new Set();
// Le téléphone et l'ordinateur d'Awa ont les mêmes clés : « relier un appareil » viendra plus tard.
const clesDAwa = new coeur.Appareil().secrets();
const pages = {};

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';

async function appareil(nom, options, { url = '/index.html', cles, relaisUrl = relais.url, userAgent } = {}) {
  const contexte = await navigateur.newContext({ ...options, locale: 'fr-FR', timezoneId: 'Europe/Paris', ...(userAgent ? { userAgent } : {}) });
  await contexte.clock.setSystemTime(MARDI_MATIN);
  await contexte.addInitScript(
    ([nom, cles, relaisUrl]) => {
      localStorage.setItem(`opl_proto_${nom}_relais`, JSON.stringify(relaisUrl));
      if (cles) localStorage.setItem(`opl_proto_${nom}_cles`, JSON.stringify(cles));
    },
    [nom, cles, relaisUrl],
  );
  const page = await contexte.newPage();
  page.on('pageerror', (e) => echecs.push(`${nom} : ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('WebSocket') && echecs.push(`${nom} : ${m.text()}`));
  page.on('request', (r) => adresses.add(new URL(r.url()).host));
  const [chemin, ancre = ''] = url.split('#');
  await page.goto(`${site}${chemin}${chemin.includes('?') ? '&' : '?'}appareil=${nom}${ancre ? `#${ancre}` : ''}`);
  pages[nom] = { page, contexte };
  return page;
}

const capturer = (page, nom) => page.screenshot({ path: join(CAPTURES, `${nom}.png`) });
const taper = async (page, code) => {
  for (const c of code) await page.click(`[data-geste="chiffre"][data-n="${c}"]`);
};
const NOMS = ['Léa', 'Martin', 'Yanis', 'Haddad', 'Inès', 'Roux', 'Noah', 'Petit', 'Kevin', 'Intrus'];
const sansNom = async (page, moment) => {
  const texte = await page.locator('body').innerText();
  verifier(!NOMS.some((n) => texte.includes(n)), `la salle ne montre aucun nom d’apprenant (${moment})`);
};
const rejoindre = async (page, prenom, nom) => {
  await page.locator('#prenom').waitFor({ timeout: 15_000 });
  await page.fill('#prenom', prenom);
  await page.fill('#nom', nom);
  await page.click('[data-geste="rejoindre"]');
  await page.getByText('Demande envoyée').waitFor();
};

try {
  const salle = await appareil('awa-ordi', ORDI, { url: '/index.html?ecran=salle', cles: clesDAwa });
  const tel = await appareil('awa-tel', TEL, { url: '/index.html#creer', cles: clesDAwa });

  await tel.fill('#prenom', 'Awa');
  await tel.fill('#nom', 'Diallo');
  await tel.fill('#classe', 'BTS SIO 2');
  await tel.fill('#centre', 'Centre Exemple');
  await capturer(tel, '01-formateur-creer');
  await tel.fill('#matin-fin', 'midi');
  await tel.click('[data-geste="creer"]');
  await tel.locator('#erreur-horaires').waitFor();
  await capturer(tel, '01b-formateur-heure-illisible');
  verifier((await tel.locator('#erreur-horaires').innerText()).includes('9 h 00') && (await tel.inputValue('#classe')) === 'BTS SIO 2', 'une heure illisible est refusée sous les horaires, et ce qui est tapé reste');
  verifier((await tel.locator('.horaire .champ.faux').count()) === 1, 'seul le champ fautif est marqué');
  await tel.fill('#matin-fin', '12h30');
  await tel.click('[data-geste="creer"]');
  await tel.getByText('Inviter des apprenants').waitFor();
  verifier(await tel.getByText('Matin, 9 h à 12 h 30 · 0 apprenant').count() === 1, 'la classe neuve n’a personne, et la touche invite');
  await capturer(tel, '02-formateur-classe-neuve');

  await tel.click('[data-geste="inviter"]');
  await capturer(tel, '03-formateur-inviter');
  await tel.click('[data-geste="montrer"]');
  await salle.locator('[data-lien]').waitFor({ timeout: 15_000 });
  const lien = await salle.locator('[data-lien]').getAttribute('data-lien');
  const code = await salle.locator('[data-code]').getAttribute('data-code');
  verifier(lien === (await tel.locator('[data-lien]').getAttribute('data-lien')), 'la salle montre le même lien que le téléphone');
  verifier(lien.length < 110, `le lien du QR reste court (${lien.length} caractères)`);
  const ancre = lien.split('#')[1];

  const telLea = await appareil('lea', TEL, { url: `/index.html#${ancre}`, userAgent: IPHONE });
  await telLea.locator('#prenom').waitFor({ timeout: 15_000 });
  verifier(await telLea.getByText('BTS SIO 2').count() === 1 && await telLea.getByText('Centre Exemple · Awa Diallo, formateur').count() === 1, 'le lien ouvre la classe, déjà affichée');
  await telLea.fill('#prenom', 'Léa');
  await telLea.fill('#nom', 'Martin');
  await capturer(telLea, '04-apprenant-rejoindre');
  await telLea.click('[data-geste="rejoindre"]');
  await telLea.getByText('Demande envoyée').waitFor();
  await capturer(telLea, '05-apprenant-attente');

  const telYanis = await appareil('yanis', TEL);
  await telYanis.getByText('Rejoins ta classe').waitFor();
  await capturer(telYanis, '06-apprenant-sans-classe');
  await telYanis.click('[data-geste="code"]');
  const faux = code.slice(0, -1) + (code.endsWith('a') ? 'b' : 'a');
  await telYanis.fill('#code', faux.toUpperCase());
  await telYanis.locator('#erreur').waitFor({ timeout: 15_000 });
  await capturer(telYanis, '07-apprenant-code-faux');
  verifier((await telYanis.locator('#erreur').innerText()).includes('Aucune classe n’a ce code'), 'un code de classe faux est refusé, avec une phrase');
  await telYanis.fill('#code', code.toUpperCase().replace(/(.{5})(?=.)/g, '$1 '));
  await rejoindre(telYanis, 'Yanis', 'Haddad');

  const telInes = await appareil('ines', TEL, { url: `/index.html#${ancre}`, relaisUrl: reseauDInes.url });
  await rejoindre(telInes, 'Inès', 'Roux');
  const telNoah = await appareil('noah', TEL, { url: `/index.html#${ancre}` });
  await rejoindre(telNoah, 'Noah', 'Petit');
  const telKevin = await appareil('kevin', TEL, { url: `/index.html#${ancre}` });
  await rejoindre(telKevin, 'Kevin', 'Intrus');

  await salle.getByText('5 ont rejoint').waitFor({ timeout: 15_000 });
  await capturer(salle, '08-salle-rejoindre');
  await sansNom(salle, 'pour rejoindre');

  await tel.click('[data-geste="retour"]');
  await tel.getByText('5 demandent à entrer').waitFor({ timeout: 15_000 });
  await capturer(tel, '09-formateur-demandes');
  await tel.click('[data-geste="accepter"]');
  const kevin = await tel.locator('[data-geste="cocher"]', { hasText: 'Kevin Intrus' }).getAttribute('data-cle');
  await tel.click(`[data-geste="cocher"][data-cle="${kevin}"]`);
  await capturer(tel, '10-formateur-accepter');
  verifier(await tel.getByText('Accepter les 4').count() === 1, 'décocher un nom le laisse dehors : la touche en accepte 4');
  await tel.click('[data-geste="valider"]');
  await tel.getByText('Lancer l’appel').waitFor();
  verifier(await tel.getByText(/4 apprenants/).count() === 1, 'la classe a ses quatre apprenants');

  await telLea.getByText('Ta présence').waitFor({ timeout: 15_000 });
  await capturer(telLea, '11-apprenant-admis');
  for (const page of [telYanis, telInes, telNoah]) await page.getByText('Ta présence').waitFor({ timeout: 15_000 });
  await telKevin.waitForTimeout(1500);
  verifier(await telKevin.getByText('Demande envoyée').count() === 1, 'Kevin, laissé dehors, attend toujours : rien ne lui est envoyé');
  const classeDeKevin = await telKevin.evaluate(() => localStorage.getItem('opl_proto_kevin_classes'));
  verifier(!classeDeKevin.includes('"fil"'), 'Kevin n’a jamais reçu le secret du fil');

  await tel.click('[data-geste="classe"]');
  await capturer(tel, '12-formateur-membres');
  await tel.click('[data-geste="retour"]');

  for (const { contexte } of Object.values(pages)) await contexte.clock.setSystemTime(NEUF_HEURES);
  await tel.click('[data-geste="lancer"]');
  await tel.getByText('0 sur 4').first().waitFor();
  await salle.locator('[data-qr]').waitFor({ timeout: 15_000 });
  await capturer(salle, '13-salle-appel');
  await sansNom(salle, 'pendant l’appel');
  const codeDeLAppel = () => salle.locator('.salle-code[data-code]').getAttribute('data-code');

  await telLea.click('[data-geste="signer"]');
  await taper(telLea, await codeDeLAppel());
  await telLea.getByText('Présence signée').waitFor({ timeout: 15_000 });
  await telLea.getByText('Garde Opn-Link sur ton écran d’accueil').waitFor();
  await capturer(telLea, '14-apprenant-signee');
  verifier(true, 'sur iPhone, après la première présence signée, l’app propose l’écran d’accueil, avec les trois pas');
  await telLea.click('[data-geste="plusTard"]');
  verifier(await telLea.getByText('Garde Opn-Link sur ton écran d’accueil').count() === 0, '« Plus tard » la fait disparaître');

  await telYanis.click('[data-geste="signer"]');
  await taper(telYanis, '000000');
  await telYanis.locator('#erreur').waitFor({ timeout: 15_000 });
  await taper(telYanis, await codeDeLAppel());
  await telYanis.getByText('Présence signée').waitFor({ timeout: 15_000 });

  reseauDInes.couper();
  await telInes.click('[data-geste="signer"]');
  await taper(telInes, await codeDeLAppel());
  await telInes.getByText('Montre ce QR à Awa Diallo').waitFor({ timeout: 20_000 });
  await capturer(telInes, '15-apprenant-sans-reseau');
  verifier(await telInes.getByText('Pas de réseau · 1 envoi attend').count() === 1, 'sans réseau, l’écran dit ce qui attend');
  const presenceDInes = await telInes.locator('[data-presence]').getAttribute('data-presence');
  const cleDInes = coeur.cle_de_la_presence(presenceDInes);
  await tel.click(`[data-geste="nom"][data-cle="${cleDInes}"]`);
  await tel.click('[data-geste="lireQr"]');
  await tel.fill('#texte-qr', presenceDInes);
  await tel.click('[data-geste="validerQr"]');
  await tel.getByText('3 sur 4').first().waitFor();
  await salle.getByText('3 sur 4').waitFor({ timeout: 15_000 });

  await tel.click('[data-geste="clore"]');
  await tel.getByText('Clos et signé').waitFor();
  await capturer(tel, '16-formateur-clos');
  await salle.getByText('Appel clos').waitFor({ timeout: 15_000 });
  await sansNom(salle, 'à la clôture');
  verifier(await tel.getByText('Noah Petit').count() === 1, 'Noah, qui n’a pas signé, est noté absent');

  reseauDInes.retablir();
  await telInes.getByText('Présence signée').waitFor({ timeout: 20_000 });
  verifier(true, 'le réseau revenu, Inès reçoit la réponse : sa présence est signée');

  const garde = JSON.parse(await tel.evaluate(() => localStorage.getItem('opl_proto_awa-tel_appel')));
  verifier(/^[0-9a-f]{64}$/.test(coeur.verifier_journal(garde.journal)), 'la feuille close se vérifie seule');
  verifier(!garde.journal.includes('Kevin'), 'Kevin, laissé dehors, n’est pas sur la feuille');
  writeFileSync(join(CAPTURES, 'feuille.txt'), garde.journal);
  copyFileSync(join(DIST, 'icone-512.png'), join(CAPTURES, '19-icone.png'));

  verifier(relais.refuses.length === 0, `le relais a accepté chaque événement signé par le cœur (${relais.gardes.length} événements)`);
  // Un contenu chiffré est du base64 : trois lettres comme « Awa » y tombent par hasard. On vérifie
  // donc que chaque contenu est une lettre scellée ou une porte chiffrée, et qu'aucun nom complet,
  // espace compris, n'apparaît nulle part.
  const surLeRelais = JSON.stringify(relais.gardes);
  const enClair = ['Awa Diallo', 'Léa Martin', 'Yanis Haddad', 'Inès Roux', 'Noah Petit', 'Kevin Intrus', 'BTS SIO 2', 'Centre Exemple'].filter((n) => surLeRelais.includes(n));
  const nonChiffres = relais.gardes.filter((e) => !/^OP[BC]1\.[A-Za-z0-9_-]+$/.test(e.content));
  verifier(enClair.length === 0 && nonChiffres.length === 0, `rien ne passe en clair sur le relais : chaque contenu est scellé ou chiffré, et aucun nom ne s'y lit (${enClair.join(', ') || 'aucun'})`);
  verifier([...adresses].every((h) => h.startsWith('127.0.0.1')), `aucune autre adresse contactée (${[...adresses].join(', ')})`);

  await telLea.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await pages.lea.contexte.setOffline(true);
  await telLea.reload();
  await telLea.getByText('Présence signée').waitFor({ timeout: 15_000 });
  verifier(await telLea.getByText('Garde Opn-Link sur ton écran d’accueil').count() === 0, 'sans réseau, le site se rouvre depuis l’appareil, et l’écran d’accueil ne se redemande pas');
  await pages.lea.contexte.setOffline(false);

  for (const page of [tel, telLea, telYanis]) await page.emulateMedia({ colorScheme: 'dark' });
  await capturer(tel, '17-formateur-clos-sombre');
  await capturer(telLea, '18-apprenant-signee-sombre');

  const poids = [];
  const premier = await navigateur.newContext({ ...TEL });
  await premier.addInitScript((url) => localStorage.setItem('opl_proto_neuf_relais', JSON.stringify(url)), relais.url);
  const pageNeuve = await premier.newPage();
  pageNeuve.on('response', async (r) => {
    try {
      const corps = await r.body();
      poids.push([new URL(r.url()).pathname, extname(r.url()) === '.woff2' ? corps.length : gzipSync(corps, { level: 9 }).length]);
    } catch {}
  });
  await pageNeuve.goto(`${site}/index.html?appareil=neuf`);
  await pageNeuve.getByText('Rejoins ta classe').waitFor();
  await pageNeuve.waitForLoadState('networkidle');
  const total = poids.reduce((s, [, o]) => s + o, 0);
  const polices = poids.filter(([c]) => c.endsWith('.woff2')).reduce((s, [, o]) => s + o, 0);
  console.log(`Premier chargement chez un apprenant : ${(total / 1024).toFixed(1)} Ko compressés, dont ${(polices / 1024).toFixed(1)} Ko de polices`);
  verifier(total <= 300 * 1024, 'le premier chargement tient sous le plafond de 300 Ko');
} finally {
  await navigateur.close();
  await reseauDInes.fermer();
  await relais.fermer();
  serveur.close();
}

if (echecs.length) {
  console.error(`\n${echecs.length} échec(s) :\n${echecs.join('\n')}`);
  process.exitCode = 1;
}
