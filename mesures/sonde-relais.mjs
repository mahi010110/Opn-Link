import { generateSecretKey } from 'nostr-tools/pure';
import { writeFileSync } from 'node:fs';
import { KIND, RELAIS, connexion, etiquette, evenement, texte } from './relais.mjs';

const TAILLES = [8_000, 32_000, 60_000, 100_000, 200_000];
const RAFALE = 20;
const CLASSE = 30;

async function json(url, entetes = {}) {
  const r = await fetch(url, { headers: entetes, signal: AbortSignal.timeout(15_000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function pays(hote) {
  try {
    const dns = await json(`https://stat.ripe.net/data/dns-chain/data.json?resource=${hote}`);
    const noms = Object.values(dns.data?.forward_nodes ?? {}).flat();
    const ip = noms.find((x) => /^\d+\.\d+\.\d+\.\d+$/.test(x)) ?? noms.find((x) => x.includes(':'));
    if (!ip) return { ip: null, pays: null };
    const geo = await json(`https://stat.ripe.net/data/maxmind-geo-lite/data.json?resource=${ip}`);
    const lieu = geo.data?.located_resources?.[0]?.locations?.[0] ?? {};
    return { ip, pays: lieu.country ?? null, ville: lieu.city ?? null };
  } catch (e) {
    return { erreur: e.message };
  }
}

async function nip11(hote) {
  try {
    const info = await json(`https://${hote}`, { Accept: 'application/nostr+json' });
    return {
      logiciel: info.software ?? null,
      version: info.version ?? null,
      limites: info.limitation ?? null,
      retention: info.retention ?? null,
      pays_annonces: info.relay_countries ?? null,
    };
  } catch (e) {
    return { erreur: e.message };
  }
}

async function sonder(hote) {
  const resultat = { hote, nip11: await nip11(hote), lieu: await pays(hote) };
  const cle = generateSecretKey();
  let a;
  try {
    a = await connexion(hote);
  } catch (e) {
    return { ...resultat, connexion: { ok: false, erreur: e.message } };
  }
  resultat.connexion = { ok: true, ms: a.ms };

  const tag = etiquette();
  const debut = Date.now();
  resultat.ecriture = { ...(await a.publier(evenement(cle, tag, texte(1_000)))), ms: Date.now() - debut };

  try {
    const b = await connexion(hote);
    const lu = await b.lire({ kinds: [KIND], '#x': [tag] });
    resultat.garde = { relu: lu.recus.length > 0, eose: lu.eose, message: lu.message ?? '' };
    b.ws.close();
  } catch (e) {
    resultat.garde = { relu: false, erreur: e.message };
  }

  resultat.notices = a.notices.slice(0, 5);
  a.ws.close();

  try {
    const c = await connexion(hote);
    const rafale = await Promise.all(
      Array.from({ length: RAFALE }, () => c.publier(evenement(cle, etiquette(), texte(200)))),
    );
    resultat.rafale = {
      envoyes: RAFALE,
      acceptes: rafale.filter((r) => r.ok).length,
      refus: [...new Set(rafale.filter((r) => !r.ok).map((r) => r.message))],
    };
    c.ws.close();
  } catch (e) {
    resultat.rafale = { envoyes: RAFALE, acceptes: 0, erreur: e.message };
  }

  // Un message trop gros fait fermer la connexion à certains relais : ce test passe en dernier,
  // et s'arrête au premier refus.
  resultat.tailles = [];
  try {
    const d = await connexion(hote);
    for (const n of TAILLES) {
      const r = await d.publier(evenement(cle, etiquette(), texte(n)));
      resultat.tailles.push({ octets: n, ok: r.ok, message: r.message });
      if (!r.ok) break;
    }
    d.ws.close();
  } catch (e) {
    resultat.tailles.push({ octets: 0, ok: false, message: e.message });
  }

  const connexions = await Promise.allSettled(Array.from({ length: CLASSE }, () => connexion(hote)));
  const ouvertes = connexions.filter((c) => c.status === 'fulfilled').map((c) => c.value);
  const presences = await Promise.all(
    ouvertes.map((c) => c.publier(evenement(generateSecretKey(), etiquette(), texte(300)))),
  );
  resultat.classe = {
    telephones: CLASSE,
    connectes: ouvertes.length,
    signatures_acceptees: presences.filter((r) => r.ok).length,
    erreurs: [...new Set(connexions.filter((c) => c.status === 'rejected').map((c) => c.reason?.message))],
    refus: [...new Set(presences.filter((r) => !r.ok).map((r) => r.message))],
  };
  ouvertes.forEach((c) => c.ws.close());
  return resultat;
}

const resultats = await Promise.all(RELAIS.map(sonder));
const jour = new Date().toISOString().slice(0, 10);
writeFileSync(new URL(`./resultats/relais-${jour}.json`, import.meta.url), JSON.stringify(resultats, null, 2));

for (const r of resultats) {
  const tailleMax = r.tailles?.filter((t) => t.ok).map((t) => t.octets).pop() ?? 0;
  console.log(
    [
      r.hote.padEnd(24),
      `pays ${r.lieu?.pays ?? '?'}`.padEnd(9),
      r.connexion.ok ? `ws ${r.connexion.ms} ms`.padEnd(10) : `ws KO ${r.connexion.erreur}`,
      r.ecriture ? `écrit ${r.ecriture.ok ? 'oui' : 'non'}` : '',
      r.garde ? `relu ${r.garde.relu ? 'oui' : 'non'}` : '',
      r.tailles ? `max ${tailleMax / 1000} Ko` : '',
      r.rafale ? `rafale ${r.rafale.acceptes}/${r.rafale.envoyes}` : '',
      r.classe ? `classe ${r.classe.connectes}/${r.classe.telephones} co, ${r.classe.signatures_acceptees} signés` : '',
    ].join('  '),
  );
}
