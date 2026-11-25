// Les classes de ce téléphone. Chacune a son suivi, qui lit ses lettres, ses annonces et sa porte
// même quand une autre est à l'écran. Une seule s'affiche : la classe du moment, choisie avec
// l'heure, les horaires et les cours passés, ou celle qu'on choisit dans « Mes cours ».

import { apprenant } from './apprenant';
import type { Coeur } from './coeur';
import { type Contexte, faits } from './contexte';
import { joursEntre } from './creneaux';
import { attenteDAdjoint, sansClasse } from './entree';
import { CLASSES_AU_PLUS, type ClasseGardee, classes, ecrire, estResponsable, garderClasse, lire } from './etat';
import { type Correspondance, afficherLesMessages } from './messages';
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
  rendre(): void;
  /// Remet la classe à son écran d'entrée, sans dessiner.
  revenir(): void;
  aLEntree(): boolean;
  moment(): Moment;
  /// Le réseau a changé : la ligne de faits suit.
  reseau(): void;
  arreter(): void;
  /// Chez un responsable : ceux à qui il peut écrire dans la classe, et ce qu'ils se sont écrit.
  correspondances?(): Correspondance[];
  /// Chez un responsable : ouvre la conversation avec quelqu'un de la classe.
  conversation?(cle: string): void;
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
  /// « Messages » chez un responsable, pour toutes ses classes. Depuis les entrées, la recherche
  /// repart de zéro ; au retour d'une conversation, elle reste.
  messages(depuisLeMenu?: boolean): void;
  /// Un message est arrivé, ou a été lu : la liste de « Messages » suit, si elle est à l'écran.
  messagesChangent(): void;
}

let ctx: Contexte | undefined;
const suivis = new Map<string, Suivi>();

// Les écrans des responsables se chargent à part : un apprenant ne les télécharge pas, et son
// premier chargement tient sous 300 Ko (docs/regles.md, partie 4).
let responsables: { formateur: typeof import('./formateur').formateur; creer: typeof import('./creer').creer } | undefined;
export async function chargerLesEcransDesResponsables(): Promise<NonNullable<typeof responsables>> {
  responsables ??= { formateur: (await import('./formateur')).formateur, creer: (await import('./creer')).creer };
  return responsables;
}
// La classe à l'écran, ou la dernière, quand « Mes cours » ou « Créer une classe » la recouvre.
let affichee: string | undefined;
let aLEcran: 'classe' | 'mes-cours' | 'messages' | 'ailleurs' = 'classe';
let visibiliteEcoutee = false;

/// « Mes cours » chez un formateur ou le centre, « Mes classes » chez un apprenant.
export const titreDesClasses = (): string => (classes().some(estResponsable) ? 'Mes cours' : 'Mes classes');

/// Les secrets d'une classe se tirent de son code en 140 ms, à chaque ouverture : le téléphone les
/// garde avec la classe, et le cœur les reprend (docs/mesures.md).
export function reprendreLesSecrets(coeur: Coeur, classe: ClasseGardee): void {
  try {
    if (classe.secrets) return coeur.reprendre_les_secrets(classe.code, classe.secrets);
  } catch {
    // Des secrets qu'il ne relit pas, le cœur les tire à nouveau du code.
  }
  garderClasse({ ...classe, secrets: coeur.secrets_de_la_classe(classe.code) });
}

/// Un téléphone suit dix classes au plus : en rejoindre ou en créer une de plus s'arrête là, et le dit.
export function plein(contexte: Contexte): boolean {
  if (classes().length < CLASSES_AU_PLUS) return false;
  ctx = contexte;
  aLEcran = 'ailleurs';
  history.replaceState(null, '', location.pathname + location.search);
  afficher(
    'tel',
    'Dix classes',
    `<header class="barre"><h1 class="barre-titre">Dix classes</h1></header>
     <main class="page"><section class="reponse">${ic('info-box', 'ic-32')}<div><h2 class="tres-gros" tabindex="-1">Dix classes au plus</h2><p class="mono">Ce téléphone en suit déjà ${CLASSES_AU_PLUS}. Une classe fermée libère sa place.</p></div></section></main>
     <footer class="bas"><div class="gestes"><button class="btn retour" data-geste="retour">${ic('arrow-left', 'ic-20')}Retour</button></div></footer>`,
    { retour: () => ouvrirLesClasses(contexte) },
  );
  return true;
}

function suivre(classe: ClasseGardee): Suivi {
  const code = classe.code;
  const nav: Navigation = {
    affichee: () => aLEcran === 'classe' && affichee === code,
    plusieurs: () => suivis.size > 1,
    mesCours: ouvrirMesCours,
    aChange: reconsiderer,
    relancer: () => relancer(code),
    messages: (depuisLeMenu = false) => ouvrirMessages(depuisLeMenu),
    messagesChangent: () => aLEcran === 'messages' && ecranMessages(),
  };
  if (classe.role === 'apprenant') return apprenant(ctx!, code, nav);
  if (estResponsable(classe) && classe.fil) return responsables!.formateur(ctx!, code, nav);
  return attenteDAdjoint(ctx!, code, nav);
}

/// Ouvre les classes du téléphone, et montre celle demandée, ou la classe du moment.
export function ouvrirLesClasses(contexte: Contexte, code?: string): void {
  ctx = contexte;
  const gardees = classes();
  if (!responsables && gardees.some((c) => estResponsable(c) && c.fil)) {
    chargerLesEcransDesResponsables().then(() => ouvrirLesClasses(contexte, code));
    return;
  }
  for (const [c, suivi] of suivis) {
    if (gardees.some((g) => g.code === c)) continue;
    suivi.arreter();
    suivis.delete(c);
  }
  for (const classe of gardees) {
    if (suivis.has(classe.code)) continue;
    reprendreLesSecrets(contexte.coeur, classe);
    suivis.set(classe.code, suivre(classe));
  }
  contexte.relais.changement = () => {
    if (aLEcran === 'mes-cours') ecranMesCours();
    else if (aLEcran === 'messages') ecranMessages();
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
  // Un adjoint accepté devient responsable : ses écrans se chargent d'abord.
  const devenu = classes().find((c) => c.code === code);
  if (!responsables && devenu && estResponsable(devenu) && devenu.fil) {
    chargerLesEcransDesResponsables().then(() => relancer(code));
    return;
  }
  suivis.get(code)?.arreter();
  suivis.delete(code);
  const classe = classes().find((c) => c.code === code);
  if (classe) suivis.set(code, suivre(classe));
  if (aLEcran === 'mes-cours') ecranMesCours();
  else if (aLEcran === 'classe' && affichee === code) ouvrirLesClasses(ctx!, classe ? code : undefined);
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
  const pourCreer = classes().length < CLASSES_AU_PLUS
    ? `<div class="note-gestes"><button class="btn" data-geste="creer">${ic('plus')}Créer une classe</button></div>`
    : `<p class="mono">Dix classes au plus sur ce téléphone.</p>`;
  afficher(
    'tel',
    titre,
    `<header class="barre"><h1 class="barre-titre" tabindex="-1">${titre}</h1></header>
     <main class="page">
       <div class="liste">${lignes.join('')}</div>
       ${responsable ? pourCreer : ''}
     </main>
     <footer class="bas"><div class="gestes"><button class="btn retour" data-geste="retour">${ic('arrow-left', 'ic-20')}Retour</button></div>${faits(relais)}</footer>`,
    {
      choisir: (c) => ouvrirLesClasses(ctx!, c.dataset.code),
      creer: () => {
        aLEcran = 'ailleurs';
        chargerLesEcransDesResponsables().then((r) => r.creer(ctx!, undefined, {}, ouvrirMesCours));
      },
      retour: () => ouvrirLesClasses(ctx!, affichee),
    },
  );
}

// « Messages » chez un responsable : toutes ses classes, rangées par ce qui attend une réponse.
function ouvrirMessages(depuisLeMenu: boolean): void {
  aLEcran = 'messages';
  ecranMessages(depuisLeMenu);
}

function ecranMessages(depuisLeMenu = false): void {
  const moi = lire<{ prenom: string; nom: string }>('moi');
  afficherLesMessages({
    qui: moi ? `${moi.prenom} ${moi.nom}` : '',
    correspondances: [...suivis.values()].flatMap((s) => s.correspondances?.() ?? []),
    faits: faits(ctx!.relais),
    depuisLeMenu,
    gestes: {
      ecrire: (c) => {
        const suivi = suivis.get(c.dataset.code!);
        if (!suivi?.conversation) return;
        if (affichee !== suivi.code) suivis.get(affichee ?? '')?.revenir();
        affichee = suivi.code;
        aLEcran = 'classe';
        ecrire('derniere-classe', suivi.code);
        suivi.conversation(c.dataset.cle!);
      },
      retour: () => ouvrirLesClasses(ctx!, affichee),
    },
  });
}
