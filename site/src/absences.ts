// Les absences justifiées. L'apprenant dit pourquoi il était absent : le motif part aux seuls
// responsables, signé par son appareil. Ni la classe, ni plus tard le tuteur, ne le lisent.

import type { Coeur } from './coeur';
import { type Demi, enJour } from './creneaux';
import type { JustificationGardee } from './etat';

export const MOTIFS = [
  ['maladie', 'Maladie'],
  ['transport', 'Transport'],
  ['entreprise', 'Entreprise'],
  ['autre', 'Autre raison'],
] as const;

/// « transport », « autre raison » : le motif tel qu'une phrase le dit.
export const leMotif = (motif: string): string => (MOTIFS.find(([id]) => id === motif)?.[1] ?? motif).toLowerCase();

/// « mardi 17 novembre, matin »
export const lAbsence = (date: string, demi: Demi): string =>
  `${new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(enJour(date))}, ${demi === 'matin' ? 'matin' : 'après-midi'}`;

/// Relit la justification d'une absence, ou rien si l'apprenant qu'elle porte ne l'a pas signée.
export function lireJustification(coeur: Coeur, code: string, texte: string): JustificationGardee | undefined {
  try {
    const j = coeur.lire_justification(code, texte);
    return { cle: j.apprenant, seance: j.seance, date: j.date, demi: j.demi as Demi, motif: j.motif, quand: j.quand };
  } catch {
    return undefined;
  }
}

/// Garde la dernière justification de chaque absence, et oublie celles d'avant la date donnée.
/// Rend la liste à jour, ou rien si elle ne change pas.
export function garderLaJustification(liste: JustificationGardee[], j: JustificationGardee, depuis: string): JustificationGardee[] | undefined {
  const meme = (x: JustificationGardee) => x.cle === j.cle && x.seance === j.seance;
  const avant = liste.find(meme);
  if (avant && avant.quand >= j.quand) return undefined;
  return [...liste.filter((x) => !meme(x) && x.date >= depuis), j];
}
