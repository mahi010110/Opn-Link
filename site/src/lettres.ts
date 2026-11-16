// Les lettres scellées entre appareils, posées sur les relais dans la boîte du destinataire.

import type { Coeur } from './coeur';
import type { Relais } from './relais';

export type Lettre =
  | { v: 1; t: 'appel'; journal: string; secret: string }
  | { v: 1; t: 'presence'; presence: string }
  | { v: 1; t: 'recu'; seance: string; quand: number; par: string }
  | { v: 1; t: 'refus'; seance: string; raison: string }
  | { v: 1; t: 'compte'; seance: string; presents: number; inscrits: number }
  | { v: 1; t: 'clos'; seance: string; presents: number; absents: number; quand: number }
  | { v: 1; t: 'reouvert'; seance: string };

const DOUZE_HEURES = 12 * 3600;

export function envoyer(coeur: Coeur, relais: Relais, boite: string, lettre: Lettre): void {
  const maintenant = Math.floor(Date.now() / 1000);
  const scellee = coeur.sceller(boite, JSON.stringify(lettre));
  relais.publier(coeur.evenement_nostr(coeur.etiquette_de_boite(boite), maintenant + DOUZE_HEURES, scellee, maintenant));
}

export function recevoir(coeur: Coeur, relais: Relais, appareil: InstanceType<Coeur['Appareil']>, rappel: (l: Lettre) => void): void {
  const depuis = Math.floor(Date.now() / 1000) - DOUZE_HEURES;
  relais.ecouter('boite', { kinds: [8571], '#x': [coeur.etiquette_de_boite(appareil.boite())], since: depuis }, (e) => {
    try {
      const lettre = JSON.parse(appareil.ouvrir(e.content));
      if (lettre?.v === 1) rappel(lettre);
    } catch {
      // Une lettre qui ne s'ouvre pas n'était pas pour nous.
    }
  });
}
