// Un client Nostr réduit à ce dont Opn-Link a besoin : publier, et écouter une étiquette.
// Ce qui n'a pas encore été accepté par le relais attend, et repart à la reconnexion.

export interface EvenementNostr {
  id: string;
  content: string;
  created_at: number;
}

interface Ecoute {
  filtre: Record<string, unknown>;
  rappel: (e: EvenementNostr) => void;
}

export class Relais {
  private ws?: WebSocket;
  private enAttente = new Map<string, string>();
  private ecoutes = new Map<string, Ecoute>();
  private vus = new Set<string>();
  ouvert = false;
  changement: () => void = () => {};

  constructor(private url: string) {
    this.connecter();
  }

  get attend(): number {
    return this.enAttente.size;
  }

  private connecter(): void {
    let ws: WebSocket;
    try {
      ws = new WebSocket(this.url);
    } catch {
      setTimeout(() => this.connecter(), 3000);
      return;
    }
    this.ws = ws;
    ws.onopen = () => {
      this.ouvert = true;
      for (const [id, e] of this.ecoutes) ws.send(JSON.stringify(['REQ', id, e.filtre]));
      for (const e of this.enAttente.values()) ws.send(`["EVENT",${e}]`);
      this.changement();
    };
    ws.onmessage = (m) => {
      const [sorte, a, b] = JSON.parse(String(m.data));
      if (sorte === 'OK' && b === true) {
        this.enAttente.delete(a);
        this.changement();
      } else if (sorte === 'EVENT' && !this.vus.has(b.id)) {
        this.vus.add(b.id);
        this.ecoutes.get(a)?.rappel(b);
      }
    };
    ws.onclose = () => {
      this.ouvert = false;
      this.changement();
      setTimeout(() => this.connecter(), 3000);
    };
  }

  publier(evenement: string): void {
    const { id } = JSON.parse(evenement);
    this.enAttente.set(id, evenement);
    if (this.ouvert) this.ws?.send(`["EVENT",${evenement}]`);
    this.changement();
  }

  ecouter(id: string, filtre: Record<string, unknown>, rappel: (e: EvenementNostr) => void): void {
    this.ecoutes.set(id, { filtre, rappel });
    if (this.ouvert) this.ws?.send(JSON.stringify(['REQ', id, filtre]));
  }
}
