// Les horaires d'une classe, tapés comme du texte : le champ d'heure du téléphone change d'affichage
// d'un appareil à l'autre, et celui de Chromium montrait « 01:30 » pour 13 h 30.

import { esc, ic } from './vue';

export interface Horaires {
  matin: [string, string];
  apresMidi: [string, string];
}

const IDS = ['matin-debut', 'matin-fin', 'apres-midi-debut', 'apres-midi-fin'];

/// Lit une heure comme on la tape : « 9 h 30 », « 9h », « 9:30 » ou « 930 ». Rend « 9:30 ».
export function lireHeure(texte: string): string | undefined {
  const t = texte.trim().toLowerCase();
  const m = /^(\d{1,2})\s*(?:[h:.]\s*(\d{2})?)?$/.exec(t) ?? /^(\d{1,2})(\d{2})$/.exec(t);
  if (!m) return undefined;
  const [heures, minutes] = [Number(m[1]), Number(m[2] ?? 0)];
  return heures < 24 && minutes < 60 ? `${heures}:${String(minutes).padStart(2, '0')}` : undefined;
}

const enMinutes = (h: string) => Number(h.split(':')[0]) * 60 + Number(h.split(':')[1]);
const affiche = (h: string) => (lireHeure(h) ?? h).replace(':', ' h ');

/// Les deux lignes, matin et après-midi, avec l'erreur sous elles et les champs fautifs marqués.
export function champsDesHoraires(h: Horaires, erreur?: string, heuresFausses: string[] = []): string {
  const heure = (id: string, libelle: string, valeur: string) => {
    const faux = heuresFausses.includes(id);
    return `<input id="${id}" class="champ${faux ? ' faux' : ''}" value="${esc(affiche(valeur))}" inputmode="numeric" autocomplete="off" aria-label="${libelle}"${faux ? ' aria-describedby="erreur-horaires"' : ''}>`;
  };
  const ligne = (id: string, libelle: string, [debut, fin]: [string, string]) =>
    `<div class="rangee"><div><b>${libelle}</b></div><span class="horaire">${heure(`${id}-debut`, `Début, ${libelle.toLowerCase()}`, debut)}<span>à</span>${heure(`${id}-fin`, `Fin, ${libelle.toLowerCase()}`, fin)}</span></div>`;
  return `<section class="bloc"><p class="etiquette">Horaires</p><div class="liste">${ligne('matin', 'Matin', h.matin)}${ligne('apres-midi', 'Après-midi', h.apresMidi)}</div>
    ${erreur ? `<p class="erreur" id="erreur-horaires">${ic('info-box')}<span>${esc(erreur)}</span></p>` : ''}</section>`;
}

/// Ce qui est tapé dans les champs : les horaires lus, ou l'erreur et les champs fautifs.
export function lireLesHoraires(): { saisis: Horaires; lus?: Horaires; erreur?: string; heuresFausses?: string[] } {
  const valeur = (id: string) => document.querySelector<HTMLInputElement>(`#${id}`)?.value.trim() ?? '';
  const [a, b, c, d] = IDS.map(valeur);
  const saisis: Horaires = { matin: [a, b], apresMidi: [c, d] };
  const heures = [a, b, c, d].map(lireHeure);
  const illisibles = IDS.filter((_, i) => !heures[i]);
  if (illisibles.length) return { saisis, erreur: 'Écris les heures comme 9 h 00.', heuresFausses: illisibles };
  const desordre = IDS.filter((_, i) => i > 0 && enMinutes(heures[i - 1]!) >= enMinutes(heures[i]!));
  if (desordre.length) return { saisis, erreur: 'Chaque heure vient après la précédente.', heuresFausses: desordre };
  return { saisis, lus: { matin: [heures[0]!, heures[1]!], apresMidi: [heures[2]!, heures[3]!] } };
}
