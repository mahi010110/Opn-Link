// Les classes de ce téléphone. Chacune a son suivi, qui lit ses lettres, ses annonces et sa porte
// même quand une autre est à l'écran. Une seule s'affiche : la classe du moment, choisie avec
// l'heure, les horaires et les cours passés, ou celle qu'on choisit dans « Mes cours ».

import { apprenant } from './apprenant';
import { type Contexte, faits } from './contexte';
import { joursEntre } from './creneaux';
import { creer } from './creer';
import { attenteDAdjoint, sansClasse } from './entree';
import { type ClasseGardee, classes, ecrire, estResponsable, lire } from './etat';
import { formateur } from './formateur';
import { afficher, dateIso, esc, horaire, ic, jour } from './vue';

/// Ce qu'une classe dit de maintenant : de quoi choisir la classe du moment et ranger « Mes cours ».
export interface Moment {
  /// 2 : un appel ouvert, 1 : un cours aujourd'hui qui n'est pas fini, 0 : rien maintenant.
  urgence: number;
  /// Le début du cours de maintenant, ou du prochain cours connu, en millisecondes.
  prochain?: number;
  /// La demande d'entrée attend un responsable.
  attente?: boolean;
}

/// Le suivi d'une classe : ce que l'écran de la classe offre au reste de l'app.
export interface Suivi {
  readonly code: string;
  /// Le formateur ou le centre, plutôt que l'apprenant.
  readonly responsable: boolean;
  rendre(): void;
  /// Remet la classe à son écran d'entrée, sans dessiner.
  revenir(): void;
  aLEntree(): boolean;
  moment(): Moment;
  /// Le réseau a changé : la ligne de faits suit.
  reseau(): void;
  arreter(): void;
}

/// Ce que l'app offre au suivi d'une classe.
export interface Navigation {
  /// Sa classe est à l'écran : lui seul dessine.
  affichee(): boolean;
  /// Le téléphone suit plusieurs classes.
  plusieurs(): boolean;
  mesCours(): void;
  /// Quelque chose a changé qui peut faire de sa classe la classe du moment.
  aChange(): void;
  /// Sa classe a changé de nature, ou n'est plus là : un adjoint accepté, une demande retirée.
  relancer(): void;
}

let ctx: Contexte | undefined;
const suivis = new Map<string, Suivi>();
// La classe à l'écran, ou la dernière, quand « Mes cours » ou « Créer une classe » la recouvre.
let affichee: string | undefined;
let aLEcran: 'classe' | 'mes-cours' | 'ailleurs' = 'classe';
let visibiliteEcoutee = false;

/// « Mes cours » chez un formateur ou le centre, « Mes classes » chez un apprenant.
export const titreDesClasses = (): string => (classes().some(estResponsable) ? 'Mes cours' : 'Mes classes');

function suivre(classe: ClasseGardee): Suivi {
  const code = classe.code;
  const nav: Navigation = {
    affichee: () => aLEcran === 'classe' && affichee === code,
    plusieurs: () => suivis.size > 1,
    mesCours: ouvrirMesCours,
    aChange: reconsiderer,
    relancer: () => relancer(code),
  };
  if (classe.role === 'apprenant') return apprenant(ctx!, code, nav);
  if (estResponsable(classe) && classe.fil) return formateur(ctx!, code, nav);
  return attenteDAdjoint(ctx!, code, nav);
}

/// Ouvre les classes du téléphone, et montre celle demandée, ou la classe du moment.
export function ouvrirLesClasses(contexte: Contexte, code?: string): void {
  ctx = contexte;
  const gardees = classes();
  for (const [c, suivi] of suivis) {
    if (gardees.some((g) => g.code === c)) continue;
    suivi.arreter();
    suivis.delete(c);
  }
  for (const classe of gardees) if (!suivis.has(classe.code)) suivis.set(classe.code, suivre(classe));
  contexte.relais.changement = () => {
    if (aLEcran === 'mes-cours') ecranMesCours();
    else if (aLEcran === 'classe') suivis.get(affichee ?? '')?.reseau();
  };
  if (!visibiliteEcoutee) {
    visibiliteEcoutee = true;
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && reconsiderer());
  }
  if (!suivis.size) {
    affichee = undefined;
    aLEcran = 'ailleurs';
    return sansClasse(contexte);
  }
  montrer(code && suivis.has(code) ? code : classeDuMoment());
}

function montrer(code: string): void {
  if (affichee !== code) suivis.get(affichee ?? '')?.revenir();
  affichee = code;
  aLEcran = 'classe';
  ecrire('derniere-classe', code);
  const suivi = suivis.get(code)!;
  suivi.revenir();
  suivi.rendre();
}

// La classe du moment : un appel ouvert, puis un cours aujourd'hui qui n'est pas fini, puis le
// prochain cours le plus proche. À égalité, la dernière classe montrée.
const rangees = (): { suivi: Suivi; moment: Moment }[] => {
  const derniere = lire<string>('derniere-classe');
  const tard = (m: Moment) => m.prochain ?? Number.MAX_SAFE_INTEGER;
  return [...suivis.values()]
    .map((suivi) => ({ suivi, moment: suivi.moment() }))
    .sort((a, b) => b.moment.urgence - a.moment.urgence || tard(a.moment) - tard(b.moment) || Number(b.suivi.code === derniere) - Number(a.suivi.code === derniere));
};
const classeDuMoment = (): string => rangees()[0].suivi.code;

// Un appel s'ouvre dans une autre classe pendant qu'on regarde l'écran d'entrée d'une classe où
// rien ne presse : l'app montre celle de l'appel. Au milieu d'un geste, elle ne bouge pas.
function reconsiderer(): void {
  if (aLEcran !== 'classe' || !affichee) return;
  const actuelle = suivis.get(affichee);
  if (!actuelle?.aLEntree()) return;
  const meilleure = rangees()[0];
  if (meilleure.suivi.code !== affichee && meilleure.moment.urgence > actuelle.moment().urgence) montrer(meilleure.suivi.code);
}

function relancer(code: string): void {
  suivis.get(code)?.arreter();
  suivis.delete(code);
  const classe = classes().find((c) => c.code === code);
  if (classe) suivis.set(code, suivre(classe));
  if (aLEcran === 'mes-cours') ecranMesCours();
  else if (aLEcran === 'classe' && affichee === code) ouvrirLesClasses(ctx!, classe && code);
}

function ouvrirMesCours(): void {
  aLEcran = 'mes-cours';
  ecranMesCours();
}

// « aujourd'hui, 13 h 30 », « mer. 18, 9 h » dans la semaine, puis la date entière.
function quand(ms: number): string {
  const d = new Date(ms);
  const heure = horaire(`${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`);
  const dans = joursEntre(dateIso(Date.now()), dateIso(ms));
  if (dans === 0) return `aujourd’hui, ${heure}`;
  if (dans < 7) return `${new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(d)} ${d.getDate()}, ${heure}`;
  return `${jour(ms)}, ${heure}`;
}

// « Mes cours » range les classes par l'heure du prochain cours, pas par nom (conception, partie 4).
function ecranMesCours(): void {
  const { coeur, relais } = ctx!;
  const titre = titreDesClasses();
  const lignes = rangees().map(({ suivi, moment }) => {
    const classe = classes().find((c) => c.code === suivi.code)!;
    const porte = coeur.lire_porte(classe.code, classe.porte);
    const maintenant = moment.urgence === 2 || (moment.urgence === 1 && (moment.prochain ?? 0) <= Date.now());
    const etat = moment.attente ? 'demande envoyée' : maintenant ? 'maintenant' : moment.prochain ? quand(moment.prochain) : '';
    const ici = suivi.code === affichee;
    return `<button class="rangee${ici ? ' ici' : ''}" data-geste="choisir" data-code="${suivi.code}"${ici ? ' aria-current="true"' : ''}><div><b>${esc(porte.nom)}</b><span class="mono">${esc([etat, porte.centre].filter(Boolean).join(' · '))}</span></div>${ic('chevron-right')}</button>`;
  });
  const responsable = classes().some(estResponsable);
  afficher(
    'tel',
    titre,
    `<header class="barre"><h1 class="barre-titre" tabindex="-1">${titre}</h1></header>
     <main class="page">
       <div class="liste">${lignes.join('')}</div>
       ${responsable ? `<div class="note-gestes"><button class="btn" data-geste="creer">${ic('plus')}Créer une classe</button></div>` : ''}
     </main>
     <footer class="bas"><div class="gestes"><button class="btn retour" data-geste="retour">${ic('arrow-left', 'ic-20')}Retour</button></div>${faits(relais)}</footer>`,
    {
      choisir: (c) => ouvrirLesClasses(ctx!, c.dataset.code),
      creer: () => {
        aLEcran = 'ailleurs';
        creer(ctx!, undefined, {}, ouvrirMesCours);
      },
      retour: () => ouvrirLesClasses(ctx!, affichee),
    },
  );
}
