// Les messages privés. L'apprenant écrit aux responsables de sa classe, un responsable à un
// apprenant ou à un autre responsable. Chaque message part signé, scellé dans la boîte de celui
// à qui il est écrit. Le téléphone garde les conversations jusqu'à la fermeture de la classe, ne
// montre un message reçu qu'une fois arrivé, et ne dit à personne qu'on l'a ouvert (règle 3).

import { tropLong } from './annonces';
import type { Coeur } from './coeur';
import { afficher, aQuelMoment, dateIso, esc, heure, ic, jour } from './vue';

/// Un message privé, déjà vérifié. `nouveau` marque un message reçu qu'on n'a pas encore ouvert.
export interface MessageGarde {
  de: string;
  pour: string;
  quand: number;
  arrivee: number;
  /// L'annonce de la classe à laquelle il répond.
  annonce?: string;
  texte: string;
  nouveau?: boolean;
}

/// Relit un message de la classe entre soi et l'une des clés données, ou rien.
export function lireMessage(coeur: Coeur, code: string, texte: string, moi: string, autres: string[]): MessageGarde | undefined {
  try {
    const m = coeur.lire_message(code, texte, moi, autres);
    return { de: m.de, pour: m.pour, quand: m.quand, arrivee: m.arrivee, ...(m.annonce ? { annonce: m.annonce } : {}), texte: m.texte };
  } catch {
    return undefined;
  }
}

/// Au rechargement, les relais renvoient les lettres du mois : un message déjà gardé ne change rien.
export const dejaGarde = (messages: MessageGarde[], m: MessageGarde): boolean =>
  messages.some((x) => x.de === m.de && x.pour === m.pour && x.quand === m.quand);

/// La conversation avec une personne : ses messages une fois arrivés, et tous ceux qu'on lui a écrits.
export const avec = (messages: MessageGarde[], cle: string, maintenant = Date.now()): MessageGarde[] =>
  messages.filter((m) => (m.de === cle && m.arrivee <= maintenant) || m.pour === cle).sort((a, b) => a.quand - b.quand);

/// Les messages arrivés qu'on n'a pas encore ouverts.
export const nonLus = (messages: MessageGarde[], maintenant = Date.now()): MessageGarde[] =>
  messages.filter((m) => m.nouveau && m.arrivee <= maintenant).sort((a, b) => a.quand - b.quand);

/// Ouvrir une conversation marque ses messages arrivés comme lus, sur ce téléphone seulement.
/// Rend la liste à jour, ou rien si elle ne change pas.
export function marquerLus(messages: MessageGarde[], cle: string, maintenant = Date.now()): MessageGarde[] | undefined {
  const lu = (m: MessageGarde) => m.nouveau && m.de === cle && m.arrivee <= maintenant;
  if (!messages.some(lu)) return undefined;
  return messages.map((m) => (lu(m) ? { ...m, nouveau: undefined } : m));
}

/// « Awa Diallo t'a écrit », une ligne par personne, pour « À lire » et « À suivre ».
export function lignesDesNonLus(messages: MessageGarde[], nomDe: (cle: string) => string, maintenant = Date.now()): string[] {
  const parPersonne = new Map<string, MessageGarde>();
  for (const m of nonLus(messages, maintenant)) parPersonne.set(m.de, m);
  return [...parPersonne.values()].map(
    (m) =>
      `<button class="rangee" data-geste="conversation" data-cle="${esc(m.de)}">${ic('message-text', 'ic-20')}<div><b>${esc(nomDe(m.de))} t’a écrit</b><span class="mono">${jour(m.quand)} · ${heure(m.quand)}</span></div>${ic('chevron-right')}</button>`,
  );
}

/// Les bulles d'une conversation, comme dans les maquettes : la date quand le jour change, et
/// l'heure d'arrivée d'un message qui attend l'ouverture de la classe.
export function bullesHtml(messages: MessageGarde[], moi: string, reponseA: (annonce: string) => string, maintenant = Date.now()): string {
  let jourAvant = '';
  return messages
    .map((m) => {
      const jourDuMessage = dateIso(m.quand);
      const quand = jourDuMessage === jourAvant ? heure(m.quand) : `${jour(m.quand)} · ${heure(m.quand)}`;
      jourAvant = jourDuMessage;
      const attend = m.arrivee > maintenant ? ` · arrivera ${aQuelMoment(m.arrivee, maintenant)}` : '';
      const reponse = m.annonce ? ` · ${reponseA(m.annonce)}` : '';
      return `<p class="bulle${m.de === moi ? ' moi' : ''}">${esc(m.texte).replace(/\n/g, '<br>')}<span class="mono">${quand}${attend}${reponse}</span></p>`;
    })
    .join('');
}

/// Ce qu'une conversation montre : à qui on écrit, ce qui s'est dit, et le message en cours.
export interface Conversation {
  qui: string;
  /// Sous le nom, dans la barre : son rôle, ou sa classe.
  sous: string;
  bulles: string;
  libelle: string;
  brouillon: string;
  erreur?: string;
  /// L'heure où arriverait le message envoyé maintenant.
  arrive: number;
  /// La ligne du bas quand la classe est fermée : l'heure, et quand elle rouvre.
  horsDesHeures: string;
  /// La ligne du bas le reste du temps.
  faits: string;
  gestes: Parameters<typeof afficher>[3];
  /// Le message en cours suit la saisie : un redessin ne le perd pas.
  saisie: (texte: string) => void;
}

const retour = `<button class="btn retour" data-geste="retour">${ic('arrow-left', 'ic-20')}Retour</button>`;

/// La fenêtre d'une conversation. La barre dit à qui part le message (règle 1). Écrit en dehors
/// des heures de la classe, il arrive à l'ouverture suivante : la touche le dit.
export function afficherConversation(c: Conversation): void {
  const maintenant = Date.now();
  const horsDesHeures = c.arrive > maintenant;
  const ecrit = document.activeElement?.id === 'message' ? (document.activeElement as HTMLTextAreaElement) : undefined;
  const selection = ecrit ? [ecrit.selectionStart, ecrit.selectionEnd] : undefined;
  const avant = document.querySelector('#message');
  afficher(
    'tel',
    c.qui,
    `<header class="barre"><h1 class="barre-titre" tabindex="-1">${esc(c.qui)}</h1><span class="mono">${esc(c.sous)}</span></header>
     <main class="page">
       ${c.bulles}
       <div style="flex: 1"></div>
       <div class="bloc"><label class="champ-nom" for="message">${esc(c.libelle)}</label>
         <textarea id="message" class="champ${c.erreur ? ' faux' : ''}" rows="3"${c.erreur ? ' aria-describedby="erreur-message"' : ''}>${esc(c.brouillon)}</textarea>
         ${c.erreur ? `<p class="erreur" id="erreur-message">${ic('info-box')}<span>${esc(c.erreur)}</span></p>` : ''}</div>
     </main>
     <footer class="bas"><div class="gestes">${retour}<button class="touche" data-geste="envoyerMessage">${ic('send', 'ic-24')}<span>Envoyer${horsDesHeures ? `<small>arrivera ${aQuelMoment(c.arrive, maintenant)}</small>` : ''}</span></button></div>${horsDesHeures && c.horsDesHeures ? c.horsDesHeures : c.faits}</footer>`,
    c.gestes,
    !!ecrit,
  );
  const champ = document.querySelector<HTMLTextAreaElement>('#message')!;
  champ.oninput = () => c.saisie(champ.value);
  if (selection) {
    champ.focus();
    champ.setSelectionRange(selection[0], selection[1]);
  }
  // Le dernier message est en bas, près du champ. Un écran qui n'a pas changé garde sa place :
  // on relit peut-être un message plus haut.
  const page = document.querySelector<HTMLElement>('main.page');
  if (page && champ !== avant) page.scrollTop = page.scrollHeight;
}

/// Ce que dit l'écran, sous le champ, quand le message ne part pas.
export const phraseDuMessage = (texte: string): string | undefined =>
  !texte.trim() ? 'Écris ton message.' : tropLong(texte) ? 'Ce message est trop long : coupe-le en deux.' : undefined;

/// Quelqu'un à qui écrire, dans une classe.
export interface Correspondant {
  code: string;
  /// Le nom de sa classe.
  classe: string;
  cle: string;
  nom: string;
  /// « formateur » ou « centre » pour un responsable ; rien pour un apprenant.
  role?: string;
}

/// Une personne et ce qu'on s'est écrit, dans une classe.
export interface Correspondance {
  correspondant: Correspondant;
  fil: MessageGarde[];
}

const sansAccents = (t: string) => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

// La liste reste au même endroit quand on revient d'une conversation : ce qu'on cherchait aussi.
let recherche = '';

/// « Messages » chez un responsable, pour toutes ses classes : en haut, ceux qui attendent une
/// réponse, le plus ancien d'abord, puis ceux à qui il a répondu. Chercher un nom trouve aussi
/// ceux à qui il n'a pas encore écrit.
export function afficherLesMessages(o: { qui: string; correspondances: Correspondance[]; faits: string; gestes: Parameters<typeof afficher>[3]; depuisLeMenu?: boolean }): void {
  if (o.depuisLeMenu) recherche = '';
  const doublons = new Set(o.correspondances.map((c) => c.correspondant.cle).filter((cle, n, toutes) => toutes.indexOf(cle) !== n));
  const qualite = (c: Correspondant) => (c.role ? (doublons.has(c.cle) ? `${c.role} · ${c.classe}` : c.role) : c.classe);
  // Le premier message qui attend : le sien qui suit ma dernière réponse.
  const enAttente = (x: Correspondance) => {
    const dernier = x.fil.at(-1);
    if (!dernier || dernier.de !== x.correspondant.cle) return undefined;
    let premier = x.fil.length - 1;
    while (premier > 0 && x.fil[premier - 1].de === x.correspondant.cle) premier--;
    return x.fil[premier];
  };
  const rangee = (x: Correspondance) => {
    const attend = enAttente(x);
    const dernier = x.fil.at(-1);
    const quand = attend ? `${jour(attend.quand)} · ${heure(attend.quand)}` : dernier ? jour(dernier.quand) : '';
    return `<button class="rangee${!attend && dernier ? ' faite' : ''}" data-geste="ecrire" data-code="${esc(x.correspondant.code)}" data-cle="${esc(x.correspondant.cle)}"><div><b>${esc(x.correspondant.nom)}</b><span class="mono">${esc([qualite(x.correspondant), quand].filter(Boolean).join(' · '))}</span></div>${ic('chevron-right')}</button>`;
  };
  const section = (titre: string, lignes: Correspondance[]) =>
    lignes.length ? `<section class="bloc"><p class="etiquette">${titre}</p><div class="liste">${lignes.map(rangee).join('')}</div></section>` : '';
  const resultats = () => {
    if (recherche.trim()) {
      const cherche = sansAccents(recherche.trim());
      const trouves = o.correspondances.filter((x) => sansAccents(x.correspondant.nom).includes(cherche)).sort((a, b) => a.correspondant.nom.localeCompare(b.correspondant.nom, 'fr'));
      return trouves.length ? section(trouves.length > 1 ? `${trouves.length} personnes` : '1 personne', trouves) : '<p class="mono">Personne ne porte ce nom dans tes classes.</p>';
    }
    const ecrites = o.correspondances.filter((x) => x.fil.length);
    const attendent = ecrites.filter(enAttente).sort((a, b) => enAttente(a)!.quand - enAttente(b)!.quand);
    const repondues = ecrites.filter((x) => !enAttente(x)).sort((a, b) => b.fil.at(-1)!.quand - a.fil.at(-1)!.quand);
    const liste = `${section('T’ont écrit, le plus ancien d’abord', attendent)}${section('Tu as répondu', repondues)}`;
    return liste || '<p class="mono">Pas encore de message. Cherche un nom pour écrire.</p>';
  };
  const ecrit = document.activeElement?.id === 'chercher' ? (document.activeElement as HTMLInputElement) : undefined;
  const selection = ecrit ? [ecrit.selectionStart, ecrit.selectionEnd] : undefined;
  afficher(
    'tel',
    'Messages',
    `<header class="barre"><h1 class="barre-titre" tabindex="-1">Messages</h1><span class="mono">${esc(o.qui)}</span></header>
     <main class="page">
       <label class="champ-nom" for="chercher">Chercher un nom, pour lire ou pour écrire</label>
       <input id="chercher" class="champ" value="${esc(recherche)}" inputmode="search" autocomplete="off" autocorrect="off" spellcheck="false">
       <div id="resultats">${resultats()}</div>
     </main>
     <footer class="bas"><div class="gestes">${retour}</div>${o.faits}</footer>`,
    o.gestes,
    !!ecrit,
  );
  const champ = document.querySelector<HTMLInputElement>('#chercher')!;
  champ.oninput = () => {
    recherche = champ.value;
    document.querySelector('#resultats')!.innerHTML = resultats();
  };
  if (selection) {
    champ.focus();
    champ.setSelectionRange(selection[0], selection[1]);
  }
}
