import WebSocket from 'ws';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';
import { finalizeEvent } from 'nostr-tools/pure';
import { randomBytes } from 'node:crypto';

setGlobalDispatcher(new EnvHttpProxyAgent());
const agent = process.env.HTTPS_PROXY ? new HttpsProxyAgent(process.env.HTTPS_PROXY) : undefined;

export const RELAIS = [
  'nostr-relay.corb.net',
  'nostr.sathoarder.com',
  'nos.lol',
  'bucket.coracle.social',
  'relay.froth.zone',
  'nostr-01.yakihonne.com',
  'nostr.data.haus',
];
// Le kind de la boîte aux lettres d'OpenContact (CONTRAT.md, OCB1).
export const KIND = 8571;
const ATTENTE_MS = 8_000;

export const maintenant = () => Math.floor(Date.now() / 1000);
export const texte = (n) => randomBytes(Math.ceil((n * 3) / 4)).toString('base64').slice(0, n);
export const etiquette = () => `opn-mesure-${randomBytes(8).toString('hex')}`;

export function evenement(cle, tag, contenu) {
  return finalizeEvent(
    { kind: KIND, created_at: maintenant(), tags: [['x', tag], ['expiration', String(maintenant() + 600)]], content: contenu },
    cle,
  );
}

export function connexion(hote) {
  return new Promise((resolve, reject) => {
    const debut = Date.now();
    const ws = new WebSocket(`wss://${hote}`, { agent, handshakeTimeout: ATTENTE_MS });
    const attentes = new Map();
    const notices = [];
    ws.on('message', (donnees) => {
      let m;
      try { m = JSON.parse(donnees.toString()); } catch { return; }
      const [type, a, b, c] = m;
      if (type === 'OK') attentes.get(`ok:${a}`)?.({ ok: b === true, message: c ?? '' });
      else if (type === 'EVENT') attentes.get(`ev:${a}`)?.(b);
      else if (type === 'EOSE') attentes.get(`eose:${a}`)?.({ eose: true });
      else if (type === 'CLOSED') attentes.get(`eose:${a}`)?.({ eose: false, message: b });
      else if (type === 'NOTICE') notices.push(String(a));
    });
    const attendre = (cle, ms = ATTENTE_MS) =>
      new Promise((ok) => {
        const minuteur = setTimeout(() => { attentes.delete(cle); ok(null); }, ms);
        attentes.set(cle, (v) => { clearTimeout(minuteur); attentes.delete(cle); ok(v); });
      });
    const publier = async (ev) => {
      const reponse = attendre(`ok:${ev.id}`);
      ws.send(JSON.stringify(['EVENT', ev]));
      return (await reponse) ?? { ok: false, message: 'pas de réponse' };
    };
    const lire = async (filtre) => {
      const id = randomBytes(4).toString('hex');
      const recus = [];
      attentes.set(`ev:${id}`, (ev) => recus.push(ev));
      const fin = attendre(`eose:${id}`);
      ws.send(JSON.stringify(['REQ', id, filtre]));
      const r = (await fin) ?? { eose: false, message: 'pas de EOSE' };
      attentes.delete(`ev:${id}`);
      ws.send(JSON.stringify(['CLOSE', id]));
      return { ...r, recus };
    };
    ws.once('open', () => resolve({ ws, ms: Date.now() - debut, publier, lire, notices }));
    ws.once('error', (e) => reject(e));
    ws.once('unexpected-response', (_req, res) => reject(new Error(`HTTP ${res.statusCode}`)));
  });
}

