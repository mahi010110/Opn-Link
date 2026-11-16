// Un petit relais Nostr, pour que les appareils se parlent pendant les tests, sans dépendre
// des relais publics. Il vérifie chaque événement comme un vrai relais, garde ce qu'il reçoit
// jusqu'à son expiration (NIP-40), et sert les filtres dont Opn-Link a besoin.
//
// node outils/relais.mjs [port]  le lance seul ; sinon les tests appellent lancerRelais().

import { WebSocketServer } from 'ws';
import { verifyEvent } from 'nostr-tools/pure';
import { fileURLToPath } from 'node:url';

const expiration = (e) => Number(e.tags.find((t) => t[0] === 'expiration')?.[1] ?? Infinity);

const correspond = (filtre, e) =>
  (!filtre.ids || filtre.ids.includes(e.id)) &&
  (!filtre.kinds || filtre.kinds.includes(e.kind)) &&
  (!filtre.since || e.created_at >= filtre.since) &&
  (!filtre['#x'] || e.tags.some((t) => t[0] === 'x' && filtre['#x'].includes(t[1])));

export async function lancerRelais(port = 0) {
  const serveur = new WebSocketServer({ host: '127.0.0.1', port });
  await new Promise((ok) => serveur.on('listening', ok));
  const gardes = [];
  const abonnements = new Map();
  const refuses = [];

  serveur.on('connection', (ws) => {
    const siens = new Map();
    abonnements.set(ws, siens);
    ws.on('close', () => abonnements.delete(ws));
    ws.on('message', (brut) => {
      let message;
      try {
        message = JSON.parse(brut.toString());
      } catch {
        return ws.send(JSON.stringify(['NOTICE', 'JSON illisible']));
      }
      const [sorte, ...reste] = message;
      if (sorte === 'EVENT') {
        const [e] = reste;
        if (!verifyEvent(e)) {
          refuses.push(e);
          return ws.send(JSON.stringify(['OK', e?.id ?? '', false, 'invalid: signature']));
        }
        if (expiration(e) * 1000 < Date.now()) return ws.send(JSON.stringify(['OK', e.id, false, 'invalid: expiré']));
        if (!gardes.some((g) => g.id === e.id)) gardes.push(e);
        ws.send(JSON.stringify(['OK', e.id, true, '']));
        for (const [client, subs] of abonnements) {
          for (const [id, filtres] of subs) {
            if (filtres.some((f) => correspond(f, e))) client.send(JSON.stringify(['EVENT', id, e]));
          }
        }
      } else if (sorte === 'REQ') {
        const [id, ...filtres] = reste;
        siens.set(id, filtres);
        const maintenant = Date.now() / 1000;
        for (const e of gardes) {
          if (expiration(e) > maintenant && filtres.some((f) => correspond(f, e))) ws.send(JSON.stringify(['EVENT', id, e]));
        }
        ws.send(JSON.stringify(['EOSE', id]));
      } else if (sorte === 'CLOSE') {
        siens.delete(reste[0]);
      }
    });
  });

  return {
    url: `ws://127.0.0.1:${serveur.address().port}`,
    gardes,
    refuses,
    fermer: () => new Promise((ok) => {
      for (const c of serveur.clients) c.terminate();
      serveur.close(ok);
    }),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const relais = await lancerRelais(Number(process.argv[2] ?? 7447));
  console.log(`Relais local : ${relais.url}`);
}
