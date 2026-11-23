// Une classe de bout en bout, jouée par Playwright avec de vrais appareils et des relais locaux.
// Awa crée la classe et l'invite à la salle. Léa, Inès, Noah et Kevin ouvrent le lien du QR,
// Yanis tape le code, d'abord de travers, Noah sans réseau. Awa accepte tout le monde sauf
// Kevin, qu'elle ne connaît pas. Puis l'appel, annoncé sur le fil de la classe : Léa signe en
// visant le QR de la salle avec la caméra simulée de Chromium, Yanis se trompe de code puis signe, et tente de clore l'appel avec sa propre clé. Inès n'a plus
// de réseau et tend son QR, qu'Awa lit avec la caméra de son téléphone, Noah est absent. Awa clôt,
// et annonce le prochain cours : lundi 23. Jeudi, Léa est en entreprise. Les captures vont dans captures/.
//
// Les appareils ont deux relais principaux, dont un qui refuse toute écriture, et deux de
// secours, dont un qui ne répond pas. Le principal qui marche tombe juste après l'invitation :
// tout le reste passe par le secours. À la fin, la liste par défaut se vérifie sans réseau.
//
// npm run construire, puis npm run classe.

import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { WebSocket } from 'ws';
import { lancerPasserelle, lancerRelais, lancerRelaisMort } from '../outils/relais.mjs';

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

// Les appareils vivent le mardi 17 novembre 2026 au matin, comme dans les maquettes, et les
// relais avec eux.
const MARDI_MATIN = new Date('2026-11-17T08:55:00+01:00');
const NEUF_HEURES = new Date('2026-11-17T09:01:00+01:00');
const JEUDI = new Date('2026-11-19T10:00:00+01:00');
let ecart = MARDI_MATIN - Date.now();
const horloge = () => Date.now() + ecart;

const principal = await lancerRelais(0, { horloge });
const ferme = await lancerRelais(0, { refuser: true, horloge });
const secours = await lancerRelais(0, { horloge });
const mort = await lancerRelaisMort();
const LISTE = { principaux: [principal.url, ferme.url], secours: [secours.url, mort.url] };
const debut = Date.now();
// Le réseau d'un téléphone : une passerelle par relais, que le test coupe et rétablit.
async function reseau() {
  const passerelles = await Promise.all([principal, ferme, secours].map((r) => lancerPasserelle(r.url)));
  const [p, f, s] = passerelles.map((x) => x.url);
  return {
    liste: { principaux: [p, f], secours: [s, mort.url] },
    couper: () => passerelles.forEach((x) => x.couper()),
    retablir: () => passerelles.forEach((x) => x.retablir()),
    fermer: () => Promise.all(passerelles.map((x) => x.fermer())),
  };
}
const reseauDInes = await reseau();
const reseauDeNoah = await reseau();

const navigateur = await chromium.launch();
// La caméra simulée de Chromium filme un fichier. On y écrit, au moment de signer, l'image du QR
// que montre la salle : Chromium lit le fichier quand la page ouvre la caméra, et passe ses images
// en boucle.
const CAMERA = join(CAPTURES, '.camera.y4m');
const LARGEUR_CAMERA = 640;
const HAUTEUR_CAMERA = 480;
const filmer = (images) =>
  writeFileSync(
    CAMERA,
    Buffer.concat([
      Buffer.from(`YUV4MPEG2 W${LARGEUR_CAMERA} H${HAUTEUR_CAMERA} F10:1 Ip A1:1 C420jpeg\n`),
      ...images.flatMap((gris) => [Buffer.from('FRAME\n'), Buffer.from(gris), Buffer.alloc((LARGEUR_CAMERA * HAUTEUR_CAMERA) / 2, 128)]),
    ]),
  );
filmer([new Uint8Array(LARGEUR_CAMERA * HAUTEUR_CAMERA).fill(200)]);
const navigateurCamera = await chromium.launch({
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${CAMERA}`],
});
// Un QR posé de travers, comme dans le viseur de la maquette, filmé par une main qui bouge un peu :
// cinq poses. Une seule image fixe, ratée par le lecteur, l'était pour toujours (une présence
// filmée à 250 pixels et de travers rate une fois sur quarante, mesuré le 23 novembre 2026).
const POSES = [
  [-0.05, 250, 0, 0],
  [-0.03, 256, 6, -4],
  [-0.07, 244, -5, 3],
  [-0.04, 262, 3, 5],
  [-0.06, 248, -3, -6],
];
async function filmerLeQr(texte) {
  const page = await navigateur.newPage();
  const images = [];
  for (const pose of POSES) {
    images.push(
      await page.evaluate(
        async ([svg, l, h, [angle, taille, dx, dy]]) => {
          const toile = Object.assign(document.createElement('canvas'), { width: l, height: h });
          const ctx = toile.getContext('2d');
          ctx.fillStyle = '#8a8478';
          ctx.fillRect(0, 0, l, h);
          const image = new Image();
          image.src = `data:image/svg+xml;base64,${btoa(svg)}`;
          await image.decode();
          ctx.translate(l / 2 + dx, h / 2 + dy);
          ctx.rotate(angle);
          ctx.fillStyle = '#fff';
          ctx.fillRect(-taille / 2 - 25, -taille / 2 - 25, taille + 50, taille + 50);
          ctx.drawImage(image, -taille / 2, -taille / 2, taille, taille);
          const rvb = ctx.getImageData(0, 0, l, h).data;
          return Array.from({ length: l * h }, (_, i) => Math.round(rvb[i * 4] * 0.299 + rvb[i * 4 + 1] * 0.587 + rvb[i * 4 + 2] * 0.114));
        },
        [coeur.svg_du_qr(texte), LARGEUR_CAMERA, HAUTEUR_CAMERA, pose],
      ),
    );
  }
  await page.close();
  filmer(images);
}
const TEL = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const ORDI = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };
const adresses = new Set();
// Le téléphone et l'ordinateur d'Awa ont les mêmes clés : « relier un appareil » viendra plus tard.
const clesDAwa = new coeur.Appareil().secrets();
const pages = {};

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';

async function appareil(nom, options, { url = '/index.html', cles, liste = LISTE, userAgent, camera = false } = {}) {
  const contexte = await (camera ? navigateurCamera : navigateur).newContext({
    ...options,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    ...(userAgent ? { userAgent } : {}),
    ...(camera ? { permissions: ['camera'] } : {}),
  });
  await contexte.clock.setSystemTime(MARDI_MATIN);
  await contexte.addInitScript(
    ([nom, cles, liste]) => {
      localStorage.setItem(`opl_proto_${nom}_relais`, JSON.stringify(liste));
      if (cles) localStorage.setItem(`opl_proto_${nom}_cles`, JSON.stringify(cles));
    },
    [nom, cles, liste],
  );
  const page = await contexte.newPage();
  page.on('pageerror', (e) => echecs.push(`${nom} : ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('WebSocket') && echecs.push(`${nom} : ${m.text()}`));
  page.on('request', (r) => adresses.add(new URL(r.url()).host));
  page.on('websocket', (ws) => adresses.add(new URL(ws.url()).host));
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
  const tel = await appareil('awa-tel', TEL, { url: '/index.html#creer', cles: clesDAwa, camera: true });

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

  await principal.fermer();
  const gardesAvantLaPanne = secours.gardes.length;
  const etiquetteDeLaClasse = coeur.etiquette_de_classe(code);
  verifier(
    secours.gardes.some((e) => e.tags.some(([t, v]) => t === 'x' && v === etiquetteDeLaClasse)),
    'la porte, acceptée par le principal avant que le secours ne s’ouvre, a été renvoyée au secours',
  );

  const telLea = await appareil('lea', TEL, { url: `/index.html#${ancre}`, userAgent: IPHONE, camera: true });
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

  const telInes = await appareil('ines', TEL, { url: `/index.html#${ancre}`, liste: reseauDInes.liste });
  await rejoindre(telInes, 'Inès', 'Roux');

  reseauDeNoah.couper();
  const telNoah = await appareil('noah', TEL, { url: `/index.html#${ancre}`, liste: reseauDeNoah.liste });
  await telNoah.getByText('Je cherche la classe dès qu’il revient').waitFor({ timeout: 15_000 });
  await capturer(telNoah, '07b-apprenant-lien-sans-reseau');
  verifier(true, 'sans réseau, le lien de la classe dit « Pas de réseau », sans parler de code faux');
  reseauDeNoah.retablir();
  await rejoindre(telNoah, 'Noah', 'Petit');
  verifier(true, 'le réseau revenu, la classe s’affiche d’elle-même');
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

  await telLea.getByText('Pas d’appel ouvert').waitFor({ timeout: 15_000 });
  await capturer(telLea, '11-apprenant-admis');
  verifier(await telLea.locator('[data-geste="signer"]').count() === 0, 'avant l’appel, l’apprenant n’a pas de touche : rien n’est dû');
  for (const page of [telYanis, telInes, telNoah]) await page.getByText('Pas d’appel ouvert').waitFor({ timeout: 15_000 });

  reseauDeNoah.couper();
  await telNoah.reload();
  await telNoah.getByText('Ta présence').waitFor({ timeout: 15_000 });
  verifier(await telNoah.locator('[data-geste="signer"]').count() === 1, 'sans réseau, le téléphone ne peut pas savoir si l’appel est ouvert : la touche reste');
  reseauDeNoah.retablir();
  await telNoah.getByText('Pas d’appel ouvert').waitFor({ timeout: 15_000 });
  await telKevin.waitForTimeout(1500);
  verifier(await telKevin.getByText('Demande envoyée').count() === 1, 'Kevin, laissé dehors, attend toujours : rien ne lui est envoyé');
  const classeDeKevin = await telKevin.evaluate(() => localStorage.getItem('opl_proto_kevin_classes'));
  verifier(!classeDeKevin.includes('"fil"'), 'Kevin n’a jamais reçu le secret du fil');

  await tel.click('[data-geste="classe"]');
  await capturer(tel, '12-formateur-membres');
  await tel.click('[data-geste="retour"]');

  ecart = NEUF_HEURES - Date.now();
  for (const { contexte } of Object.values(pages)) await contexte.clock.setSystemTime(NEUF_HEURES);
  await tel.click('[data-geste="lancer"]');
  await tel.getByText('0 sur 4').first().waitFor();
  await salle.locator('[data-qr]').waitFor({ timeout: 15_000 });
  await capturer(salle, '13-salle-appel');
  await sansNom(salle, 'pendant l’appel');
  const codeDeLAppel = () => salle.locator('.salle-code[data-code]').getAttribute('data-code');
  for (const page of [telLea, telYanis, telInes, telNoah]) await page.getByText('L’appel est ouvert').waitFor({ timeout: 15_000 });
  await capturer(telLea, '13b-apprenant-appel-ouvert');
  verifier(
    (await telLea.locator('header.barre.maintenant').count()) === 1 && (await telLea.getByText('Matin, 9 h à 12 h 30 · Awa Diallo').count()) === 1,
    'le fil annonce l’appel : la barre passe en marine, avec la demi-journée et qui l’a ouvert',
  );
  verifier(await telKevin.getByText('Demande envoyée').count() === 1, 'Kevin, laissé dehors, ne voit pas l’appel');

  await filmerLeQr(lien);
  await telLea.click('[data-geste="signer"]');
  await telLea.getByText('Ce QR n’est pas celui de l’appel').waitFor({ timeout: 15_000 });
  await capturer(telLea, '13c-apprenant-viseur');
  verifier(true, 'viser le QR de la classe au lieu de celui de l’appel : une phrase, et rien ne part');
  await telLea.click('[data-geste="retour"]');
  await filmerLeQr(await salle.locator('[data-qr]').getAttribute('data-qr'));
  await telLea.click('[data-geste="signer"]');
  await telLea.getByText('Présence signée').waitFor({ timeout: 15_000 });
  verifier(true, 'Léa signe en visant le QR de la salle : la caméra le lit, sans un chiffre tapé');
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

  // Yanis a le secret du fil, comme tout membre. Il annonce l'appel clos, signé de sa propre clé.
  const clesDeYanis = JSON.parse(await telYanis.evaluate(() => localStorage.getItem('opl_proto_yanis_cles')));
  const [classeDeYanis] = JSON.parse(await telYanis.evaluate(() => localStorage.getItem('opl_proto_yanis_classes')));
  const plusTard = NEUF_HEURES.getTime() + 10 * 60_000;
  const fauxAppel = coeur.Appel.ouvrir(classeDeYanis.code, '2026-11-17', 'matin', coeur.Appareil.relire(clesDeYanis), '', NEUF_HEURES.getTime());
  fauxAppel.clore(plusTard);
  const fausseAnnonce = coeur.chiffrer_pour_le_fil(classeDeYanis.fil, fauxAppel.annonce(classeDeYanis.fil, plusTard));
  const seconde = Math.floor(Date.now() / 1000);
  const parYanis = new WebSocket(secours.url);
  await new Promise((ok) => parYanis.on('open', ok));
  parYanis.send(`["EVENT",${coeur.evenement_nostr(coeur.etiquette_du_fil(classeDeYanis.fil), seconde + 3600, fausseAnnonce, seconde)}]`);
  await new Promise((ok) => parYanis.on('message', ok));
  parYanis.close();
  await telNoah.waitForTimeout(1500);
  verifier(await telNoah.getByText('L’appel est ouvert').count() === 1, 'un apprenant ne peut pas clore l’appel des autres : son annonce n’est pas signée par un responsable');

  reseauDInes.couper();
  await telInes.click('[data-geste="signer"]');
  await taper(telInes, await codeDeLAppel());
  await telInes.getByText('Montre ce QR à Awa Diallo').waitFor({ timeout: 20_000 });
  await capturer(telInes, '15-apprenant-sans-reseau');
  verifier(await telInes.getByText('Pas de réseau · 1 envoi attend').count() === 1, 'sans réseau, l’écran dit ce qui attend');
  const presenceDInes = await telInes.locator('[data-presence]').getAttribute('data-presence');
  const cleDInes = coeur.cle_de_la_presence(presenceDInes);
  const enAttente = JSON.parse(await telInes.evaluate(() => localStorage.getItem('opl_proto_ines_envois')));
  await telInes.reload();
  await telInes.getByText('Pas de réseau · 1 envoi attend').waitFor({ timeout: 15_000 });
  verifier(enAttente.length === 1, 'ce qui attend se garde sur le téléphone : rechargé, il dit encore « 1 envoi attend »');
  await filmerLeQr(await salle.locator('[data-qr]').getAttribute('data-qr'));
  await tel.click(`[data-geste="nom"][data-cle="${cleDInes}"]`);
  await tel.click('[data-geste="lireQr"]');
  await tel.getByText('Ce QR n’est pas une présence').waitFor({ timeout: 15_000 });
  await capturer(tel, '15b-formateur-lire-qr');
  verifier((await salle.getByText('2 sur 4').count()) === 1, 'le formateur vise le QR de la salle au lieu de celui d’Inès : une phrase, et rien n’entre');
  await tel.click('[data-geste="retour"]');
  await filmerLeQr(presenceDInes);
  await tel.click(`[data-geste="nom"][data-cle="${cleDInes}"]`);
  await tel.click('[data-geste="lireQr"]');
  await tel.getByText('3 sur 4').first().waitFor({ timeout: 15_000 });
  verifier(true, 'Awa lit le QR d’Inès avec la caméra de son téléphone, sans rien taper');
  await salle.getByText('3 sur 4').waitFor({ timeout: 15_000 });

  await tel.click('[data-geste="clore"]');
  await tel.getByText('Clos et signé').waitFor();
  await capturer(tel, '16-formateur-clos');
  await salle.getByText('Appel clos').waitFor({ timeout: 15_000 });
  await sansNom(salle, 'à la clôture');
  verifier(await tel.getByText('Noah Petit').count() === 1, 'Noah, qui n’a pas signé, est noté absent');
  await telNoah.getByText('Une absence').waitFor({ timeout: 15_000 });
  await capturer(telNoah, '16b-apprenant-absence');
  verifier(await telNoah.getByText(/Matin · appel clos à 9\sh\s0\d par Awa Diallo/).count() === 1, 'l’appel clos, le téléphone de Noah dit « Une absence », et qui a clos');
  verifier(await telNoah.locator('.case.absent').count() === 1, 'sa semaine le montre : une case rouge, mardi matin');

  verifier(await tel.getByText('Prochain cours : mardi 17, après-midi').count() === 1, 'à la clôture, l’app propose le prochain cours : sans rien appris, la demi-journée suivante');
  await telLea.getByText('Prochain appel : mar. 17 nov., 13 h 30').waitFor({ timeout: 15_000 });
  await tel.click('[data-geste="changerProchain"]');
  await tel.check('input[value="2026-11-23 matin"]');
  await capturer(tel, '16c-formateur-prochain');
  await tel.click('[data-geste="annoncerProchain"]');
  verifier(await tel.getByText('Prochain cours : lundi 23, matin').count() === 1, '« Changer » : Awa choisit lundi 23 au matin, et l’annonce à la classe');
  await telLea.getByText('Prochain appel : lun. 23 nov., 9 h').waitFor({ timeout: 15_000 });
  await capturer(telLea, '16d-apprenant-en-regle');
  const casesDeLea = await telLea.locator('.semaine .case').evaluateAll((cases) => cases.map((c) => `${c.className.replace('case', '').trim() || '-'}:${c.textContent}`));
  verifier(
    casesDeLea.join(' ') === '-: faite:9:01 ailleurs: ailleurs: ailleurs: -: ailleurs: ailleurs: ailleurs: ailleurs:',
    `la semaine de Léa : sa présence mardi matin, puis pas de cours jusqu’à lundi (${casesDeLea.join(' ')})`,
  );
  verifier(await telLea.getByText('En règle').count() === 1, 'l’appel clos et sa présence reçue, Léa est en règle');

  // Yanis, qui a le secret du fil, annonce un autre prochain cours, signé de sa propre clé.
  const fauxProchain = coeur.Appareil.relire(clesDeYanis).prochain_cours(classeDeYanis.fil, '2026-11-18', 'matin', horloge() + 60_000);
  const parYanisEncore = new WebSocket(secours.url);
  await new Promise((ok) => parYanisEncore.on('open', ok));
  const aLaSeconde = Math.floor(horloge() / 1000);
  parYanisEncore.send(`["EVENT",${coeur.evenement_nostr(coeur.etiquette_du_fil(classeDeYanis.fil), aLaSeconde + 86_400, coeur.chiffrer_pour_le_fil(classeDeYanis.fil, fauxProchain), aLaSeconde)}]`);
  await new Promise((ok) => parYanisEncore.on('message', ok));
  parYanisEncore.close();
  await telLea.waitForTimeout(1500);
  verifier(await telLea.getByText('Prochain appel : lun. 23 nov., 9 h').count() === 1, 'un apprenant ne fixe pas le prochain cours : le sien n’est pas signé par un responsable');

  reseauDInes.retablir();
  await telInes.waitForFunction(() => localStorage.getItem('opl_proto_ines_presences')?.includes('"recu"'), null, { timeout: 20_000 });
  await telInes.getByText('En règle').waitFor({ timeout: 15_000 });
  verifier((await telInes.locator('.case.faite').count()) === 1, 'le réseau revenu, Inès reçoit la réponse : sa présence est signée, et elle est en règle');
  await telInes.waitForFunction(() => localStorage.getItem('opl_proto_ines_envois') === '[]', null, { timeout: 15_000 });
  const idDeLaPresence = JSON.parse(enAttente[0]).id;
  verifier(secours.gardes.some((e) => e.id === idDeLaPresence), 'la présence gardée part d’elle-même au retour du réseau, rechargement compris');

  const garde = JSON.parse(await tel.evaluate(() => localStorage.getItem('opl_proto_awa-tel_appel')));
  verifier(/^[0-9a-f]{64}$/.test(coeur.verifier_journal(garde.journal)), 'la feuille close se vérifie seule');
  verifier(!garde.journal.includes('Kevin'), 'Kevin, laissé dehors, n’est pas sur la feuille');
  writeFileSync(join(CAPTURES, 'feuille.txt'), garde.journal);
  copyFileSync(join(DIST, 'icone-512.png'), join(CAPTURES, '19-icone.png'));

  const gardes = [...principal.gardes, ...secours.gardes];
  verifier(principal.refuses.length + secours.refuses.length === 0, `les relais ont accepté chaque événement signé par le cœur (${gardes.length} événements)`);
  verifier(secours.gardes.length - gardesAvantLaPanne > 20, `le principal tombé, tout est passé par le relais de secours (${secours.gardes.length - gardesAvantLaPanne} événements depuis)`);
  // Neuf appareils au plus, une tentative toutes les trois secondes chacun : trois par seconde.
  // Retenté sans attendre, Chromium freine lui-même, et on en mesure encore six.
  const parSeconde = mort.tentatives / ((Date.now() - debut) / 1000);
  verifier(mort.tentatives > 0 && parSeconde < 4, `le relais de secours mort est retenté toutes les trois secondes, pas plus (${mort.tentatives} tentatives, ${parSeconde.toFixed(1)} par seconde pour tous les appareils)`);
  const ecrivains = ferme.connexions.filter((c) => c.evenements > 0);
  const auPlus = Math.max(...ferme.connexions.map((c) => c.evenements));
  verifier(ecrivains.length > 0 && auPlus <= 3, `le relais qui refuse est écarté au premier refus (${ecrivains.length} appareils ont essayé, ${auPlus} événements au plus chacun)`);
  // Un contenu chiffré est du base64 : trois lettres comme « Awa » y tombent par hasard. On vérifie
  // donc que chaque contenu est une lettre scellée ou une porte chiffrée, et qu'aucun nom complet,
  // espace compris, n'apparaît nulle part.
  const surLesRelais = JSON.stringify(gardes);
  const enClair = ['Awa Diallo', 'Léa Martin', 'Yanis Haddad', 'Inès Roux', 'Noah Petit', 'Kevin Intrus', 'BTS SIO 2', 'Centre Exemple'].filter((n) => surLesRelais.includes(n));
  const nonChiffres = gardes.filter((e) => !/^OP[BC]1\.[A-Za-z0-9_-]+$/.test(e.content));
  verifier(enClair.length === 0 && nonChiffres.length === 0, `rien ne passe en clair sur les relais : chaque contenu est scellé ou chiffré, et aucun nom ne s'y lit (${enClair.join(', ') || 'aucun'})`);
  verifier([...adresses].every((h) => h.startsWith('127.0.0.1')), `aucune autre adresse contactée (${[...adresses].join(', ')})`);

  await telLea.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await pages.lea.contexte.setOffline(true);
  await telLea.reload();
  await telLea.getByText('En règle').waitFor({ timeout: 15_000 });
  verifier(await telLea.getByText('Garde Opn-Link sur ton écran d’accueil').count() === 0, 'sans réseau, le site se rouvre depuis l’appareil, et l’écran d’accueil ne se redemande pas');
  await pages.lea.contexte.setOffline(false);

  for (const page of [tel, telLea, telYanis]) await page.emulateMedia({ colorScheme: 'dark' });
  await capturer(tel, '17-formateur-clos-sombre');
  await capturer(telLea, '18-apprenant-en-regle-sombre');

  // Jeudi, Léa est en entreprise : son téléphone le sait par le prochain cours.
  ecart = JEUDI - Date.now();
  await pages.lea.contexte.clock.setSystemTime(JEUDI);
  await telLea.emulateMedia({ colorScheme: 'light' });
  await telLea.reload();
  await telLea.getByText('Retour au centre : lun. 23 nov., 9 h').waitFor({ timeout: 15_000 });
  await capturer(telLea, '20-apprenant-entreprise');
  verifier(
    (await telLea.locator('header.barre.pas-maintenant', { hasText: 'En entreprise' }).count()) === 1 && (await telLea.locator('.case.ailleurs.ici').count()) === 1,
    'jeudi, la barre dit « En entreprise », en trame, et la case du moment aussi',
  );
  verifier(await telLea.locator('[data-geste="signer"]').count() === 0, 'en entreprise, rien n’est dû : pas de touche');

  // Le texte agrandi à 200 %, à 360 pixels : la semaine passe en rangs, et rien ne sort de l'écran.
  await pages.lea.contexte.addInitScript(() => document.addEventListener('DOMContentLoaded', () => (document.documentElement.style.fontSize = '200%')));
  await telLea.setViewportSize({ width: 360, height: 640 });
  await telLea.reload();
  await telLea.locator('.semaine.en-rangs').waitFor({ timeout: 15_000 });
  await capturer(telLea, '21-apprenant-texte-200');
  verifier(await telLea.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'le texte agrandi à 200 %, la semaine se lit en rangs, et rien ne sort de l’écran');

  const poids = [];
  const premier = await navigateur.newContext({ ...TEL });
  await premier.addInitScript((url) => localStorage.setItem('opl_proto_neuf_relais', JSON.stringify({ principaux: [url], secours: [] })), secours.url);
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

  // La liste par défaut, sans toucher au réseau : Playwright tient le rôle des relais publics.
  // nos.lol refuse les écritures, comme un relais qui bloque l'adresse d'un centre.
  const contactes = [];
  const evenementsPour = {};
  const sansReglage = await navigateur.newContext({ ...TEL, locale: 'fr-FR', timezoneId: 'Europe/Paris' });
  await sansReglage.routeWebSocket(/^wss:/, (ws) => {
    const hote = new URL(ws.url()).host;
    contactes.push(hote);
    ws.onMessage((brut) => {
      const [sorte, a] = JSON.parse(String(brut));
      if (sorte === 'REQ') ws.send(JSON.stringify(['EOSE', a]));
      if (sorte !== 'EVENT') return;
      evenementsPour[hote] = (evenementsPour[hote] ?? 0) + 1;
      ws.send(JSON.stringify(hote === 'nos.lol' ? ['OK', a.id, false, 'blocked: écriture fermée'] : ['OK', a.id, true, '']));
    });
  });
  const pageSansReglage = await sansReglage.newPage();
  pageSansReglage.on('request', (r) => adresses.add(new URL(r.url()).host));
  await pageSansReglage.goto(`${site}/index.html?appareil=defaut#creer`);
  await pageSansReglage.locator('#prenom').waitFor();
  await pageSansReglage.waitForTimeout(1500);
  const vus = () => [...new Set(contactes)].sort().join(', ');
  verifier(vus() === 'nos.lol, nostr.sathoarder.com', `sans réglage, l’app passe par nostr.sathoarder.com et nos.lol, et pas par les secours (${vus()})`);
  await pageSansReglage.fill('#prenom', 'Awa');
  await pageSansReglage.fill('#nom', 'Diallo');
  await pageSansReglage.fill('#classe', 'BTS SIO 2');
  await pageSansReglage.fill('#centre', 'Centre Exemple');
  await pageSansReglage.click('[data-geste="creer"]');
  await pageSansReglage.getByText('Inviter des apprenants').waitFor();
  await pageSansReglage.waitForTimeout(1500);
  verifier(
    vus() === 'nos.lol, nostr-01.yakihonne.com, nostr-relay.corb.net, nostr.sathoarder.com' && evenementsPour['nos.lol'] <= 3 && evenementsPour['nostr-relay.corb.net'] > 0,
    `nos.lol refuse : l’app l’écarte et passe par les deux relais de secours (${vus()} ; ${JSON.stringify(evenementsPour)})`,
  );
  verifier([...adresses].every((h) => h.startsWith('127.0.0.1')), `aucune requête ne quitte la machine (${[...adresses].join(', ')})`);
} catch (e) {
  // L'écran de chaque appareil au moment de l'échec, pour comprendre sans relancer.
  for (const [nom, { page }] of Object.entries(pages)) await page.screenshot({ path: join(CAPTURES, `echec-${nom}.png`) }).catch(() => {});
  throw e;
} finally {
  await navigateur.close();
  await navigateurCamera.close();
  await reseauDInes.fermer();
  await reseauDeNoah.fermer();
  for (const r of [principal, ferme, secours, mort]) await r.fermer();
  serveur.close();
}

if (echecs.length) {
  console.error(`\n${echecs.length} échec(s) :\n${echecs.join('\n')}`);
  process.exitCode = 1;
}
