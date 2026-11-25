// Ma semaine : une case par demi-journée, du lundi au vendredi. Le téléphone y met ce qu'il sait :
// les présences signées, les appels clos sans elles, l'appel ouvert, et les jours sans cours que le
// formateur a dits en annonçant le prochain cours. Ce qu'il ne sait pas reste une case vide.

import { type Creneau, type Demi, enJour, lundiDe, plusJours, rang, sansCours } from './creneaux';
import { esc, heure, heureCourte } from './vue';

export interface CeQueSaitLeTelephone {
  maintenant: Creneau;
  presences: (Creneau & { signee: number })[];
  appels: (Creneau & { etat: string })[];
  prochain?: { annonce: Creneau; cours: Creneau };
}

type Etat = 'faite' | 'maintenant' | 'ailleurs' | 'absent' | '';
interface Case {
  etat: Etat;
  texte: string;
  dit: string;
}

const NOMS = ['lun', 'mar', 'mer', 'jeu', 'ven'];
const pareil = (a: Creneau, b: Creneau) => a.date === b.date && a.demi === b.demi;
const quand = (date: string, demi: Demi) =>
  `${new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric' }).format(enJour(date))}, ${demi === 'matin' ? 'matin' : 'après-midi'}`;

export function caseDe(c: Creneau, sait: CeQueSaitLeTelephone): Case {
  const presence = sait.presences.find((p) => pareil(p, c));
  if (presence) return { etat: 'faite', texte: heureCourte(presence.signee), dit: `présence signée à ${heure(presence.signee)}` };
  const appel = sait.appels.find((a) => pareil(a, c));
  if (appel?.etat === 'clos') return { etat: 'absent', texte: 'abs.', dit: 'une absence' };
  if (appel?.etat === 'ouvert' && pareil(c, sait.maintenant)) return { etat: 'maintenant', texte: 'appel', dit: 'l’appel est ouvert' };
  if (sait.prochain && sansCours(c, sait.prochain.annonce, sait.prochain.cours)) return { etat: 'ailleurs', texte: '', dit: 'pas de cours' };
  return { etat: '', texte: '', dit: rang(c) < rang(sait.maintenant) ? 'rien de connu' : 'à venir' };
}

/// Les absences de la semaine que le téléphone connaît, la plus récente d'abord.
export function absences(sait: CeQueSaitLeTelephone): Creneau[] {
  const lundi = lundiDe(sait.maintenant.date);
  return sait.appels
    .filter((a) => a.date >= lundi && rang(a) <= rang(sait.maintenant) && caseDe(a, sait).etat === 'absent')
    .sort((a, b) => rang(b).localeCompare(rang(a)));
}

/// La semaine en HTML, comme dans les maquettes. En rangs, un jour par rang : pour le texte agrandi.
export function semaineHtml(sait: CeQueSaitLeTelephone, enRangs = false): string {
  const lundi = lundiDe(sait.maintenant.date);
  const jours = NOMS.map((nom, n) => ({ nom, date: plusJours(lundi, n) }));
  const uneCase = (date: string, demi: Demi) => {
    const c = { date, demi };
    const { etat, texte, dit } = caseDe(c, sait);
    const ici = pareil(c, sait.maintenant) && etat === 'ailleurs' ? ' ici' : '';
    return `<span class="case ${etat}${ici}" role="img" aria-label="${esc(`${quand(date, demi)} : ${dit}`)}">${esc(texte)}</span>`;
  };
  const jour = (j: (typeof jours)[number], coupe: boolean) =>
    `<span class="jour${j.date === sait.maintenant.date ? ' ici' : ''}" aria-hidden="true">${j.nom}${coupe ? '<br>' : ' '}${enJour(j.date).getDate()}</span>`;
  if (enRangs) {
    return `<div class="semaine en-rangs"><span></span><span class="rang" aria-hidden="true">Matin</span><span class="rang" aria-hidden="true">Après-midi</span>${jours
      .map((j) => `${jour(j, false)}${uneCase(j.date, 'matin')}${uneCase(j.date, 'apres-midi')}`)
      .join('')}</div>`;
  }
  const rangee = (nom: string, demi: Demi) => `<span class="rang" aria-hidden="true">${nom}</span>${jours.map((j) => uneCase(j.date, demi)).join('')}`;
  return `<div class="semaine"><span></span>${jours.map((j) => jour(j, true)).join('')}${rangee('Matin', 'matin')}${rangee('Après-<br>midi', 'apres-midi')}</div>`;
}

/// La même semaine en petit, dix cases sans texte : « Sa semaine », chez le formateur.
export function dixHtml(sait: CeQueSaitLeTelephone): string {
  const lundi = lundiDe(sait.maintenant.date);
  const uneCase = (date: string, demi: Demi) => {
    const { etat, dit } = caseDe({ date, demi }, sait);
    return `<span class="case ${etat}" role="img" aria-label="${esc(`${quand(date, demi)} : ${dit}`)}"></span>`;
  };
  return `<div class="dix">${NOMS.map((_, n) => plusJours(lundi, n))
    .map((date) => `<span>${uneCase(date, 'matin')}${uneCase(date, 'apres-midi')}</span>`)
    .join('')}</div>`;
}

/// Quand une heure ne tient plus dans sa case, avec le texte agrandi, la semaine passe en rangs.
export function ajusterLaSemaine(sait: CeQueSaitLeTelephone): void {
  const semaine = document.querySelector('.semaine:not(.en-rangs)');
  if (!semaine) return;
  const deborde = [...semaine.querySelectorAll<HTMLElement>('.case, .jour')].some((c) => c.scrollWidth > c.clientWidth + 1);
  if (deborde) semaine.outerHTML = semaineHtml(sait, true);
}
