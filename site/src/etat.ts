// Ce que l'appareil garde. Les clés de stockage commencent par opl_proto_ : elles disparaîtront
// avec le prototype, et le contrat écrira les vraies.

import type { Appareil, Coeur } from './coeur';

export interface Moi {
  prenom: string;
  nom: string;
}

export interface ClasseGardee {
  code: string;
  role: 'chef' | 'apprenant';
  porte: string;
  fil?: string;
  /// L'apprenant : son acceptation, une fois admis, ou sa demande, tant qu'il attend.
  acceptation?: string;
  demande?: string;
  /// Le chef : les acceptations, les demandes en attente, et les clés de ceux qu'il a laissés dehors.
  membres?: string[];
  demandes?: string[];
  dehors?: string[];
  portePubliee?: number;
  /// Le chef : les demi-journées où l'appel a été clos, huit semaines au plus, et le prochain cours
  /// annoncé à la classe.
  cours?: string[];
  prochain?: { date: string; demi: string; quand: number };
  /// Le prochain cours qui attend la fin du délai pour annuler, avant de partir à la classe.
  prochainEnAttente?: { date: string; demi: string; part: number };
}

const parametres = new URLSearchParams(location.search);
export const appareil = parametres.get('appareil') ?? 'moi';
export const ecran = parametres.get('ecran');
const cle = (nom: string) => `opl_proto_${appareil}_${nom}`;

export function lire<T>(nom: string): T | undefined {
  try {
    const t = localStorage.getItem(cle(nom));
    return t ? (JSON.parse(t) as T) : undefined;
  } catch {
    return undefined;
  }
}

export function ecrire(nom: string, valeur: unknown): void {
  try {
    if (valeur === undefined || valeur === null) localStorage.removeItem(cle(nom));
    else localStorage.setItem(cle(nom), JSON.stringify(valeur));
  } catch {
    // Sans stockage, l'appareil marche le temps de la page.
  }
}

/// Les clés de cet appareil, tirées la première fois.
export function clesDeLAppareil(coeur: Coeur): Appareil {
  const gardees = lire<string>('cles');
  if (gardees) return coeur.Appareil.relire(gardees);
  const neuves = new coeur.Appareil();
  ecrire('cles', neuves.secrets());
  return neuves;
}

export const classes = (): ClasseGardee[] => lire<ClasseGardee[]>('classes') ?? [];

export function garderClasse(classe: ClasseGardee): void {
  ecrire('classes', [classe, ...classes().filter((c) => c.code !== classe.code)]);
}

export function oublierClasse(code: string): void {
  ecrire('classes', classes().filter((c) => c.code !== code));
}

// Les relais par défaut, mesurés le 15 novembre 2026 (docs/architecture.md). Les tests donnent les leurs.
const RELAIS_PAR_DEFAUT = {
  principaux: ['wss://nostr.sathoarder.com', 'wss://nos.lol'],
  secours: ['wss://nostr-relay.corb.net', 'wss://nostr-01.yakihonne.com'],
};
export const listeDesRelais = (): { principaux: string[]; secours: string[] } => lire('relais') ?? RELAIS_PAR_DEFAUT;
