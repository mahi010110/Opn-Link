import type { Appareil, Coeur } from './coeur';
import type { Relais } from './relais';

/// Ce que chaque écran reçoit : le cœur, le relais, et les clés de l'appareil.
export interface Contexte {
  coeur: Coeur;
  relais: Relais;
  moi: Appareil;
}

/// La ligne de faits, en bas de l'écran : ce qui est parti, et ce qui attend.
export function faits(relais: Relais, texte = 'Tout est parti'): string {
  const n = relais.attend;
  if (!n) return `<p class="faits"><span>${texte}</span></p>`;
  return `<p class="faits"><span class="attend">${relais.ouvert ? '' : 'Pas de réseau · '}${n} envoi${n > 1 ? 's attendent' : ' attend'}</span></p>`;
}

export const nomDe = (p: { prenom: string; nom: string }): string => `${p.prenom} ${p.nom}`;
