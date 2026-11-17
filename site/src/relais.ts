// Un client Nostr réduit à ce dont Opn-Link a besoin : publier, chercher, écouter une étiquette.
// Il passe par deux relais principaux. Tant que moins de deux répondent, il passe aussi par ceux
// de secours. Un relais qui refuse nos messages est écarté dix minutes, sur cet appareil
// (docs/architecture.md, « Les relais par défaut »). Ce qu'aucun relais n'a accepté attend, se
// garde sur l'appareil et repart. Chaque relais qui se connecte reçoit ce qu'il a manqué pendant
// la session : sans ça, un message parti quand un relais était tombé n'existerait que sur l'autre.

export interface EvenementNostr {
  id: string;
  content: string;
  created_at: number;
}

export interface ListeDeRelais {
  principaux: string[];
  secours: string[];
}

/// Où se garde ce qui attend, pour qu'un rechargement de la page ne le perde pas.
export interface GardeDesEnvois {
  lire(): string[];
  ecrire(evenements: string[]): void;
}

interface Envoi {
  texte: string;
  expire: number;
  acceptePar: Set<string>;
}

interface Ecoute {
  filtre: Record<string, unknown>;
  rappel: (e: EvenementNostr) => void;
}

interface Recherche {
  filtre: Record<string, unknown>;
  trouves: Map<string, EvenementNostr>;
  attendus: Set<Connexion>;
  finis: Set<Connexion>;
  repondu: boolean;
  finir: () => void;
}

const RECONNEXION_MS = 3000;
const DELAI_DE_CONNEXION_MS = 8000;
const ECARTE_MS = 10 * 60 * 1000;
const PRINCIPAUX_VOULUS = 2;
const ENVOIS_GARDES = 300;

class Connexion {
  ws?: WebSocket;
  ouverte = false;
  voulue = false;
  ecarteeJusqua = 0;
  private reprise?: ReturnType<typeof setTimeout>;

  constructor(
    readonly url: string,
    private readonly relais: Relais,
  ) {}

  get vivante(): boolean {
    return !!this.ws && Date.now() >= this.ecarteeJusqua;
  }

  ouvrir(): void {
    this.voulue = true;
    if (this.ws || this.reprise || Date.now() < this.ecarteeJusqua) return;
    let ws: WebSocket;
    try {
      ws = new WebSocket(this.url);
    } catch {
      return this.plusTard();
    }
    this.ws = ws;
    this.relais.enRoute(this);
    // Un relais filtré par le réseau peut laisser la connexion pendue de longues secondes.
    const pendue = setTimeout(() => ws.close(), DELAI_DE_CONNEXION_MS);
    ws.onopen = () => {
      clearTimeout(pendue);
      this.ouverte = true;
      this.relais.ouverte(this);
    };
    ws.onmessage = (m) => {
      try {
        this.relais.message(this, JSON.parse(String(m.data)));
      } catch {
        // Un message illisible d'un relais ne change rien chez nous.
      }
    };
    ws.onclose = () => {
      clearTimeout(pendue);
      this.ws = undefined;
      this.ouverte = false;
      // La reprise d'abord : sans elle, les secours rouverts aussitôt par fermee() se
      // reconnecteraient en boucle à un relais mort.
      this.plusTard();
      this.relais.fermee(this);
    };
  }

  fermer(): void {
    this.voulue = false;
    if (this.ws) this.ws.close();
    else this.relais.oublier(this);
  }

  envoyer(message: string): void {
    if (this.ouverte) this.ws?.send(message);
  }

  ecarter(): void {
    this.ecarteeJusqua = Date.now() + ECARTE_MS;
    this.ws?.close();
  }

  private plusTard(): void {
    clearTimeout(this.reprise);
    this.reprise = setTimeout(
      () => {
        this.reprise = undefined;
        if (this.voulue) this.ouvrir();
      },
      Math.max(RECONNEXION_MS, this.ecarteeJusqua - Date.now()),
    );
  }
}

export class Relais {
  private principaux: Connexion[];
  private secours: Connexion[];
  private envois = new Map<string, Envoi>();
  private ecoutes = new Map<string, Ecoute>();
  private recherches = new Map<string, Recherche>();
  private vus = new Set<string>();
  private compteur = 0;
  changement: () => void = () => {};

  constructor(
    liste: ListeDeRelais,
    private readonly garde?: GardeDesEnvois,
  ) {
    this.principaux = liste.principaux.map((url) => new Connexion(url, this));
    this.secours = liste.secours.map((url) => new Connexion(url, this));
    for (const texte of garde?.lire() ?? []) this.retenir(texte);
    for (const c of this.principaux) c.ouvrir();
    this.equilibrer();
  }

  private get toutes(): Connexion[] {
    return [...this.principaux, ...this.secours];
  }

  get ouvert(): boolean {
    return this.toutes.some((c) => c.ouverte);
  }

  /// Ce qu'aucun relais n'a encore accepté.
  get attend(): number {
    let n = 0;
    for (const e of this.envois.values()) if (!e.acceptePar.size && e.expire > Date.now() / 1000) n++;
    return n;
  }

  /// Les relais de secours servent tant que moins de deux principaux sont en route,
  /// et se referment quand deux principaux répondent.
  private equilibrer(): void {
    if (this.principaux.filter((c) => c.vivante).length < PRINCIPAUX_VOULUS) {
      for (const c of this.secours) c.ouvrir();
    } else if (this.principaux.filter((c) => c.ouverte).length >= PRINCIPAUX_VOULUS) {
      for (const c of this.secours) if (c.voulue) c.fermer();
    }
  }

  enRoute(c: Connexion): void {
    for (const r of this.recherches.values()) if (!r.finis.has(c)) r.attendus.add(c);
  }

  private plusAttendu(r: Recherche, c: Connexion): void {
    if (!r.attendus.delete(c)) return;
    r.finis.add(c);
    if (!r.attendus.size) r.finir();
  }

  /// Les recherches en cours n'attendent plus cette connexion.
  oublier(c: Connexion): void {
    for (const r of [...this.recherches.values()]) this.plusAttendu(r, c);
  }

  ouverte(c: Connexion): void {
    for (const [id, e] of this.ecoutes) c.envoyer(JSON.stringify(['REQ', id, e.filtre]));
    for (const [id, r] of this.recherches) c.envoyer(JSON.stringify(['REQ', id, r.filtre]));
    const maintenant = Date.now() / 1000;
    for (const e of this.envois.values()) if (e.expire > maintenant && !e.acceptePar.has(c.url)) c.envoyer(`["EVENT",${e.texte}]`);
    this.equilibrer();
    this.changement();
  }

  fermee(c: Connexion): void {
    // D'abord les secours, pour qu'une recherche en cours les attende avant de conclure.
    this.equilibrer();
    this.oublier(c);
    this.changement();
  }

  message(c: Connexion, [sorte, a, b, raison]: [string, string, unknown, unknown]): void {
    const recherche = this.recherches.get(a);
    if (recherche && sorte === 'EVENT') {
      const e = b as EvenementNostr;
      recherche.trouves.set(e.id, e);
    } else if (recherche && (sorte === 'EOSE' || sorte === 'CLOSED')) {
      if (sorte === 'EOSE') recherche.repondu = true;
      this.plusAttendu(recherche, c);
    } else if (sorte === 'OK') {
      // Un relais qui a déjà l'événement répond « duplicate: », parfois avec false.
      if (b === true || String(raison).startsWith('duplicate:')) this.accepte(a, c.url);
      else c.ecarter();
    } else if (sorte === 'EVENT') {
      const e = b as EvenementNostr;
      if (this.vus.has(e.id)) return;
      this.vus.add(e.id);
      this.ecoutes.get(a)?.rappel(e);
    }
  }

  private accepte(id: string, url: string): void {
    const envoi = this.envois.get(id);
    if (!envoi || envoi.acceptePar.has(url)) return;
    const attendait = !envoi.acceptePar.size;
    envoi.acceptePar.add(url);
    if (attendait) {
      this.garder();
      this.changement();
    }
  }

  private retenir(texte: string): string {
    const e = JSON.parse(texte);
    const expire = Number(e.tags?.find((t: string[]) => t[0] === 'expiration')?.[1] ?? Infinity);
    if (!this.envois.has(e.id)) this.envois.set(e.id, { texte, expire, acceptePar: new Set() });
    for (const [id, envoi] of this.envois) {
      if (this.envois.size <= ENVOIS_GARDES) break;
      if (envoi.acceptePar.size || envoi.expire <= Date.now() / 1000) this.envois.delete(id);
    }
    return e.id;
  }

  private garder(): void {
    const maintenant = Date.now() / 1000;
    this.garde?.ecrire([...this.envois.values()].filter((e) => !e.acceptePar.size && e.expire > maintenant).map((e) => e.texte));
  }

  publier(evenement: string): void {
    this.retenir(evenement);
    this.garder();
    for (const c of this.toutes) c.envoyer(`["EVENT",${evenement}]`);
    this.changement();
  }

  /// Ce que les relais gardent pour un filtre. La recherche attend chaque relais en service, même
  /// entre deux tentatives : un relais qui répond vite et n'a rien ne doit pas faire conclure
  /// « rien » avant celui qui a la réponse. Elle s'arrête au bout du délai, et rend l'erreur
  /// « sans-reseau » si aucun relais n'a répondu.
  chercher(filtre: Record<string, unknown>, delaiMs = 6000): Promise<EvenementNostr[]> {
    return new Promise((ok, refus) => {
      const id = `r${++this.compteur}`;
      const recherche: Recherche = {
        filtre,
        trouves: new Map(),
        attendus: new Set(this.toutes.filter((c) => c.voulue && Date.now() >= c.ecarteeJusqua)),
        finis: new Set(),
        repondu: false,
        finir: () => {
          clearTimeout(minuterie);
          if (!this.recherches.delete(id)) return;
          for (const c of this.toutes) c.envoyer(JSON.stringify(['CLOSE', id]));
          if (recherche.repondu) ok([...recherche.trouves.values()]);
          else refus(new Error('sans-reseau'));
        },
      };
      const minuterie = setTimeout(recherche.finir, delaiMs);
      this.recherches.set(id, recherche);
      if (!recherche.attendus.size) return recherche.finir();
      for (const c of this.toutes) c.envoyer(JSON.stringify(['REQ', id, filtre]));
    });
  }

  ecouter(id: string, filtre: Record<string, unknown>, rappel: (e: EvenementNostr) => void): void {
    this.ecoutes.set(id, { filtre, rappel });
    for (const c of this.toutes) c.envoyer(JSON.stringify(['REQ', id, filtre]));
  }
}
