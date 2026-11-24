// Ce que partagent les écrans : écrire une page, les icônes, les heures, les gestes.

import { joursEntre } from './creneaux';

const echappes: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (t: string): string => t.replace(/[&<>"']/g, (c) => echappes[c]);

export const ic = (nom: string, taille = ''): string =>
  `<span class="ic ${taille}" aria-hidden="true" style="-webkit-mask-image:url(kit/assets/icons/${nom}.svg);mask-image:url(kit/assets/icons/${nom}.svg)"></span>`;

const espace = ' ';
export const heure = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getHours()}${espace}h${espace}${String(d.getMinutes()).padStart(2, '0')}`;
};
export const heureCourte = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};
export const jour = (ms: number): string =>
  new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(ms));
export const dateIso = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
/// « 9:00 » devient « 9 h », « 12:30 » devient « 12 h 30 ».
export const horaire = (h: string): string => {
  const [heures, minutes = '00'] = h.split(':');
  return minutes === '00' ? `${Number(heures)}${espace}h` : `${Number(heures)}${espace}h${espace}${minutes}`;
};

/// « aujourd’hui à 8 h », « demain à 8 h », « lundi à 8 h » dans la semaine, puis la date.
export function aQuelMoment(ms: number, maintenant = Date.now()): string {
  const d = new Date(ms);
  const h = horaire(`${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`);
  const dans = joursEntre(dateIso(maintenant), dateIso(ms));
  if (dans === 0) return `aujourd’hui à ${h}`;
  if (dans === 1) return `demain à ${h}`;
  if (dans < 7) return `${new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(d)} à ${h}`;
  return `${jour(ms)} à ${h}`;
}

/// Le matin ou l'après-midi, d'après les horaires de l'après-midi (« 13:30-17:00 »).
/// L'appel de l'après-midi peut se lancer une heure avant son début.
export const demiJournee = (ms: number, apresMidi: string): 'matin' | 'apres-midi' => {
  const d = new Date(ms);
  const [h, m] = apresMidi.split('-')[0].split(':').map(Number);
  return d.getHours() * 60 + d.getMinutes() < h * 60 + m - 60 ? 'matin' : 'apres-midi';
};

type Geste = (cible: HTMLElement) => void;
let gestes: Record<string, Geste> = {};

document.addEventListener('click', (e) => {
  const lien = (e.target as Element).closest('a[href="#"]');
  if (lien) e.preventDefault();
  const cible = (e.target as Element).closest<HTMLElement>('[data-geste]');
  if (cible && !cible.hasAttribute('disabled')) gestes[cible.dataset.geste!]?.(cible);
});

let affiche = '';

/// Écrit un écran. Le titre de la page suit, et le focus va au titre de l'écran.
/// Un écran qui n'a pas changé reste en place : un relais qui se reconnecte redessinait sinon la
/// page sous le doigt, et un lecteur d'écran perdait sa place.
export function afficher(classe: string, titre: string, html: string, nouveauxGestes: Record<string, Geste>, garderFocus = false): void {
  gestes = nouveauxGestes;
  if (document.body.className === classe && affiche === html) return;
  affiche = html;
  document.body.className = classe;
  document.body.innerHTML = html;
  document.title = `${titre} · Opn-Link`;
  if (!garderFocus) document.querySelector<HTMLElement>('h1, h2')?.focus({ preventScroll: true });
}

export const paves = (fait: number, total: number): string =>
  `<div class="paves" role="img" aria-label="${fait} sur ${total}">${Array.from({ length: total }, (_, n) => `<span class="pave${n < fait ? ' fait' : ''}"></span>`).join('')}</div>`;

/// Le code d'une classe tel qu'on l'affiche : trois blocs de cinq, en majuscules.
export const codeAffiche = (code: string): string => code.replace(/[\s-]/g, '').toUpperCase().replace(/(.{5})(?=.)/g, '$1 ');

/// Ajouter le site à l'écran d'accueil. Sur Android, le navigateur le propose par un événement
/// qu'on garde pour le bon moment. Sur iPhone, il faut passer par Safari.
let invitationAInstaller: (Event & { prompt?: () => Promise<void> }) | undefined;
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  invitationAInstaller = e;
});

export const surLEcranDAccueil = (): boolean =>
  matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
export const surIPhone = (): boolean => /iPhone|iPad|iPod/.test(navigator.userAgent);
export const installable = (): boolean => invitationAInstaller !== undefined;
export async function installer(): Promise<void> {
  await invitationAInstaller?.prompt?.();
  invitationAInstaller = undefined;
}
