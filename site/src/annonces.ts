// Les annonces de la classe : ce que les responsables publient sur le fil. Le téléphone garde la
// dernière version de chacune, retraits compris, et ne montre une annonce qu'une fois arrivée.

import type { Coeur } from './coeur';
import { aQuelMoment, esc, ic, jour } from './vue';

/// Une version d'une annonce, déjà vérifiée.
export interface AnnonceDeLaClasse {
  id: string;
  auteur: string;
  creee: number;
  quand: number;
  arrivee: number;
  retiree: boolean;
  texte: string;
  par: string;
  /// Le texte signé, tel qu'il se garde et se republie.
  signee: string;
}

/// Relit une annonce venue du fil, ou rien : ce n'est pas une annonce, ou un responsable ne l'a pas signée.
export function lireAnnonce(coeur: Coeur, fil: string, texte: string, responsables: string[]): AnnonceDeLaClasse | undefined {
  try {
    const a = coeur.lire_annonce(fil, texte, responsables);
    return { id: a.id, auteur: a.auteur, creee: a.creee, quand: a.quand, arrivee: a.arrivee, retiree: a.retiree, texte: a.texte, par: a.par, signee: texte };
  } catch {
    return undefined;
  }
}

/// Les annonces gardées, relues. Celles qu'un responsable de la porte n'a pas signées tombent.
export const relireLesAnnonces = (coeur: Coeur, fil: string | undefined, textes: string[] | undefined, responsables: string[]): AnnonceDeLaClasse[] =>
  fil ? (textes ?? []).flatMap((t) => lireAnnonce(coeur, fil, t, responsables) ?? []) : [];

/// Garde la version la plus récente de chaque annonce. Une version qui ne porte pas l'auteur et la
/// création de celle qu'on garde ne compte pas : un responsable ne reprend pas l'annonce d'un
/// autre. Rend la liste à jour, ou rien si elle ne change pas.
export function garderLaVersion(annonces: AnnonceDeLaClasse[], a: AnnonceDeLaClasse): AnnonceDeLaClasse[] | undefined {
  const avant = annonces.find((x) => x.id === a.id);
  if (avant && (avant.auteur !== a.auteur || avant.creee !== a.creee || avant.quand >= a.quand)) return undefined;
  return [...annonces.filter((x) => x.id !== a.id), a];
}

/// Les annonces en vigueur, la plus ancienne d'abord. Chez l'apprenant, seulement celles arrivées.
export const enVigueur = (annonces: AnnonceDeLaClasse[], arriveesAvant = Infinity): AnnonceDeLaClasse[] =>
  annonces.filter((a) => !a.retiree && a.arrivee <= arriveesAvant).sort((x, y) => x.creee - y.creee);

// Une voix française de l'appareil : une voix en ligne enverrait le texte de l'annonce sur Internet.
const voixLocale = () => ('speechSynthesis' in window ? speechSynthesis.getVoices().find((v) => v.lang.startsWith('fr') && v.localService) : undefined);
export const peutEcouter = (): boolean => voixLocale() !== undefined;

/// Lit une annonce à voix haute, avec la voix française de l'appareil.
export function ecouter(texte: string): void {
  const voix = voixLocale();
  if (!voix) return;
  speechSynthesis.cancel();
  const dit = new SpeechSynthesisUtterance(texte);
  dit.voice = voix;
  dit.lang = voix.lang;
  speechSynthesis.speak(dit);
}

/// Une annonce comme dans les maquettes : qui, son rôle, le jour où elle est arrivée, puis le
/// texte, en entier.
export function noteHtml(a: AnnonceDeLaClasse, qui: string, role: string, gestes: string, maintenant = Date.now()): string {
  const modifiee = a.quand > a.creee ? ' · modifiée' : '';
  const attend = a.arrivee > maintenant ? ` · arrivera ${aQuelMoment(a.arrivee, maintenant)}` : '';
  return `<article class="note" data-annonce="${esc(a.id)}"><p class="mono">${esc(qui)} · ${esc(role)} · ${jour(a.arrivee)}${modifiee}${attend}</p><p class="lu">${esc(a.texte).replace(/\n/g, '<br>')}</p>${gestes ? `<div class="note-gestes">${gestes}</div>` : ''}</article>`;
}

/// La touche « Écouter », quand l'appareil a une voix française à lui.
export const toucheEcouter = (a: AnnonceDeLaClasse): string =>
  peutEcouter() ? `<button class="btn" data-geste="ecouter" data-annonce="${esc(a.id)}">${ic('volume-2')}Écouter</button>` : '';
