import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';
import { createHash, randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

setGlobalDispatcher(new EnvHttpProxyAgent());

const SERVEURS = [
  'https://a.pool.opentimestamps.org',
  'https://alice.btc.calendar.opentimestamps.org',
  'https://bob.btc.calendar.opentimestamps.org',
  'https://finney.calendar.eternitywall.com',
];
// L'adresse que le site d'Opn-Link aura : c'est elle que le navigateur annoncera.
const ORIGINE = 'https://opn-link.github.io';

const cors = (r) => ({
  origine: r.headers.get('access-control-allow-origin'),
  methodes: r.headers.get('access-control-allow-methods'),
  entetes: r.headers.get('access-control-allow-headers'),
});

async function sonder(base) {
  const resultat = { serveur: base };
  try {
    const pre = await fetch(`${base}/digest`, {
      method: 'OPTIONS',
      headers: { Origin: ORIGINE, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
      signal: AbortSignal.timeout(15_000),
    });
    resultat.preflight = { statut: pre.status, ...cors(pre) };
  } catch (e) {
    resultat.preflight = { erreur: e.message };
  }

  const empreinte = createHash('sha256').update(randomBytes(32)).digest();
  try {
    const debut = Date.now();
    const r = await fetch(`${base}/digest`, {
      method: 'POST',
      headers: { Origin: ORIGINE, Accept: 'application/vnd.opentimestamps.v1', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: empreinte,
      signal: AbortSignal.timeout(20_000),
    });
    const corps = Buffer.from(await r.arrayBuffer());
    resultat.depot = { statut: r.status, ms: Date.now() - debut, octets: corps.length, ...cors(r) };
  } catch (e) {
    resultat.depot = { erreur: e.message };
  }

  try {
    const r = await fetch(`${base}/timestamp/${empreinte.toString('hex')}`, {
      headers: { Origin: ORIGINE, Accept: 'application/vnd.opentimestamps.v1' },
      signal: AbortSignal.timeout(15_000),
    });
    const corps = await r.text();
    resultat.lecture = { statut: r.status, extrait: corps.slice(0, 80).replace(/[^\x20-\x7e]/g, '.'), ...cors(r) };
  } catch (e) {
    resultat.lecture = { erreur: e.message };
  }
  return resultat;
}

const resultats = await Promise.all(SERVEURS.map(sonder));
const jour = new Date().toISOString().slice(0, 10);
writeFileSync(new URL(`./resultats/horodatage-${jour}.json`, import.meta.url), JSON.stringify(resultats, null, 2));
for (const r of resultats) console.log(JSON.stringify(r));
