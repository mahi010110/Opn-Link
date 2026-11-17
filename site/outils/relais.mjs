// Un petit relais Nostr, pour que les appareils se parlent pendant les tests, sans dépendre
// des relais publics. Il vérifie chaque événement comme un vrai relais, garde ce qu'il reçoit
// jusqu'à son expiration (NIP-40), et sert les filtres dont Opn-Link a besoin.
// Avec { refuser: true }, il sert les lectures et refuse toute écriture, comme relay.froth.zone
// le 15 novembre 2026 (docs/mesures.md).
//
// node outils/relais.mjs [port]  le lance seul ; sinon les tests appellent lancerRelais().

import { WebSocket, WebSocketServer } from 'ws';
import { verifyEvent } from 'nostr-tools/pure';
import { createServer } from 'node:http';
import { createServer as createNetServer } from 'node:net';
import { fileURLToPath } from 'node:url';

const expiration = (e) => Number(e.tags.find((t) => t[0] === 'expiration')?.[1] ?? Infinity);

const correspond = (filtre, e) =>
  (!filtre.ids || filtre.ids.includes(e.id)) &&
  (!filtre.kinds || filtre.kinds.includes(e.kind)) &&
  (!filtre.since || e.created_at >= filtre.since) &&
  (!filtre['#x'] || e.tags.some((t) => t[0] === 'x' && filtre['#x'].includes(t[1])));

export async function lancerRelais(port = 0, { refuser = false } = {}) {
  const serveur = new WebSocketServer({ host: '127.0.0.1', port });
  await new Promise((ok) => serveur.on('listening', ok));
  const gardes = [];
  const abonnements = new Map();
  const refuses = [];
  // Pour chaque connexion, le nombre d'événements reçus : on y voit qui insiste après un refus.
  const connexions = [];

  serveur.on('connection', (ws) => {
    const siens = new Map();
    const connexion = { evenements: 0 };
    connexions.push(connexion);
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
        connexion.evenements++;
        if (refuser) return ws.send(JSON.stringify(['OK', e?.id ?? '', false, 'blocked: écriture fermée']));
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

  let arrete = false;
  return {
    url: `ws://127.0.0.1:${serveur.address().port}`,
    gardes,
    refuses,
    connexions,
    fermer: () => new Promise((ok) => {
      if (arrete) return ok();
      arrete = true;
      for (const c of serveur.clients) c.terminate();
      serveur.close(() => ok());
    }),
  };
}

// Un relais mort : il coupe chaque connexion dès qu'elle arrive, et compte les tentatives.
export async function lancerRelaisMort() {
  let tentatives = 0;
  const serveur = createNetServer((socket) => {
    tentatives++;
    socket.destroy();
  });
  await new Promise((ok) => serveur.listen(0, '127.0.0.1', ok));
  return {
    url: `ws://127.0.0.1:${serveur.address().port}`,
    get tentatives() {
      return tentatives;
    },
    fermer: () => new Promise((ok) => serveur.close(() => ok())),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const relais = await lancerRelais(Number(process.argv[2] ?? 7447));
  console.log(`Relais local : ${relais.url}`);
}

// Une passerelle vers un relais, que les tests coupent et rétablissent : c'est le réseau d'un
// téléphone. Elle n'accepte la connexion qu'une fois le relais joint, comme un vrai réseau :
// un relais tombé derrière elle reste injoignable, au lieu de s'ouvrir puis se fermer aussitôt.
export async function lancerPasserelle(vers) {
  const http = createServer();
  const serveur = new WebSocketServer({ noServer: true });
  await new Promise((ok) => http.listen(0, '127.0.0.1', ok));
  let coupee = false;
  const liaisons = new Set();
  http.on('upgrade', (requete, socket, tete) => {
    if (coupee) return socket.destroy();
    const relais = new WebSocket(vers);
    relais.on('error', () => socket.destroy());
    relais.once('open', () => {
      if (coupee) {
        relais.terminate();
        return socket.destroy();
      }
      serveur.handleUpgrade(requete, socket, tete, (client) => {
        const liaison = { client, relais };
        liaisons.add(liaison);
        client.on('error', () => {});
        relais.on('message', (m) => client.readyState === 1 && client.send(m.toString()));
        client.on('message', (m) => relais.readyState === 1 && relais.send(m.toString()));
        const fermer = () => {
          liaisons.delete(liaison);
          client.terminate();
          relais.terminate();
        };
        client.on('close', fermer);
        relais.on('close', fermer);
      });
    });
  });
  return {
    url: `ws://127.0.0.1:${http.address().port}`,
    couper: () => {
      coupee = true;
      for (const l of liaisons) {
        l.client.terminate();
        l.relais.terminate();
      }
    },
    retablir: () => {
      coupee = false;
    },
    fermer: () => new Promise((ok) => {
      for (const l of liaisons) {
        l.client.terminate();
        l.relais.terminate();
      }
      http.closeAllConnections();
      http.close(ok);
    }),
  };
}
