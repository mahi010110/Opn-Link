import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure';
import { createHash, randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { KIND, connexion, etiquette, maintenant } from './relais.mjs';

const RELAIS = ['nostr-relay.corb.net', 'nostr.sathoarder.com', 'nos.lol', 'nostr.data.haus'];
const FICHIER = 1_000_000;
// 45 000 octets donnent 60 000 caractères en base64 : sous la limite de 64 Ko des relais strfry.
const MORCEAU = 45_000;

const sha256 = (octets) => createHash('sha256').update(octets).digest('hex');

function morceaux(fichier) {
  const liste = [];
  for (let debut = 0; debut < fichier.length; debut += MORCEAU) liste.push(fichier.subarray(debut, debut + MORCEAU));
  return liste;
}

async function sonder(hote) {
  const fichier = randomBytes(FICHIER);
  const parts = morceaux(fichier);
  const tag = etiquette();
  const cle = generateSecretKey();
  const resultat = { hote, morceaux: parts.length };
  try {
    const a = await connexion(hote);
    const debut = Date.now();
    const reponses = [];
    for (const [i, part] of parts.entries()) {
      const ev = finalizeEvent(
        {
          kind: KIND,
          created_at: maintenant(),
          tags: [['x', tag], ['i', String(i)], ['expiration', String(maintenant() + 600)]],
          content: part.toString('base64'),
        },
        cle,
      );
      reponses.push(await a.publier(ev));
    }
    resultat.envoi = {
      acceptes: reponses.filter((r) => r.ok).length,
      ms: Date.now() - debut,
      refus: [...new Set(reponses.filter((r) => !r.ok).map((r) => r.message))],
    };
    a.ws.close();

    const b = await connexion(hote);
    const debutLecture = Date.now();
    const lu = await b.lire({ kinds: [KIND], '#x': [tag], limit: 100 });
    b.ws.close();
    const recolle = Buffer.concat(
      lu.recus
        .map((ev) => ({ i: Number(ev.tags.find((t) => t[0] === 'i')?.[1]), octets: Buffer.from(ev.content, 'base64') }))
        .sort((x, y) => x.i - y.i)
        .map((m) => m.octets),
    );
    resultat.lecture = {
      recus: lu.recus.length,
      ms: Date.now() - debutLecture,
      identique: sha256(recolle) === sha256(fichier),
    };
  } catch (e) {
    resultat.erreur = e.message;
  }
  return resultat;
}

const resultats = await Promise.all(RELAIS.map(sonder));
const jour = new Date().toISOString().slice(0, 10);
writeFileSync(new URL(`./resultats/morceaux-${jour}.json`, import.meta.url), JSON.stringify(resultats, null, 2));
for (const r of resultats) console.log(JSON.stringify(r));
