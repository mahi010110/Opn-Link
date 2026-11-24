// Les demi-journées d'une classe : les dates, la suivante, et le prochain cours que l'app propose
// au formateur quand il clôt l'appel. Les dates s'écrivent 2026-11-17, à l'heure de l'appareil.

export type Demi = 'matin' | 'apres-midi';
export interface Creneau {
  date: string;
  demi: Demi;
}

const deux = (n: number) => String(n).padStart(2, '0');
export const enJour = (date: string): Date => {
  const [a, m, j] = date.split('-').map(Number);
  return new Date(a, m - 1, j);
};
export const iso = (d: Date): string => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
export const plusJours = (date: string, n: number): string => {
  const d = enJour(date);
  d.setDate(d.getDate() + n);
  return iso(d);
};
export const ouvre = (date: string): boolean => enJour(date).getDay() % 6 !== 0;
export const lundiDe = (date: string): string => plusJours(date, -((enJour(date).getDay() + 6) % 7));
export const joursEntre = (de: string, a: string): number => Math.round((enJour(a).getTime() - enJour(de).getTime()) / 86_400_000);

/// Pour comparer deux créneaux comme des textes : le matin passe avant l'après-midi.
export const rang = (c: Creneau): string => `${c.date}${c.demi === 'matin' ? 0 : 1}`;
export const enTexte = (c: Creneau): string => `${c.date} ${c.demi}`;
export const lireCreneau = (t: string): Creneau => {
  const [date, demi] = t.split(' ');
  return { date, demi: demi as Demi };
};

/// La demi-journée qui suit, sans le week-end.
export function suivant(c: Creneau): Creneau {
  if (c.demi === 'matin') return { date: c.date, demi: 'apres-midi' };
  let date = plusJours(c.date, 1);
  while (!ouvre(date)) date = plusJours(date, 1);
  return { date, demi: 'matin' };
}

/// Le prochain cours que l'app propose à la clôture. Elle cherche la dernière fois que la classe a
/// eu cours ce jour de la semaine, à cette demi-journée, et reprend l'écart jusqu'au cours d'après :
/// une alternance d'une semaine au centre et deux en entreprise se retrouve ainsi d'elle-même.
/// Sans rien de tel, c'est la demi-journée suivante.
export function proposerLeProchain(cours: Creneau[], ce: Creneau): Creneau {
  const tries = [...new Map(cours.map((c) => [rang(c), c])).values()].sort((a, b) => rang(a).localeCompare(rang(b)));
  const jour = enJour(ce.date).getDay();
  const avant = tries.filter((c) => rang(c) < rang(ce) && c.demi === ce.demi && enJour(c.date).getDay() === jour).pop();
  const apres = avant && tries.find((c) => rang(c) > rang(avant));
  if (avant && apres) {
    const propose = { date: plusJours(ce.date, joursEntre(avant.date, apres.date)), demi: apres.demi };
    if (rang(propose) > rang(ce) && ouvre(propose.date)) return propose;
  }
  return suivant(ce);
}

/// Entre le moment où le prochain cours a été annoncé et ce cours, la classe n'a pas cours.
export const sansCours = (c: Creneau, annonce: Creneau, prochain: Creneau): boolean => rang(annonce) < rang(c) && rang(c) < rang(prochain);

/// Le début et la fin d'une demi-journée, en millisecondes, d'après les horaires de la classe.
export function bornes(c: Creneau, horaires: { matin: string; apres_midi: string }): [number, number] {
  const [debut, fin] = (c.demi === 'matin' ? horaires.matin : horaires.apres_midi).split('-').map((h) => {
    const [heures, minutes] = h.split(':').map(Number);
    return enJour(c.date).setHours(heures, minutes, 0, 0);
  });
  return [debut, fin];
}

const UNE_HEURE_MS = 3600_000;

/// L'heure où arrive ce qu'on écrit maintenant : tout de suite pendant les heures de la classe,
/// sinon à l'ouverture suivante, une heure avant le début du matin du prochain jour de semaine
/// (conception, partie 2, « Les heures de la classe »).
export function arrivee(horaires: { matin: string; apres_midi: string }, maintenant: number): number {
  const ouvertureDu = (date: string) => bornes({ date, demi: 'matin' }, horaires)[0] - UNE_HEURE_MS;
  const aujourdhui = iso(new Date(maintenant));
  if (ouvre(aujourdhui)) {
    if (maintenant < ouvertureDu(aujourdhui)) return ouvertureDu(aujourdhui);
    if (maintenant <= bornes({ date: aujourdhui, demi: 'apres-midi' }, horaires)[1]) return maintenant;
  }
  let date = plusJours(aujourdhui, 1);
  while (!ouvre(date)) date = plusJours(date, 1);
  return ouvertureDu(date);
}
