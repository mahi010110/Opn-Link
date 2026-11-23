// Ce qui passe entre les appareils : les lettres scellées dans la boîte du destinataire,
// et la porte de la classe, chiffrée par son code.

import type { Appareil, Coeur } from './coeur';
import type { ClasseGardee } from './etat';
import type { Relais } from './relais';

export type Lettre =
  | { v: 1; t: 'entree'; code: string; demande: string }
  | { v: 1; t: 'admis'; code: string; porte: string; fil: string; acceptation: string }
  | { v: 1; t: 'classe'; classe: ClasseGardee }
  | { v: 1; t: 'montrer'; code: string; quoi: 'rejoindre' | 'rien' }
  | { v: 1; t: 'appel'; journal: string; secret: string }
  | { v: 1; t: 'presence'; presence: string }
  | { v: 1; t: 'recu'; seance: string; quand: number; par: string }
  | { v: 1; t: 'refus'; seance: string; raison: string }
  | { v: 1; t: 'compte'; seance: string; presents: number; inscrits: number }
  | { v: 1; t: 'clos'; seance: string; presents: number; absents: number; quand: number }
  | { v: 1; t: 'reouvert'; seance: string };

const UN_JOUR = 24 * 3600;
const SEPT_JOURS = 7 * UN_JOUR;
// Le prochain cours peut être à plusieurs semaines, en alternance : le fil se relit sur huit.
const HUIT_SEMAINES = 56 * UN_JOUR;
const TRENTE_JOURS = 30 * 24 * 3600;
const secondes = () => Math.floor(Date.now() / 1000);

export function envoyer(coeur: Coeur, relais: Relais, boite: string, lettre: Lettre): void {
  const maintenant = secondes();
  const scellee = coeur.sceller(boite, JSON.stringify(lettre));
  relais.publier(coeur.evenement_nostr(coeur.etiquette_de_boite(boite), maintenant + SEPT_JOURS, scellee, maintenant));
}

export function recevoir(coeur: Coeur, relais: Relais, appareil: Appareil, rappel: (l: Lettre) => void): void {
  relais.ecouter('boite', { kinds: [8571], '#x': [coeur.etiquette_de_boite(appareil.boite())], since: secondes() - SEPT_JOURS }, (e) => {
    let lettre: Lettre;
    try {
      lettre = JSON.parse(appareil.ouvrir(e.content));
    } catch {
      return; // Une lettre qui ne s'ouvre pas n'était pas pour nous.
    }
    if (lettre?.v === 1) rappel(lettre);
  });
}

/// Un responsable dit à la classe, sur le fil, que l'appel est ouvert ou clos. L'annonce ne sert
/// que le jour même : les relais la gardent un jour.
export function annoncerLAppel(coeur: Coeur, relais: Relais, fil: string, annonce: string): void {
  const maintenant = secondes();
  relais.publier(coeur.evenement_nostr(coeur.etiquette_du_fil(fil), maintenant + UN_JOUR, coeur.chiffrer_pour_le_fil(fil, annonce), maintenant));
}

/// Un responsable dit le prochain cours. Les relais le gardent jusqu'au lendemain de ce cours.
export function annoncerLeProchain(coeur: Coeur, relais: Relais, fil: string, prochain: string, date: string): void {
  const maintenant = secondes();
  const [a, m, j] = date.split('-').map(Number);
  const lendemain = Math.floor(new Date(a, m - 1, j + 2).getTime() / 1000);
  relais.publier(coeur.evenement_nostr(coeur.etiquette_du_fil(fil), Math.max(lendemain, maintenant + UN_JOUR), coeur.chiffrer_pour_le_fil(fil, prochain), maintenant));
}

/// Ce qui arrive sur le fil de la classe, déchiffré. Celui qui le lit vérifie qui l'a signé.
export function ecouterLeFil(coeur: Coeur, relais: Relais, fil: string, rappel: (texte: string) => void): void {
  relais.ecouter('fil', { kinds: [8571], '#x': [coeur.etiquette_du_fil(fil)], since: secondes() - HUIT_SEMAINES }, (e) => {
    try {
      rappel(coeur.dechiffrer_du_fil(fil, e.content));
    } catch {
      // Ce qui ne se déchiffre pas n'est pas de ce fil.
    }
  });
}

/// Le chef publie la porte de la classe, sous l'étiquette du code. Les relais la gardent trente jours.
export function publierPorte(coeur: Coeur, relais: Relais, code: string, porte: string): void {
  const maintenant = secondes();
  const chiffree = coeur.chiffrer_pour_la_classe(code, porte);
  relais.publier(coeur.evenement_nostr(coeur.etiquette_de_classe(code), maintenant + TRENTE_JOURS, chiffree, maintenant));
}

/// Cherche la porte d'une classe sur les relais. Rend le code d'erreur du cœur si rien ne va.
export async function chercherPorte(coeur: Coeur, relais: Relais, code: string, chef?: string): Promise<ReturnType<Coeur['choisir_porte']>> {
  const evenements = await relais.chercher({ kinds: [8571], '#x': [coeur.etiquette_de_classe(code)] });
  const textes: string[] = [];
  for (const e of evenements) {
    try {
      textes.push(coeur.dechiffrer_pour_la_classe(code, e.content));
    } catch {
      // Ce qui ne se déchiffre pas n'est pas une porte de cette classe.
    }
  }
  return coeur.choisir_porte(code, textes, chef);
}

/// Le code d'une classe sous la seule forme qu'on garde et qu'on compare : en minuscules, sans espaces.
export const codeNormal = (code: string): string => code.replace(/[\s-]/g, '').toLowerCase();

/// Le lien du QR de la classe : le code, et la clé du chef, qui seule signe la vraie porte.
/// Il passe après #, que le navigateur n'envoie jamais au serveur du site.
export function lienDeLaClasse(coeur: Coeur, code: string, cleDuChef: string): string {
  return `${location.origin}${location.pathname}#r=${codeNormal(code)}.${coeur.cle_courte(cleDuChef)}`;
}

export function lireLien(hash: string): { code: string; chef: string } | undefined {
  const m = /^#r=([a-z0-9]{15})\.([A-Za-z0-9_-]{44})$/.exec(hash);
  return m ? { code: m[1], chef: m[2] } : undefined;
}
