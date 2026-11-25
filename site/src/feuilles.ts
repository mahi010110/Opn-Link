// Les feuilles closes de la classe, chez chaque responsable. Celui qui a tenu l'appel envoie le
// journal aux autres quand sa clôture ne s'annule plus. Chacun le vérifie, et garde huit semaines
// ce qu'il dit de chaque inscrit : présent, à quelle heure, ou absent.

import type { Coeur } from './coeur';
import type { Creneau, Demi } from './creneaux';
import type { CeQueSaitLeTelephone } from './semaine';

/// Une feuille close, déjà vérifiée.
export interface FeuilleGardee extends Creneau {
  seance: string;
  /// La clé du formateur qui a tenu l'appel.
  par: string;
  cloture: number;
  empreinte: string;
  /// Le nombre de lignes du journal : une correction en ajoute une.
  longueur: number;
  /// Les présents et l'heure de leur présence, puis les absents.
  presents: Record<string, number>;
  absents: string[];
}

/// Relit le journal d'une feuille close de la classe, ou rien s'il ne se vérifie pas.
export function lireFeuille(coeur: Coeur, code: string, journal: string): FeuilleGardee | undefined {
  try {
    const f = coeur.lire_feuille(code, journal);
    const lignes = f.lignes;
    return {
      seance: f.seance,
      date: f.date,
      demi: f.demi as Demi,
      par: f.formateur,
      cloture: f.cloture,
      empreinte: f.empreinte,
      longueur: f.longueur,
      presents: Object.fromEntries(lignes.filter((l) => l.etat === 'present').map((l) => [l.cle, l.quand])),
      absents: lignes.filter((l) => l.etat === 'absent').map((l) => l.cle),
    };
  } catch {
    return undefined;
  }
}

/// Une feuille déjà gardée, dans sa version ou une plus longue. Le journal se lit ici sans être
/// vérifié : le vérifier coûte une signature par ligne, et les relais renvoient les lettres du mois
/// à chaque ouverture.
export function dejaGardee(feuilles: FeuilleGardee[], journal: string): boolean {
  const lignes = journal.split('\n');
  const [, , , , seance, , , par] = lignes[1]?.split('\t') ?? [];
  return feuilles.some((f) => f.seance === seance && f.par === par && f.longueur >= lignes.length - 1);
}

/// Garde une feuille à la place d'une version plus courte de la même, et oublie celles d'avant
/// la date donnée. Rend la liste à jour, ou rien si elle ne change pas.
export function garderLaFeuille(feuilles: FeuilleGardee[], f: FeuilleGardee, depuis: string): FeuilleGardee[] | undefined {
  const meme = (x: FeuilleGardee) => x.seance === f.seance && x.par === f.par;
  const avant = feuilles.find(meme);
  if (avant && avant.longueur >= f.longueur) return undefined;
  return [...feuilles.filter((x) => !meme(x) && x.date >= depuis), f];
}

/// Ce que disent les feuilles d'un apprenant : de quoi dessiner sa semaine comme sur son téléphone.
export function ceQueDisentLesFeuilles(feuilles: FeuilleGardee[], cle: string, maintenant: Creneau, prochain?: CeQueSaitLeTelephone['prochain']): CeQueSaitLeTelephone {
  const siennes = feuilles.filter((f) => cle in f.presents || f.absents.includes(cle));
  return {
    maintenant,
    presences: siennes.filter((f) => cle in f.presents).map((f) => ({ date: f.date, demi: f.demi, signee: f.presents[cle] })),
    appels: siennes.map((f) => ({ date: f.date, demi: f.demi, etat: 'clos' })),
    prochain,
  };
}
