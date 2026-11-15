import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';
import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure';
import { createHash, randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

setGlobalDispatcher(new EnvHttpProxyAgent());

const SERVEURS = [
  'https://blossom.primal.net',
  'https://cdn.nostrcheck.me',
  'https://cdn.satellite.earth',
  'https://blossom.band',
];
const ORIGINE = 'https://opn-link.github.io';
const TAILLES = [600_000, 2_000_000];

const maintenant = () => Math.floor(Date.now() / 1000);
const sha256 = (octets) => createHash('sha256').update(octets).digest('hex');

// L'autorisation Blossom (BUD-01) : un événement Nostr de kind 24242, signé d'une clé jetable.
function autorisation(cle, verbe, empreinte) {
  const ev = finalizeEvent(
    {
      kind: 24242,
      created_at: maintenant(),
      tags: [['t', verbe], ['x', empreinte], ['expiration', String(maintenant() + 300)]],
      content: `${verbe} opn-link mesure`,
    },
    cle,
  );
  return `Nostr ${Buffer.from(JSON.stringify(ev)).toString('base64')}`;
}

const cors = (r) => ({
  origine: r.headers.get('access-control-allow-origin'),
  methodes: r.headers.get('access-control-allow-methods'),
  entetes: r.headers.get('access-control-allow-headers'),
});

async function essai(base, cle, taille) {
  const corps = randomBytes(taille);
  const empreinte = sha256(corps);
  const r = { octets: taille };
  try {
    const debut = Date.now();
    const depot = await fetch(`${base}/upload`, {
      method: 'PUT',
      headers: {
        Origin: ORIGINE,
        Authorization: autorisation(cle, 'upload', empreinte),
        'Content-Type': 'application/octet-stream',
        'X-SHA-256': empreinte,
      },
      body: corps,
      signal: AbortSignal.timeout(60_000),
    });
    const texte = await depot.text();
    r.depot = { statut: depot.status, ms: Date.now() - debut, raison: depot.headers.get('x-reason'), ...cors(depot) };
    if (!depot.ok) {
      r.depot.reponse = texte.slice(0, 160);
      return r;
    }
    const descripteur = JSON.parse(texte);
    const lecture = await fetch(descripteur.url ?? `${base}/${empreinte}`, {
      headers: { Origin: ORIGINE },
      signal: AbortSignal.timeout(60_000),
    });
    const relu = Buffer.from(await lecture.arrayBuffer());
    r.lecture = { statut: lecture.status, identique: sha256(relu) === empreinte, ...cors(lecture) };
    const suppression = await fetch(`${base}/${empreinte}`, {
      method: 'DELETE',
      headers: { Origin: ORIGINE, Authorization: autorisation(cle, 'delete', empreinte) },
      signal: AbortSignal.timeout(30_000),
    });
    r.suppression = { statut: suppression.status };
  } catch (e) {
    r.erreur = e.message;
  }
  return r;
}

async function sonder(base) {
  const resultat = { serveur: base };
  try {
    const pre = await fetch(`${base}/upload`, {
      method: 'OPTIONS',
      headers: {
        Origin: ORIGINE,
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'authorization,content-type,x-sha-256',
      },
      signal: AbortSignal.timeout(15_000),
    });
    resultat.preflight = { statut: pre.status, ...cors(pre) };
  } catch (e) {
    resultat.preflight = { erreur: e.message };
  }
  const cle = generateSecretKey();
  resultat.essais = [];
  for (const taille of TAILLES) resultat.essais.push(await essai(base, cle, taille));
  return resultat;
}

const resultats = await Promise.all(SERVEURS.map(sonder));
const jour = new Date().toISOString().slice(0, 10);
writeFileSync(new URL(`./resultats/fichiers-${jour}.json`, import.meta.url), JSON.stringify(resultats, null, 2));
for (const r of resultats) console.log(JSON.stringify(r));
