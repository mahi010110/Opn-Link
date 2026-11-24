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
// Ce qu'un intrus publie lui-même, sans passer par l'app : un événement sous une étiquette.
async function publierAuSecours(etiquette, contenu) {
  const seconde = Math.floor(horloge() / 1000);
  const ws = new WebSocket(secours.url);
  await new Promise((ok) => ws.on('open', ok));
  ws.send(`["EVENT",${coeur.evenement_nostr(etiquette, seconde + 86_400, contenu, seconde)}]`);
  await new Promise((ok) => ws.on('message', ok));
  ws.close();
}
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
    retarderLeSecours: (ms) => passerelles[2].retarder(ms),
    fermer: () => Promise.all(passerelles.map((x) => x.fermer())),
  };
}
const reseauDInes = await reseau();
const reseauDeNoah = await reseau();
const reseauDeNadia = await reseau();

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

// Le stockage de départ ne se pose qu'une fois : ce que l'app y écrit ensuite reste au rechargement.
async function appareil(nom, options, { url = '/index.html', cles, liste = LISTE, userAgent, camera = false, stockage = {} } = {}) {
  const contexte = await (camera ? navigateurCamera : navigateur).newContext({
    ...options,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    ...(userAgent ? { userAgent } : {}),
    ...(camera ? { permissions: ['camera'] } : {}),
  });
  await contexte.clock.setSystemTime(MARDI_MATIN);
  await contexte.addInitScript(
    ([nom, cles, liste, stockage]) => {
      if (location.protocol === 'about:') return;
      localStorage.setItem(`opl_proto_${nom}_relais`, JSON.stringify(liste));
      if (cles) localStorage.setItem(`opl_proto_${nom}_cles`, JSON.stringify(cles));
      for (const [cle, valeur] of Object.entries(stockage)) localStorage.getItem(`opl_proto_${nom}_${cle}`) ?? localStorage.setItem(`opl_proto_${nom}_${cle}`, JSON.stringify(valeur));
    },
    [nom, cles, liste, stockage],
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

  // Awa nomme un adjoint, Julien Morel, formateur. L'invitation est un lien, avec un jeton.
  await tel.click('[data-geste="nommer"]');
  await capturer(tel, '12b-formateur-adjoint');
  await tel.click('[data-geste="montrerInvitation"]');
  const invitation = await tel.locator('[data-lien]').getAttribute('data-lien');
  const telJulien = await appareil('julien', TEL, { url: `/index.html#${invitation.split('#')[1]}` });
  await telJulien.getByText('Awa Diallo t’invite comme adjoint').waitFor({ timeout: 15_000 });
  await capturer(telJulien, '12c-adjoint-invitation');
  await telJulien.fill('#prenom', 'Julien');
  await telJulien.fill('#nom', 'Morel');
  await telJulien.click('[data-geste="demander"]');
  await telJulien.getByText('Demande envoyée').waitFor();

  // Kevin, qui a le code, demande aussi à être adjoint, mais sans le jeton d'une invitation.
  const clesDeKevin = JSON.parse(await telKevin.evaluate(() => localStorage.getItem('opl_proto_kevin_cles')));
  const boiteDAwa = coeur.Appareil.relire(clesDAwa).boite();
  const demandeDeKevin = coeur.Appareil.relire(clesDeKevin).demander_entree(code, 'Kevin', 'Intrus', horloge());
  await publierAuSecours(coeur.etiquette_de_boite(boiteDAwa), coeur.sceller(boiteDAwa, JSON.stringify({ v: 1, t: 'adjoint', code, demande: demandeDeKevin, jeton: 'A'.repeat(22) })));

  await tel.click('[data-geste="retour"]');
  await tel.click('[data-geste="retour"]');
  await tel.getByText('Julien Morel demande à être adjoint').waitFor({ timeout: 15_000 });
  await tel.waitForTimeout(1500);
  verifier(await tel.getByText('Kevin Intrus demande à être adjoint').count() === 0, 'une demande d’adjoint sans le jeton d’une invitation ne s’affiche pas');
  await capturer(tel, '12d-formateur-accepter-adjoint');
  await tel.click('[data-geste="accepterAdjoint"]');
  await telJulien.getByText('Lancer l’appel').waitFor({ timeout: 15_000 });
  await capturer(telJulien, '12e-adjoint-cours');
  verifier(await telJulien.getByText('Matin, 9 h à 12 h 30 · 4 apprenants').count() === 1, 'accepté, Julien voit la classe et ses quatre apprenants, partagés par Awa');
  await telJulien.click('[data-geste="classe"]');
  verifier(
    (await telJulien.getByText('formateur · chef').count()) === 1 && (await telJulien.getByText('formateur · adjoint').count()) === 1 && (await telJulien.locator('[data-geste="nommer"]').count()) === 0,
    'Julien est adjoint : il ne voit pas « Nommer un adjoint », qui reste au chef',
  );
  await capturer(telJulien, '12f-adjoint-membres');
  await telJulien.click('[data-geste="retour"]');

  // Le téléphone de Léa suit la porte : Julien en est, sa présence lui partira aussi.
  await telLea.waitForFunction(() => JSON.parse(localStorage.getItem('opl_proto_lea_classes'))[0].porte.includes('Julien'), null, { timeout: 15_000 });
  verifier(true, 'la porte qui compte Julien arrive chez Léa');
  // Yanis, qui a le code, signe une porte où il est chef : personne n'en tient compte.
  const clesDeYanisAvant = JSON.parse(await telYanis.evaluate(() => localStorage.getItem('opl_proto_yanis_cles')));
  const yanis = coeur.Appareil.relire(clesDeYanisAvant);
  const porteDeYanis = coeur.signer_porte(code, 'BTS SIO 2', 'Centre Exemple', '9:00-12:30', '13:30-17:00', ['Yanis', 'Haddad', 'formateur', yanis.cle(), yanis.boite()].join('\t'), yanis, horloge() + 60_000);
  await publierAuSecours(coeur.etiquette_de_classe(code), coeur.chiffrer_pour_la_classe(code, porteDeYanis));
  await telLea.waitForTimeout(1500);
  const porteDeLea = JSON.parse(await telLea.evaluate(() => localStorage.getItem('opl_proto_lea_classes')))[0].porte;
  verifier(coeur.lire_porte(code, porteDeLea).responsables[0].prenom === 'Awa', 'un apprenant ne se fait pas chef : sa porte n’est pas signée par le chef que suit la classe');

  await tel.click('[data-geste="classe"]');
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
  // Sa présence part à chaque responsable : Awa et Julien.
  verifier(await telInes.getByText('Pas de réseau · 2 envois attendent').count() === 1, 'sans réseau, l’écran dit ce qui attend : sa présence, pour chacun des deux responsables');
  const presenceDInes = await telInes.locator('[data-presence]').getAttribute('data-presence');
  const cleDInes = coeur.cle_de_la_presence(presenceDInes);
  const enAttente = JSON.parse(await telInes.evaluate(() => localStorage.getItem('opl_proto_ines_envois')));
  await telInes.reload();
  await telInes.getByText('Pas de réseau · 2 envois attendent').waitFor({ timeout: 15_000 });
  verifier(enAttente.length === 2, 'ce qui attend se garde sur le téléphone : rechargé, il dit encore « 2 envois attendent »');
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

  // « Appel clos » ne reste que trois secondes à la salle : on la guette avant de clore.
  const clotureALaSalle = salle.getByText('Appel clos').waitFor({ timeout: 15_000 }).then(() => sansNom(salle, 'à la clôture'));
  await tel.click('[data-geste="clore"]');
  await tel.getByText('Clos et signé').waitFor();
  await capturer(tel, '16-formateur-clos');
  await clotureALaSalle;
  verifier(await tel.getByText('Noah Petit').count() === 1, 'Noah, qui n’a pas signé, est noté absent');
  await telNoah.getByText('Une absence').waitFor({ timeout: 15_000 });
  await capturer(telNoah, '16b-apprenant-absence');
  verifier(await telNoah.getByText(/Matin · appel clos à 9\sh\s0\d par Awa Diallo/).count() === 1, 'l’appel clos, le téléphone de Noah dit « Une absence », et qui a clos');
  verifier(await telNoah.locator('.case.absent').count() === 1, 'sa semaine le montre : une case rouge, mardi matin');

  verifier(
    (await tel.getByText('Prochain cours : mardi 17, après-midi').count()) === 1 && (await tel.getByText(/part à la classe dans \d+\ss/).count()) === 1,
    'à la clôture, l’app propose le prochain cours, la demi-journée suivante, qui part avec la feuille',
  );
  verifier(await telLea.getByText(/Prochain appel/).count() === 0, 'tant que la clôture peut s’annuler, le prochain cours n’est pas parti');
  await telLea.getByText('Prochain appel : mar. 17 nov., 13 h 30').waitFor({ timeout: 45_000 });

  // Un prochain cours part à toute la classe et remplace le précédent : trente secondes pour annuler.
  const etiquetteDuFil = coeur.etiquette_du_fil(classeDeYanis.fil);
  const surLeFil = () => secours.gardes.filter((e) => e.tags.some(([t, v]) => t === 'x' && v === etiquetteDuFil)).length;
  const avantLesChangements = surLeFil();
  await tel.click('[data-geste="changerProchain"]');
  await tel.check('input[value="2026-11-18 matin"]');
  await tel.click('[data-geste="annoncerProchain"]');
  await tel.click('[data-geste="annulerProchain"]');
  verifier(
    (await tel.getByText('Prochain cours : mardi 17, après-midi').count()) === 1 && (await tel.getByText('les apprenants le voient').count()) === 1,
    '« Annuler » pendant les trente secondes : le prochain cours reste celui d’avant',
  );
  await tel.click('[data-geste="changerProchain"]');
  await tel.check('input[value="2026-11-23 matin"]');
  await capturer(tel, '16c-formateur-prochain');
  await tel.click('[data-geste="annoncerProchain"]');
  verifier(
    (await tel.getByText('Prochain cours : lundi 23, matin').count()) === 1 && (await tel.locator('[data-geste="annulerProchain"]').count()) === 1,
    '« Changer » : Awa choisit lundi 23 au matin, qui part dans trente secondes, avec « Annuler »',
  );
  await capturer(tel, '16e-formateur-prochain-part');
  await telLea.getByText('Prochain appel : lun. 23 nov., 9 h').waitFor({ timeout: 45_000 });
  verifier(surLeFil() === avantLesChangements + 1, `un seul prochain cours est parti, celui de lundi : l’annulé n’a rien envoyé (${surLeFil() - avantLesChangements})`);

  // Yanis écrit à Awa comme un responsable, une lettre signée de sa clé : un autre prochain cours.
  const parYanisLettre = coeur.Appareil.relire(clesDeYanis).ecrire_aux_responsables(
    code,
    JSON.stringify({ v: 1, t: 'classe', etat: { porte: classeDeYanis.porte, passations: [], membres: [], demandes: [], dehors: [], cours: [], prochain: { date: '2026-12-25', demi: 'matin', quand: horloge() + 1e9 } } }),
    horloge(),
  );
  await publierAuSecours(
    coeur.etiquette_de_boite(boiteDAwa),
    coeur.sceller(boiteDAwa, JSON.stringify({ v: 1, t: 'responsables', code, porte: classeDeYanis.porte, passations: [], lettre: parYanisLettre })),
  );
  await tel.waitForTimeout(1500);
  verifier(await tel.getByText('Prochain cours : lundi 23, matin').count() === 1, 'une lettre entre responsables signée par un apprenant ne compte pas');
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
  await telInes.waitForFunction(() => JSON.parse(localStorage.getItem('opl_proto_ines_classes'))[0].presences?.some((p) => p.recu), null, { timeout: 20_000 });
  await telInes.getByText('En règle').waitFor({ timeout: 15_000 });
  verifier((await telInes.locator('.case.faite').count()) === 1, 'le réseau revenu, Inès reçoit la réponse : sa présence est signée, et elle est en règle');
  await telInes.waitForFunction(() => localStorage.getItem('opl_proto_ines_envois') === '[]', null, { timeout: 15_000 });
  const partis = enAttente.map((e) => JSON.parse(e).id).filter((id) => secours.gardes.some((e) => e.id === id));
  verifier(partis.length === 2, 'la présence gardée part d’elle-même au retour du réseau, rechargement compris');

  const garde = JSON.parse(await tel.evaluate(() => localStorage.getItem('opl_proto_awa-tel_appels')))[code];
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
  const enClair = ['Awa Diallo', 'Léa Martin', 'Yanis Haddad', 'Inès Roux', 'Noah Petit', 'Kevin Intrus', 'Julien Morel', 'BTS SIO 2', 'Centre Exemple'].filter((n) => surLesRelais.includes(n));
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

  // Awa passe la main à Julien : trente secondes pour annuler, puis la passation signée part, et
  // Julien publie la porte où il est chef.
  await tel.emulateMedia({ colorScheme: 'light' });
  await tel.click('[data-geste="classe"]');
  await tel.click('[data-geste="passer"]');
  await tel.click('[data-geste="passerLaMain"]');
  await tel.click('[data-geste="annulerPassation"]');
  const passationGardee = () => tel.evaluate(() => JSON.parse(localStorage.getItem('opl_proto_awa-tel_classes'))[0].passationEnAttente);
  verifier(
    (await passationGardee()) === undefined && (await tel.locator('[data-geste="passer"]').count()) === 1,
    '« Annuler » pendant les trente secondes : Awa reste chef, et rien n’attend de partir',
  );
  await tel.click('[data-geste="passer"]');
  await capturer(tel, '17b-formateur-passer');
  await tel.click('[data-geste="passerLaMain"]');
  const decompte = Number((await tel.getByText(/devient chef dans \d+\ss/).textContent()).match(/dans (\d+)/)[1]);
  verifier(
    decompte >= 25 && (await tel.locator('[data-geste="annulerPassation"]').count()) === 1,
    `passer la main attend trente secondes, avec « Annuler » (${decompte} s)`,
  );
  await capturer(tel, '17c-formateur-passation-attend');
  await telJulien.click('[data-geste="classe"]');
  await telJulien.locator('[data-geste="nommer"]').waitFor({ timeout: 60_000 });
  await capturer(telJulien, '17d-julien-chef');
  verifier(
    (await telJulien.locator('[data-geste="passer"]').count()) === 1 && (await telJulien.getByText('formateur · chef').count()) === 1,
    'Julien est chef : « Nommer un adjoint » et « Passer la main » sont chez lui',
  );
  await tel.locator('[data-geste="nommer"]').waitFor({ state: 'detached', timeout: 15_000 });
  verifier(
    (await tel.locator('[data-geste="passer"]').count()) === 0 &&
      (await tel.locator('[data-geste="reglages"]').count()) === 0 &&
      (await tel.getByText('formateur · adjoint').count()) === 1,
    'Awa est adjoint : les gestes du chef, réglages compris, ont quitté son écran',
  );
  const chefChezLea = async () =>
    coeur.lire_porte(code, JSON.parse(await telLea.evaluate(() => localStorage.getItem('opl_proto_lea_classes')))[0].porte).responsables[0].prenom;
  for (let i = 0; i < 30 && (await chefChezLea()) !== 'Julien'; i++) await telLea.waitForTimeout(1000);
  verifier((await chefChezLea()) === 'Julien', 'le téléphone de Léa suit la passation : sa porte est celle de Julien');
  await telJulien.click('[data-geste="retour"]');
  await tel.click('[data-geste="retour"]');

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

  verifier(await telLea.getByText('Garde Opn-Link sur ton écran d’accueil').count() === 0, 'le retour au centre dans quatre jours : l’écran d’accueil ne se redemande pas');

  // Awa repousse le prochain cours au lundi 30 : plus de sept jours sans cours pour Léa.
  await tel.click('[data-geste="changerProchain"]');
  await tel.check('input[value="2026-11-30 matin"]');
  await tel.click('[data-geste="annoncerProchain"]');
  await telLea.getByText('Ton prochain cours est le lun. 30 nov. : d’ici là').waitFor({ timeout: 45_000 });
  await capturer(telLea, '20b-apprenant-accueil-redemande');
  verifier(true, 'plus de sept jours sans cours : l’app redemande l’écran d’accueil, avec la raison');
  await telLea.click('[data-geste="plusTard"]');
  await telLea.reload();
  await telLea.getByText('Retour au centre : lun. 30 nov., 9 h').waitFor({ timeout: 15_000 });
  verifier(await telLea.getByText('Garde Opn-Link sur ton écran d’accueil').count() === 0, '« Plus tard », et la demande ne revient plus : une seule fois');

  // Julien, chef, avance le matin à 8 h 30. Trente secondes pour annuler, puis la porte part.
  await telJulien.click('[data-geste="classe"]');
  await telJulien.click('[data-geste="reglages"]');
  await telJulien.click('[data-geste="horaires"]');
  await telJulien.fill('#matin-debut', 'neuf heures');
  await telJulien.click('[data-geste="enregistrerHoraires"]');
  verifier(await telJulien.locator('#erreur-horaires').count() === 1, 'une heure illisible est refusée sous les horaires, comme à la création');
  await capturer(telJulien, '20c-julien-horaires');
  await telJulien.fill('#matin-debut', '8h30');
  await telJulien.click('[data-geste="enregistrerHoraires"]');
  const delaiDesHoraires = Number((await telJulien.getByText(/8\sh\s30 à 12\sh\s30 · 13\sh\s30 à 17\sh · dans \d+\ss/).textContent()).match(/dans (\d+)/)[1]);
  verifier(delaiDesHoraires >= 25 && (await telJulien.locator('[data-geste="annulerHoraires"]').count()) === 1, `les horaires attendent trente secondes, avec « Annuler » (${delaiDesHoraires} s)`);
  await capturer(telJulien, '20d-julien-reglages');
  await telLea.getByText('Retour au centre : lun. 30 nov., 8 h 30').waitFor({ timeout: 60_000 });
  verifier(true, 'le téléphone de Léa suit les nouveaux horaires : « Retour au centre : lun. 30 nov., 8 h 30 »');

  // Léa corrige son nom depuis « Moi » : trente secondes pour annuler, puis la correction signée part.
  await telLea.click('[data-geste="moi"]');
  await capturer(telLea, '20e-apprenant-moi');
  await telLea.click('[data-geste="corrigerNom"]');
  await telLea.fill('#nom', 'Martin-Dupont');
  await telLea.click('[data-geste="corriger"]');
  const delaiDuNom = Number((await telLea.getByText(/part aux responsables dans \d+\ss/).textContent()).match(/dans (\d+)/)[1]);
  verifier(delaiDuNom >= 25 && (await telLea.locator('[data-geste="annulerNom"]').count()) === 1, `le nom corrigé attend trente secondes, avec « Annuler » (${delaiDuNom} s)`);
  await capturer(telLea, '20f-apprenant-nom-part');
  await telJulien.click('[data-geste="retour"]');
  await telJulien.getByText('Léa Martin-Dupont').waitFor({ timeout: 60_000 });
  verifier(await telJulien.getByText(/avant : Léa Martin ·/).count() === 1, 'chez Julien, le nouveau nom de Léa, et l’ancien à côté');
  await capturer(telJulien, '20g-julien-membres-nom');

  // Le thème choisi dans « Moi » s'applique tout de suite, et reste au rechargement.
  await telLea.check('input[name="theme"][value="sombre"]');
  verifier(await telLea.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'le thème « Sombre », choisi dans « Moi », s’applique tout de suite');
  await telLea.reload();
  await telLea.locator('.semaine').waitFor({ timeout: 15_000 });
  verifier(await telLea.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'et il reste au rechargement');
  await telLea.click('[data-geste="moi"]');
  await telLea.check('input[name="theme"][value="telephone"]');
  await telLea.click('[data-geste="retour"]');

  // Le texte agrandi à 200 %, à 360 pixels : la semaine passe en rangs, et rien ne sort de l'écran.
  await pages.lea.contexte.addInitScript(() => document.addEventListener('DOMContentLoaded', () => (document.documentElement.style.fontSize = '200%')));
  await telLea.setViewportSize({ width: 360, height: 640 });
  await telLea.reload();
  await telLea.locator('.semaine.en-rangs').waitFor({ timeout: 15_000 });
  await capturer(telLea, '21-apprenant-texte-200');
  verifier(await telLea.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'le texte agrandi à 200 %, la semaine se lit en rangs, et rien ne sort de l’écran');

  // Plusieurs classes. Jeudi, Awa crée BTS SIO 1 depuis « Mes cours », et Inès la rejoint : elle
  // suit deux classes. L'appel ouvert dans l'une montre cette classe, même si l'autre était à l'écran.
  const jeudiPlusTard = new Date(horloge());
  for (const nom of ['awa-tel', 'awa-ordi', 'ines']) await pages[nom].contexte.clock.setSystemTime(jeudiPlusTard);
  await tel.reload();
  await tel.click('[data-geste="mesCours"]');
  verifier(
    (await tel.locator('[data-geste="choisir"]').count()) === 1 && (await tel.getByText(/lun\. 30 nov\., 8\sh\s30 · Centre Exemple/).count()) === 1,
    '« Mes cours » liste la classe, avec l’heure de son prochain cours',
  );
  await tel.click('[data-geste="creer"]');
  await tel.click('[data-geste="retour"]');
  verifier((await tel.locator('[data-geste="choisir"]').count()) === 1, '« Créer une classe » a son « Retour », qui ne crée rien');
  await tel.click('[data-geste="creer"]');
  await tel.fill('#classe', 'BTS SIO 1');
  await tel.fill('#centre', 'Centre Exemple');
  await tel.click('[data-geste="creer"]');
  await tel.getByText('Inviter des apprenants').waitFor();
  verifier((await tel.locator('h2', { hasText: 'BTS SIO 1' }).count()) === 1, 'la classe créée s’ouvre : BTS SIO 1, sans personne');
  await tel.click('[data-geste="inviter"]');
  await tel.click('[data-geste="montrer"]');
  await salle.getByText('Rejoindre · BTS SIO 1').waitFor({ timeout: 15_000 });
  verifier(true, 'la salle montre la classe que le téléphone lui montre : BTS SIO 1, et pas BTS SIO 2');
  const ancreSio1 = (await salle.locator('[data-lien]').getAttribute('data-lien')).split('#')[1];
  const codeSio1 = await salle.locator('[data-code]').getAttribute('data-code');

  // Le seul relais qui a la porte répond sept secondes après l'autre, qui n'a rien : la recherche
  // l'attend, au lieu de conclure « Aucune classe n'a ce code ».
  reseauDeNadia.retarderLeSecours(7000);
  const telNadia = await appareil('nadia', TEL, { url: `/index.html#${ancreSio1}`, liste: reseauDeNadia.liste });
  await telNadia.locator('#prenom').waitFor({ timeout: 25_000 });
  verifier(true, 'le seul relais qui a la porte répond sept secondes après l’autre : la recherche l’attend, et la classe s’affiche');

  // Le téléphone d'Inès tourne depuis des minutes, avec un relais mort dans sa liste : Chromium
  // retarde ses nouvelles connexions, et la recherche peut dépasser les quinze secondes de rejoindre().
  await telInes.goto('about:blank');
  await telInes.goto(`${site}/index.html?appareil=ines#${ancreSio1}`);
  await telInes.locator('#prenom').waitFor({ timeout: 25_000 });
  await rejoindre(telInes, 'Inès', 'Roux');
  await capturer(telInes, '22-apprenant-deuxieme-classe');
  verifier((await telInes.locator('header.barre [data-geste="mesClasses"]').innerText()) === 'Mes classes', 'Inès demande à entrer en BTS SIO 1 : « Mes classes » est dans la barre, pour revenir à BTS SIO 2');
  await tel.click('[data-geste="retour"]');
  await tel.locator('[data-geste="accepter"]').waitFor({ timeout: 15_000 });
  await tel.click('[data-geste="accepter"]');
  await tel.click('[data-geste="valider"]');
  await telInes.getByText('Pas d’appel ouvert').waitFor({ timeout: 15_000 });
  await capturer(telInes, '23-apprenant-deux-classes');
  verifier((await telInes.locator('header.barre [data-geste="mesClasses"]').innerText()) === 'BTS SIO 1', 'acceptée, Inès voit BTS SIO 1, et le nom de la classe dans la barre');
  await telInes.click('[data-geste="mesClasses"]');
  const lignesDInes = (await telInes.locator('[data-geste="choisir"]').allInnerTexts()).map((l) => l.replace(/\s+/g, ' ').trim());
  await capturer(telInes, '24-apprenant-mes-classes');
  verifier(
    lignesDInes.length === 2 && /^BTS SIO 2 lun\. 30 nov\., 8 h 30 · Centre Exemple/.test(lignesDInes[0]) && lignesDInes[1].startsWith('BTS SIO 1') && (await telInes.locator('.rangee.ici').innerText()).startsWith('BTS SIO 1'),
    `« Mes classes » range les classes par leur prochain cours, et marque celle de l’écran (${lignesDInes.join(' | ')})`,
  );
  await telInes.click('[data-geste="choisir"]:not(.ici)');
  await telInes.locator('header.barre.pas-maintenant', { hasText: 'En entreprise' }).waitFor();
  verifier((await telInes.locator('header.barre [data-geste="mesClasses"]').innerText()) === 'BTS SIO 2', 'Inès passe à BTS SIO 2 : en entreprise jusqu’au lundi 30');

  const avantLAppelDeSio1 = Math.floor(horloge() / 1000);
  await tel.click('[data-geste="lancer"]');
  await salle.getByText('Appel · BTS SIO 1').waitFor({ timeout: 15_000 });
  await capturer(salle, '25-salle-appel-autre-classe');
  verifier(true, 'la salle montre l’appel de BTS SIO 1');
  await sansNom(salle, 'pendant l’appel de BTS SIO 1');
  await telInes.getByText('L’appel est ouvert').waitFor({ timeout: 15_000 });
  await capturer(telInes, '26-apprenant-appel-autre-classe');
  verifier((await telInes.locator('header.barre [data-geste="mesClasses"]').innerText()) === 'BTS SIO 1', 'l’appel s’ouvre en BTS SIO 1 : le téléphone d’Inès, qui montrait BTS SIO 2, montre BTS SIO 1');
  await telInes.click('[data-geste="signer"]');
  await taper(telInes, await codeDeLAppel());
  await telInes.getByText('Présence signée').waitFor({ timeout: 15_000 });
  await tel.getByText('1 sur 1').first().waitFor({ timeout: 15_000 });
  verifier(true, 'Inès signe en BTS SIO 1, et Awa la voit : 1 sur 1');
  const ines = coeur.Appareil.relire(JSON.parse(await telInes.evaluate(() => localStorage.getItem('opl_proto_ines_cles'))));
  const boiteDInes = coeur.etiquette_de_boite(ines.boite());
  await telInes.waitForTimeout(1500);
  const refusAInes = [...principal.gardes, ...secours.gardes]
    .filter((e) => e.created_at >= avantLAppelDeSio1 && e.tags.some(([t, v]) => t === 'x' && v === boiteDInes))
    .flatMap((e) => {
      try {
        return [JSON.parse(ines.ouvrir(e.content))];
      } catch {
        return [];
      }
    })
    .filter((l) => l.t === 'refus');
  verifier(refusAInes.length === 0, `l’appel clos de BTS SIO 2, chez Awa, ne répond pas « appel clos » à la présence d’Inès en BTS SIO 1 (${refusAInes.length} refus)`);

  await tel.click('[data-geste="mesCours"]');
  const lignesDAwa = (await tel.locator('[data-geste="choisir"]').allInnerTexts()).map((l) => l.replace(/\s+/g, ' ').trim());
  await capturer(tel, '27-formateur-mes-cours');
  verifier(
    lignesDAwa.length === 2 && lignesDAwa[0] === 'BTS SIO 1 maintenant · Centre Exemple' && lignesDAwa[1].startsWith('BTS SIO 2 lun. 30 nov.'),
    `« Mes cours » met d’abord la classe de l’appel ouvert, « maintenant » (${lignesDAwa.join(' | ')})`,
  );
  await tel.click('[data-geste="choisir"]:not(.ici)');
  await tel.getByText('Lancer l’appel').waitFor();
  await tel.reload();
  await tel.getByText('1 sur 1').first().waitFor({ timeout: 15_000 });
  verifier(true, 'rouverte, l’app d’Awa revient à la classe du moment : l’appel ouvert de BTS SIO 1');
  const secretsDAwa = await tel.evaluate(() => JSON.parse(localStorage.getItem('opl_proto_awa-tel_classes')).map((c) => c.secrets?.split('\n')[0]));
  verifier(secretsDAwa.length === 2 && secretsDAwa.every((s) => s === 'opn-link·secrets·v1'), 'chaque classe garde ses secrets : le téléphone ne les tire plus du code à chaque ouverture');
  verifier(coeur.etiquette_de_classe(codeSio1) !== etiquetteDeLaClasse, 'les deux classes ont chacune leur étiquette sur les relais');

  // Léa rouvre le lien du QR de sa classe : elle y est déjà, et rien ne lui redemande d'entrer.
  await telLea.goto('about:blank');
  await telLea.goto(`${site}/index.html?appareil=lea#${ancre}`);
  await telLea.locator('.semaine').waitFor({ timeout: 15_000 });
  verifier(
    (await telLea.locator('#prenom').count()) === 0 && !!JSON.parse(await telLea.evaluate(() => localStorage.getItem('opl_proto_lea_classes')))[0].acceptation,
    'Léa rouvre le lien de sa classe : la classe s’ouvre, et son acceptation reste',
  );

  // Dix classes au plus : Sandrine Robert, au centre, en tient dix, puis essaie d'en créer une
  // onzième et d'en rejoindre une autre.
  const sandrine = new coeur.Appareil();
  const ligneDeSandrine = ['Sandrine', 'Robert', 'centre', sandrine.cle(), sandrine.boite()].join('\t');
  const dixClasses = Array.from({ length: 10 }, (_, n) => {
    const c = coeur.nouveau_code_de_classe().replace(/\s/g, '').toLowerCase();
    const porte = coeur.signer_porte(c, `Titre pro ${n + 1}`, 'Centre Exemple', '9:00-12:30', '13:30-17:00', ligneDeSandrine, sandrine, horloge());
    return { code: c, role: 'chef', porte, fil: coeur.nouveau_secret_du_fil(), membres: [], demandes: [], dehors: [], portePubliee: horloge() };
  });
  const telSandrine = await appareil('sandrine', TEL, { cles: sandrine.secrets(), stockage: { moi: { prenom: 'Sandrine', nom: 'Robert' }, classes: dixClasses } });
  await telSandrine.click('[data-geste="mesCours"]');
  await capturer(telSandrine, '28-centre-dix-classes');
  verifier(
    (await telSandrine.locator('[data-geste="choisir"]').count()) === 10 &&
      (await telSandrine.locator('[data-geste="creer"]').count()) === 0 &&
      (await telSandrine.getByText('Dix classes au plus sur ce téléphone.').count()) === 1,
    '« Mes cours » liste les dix classes, sans « Créer une classe »',
  );
  await telSandrine.goto('about:blank');
  await telSandrine.goto(`${site}/index.html?appareil=sandrine#creer`);
  await telSandrine.getByText('Dix classes au plus').first().waitFor();
  await capturer(telSandrine, '29-centre-onzieme-classe');
  verifier((await telSandrine.locator('#classe').count()) === 0, 'une onzième classe ne se crée pas : l’écran dit pourquoi');
  await telSandrine.goto('about:blank');
  await telSandrine.goto(`${site}/index.html?appareil=sandrine#${ancre}`);
  await telSandrine.getByText('Dix classes au plus').first().waitFor();
  verifier((await telSandrine.locator('#prenom').count()) === 0, 'ni ne se rejoint par son lien');
  await telSandrine.click('[data-geste="retour"]');
  await telSandrine.click('[data-geste="mesCours"]');
  await telSandrine.setViewportSize({ width: 360, height: 640 });
  await telSandrine.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  await capturer(telSandrine, '30-centre-mes-cours-200');
  verifier(await telSandrine.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '« Mes cours », le texte agrandi à 200 %, à 360 pixels : rien ne sort de l’écran');
  await telSandrine.evaluate(() => (document.documentElement.style.fontSize = ''));
  await telSandrine.setViewportSize(TEL.viewport);
  // L'horloge de la page est simulée : le temps se mesure ici.
  const ouvrir = async () => {
    const depart = Date.now();
    await telSandrine.reload();
    await telSandrine.locator('.barre-titre').first().waitFor();
    return Date.now() - depart;
  };
  const avecSecrets = await ouvrir();
  await telSandrine.evaluate(() => {
    const cle = 'opl_proto_sandrine_classes';
    localStorage.setItem(cle, JSON.stringify(JSON.parse(localStorage.getItem(cle)).map(({ secrets, ...reste }) => reste)));
  });
  const sansSecrets = await ouvrir();
  verifier(
    avecSecrets < sansSecrets - 700,
    `les dix classes s’ouvrent sans tirer leurs secrets du code : ${Math.round(avecSecrets)} ms avec les secrets gardés, ${Math.round(sansSecrets)} ms sans`,
  );

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
  await reseauDeNadia.fermer();
  for (const r of [principal, ferme, secours, mort]) await r.fermer();
  serveur.close();
}

if (echecs.length) {
  console.error(`\n${echecs.length} échec(s) :\n${echecs.join('\n')}`);
  process.exitCode = 1;
}
