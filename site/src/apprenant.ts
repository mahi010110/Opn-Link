// Le téléphone de l'apprenant, dans une classe : attendre d'être accepté, puis signer sa présence.
// Il apprend sur le fil de la classe que l'appel est ouvert, puis clos, et le prochain cours.
// Sans réseau, il ne peut pas savoir si l'appel est ouvert : la touche « Signer ma présence »
// reste là pendant les heures de la classe. Sans réponse au bout de dix secondes, l'écran montre
// seul le QR à tendre au formateur.

import { type AnnonceDeLaClasse, ecouter, enVigueur, garderLaVersion, lireAnnonce, noteHtml, relireLesAnnonces, toucheEcouter } from './annonces';
import { couper, poser, viser } from './camera';
import { type Moment, type Navigation, type Suivi, titreDesClasses } from './classes';
import { type Contexte, faits, nomDe } from './contexte';
import { type Creneau, type Demi, arrivee, bornes, enJour, joursEntre, ouvre, plusJours, rang, sansCours } from './creneaux';
import { type Erreurs, nomTape } from './entree';
import { type AnnonceGardee, type PresenceGardee, classes, ecrire, garderClasse, lire, oublierClasse } from './etat';
import { ecouterLaPorte, ecouterLeFil, envoyer, envoyerUnMessage, recevoir } from './lettres';
import { afficherConversation, avec, bullesHtml, dejaGarde, lignesDesNonLus, lireMessage, marquerLus, nonLus, phraseDuMessage } from './messages';
import { type PourQui, afficherMoi, afficherNom } from './moi';
import { nomCorrige, nomsAJour, nomsDesResponsables, passationsDe, porteAJour } from './responsables';
import { type CeQueSaitLeTelephone, absences, ajusterLaSemaine, semaineHtml } from './semaine';
import { phrase } from './textes';
import { aQuelMoment, afficher, dateIso, demiJournee, esc, heure, horaire, ic, installable, installer, jour, surIPhone, surLEcranDAccueil } from './vue';

type Vue =
  | { ecran: 'jour' }
  | { ecran: 'signer'; chiffres: string; erreur?: string; erreurQr?: string; sansCamera?: boolean }
  | { ecran: 'sans-reseau' }
  | { ecran: 'moi' }
  | { ecran: 'nom'; prenom: string; nom: string; erreurs?: Erreurs }
  | { ecran: 'classe' }
  | { ecran: 'messages' }
  | { ecran: 'conversation'; cle: string; brouillon: string; annonce?: string; erreur?: string; retour: 'jour' | 'classe' | 'messages' };

type Annonce = ReturnType<Contexte['coeur']['lire_annonce_de_l_appel']>;
interface Prochain extends Creneau {
  quand: number;
  par: string;
}

const SANS_REPONSE_MS = 10_000;
// Les présences signées se gardent huit semaines, les annonces de l'appel une semaine : de quoi
// dessiner la semaine, et bientôt les semaines d'avant.
const HUIT_SEMAINES = 56;
const UNE_SEMAINE = 7;
// Safari efface les données d'un site après sept jours sans visite (docs/mesures.md).
const SANS_VISITE_JOURS = 7;
// Le temps de joindre un relais au démarrage, avant de conclure qu'il n'y a pas de réseau.
const HORS_LIGNE_MS = 5_000;
const MENU = `<nav class="menu" aria-label="Entrées"><a href="#" data-geste="classe">Classe</a><a href="#" data-geste="messages">Messages</a><a href="#">Mes documents</a><a href="#" data-geste="moi">Moi</a></nav>`;
const POUR_LES_RESPONSABLES: PourQui = {
  voit: 'le nom que voient les responsables',
  part: 'part aux responsables',
  verront: 'Les responsables de la classe verront ton nouveau nom, et l’ancien à côté.',
};
const ANNULER_MS = 30_000;
const SEPT_JOURS_MS = 7 * 86_400_000;
// Les noms corrigés qui attendent leur porte : une poignée suffit, le reste revient chaque jour.
const NOMS_EN_SUSPENS = 20;

export function apprenant(ctx: Contexte, code: string, nav: Navigation): Suivi {
  const { coeur, relais, moi } = ctx;
  let classe = classes().find((c) => c.code === code)!;
  let porte = coeur.lire_porte(classe.code, classe.porte);
  let vue: Vue = { ecran: 'jour' };
  let arrete = false;
  const demarrage = Date.now();
  const depuis = (jours: number) => plusJours(dateIso(Date.now()), -jours);
  let presences = (classe.presences ?? []).filter((p) => p.date >= depuis(HUIT_SEMAINES));
  // Les annonces de l'appel, une par séance : la plus récente compte.
  let annonces = (classe.annoncesAppel ?? []).filter((a) => a.date >= depuis(UNE_SEMAINE));
  let prochain = classe.prochain as Prochain | undefined;
  if (prochain && prochain.date < depuis(UNE_SEMAINE)) prochain = undefined;
  let annoncesDeLaClasse = relireLesAnnonces(coeur, classe.fil, classe.annoncesDeLaClasse, porte.responsables.map((r) => r.cle));
  let messages = classe.messages ?? [];
  const garder = () => {
    classe = { ...classe, presences, annoncesAppel: annonces, prochain, annoncesDeLaClasse: annoncesDeLaClasse.map((a) => a.signee), messages };
    garderClasse(classe);
  };

  const nomDuResponsableDe = (r: (typeof porte.responsables)[number]) => nomDe(nomCorrige(ctx, classe.code, classe.noms, r));
  const formateur = () => nomDuResponsableDe(porte.responsables[0]);
  const maintenant = () => Date.now();
  const demi = () => demiJournee(maintenant(), porte.apres_midi);
  const creneau = (ms: number): Creneau => ({ date: dateIso(ms), demi: demiJournee(ms, porte.apres_midi) });
  const seance = () => coeur.seance(classe.code, dateIso(maintenant()), demi());
  const nomDuResponsable = (cle: string) => {
    const r = porte.responsables.find((x) => x.cle === cle);
    return r ? nomDuResponsableDe(r) : formateur();
  };
  // Un appel ouvert aujourd'hui passe d'abord ; sinon, l'annonce de la demi-journée en cours.
  const annonceDuMoment = (): AnnonceGardee | undefined => {
    const aujourdhui = annonces.filter((a) => a.date === dateIso(maintenant()));
    return aujourdhui.find((a) => a.etat === 'ouvert') ?? aujourdhui.find((a) => a.demi === demi());
  };
  const seanceDuMoment = () => annonceDuMoment()?.seance ?? seance();
  // Un QR lu en face de l'écran de la salle dit sa séance. Sans annonce, il peut être celui du
  // matin ou de l'après-midi : un appel se lance parfois un peu avant l'heure.
  const seancesDuQr = () => {
    const annonce = annonceDuMoment();
    if (annonce) return [annonce.seance];
    const date = dateIso(maintenant());
    return [coeur.seance(classe.code, date, 'matin'), coeur.seance(classe.code, date, 'apres-midi')];
  };
  const cetteFois = () => presences.find((p) => p.seance === seanceDuMoment());
  // La demi-journée d'une séance que le téléphone vient de signer : celle d'une annonce, ou du jour.
  const creneauDe = (s: string): Creneau => {
    const a = annonces.find((x) => x.seance === s);
    if (a) return { date: a.date, demi: a.demi };
    const date = dateIso(maintenant());
    return { date, demi: coeur.seance(classe.code, date, 'matin') === s ? 'matin' : 'apres-midi' };
  };
  const sait = (): CeQueSaitLeTelephone => ({
    maintenant: creneau(maintenant()),
    presences,
    appels: annonces,
    prochain: prochain && { annonce: creneau(prochain.quand), cours: prochain },
  });
  const sansCoursMaintenant = () => !ouvre(dateIso(maintenant())) || (!!prochain && sansCours(creneau(maintenant()), creneau(prochain.quand), prochain));
  // Un appel peut venir : un jour de cours, avant la fin de la demi-journée en cours.
  const appelAttendu = () => {
    if (sansCoursMaintenant()) return false;
    const fin = (demi() === 'matin' ? porte.matin : porte.apres_midi).split('-')[1];
    const [h, m] = fin.split(':').map(Number);
    const d = new Date(maintenant());
    return d.getHours() * 60 + d.getMinutes() < h * 60 + m;
  };
  const debutDe = (c: Creneau) => horaire((c.demi === 'matin' ? porte.matin : porte.apres_midi).split('-')[0]);
  const nomDeLaDemi = (d: string) => (d === 'matin' ? 'matin' : 'après-midi');
  const horsLigne = () => !relais.ouvert && Date.now() - demarrage > HORS_LIGNE_MS;
  // La barre dit où l'app croit que tu es : au centre, en entreprise, ou le centre fermé le week-end.
  // Avec plusieurs classes, le nom de la classe est écrit à côté, et permet d'en changer.
  const barre = (ouvert = false) => {
    const classeIci = nav.plusieurs() ? `<button class="btn" data-geste="mesClasses">${esc(porte.nom)}</button>` : '';
    if (sansCoursMaintenant()) {
      const lieu = ouvre(dateIso(maintenant())) ? 'En entreprise' : 'Centre fermé';
      return `<header class="barre pas-maintenant"><h1 class="barre-titre" tabindex="-1">${lieu}</h1><span class="mono">${jour(maintenant())}</span>${classeIci}</header>`;
    }
    return `<header class="barre${ouvert ? ' maintenant' : ''}"><h1 class="barre-titre" tabindex="-1">Au centre</h1><span class="mono">${jour(maintenant())} · ${heure(maintenant())}</span>${classeIci}</header>`;
  };

  const responsables = () => porte.responsables.map((r) => r.cle);
  const recevoirProchain = (texte: string) => {
    let p;
    try {
      p = coeur.lire_prochain_cours(classe.fil!, texte, responsables());
    } catch {
      return; // Un prochain cours qu'un responsable n'a pas signé ne compte pas.
    }
    if (prochain && prochain.quand >= p.quand) return;
    prochain = { date: p.date, demi: p.demi as Demi, quand: p.quand, par: p.par };
    garder();
    if (vue.ecran === 'jour') rendre();
  };
  // Une annonce à la classe : sa version la plus récente compte, et elle se montre une fois arrivée.
  const recevoirUneAnnonce = (a: AnnonceDeLaClasse) => {
    const ajour = garderLaVersion(annoncesDeLaClasse, a);
    if (!ajour) return;
    annoncesDeLaClasse = ajour;
    garder();
    if (vue.ecran === 'jour' || vue.ecran === 'classe') rendre();
  };
  const recevoirDuFil = (texte: string) => {
    const deLaClasse = lireAnnonce(coeur, classe.fil!, texte, responsables());
    if (deLaClasse) return recevoirUneAnnonce(deLaClasse);
    let a: Annonce;
    try {
      a = coeur.lire_annonce_de_l_appel(classe.code, classe.fil!, texte, responsables());
    } catch {
      return recevoirProchain(texte); // Le fil porte aussi le prochain cours.
    }
    if (a.date < depuis(UNE_SEMAINE)) return;
    const avant = annonces.find((x) => x.seance === a.seance);
    if (avant && avant.quand >= a.quand) return;
    annonces = [...annonces.filter((x) => x.seance !== a.seance), { seance: a.seance, date: a.date, demi: a.demi as Demi, etat: a.etat, quand: a.quand, par: a.par }];
    garder();
    if (vue.ecran === 'jour') rendre();
    nav.aChange();
  };
  const arrets: (() => void)[] = [];
  const ecouterLAppel = () => {
    if (classe.fil) arrets.push(ecouterLeFil(coeur, relais, classe.fil, recevoirDuFil));
  };
  // Le nom corrigé d'un responsable voyage avec la porte. Les relais ne rendent pas les textes dans
  // l'ordre : celui d'un adjoint peut arriver avant la porte qui le nomme, et attend qu'elle vienne.
  const nomsEnSuspens = new Set<string>();
  const prendreLesNoms = (textes: string[]): boolean => {
    const verifies = nomsDesResponsables(ctx, classe.code, classe.porte, textes);
    for (const texte of textes) if (!verifies.includes(texte)) nomsEnSuspens.add(texte);
    for (const texte of verifies) nomsEnSuspens.delete(texte);
    if (nomsEnSuspens.size > NOMS_EN_SUSPENS) nomsEnSuspens.delete(nomsEnSuspens.values().next().value!);
    const noms = nomsAJour(ctx, classe.code, [...(classe.noms ?? []), ...verifies]);
    if (noms.join() === (classe.noms ?? []).join()) return false;
    classe = { ...classe, noms };
    return true;
  };
  // La porte change quand le chef nomme un adjoint ou passe la main : le téléphone la suit, pour
  // envoyer sa présence à chaque responsable et reconnaître leurs annonces.
  const estUnNom = (texte: string) => {
    try {
      coeur.lire_correction_de_nom(classe.code, texte);
      return true;
    } catch {
      return false;
    }
  };
  const suivreLaPorte = (texte: string) => {
    if (estUnNom(texte)) {
      if (!prendreLesNoms([texte])) return;
    } else {
      const passations = [...new Set([...(classe.passations ?? []), ...passationsDe(ctx, classe.code, [texte])])];
      const nouvelle = porteAJour(ctx, classe.code, classe.porte, [texte, ...passations]);
      if (nouvelle === classe.porte && passations.length === (classe.passations ?? []).length) return;
      classe = { ...classe, porte: nouvelle, passations };
      porte = coeur.lire_porte(classe.code, nouvelle);
      prendreLesNoms([...nomsEnSuspens]);
    }
    garder();
    if (vue.ecran === 'jour') rendre();
  };

  const attente = () => {
    const demande = coeur.lire_demande(classe.code, classe.demande!);
    afficher(
      'tel',
      porte.nom,
      `<header class="barre pas-maintenant"><h1 class="barre-titre">${esc(porte.nom)}</h1><span class="mono">${esc(porte.centre)}</span>${nav.plusieurs() ? `<button class="btn" data-geste="mesClasses">${titreDesClasses()}</button>` : ''}</header>
       <main class="page">
         <section class="reponse">${ic('clock', 'ic-32')}<div><h2 class="tres-gros" tabindex="-1">Demande envoyée</h2><p class="mono">${heure(demande.quand)} · un responsable va t’accepter</p></div></section>
         <div class="liste"><div class="rangee"><div><b>${esc(nomDe(demande))}</b><span class="mono">le nom que verront les responsables</span></div></div></div>
         <p class="mono">Tu n’as rien à faire. La classe s’ouvre ici dès que c’est accepté.</p>
         <div class="note-gestes"><button class="btn" data-geste="pasMaClasse">Ce n’est pas ma classe</button></div>
       </main>
       <footer class="bas">${faits(relais, `Demande partie · ${heure(demande.quand)}`)}</footer>`,
      {
        pasMaClasse: () => {
          oublierClasse(classe.code);
          nav.relancer();
        },
        mesClasses: () => nav.mesCours(),
      },
    );
  };

  const versSigner = (chiffres = '', erreur?: string) => {
    const sansCamera = vue.ecran === 'signer' && vue.sansCamera;
    vue = { ecran: 'signer', chiffres, erreur, sansCamera };
    rendre();
    if (sansCamera || !nav.affichee()) return;
    viser(coeur, signerLeQr).then((ouverte) => {
      if (ouverte || vue.ecran !== 'signer') return;
      vue = { ...vue, sansCamera: true };
      rendre();
    });
  };

  const signerLeQr = (qr: string) => {
    if (vue.ecran !== 'signer') return;
    let seanceLue: string | undefined;
    try {
      seanceLue = coeur.seance_du_qr(qr);
    } catch {
      // Ce n'est pas le QR d'un appel : celui de la classe, ou un autre.
    }
    const erreur = !seanceLue ? 'autre-qr' : seancesDuQr().includes(seanceLue) ? undefined : 'autre-seance';
    if (erreur || !seanceLue) {
      if (vue.erreurQr !== erreur) {
        vue = { ...vue, erreurQr: erreur };
        rendre();
      }
      return;
    }
    envoyerPresence(seanceLue, moi.signer_qr(qr, maintenant()));
  };

  const signer = (chiffres: string) => {
    let presence: string;
    try {
      presence = moi.signer_code(seanceDuMoment(), chiffres, maintenant());
    } catch {
      vue = { ...vue, ecran: 'signer', chiffres, erreur: 'code-inconnu' };
      return rendre();
    }
    envoyerPresence(seanceDuMoment(), presence);
  };

  const envoyerPresence = (seanceSignee: string, presence: string) => {
    couper();
    const garde: PresenceGardee = { seance: seanceSignee, ...creneauDe(seanceSignee), presence, signee: maintenant() };
    presences = [...presences.filter((p) => p.seance !== seanceSignee), garde];
    garder();
    for (const r of porte.responsables) envoyer(coeur, relais, r.boite, { v: 1, t: 'presence', presence });
    vue = { ecran: 'jour' };
    setTimeout(() => {
      const encore = presences.find((p) => p.seance === seanceSignee);
      if (encore?.signee === garde.signee && !encore.recu && vue.ecran === 'jour') {
        vue = { ecran: 'sans-reseau' };
        rendre();
      }
    }, SANS_REPONSE_MS);
    rendre();
  };

  const taper = (chiffre: string) => {
    if (vue.ecran !== 'signer') return;
    const chiffres = vue.erreur ? chiffre : (vue.chiffres + chiffre).slice(0, 6);
    vue = { ...vue, chiffres, erreur: undefined, erreurQr: undefined };
    if (chiffres.length === 6) return signer(chiffres);
    rendre();
  };

  const effacer = () => {
    if (vue.ecran !== 'signer') return;
    vue = { ...vue, chiffres: vue.chiffres.slice(0, -1), erreur: undefined, erreurQr: undefined };
    rendre();
  };

  // Demandé une fois, juste après la première présence signée, avec la raison, puis redemandé
  // une seule fois quand le prochain cours est à plus de sept jours (conception, partie 4).
  const demandeDAccueil = (): 'accueil-propose' | 'accueil-redemande' | undefined => {
    if (surLEcranDAccueil() || !(surIPhone() || installable())) return undefined;
    if (!lire<number>('accueil-propose')) return cetteFois()?.recu ? 'accueil-propose' : undefined;
    const loin = prochain && joursEntre(dateIso(maintenant()), prochain.date) > SANS_VISITE_JOURS;
    return loin && !lire<number>('accueil-redemande') ? 'accueil-redemande' : undefined;
  };
  const accueil = (demande: 'accueil-propose' | 'accueil-redemande') => {
    // La date ne finit jamais la phrase : « nov. » porte déjà un point, « mai » n'en a pas.
    const cours = demande === 'accueil-redemande' && prochain ? `Ton prochain cours est le ${jour(enJour(prochain.date).getTime())} : ` : '';
    if (surIPhone()) {
      return `<section class="fen"><header class="barre"><h2 class="barre-titre">Sur cet iPhone</h2></header><div class="fen-corps">
        <h3 class="gros">Garde Opn-Link sur ton écran d’accueil</h3>
        <p class="lu">${cours ? `${cours}d’ici là, sans visite, l’iPhone peut effacer tes données après 7 jours.` : 'Sinon, l’iPhone peut effacer tes données après 7 jours sans visite.'}</p>
        <ol class="pas">
          <li><span class="mono">1</span><span>Touche <b>Partager</b> ${ic('upload')}, en bas de l’écran</span></li>
          <li><span class="mono">2</span><span><b>Sur l’écran d’accueil</b></span></li>
          <li><span class="mono">3</span><span><b>Ajouter</b></span></li>
        </ol>
        <div class="note-gestes"><button class="btn" data-geste="plusTard">Plus tard</button></div>
      </div></section>`;
    }
    return `<section class="fen"><header class="barre"><h2 class="barre-titre">Sur ce téléphone</h2></header><div class="fen-corps">
      <h3 class="gros">Garde Opn-Link sur ton écran d’accueil</h3>
      <p class="lu">${cours ? `${cours}tu le retrouves d’un geste, même sans réseau.` : 'Tu le retrouves d’un geste, même sans réseau.'}</p>
      <div class="note-gestes"><button class="btn" data-geste="plusTard">Plus tard</button></div>
    </div></section>`;
  };

  // Le nom que voient les responsables : la dernière correction signée, sinon celui de l'acceptation.
  const monNom = (): { prenom: string; nom: string } => {
    try {
      if (classe.nom) return coeur.lire_correction_de_nom(classe.code, classe.nom);
      return coeur.lire_acceptation(classe.code, classe.acceptation!, responsables());
    } catch {
      return { prenom: '', nom: '' };
    }
  };
  // Le nom corrigé part à chaque responsable trente secondes après, le temps d'annuler (règle 6).
  const envoyerLeNomALHeure = () => {
    const attente = classe.nomEnAttente;
    if (!attente || Date.now() < attente.part) return;
    const correction = moi.corriger_son_nom(classe.code, attente.prenom, attente.nom, Date.now());
    for (const r of porte.responsables) envoyer(coeur, relais, r.boite, { v: 1, t: 'nom', code: classe.code, correction });
    classe = { ...classe, nom: correction, nomEnAttente: undefined };
    garder();
  };

  // Un message part tout de suite : il ne remplace rien, et la barre dit à qui il part (règle 1).
  const envoyerLeMessage = () => {
    if (vue.ecran !== 'conversation') return;
    const v = vue;
    const r = porte.responsables.find((x) => x.cle === v.cle);
    if (!r) {
      vue = { ecran: 'messages' };
      return rendre();
    }
    const texte = v.brouillon.trim();
    const erreur = phraseDuMessage(texte);
    if (erreur) {
      vue = { ...v, erreur };
      return rendre();
    }
    const quand = Date.now();
    const arrive = arrivee(porte, quand);
    envoyerUnMessage(coeur, relais, r.boite, classe.code, moi.ecrire_message(classe.code, r.cle, v.annonce, texte, quand, arrive), arrive);
    messages = [...messages, { de: moi.cle(), pour: r.cle, quand, arrivee: arrive, ...(v.annonce ? { annonce: v.annonce } : {}), texte }];
    garder();
    vue = { ...v, brouillon: '', annonce: undefined, erreur: undefined };
    rendre();
  };

  const gestes = {
    plusTard: () => {
      const demande = demandeDAccueil();
      if (demande) ecrire(demande, Date.now());
      rendre();
    },
    installer: async () => {
      const demande = demandeDAccueil();
      await installer();
      if (demande) ecrire(demande, Date.now());
      rendre();
    },
    signer: () => versSigner(),
    chiffre: (c: HTMLElement) => taper(c.dataset.n!),
    effacer,
    retour: () => {
      couper();
      vue = vue.ecran === 'nom' ? { ecran: 'moi' } : vue.ecran === 'conversation' ? { ecran: vue.retour } : { ecran: 'jour' };
      rendre();
    },
    messages: () => {
      vue = { ecran: 'messages' };
      rendre();
    },
    conversation: (c: HTMLElement) => {
      vue = { ecran: 'conversation', cle: c.dataset.cle!, brouillon: '', retour: vue.ecran === 'messages' ? 'messages' : 'jour' };
      rendre();
    },
    repondre: (c: HTMLElement) => {
      const a = annoncesDeLaClasse.find((x) => x.id === c.dataset.annonce);
      if (!a || !porte.responsables.some((r) => r.cle === a.auteur)) return;
      vue = { ecran: 'conversation', cle: a.auteur, brouillon: '', annonce: a.id, retour: vue.ecran === 'classe' ? 'classe' : 'jour' };
      rendre();
    },
    envoyerMessage: () => envoyerLeMessage(),
    moi: () => {
      vue = { ecran: 'moi' };
      rendre();
    },
    corrigerNom: () => {
      const n = monNom();
      vue = { ecran: 'nom', prenom: n.prenom, nom: n.nom };
      rendre();
    },
    corriger: () => {
      const { prenom, nom, erreurs } = nomTape();
      if (erreurs) {
        vue = { ecran: 'nom', prenom, nom, erreurs };
        return rendre();
      }
      const actuel = monNom();
      if (prenom !== actuel.prenom || nom !== actuel.nom) {
        classe = { ...classe, nomEnAttente: { prenom, nom, part: Date.now() + ANNULER_MS } };
        garder();
      }
      vue = { ecran: 'moi' };
      rendre();
    },
    annulerNom: () => {
      classe = { ...classe, nomEnAttente: undefined };
      garder();
      rendre();
    },
    mesClasses: () => nav.mesCours(),
    classe: () => {
      vue = { ecran: 'classe' };
      rendre();
    },
    ecouter: (c: HTMLElement) => {
      const a = annoncesDeLaClasse.find((x) => x.id === c.dataset.annonce);
      if (a) ecouter(a.texte);
    },
  };

  const auClavier = (e: KeyboardEvent) => {
    if (vue.ecran !== 'signer' || !nav.affichee()) return;
    if (/^[0-9]$/.test(e.key)) taper(e.key);
    if (e.key === 'Backspace') effacer();
  };
  document.addEventListener('keydown', auClavier);

  const ecranDuJour = () => {
    const fois = cetteFois();
    const annonce = annonceDuMoment();
    const laDemi = annonce?.demi ?? demi();
    const qui = esc(annonce ? nomDuResponsable(annonce.par) : formateur());
    const [debut, fin] = (laDemi === 'matin' ? porte.matin : porte.apres_midi).split('-');
    const nomDeLaDemiCourante = laDemi === 'matin' ? 'Matin' : 'Après-midi';
    const moment = `${nomDeLaDemiCourante}, ${horaire(debut)} à ${horaire(fin)} · ${qui}`;
    const toucheSigner = `<div class="gestes"><button class="touche" data-geste="signer">${ic('qr-code', 'ic-24')}<span>Signer ma présence</span></button></div>`;
    const ouvert = !fois && annonce?.etat === 'ouvert';
    const clos = annonce?.etat === 'clos';
    const absence = absences(sait())[0];
    let reponse: string;
    let touche = '';
    let fenetre = '';
    if (fois && (!fois.recu || !clos)) {
      reponse = fois.recu
        ? `${ic('checkbox-on', 'ic-32')}<div><h2 class="tres-gros">Présence signée</h2><p class="mono">${heure(fois.recu.quand)} · reçue par ${esc(fois.recu.par)}</p></div>`
        : `${ic('clock', 'ic-32')}<div><h2 class="tres-gros">Présence envoyée</h2><p class="mono">${heure(fois.signee)} · ${esc(formateur())} ne l’a pas encore reçue</p></div>`;
    } else if (ouvert) {
      reponse = `${ic('qr-code', 'ic-32')}<div><h2 class="tres-gros">L’appel est ouvert</h2><p class="mono">${moment}</p></div>`;
      touche = toucheSigner;
    } else if (clos && !fois) {
      reponse = `${ic('square-alert', 'ic-32')}<div><h2 class="tres-gros">Une absence</h2><p class="mono">${nomDeLaDemiCourante} · appel clos à ${heure(annonce.quand)} par ${qui}</p></div>`;
    } else if (!fois && horsLigne() && appelAttendu()) {
      reponse = `${ic('qr-code', 'ic-32')}<div><h2 class="tres-gros">Ta présence</h2><p class="mono">${moment}</p></div>`;
      touche = toucheSigner;
    } else if (absence) {
      const a = annonces.find((x) => x.date === absence.date && x.demi === absence.demi)!;
      reponse = `${ic('square-alert', 'ic-32')}<div><h2 class="tres-gros">Une absence</h2><p class="mono">${jour(enJour(absence.date).getTime())}, ${nomDeLaDemi(absence.demi)} · appel clos par ${esc(nomDuResponsable(a.par))}</p></div>`;
    } else if (appelAttendu() && !fois) {
      reponse = `${ic('clock', 'ic-32')}<div><h2 class="tres-gros">Pas d’appel ouvert</h2><p class="mono">${moment}</p></div>`;
    } else {
      const avenir = prochain && rang(prochain) > rang(creneau(maintenant())) ? prochain : undefined;
      const quand = avenir ? `${sansCoursMaintenant() ? 'Retour au centre' : 'Prochain appel'} : ${jour(enJour(avenir.date).getTime())}, ${debutDe(avenir)}` : '';
      reponse = `${ic('checkbox-on', 'ic-32')}<div><h2 class="tres-gros">En règle</h2>${quand ? `<p class="mono">${quand}</p>` : ''}</div>`;
    }
    const demande = demandeDAccueil();
    if (demande) {
      fenetre = accueil(demande);
      if (!surIPhone()) touche = `<div class="gestes"><button class="touche" data-geste="installer">${ic('download', 'ic-24')}<span>Installer</span></button></div>`;
    }
    const semaine = `<section class="bloc" aria-label="Ma semaine"><p class="etiquette">Ma semaine</p>${semaineHtml(sait())}</section>`;
    const aLire = derniereAnnonce();
    const ecrits = lignesDesNonLus(messages, nomDeLaCle);
    const lire =
      aLire || ecrits.length
        ? `<section class="bloc"><p class="etiquette">À lire</p>${aLire ? annonceHtml(aLire) : ''}${ecrits.length ? `<div class="liste">${ecrits.join('')}</div>` : ''}</section>`
        : '';
    afficher(
      'tel',
      'Aujourd’hui',
      `${barre(ouvert)}${MENU}<main class="page"><section class="reponse">${reponse}</section>${fenetre}${semaine}${lire}</main><footer class="bas">${touche}${faits(relais)}</footer>`,
      gestes,
    );
    ajusterLaSemaine(sait());
  };

  const ecranSigner = (v: Extract<Vue, { ecran: 'signer' }>) => {
    const cases = Array.from({ length: 6 }, (_, n) => `<span${n === v.chiffres.length ? ' class="ici"' : ''}>${v.chiffres[n] ?? ''}</span>`).join('');
    const touches = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => `<button class="btn" data-geste="chiffre" data-n="${n}">${n}</button>`).join('');
    afficher(
      'tel',
      'Présence',
      `<header class="barre maintenant"><h1 class="barre-titre" tabindex="-1">Présence</h1><span class="mono">${demi() === 'matin' ? 'matin' : 'après-midi'} · ${esc(formateur())}</span></header>
       <main class="page">
         <div class="viseur" role="img" aria-label="La caméra">
           <i class="viseur-coin hg"></i><i class="viseur-coin hd"></i><i class="viseur-coin bg"></i><i class="viseur-coin bd"></i>
           <p class="viseur-mot">${v.sansCamera ? 'La caméra ne s’ouvre pas' : 'Vise le QR de la salle'}</p>
         </div>
         ${v.erreurQr ? `<p class="erreur" role="alert">${ic('info-box')}<span>${esc(phrase(v.erreurQr, formateur()))}</span></p>` : ''}
         <section class="bloc">
           <p class="etiquette">${v.sansCamera ? 'Tape les 6 chiffres de l’écran' : 'Ou tape les 6 chiffres'}</p>
           <div class="code6${v.erreur ? ' faux' : ''}" role="group" aria-label="Le code de l’appel"${v.erreur ? ' aria-describedby="erreur"' : ''}>${cases}</div>
           ${v.erreur ? `<p class="erreur" id="erreur" role="alert">${ic('info-box')}<span>${esc(phrase(v.erreur, formateur()))}</span></p>` : ''}
         </section>
         <div class="chiffres" aria-label="Chiffres">${touches}<span class="btn vide"></span><button class="btn" data-geste="chiffre" data-n="0">0</button><button class="btn" data-geste="effacer" aria-label="Effacer">${ic('delete', 'ic-24')}</button></div>
       </main>
       <footer class="bas"><div class="gestes"><button class="btn retour" data-geste="retour">${ic('arrow-left', 'ic-20')}Retour</button></div>${faits(relais)}</footer>`,
      gestes,
      v.chiffres.length > 0,
    );
    poser();
  };

  const ecranSansReseau = () => {
    const fois = cetteFois();
    if (!fois) return ecranDuJour();
    afficher(
      'tel',
      'Présence',
      `<header class="barre maintenant"><h1 class="barre-titre">Présence</h1><span class="mono">${demi() === 'matin' ? 'matin' : 'après-midi'} · ${esc(formateur())}</span></header>
       <main class="page">
         <section><h2 class="gros" tabindex="-1">Montre ce QR à ${esc(formateur())}</h2><p class="mono">Signée à ${heure(fois.signee)} · pas encore reçue</p></section>
         <div class="qr" role="img" aria-label="Le QR de ta présence" data-presence="${esc(fois.presence)}">${coeur.svg_du_qr(fois.presence)}</div>
       </main>
       <footer class="bas"><div class="gestes"><button class="btn retour" data-geste="retour">${ic('arrow-left', 'ic-20')}Retour</button></div>${faits(relais)}</footer>`,
      gestes,
    );
  };

  const ecranMoi = () => afficherMoi(porte.nom, monNom(), classe.nomEnAttente, POUR_LES_RESPONSABLES, faits(relais), gestes);
  const ecranNom = (v: Extract<Vue, { ecran: 'nom' }>) => afficherNom(porte.nom, v, v.erreurs ?? {}, POUR_LES_RESPONSABLES, faits(relais), gestes);

  // Une annonce, signée de son auteur, tel que la classe le voit.
  const annonceHtml = (a: AnnonceDeLaClasse) => {
    const r = porte.responsables.find((x) => x.cle === a.auteur);
    const repondre = r ? `<button class="btn" data-geste="repondre" data-annonce="${esc(a.id)}">${ic('message-reply')}Répondre</button>` : '';
    return noteHtml(a, r ? nomDuResponsableDe(r) : 'Un responsable', r?.role ?? '', toucheEcouter(a) + repondre);
  };
  // « À lire » : la dernière annonce arrivée, de la semaine.
  const derniereAnnonce = () =>
    enVigueur(annoncesDeLaClasse, maintenant())
      .filter((a) => a.arrivee >= maintenant() - SEPT_JOURS_MS)
      .sort((x, y) => x.arrivee - y.arrivee)
      .pop();
  const ecranClasse = () => {
    const liste = enVigueur(annoncesDeLaClasse, maintenant());
    afficher(
      'tel',
      'Classe',
      `<header class="barre"><h1 class="barre-titre" tabindex="-1">Classe</h1><span class="mono">${esc(porte.nom)}</span></header>
       <main class="page"><section class="bloc"><p class="etiquette">Annonces</p>${liste.length ? liste.map(annonceHtml).join('') : '<p class="mono">Pas encore d’annonce.</p>'}</section></main>
       <footer class="bas"><div class="gestes"><button class="btn retour" data-geste="retour">${ic('arrow-left', 'ic-20')}Retour</button></div>${faits(relais)}</footer>`,
      gestes,
    );
  };

  const nomDeLaCle = (cle: string) => {
    const r = porte.responsables.find((x) => x.cle === cle);
    return r ? nomDuResponsableDe(r) : 'Un responsable';
  };
  // « Messages » : une ligne par responsable de la classe, marquée quand il y a du nouveau.
  const ecranMessages = () => {
    const maintenant = Date.now();
    const lignes = porte.responsables.map((r) => {
      const neuf = nonLus(messages, maintenant).filter((m) => m.de === r.cle).pop();
      const dernier = avec(messages, r.cle, maintenant).pop();
      const quand = neuf ? `nouveau message, ${jour(neuf.quand)}` : dernier ? jour(dernier.quand) : '';
      return `<button class="rangee" data-geste="conversation" data-cle="${r.cle}"><div><b>${esc(nomDuResponsableDe(r))}</b><span class="mono">${esc([r.role, quand].filter(Boolean).join(' · '))}</span></div>${ic('chevron-right')}</button>`;
    });
    afficher(
      'tel',
      'Messages',
      `<header class="barre"><h1 class="barre-titre" tabindex="-1">Messages</h1><span class="mono">${esc(porte.nom)}</span></header>
       <main class="page"><div class="liste">${lignes.join('')}</div><p class="mono">Tu écris en privé aux responsables de ta classe. Les autres apprenants ne voient rien.</p></main>
       <footer class="bas"><div class="gestes"><button class="btn retour" data-geste="retour">${ic('arrow-left', 'ic-20')}Retour</button></div>${faits(relais)}</footer>`,
      gestes,
    );
  };
  const reponseA = (id: string) => {
    const a = annoncesDeLaClasse.find((x) => x.id === id && !x.retiree);
    return a ? `en réponse à l’annonce du ${jour(a.arrivee)}` : 'en réponse à une annonce';
  };
  // La conversation avec un responsable. L'ouvrir marque ses messages comme lus, sur ce téléphone seulement.
  const ecranConversation = (v: Extract<Vue, { ecran: 'conversation' }>) => {
    const r = porte.responsables.find((x) => x.cle === v.cle);
    if (!r) {
      vue = { ecran: 'messages' };
      return ecranMessages();
    }
    const lus = marquerLus(messages, v.cle);
    if (lus) {
      messages = lus;
      garder();
    }
    const maintenant = Date.now();
    const arrive = arrivee(porte, maintenant);
    const repondA = v.annonce ? annoncesDeLaClasse.find((a) => a.id === v.annonce) : undefined;
    afficherConversation({
      qui: nomDuResponsableDe(r),
      sous: r.role,
      bulles: bullesHtml(avec(messages, v.cle, maintenant), moi.cle(), reponseA, maintenant),
      libelle: repondA ? `Ta réponse à l’annonce du ${jour(repondA.arrivee)}` : 'Ton message',
      brouillon: v.brouillon,
      erreur: v.erreur,
      arrive,
      horsDesHeures: relais.attend ? '' : `<p class="faits"><span>${heure(maintenant)} · le centre rouvre ${aQuelMoment(arrive, maintenant)}</span></p>`,
      faits: faits(relais),
      gestes,
      saisie: (texte) => {
        if (vue.ecran === 'conversation') vue = { ...vue, brouillon: texte, erreur: undefined };
      },
    });
  };

  const rendre = () => {
    if (arrete || !nav.affichee()) return;
    if (!classe.acceptation) return attente();
    if (vue.ecran === 'messages') return ecranMessages();
    if (vue.ecran === 'conversation') return ecranConversation(vue);
    if (vue.ecran === 'signer') return ecranSigner(vue);
    if (vue.ecran === 'moi') return ecranMoi();
    if (vue.ecran === 'classe') return ecranClasse();
    if (vue.ecran === 'nom') return ecranNom(vue);
    if (vue.ecran === 'sans-reseau') return ecranSansReseau();
    return ecranDuJour();
  };

  // Ce que la classe dit de maintenant : un appel ouvert sans ta présence, puis un cours connu
  // aujourd'hui qui n'est pas fini, puis le prochain cours.
  const moment = (): Moment => {
    if (!classe.acceptation) return { urgence: 0, attente: true };
    const ici = creneau(maintenant());
    const [debut, fin] = bornes(ici, porte);
    const annonce = annonceDuMoment();
    if (annonce?.etat === 'ouvert' && !cetteFois()) return { urgence: 2, prochain: debut };
    const prevu = prochain && rang(prochain) === rang(ici);
    if (maintenant() < fin && (annonce || prevu)) return { urgence: 1, prochain: debut };
    const avenir = prochain && rang(prochain) > rang(ici) ? bornes(prochain, porte)[0] : undefined;
    return { urgence: 0, prochain: avenir };
  };

  arrets.push(recevoir(coeur, relais, moi, (l) => {
    if (l.t === 'admis' && l.code === classe.code && !classe.acceptation) {
      try {
        const nouvellePorte = coeur.lire_porte(classe.code, l.porte);
        coeur.lire_acceptation(classe.code, l.acceptation, nouvellePorte.responsables.map((r) => r.cle));
        classe = { code: classe.code, role: 'apprenant', secrets: classe.secrets, porte: l.porte, fil: l.fil, acceptation: l.acceptation };
        porte = nouvellePorte;
        garder();
        ecouterLAppel();
      } catch {
        return; // Une admission qu'un responsable n'a pas signée ne compte pas.
      }
    } else if (l.t === 'recu' && presences.some((p) => p.seance === l.seance && !p.recu)) {
      // Au rechargement, les relais renvoient les lettres de la semaine : un reçu déjà noté ne
      // change rien, et un nouveau ne fait quitter que l'écran du QR à montrer.
      presences = presences.map((p) => (p.seance === l.seance ? { ...p, recu: { quand: l.quand, par: l.par } } : p));
      garder();
      if (vue.ecran === 'sans-reseau') vue = { ecran: 'jour' };
    } else if (l.t === 'message' && l.code === classe.code) {
      // Un apprenant ne lit que les messages des responsables de la porte : jamais ceux d'un autre apprenant.
      const m = lireMessage(coeur, classe.code, l.message, moi.cle(), responsables());
      if (!m || dejaGarde(messages, m)) return;
      messages = [...messages, m.de === moi.cle() ? m : { ...m, nouveau: true }];
      garder();
      if (vue.ecran !== 'jour' && vue.ecran !== 'messages' && vue.ecran !== 'conversation') return;
    } else if (l.t === 'refus' && presences.some((p) => p.seance === l.seance && !p.recu)) {
      const refusee = presences.find((p) => p.seance === l.seance)!;
      presences = presences.filter((p) => p !== refusee);
      garder();
      return versSigner(refusee.presence.split('.')[2] ?? '', l.raison);
    } else {
      return;
    }
    rendre();
  }));
  // Une annonce ou un message écrits en dehors des heures de la classe se montrent à leur heure d'arrivée.
  let vuJusqua = Date.now();
  const chaqueSeconde = setInterval(() => {
    const avant = classe.nomEnAttente;
    envoyerLeNomALHeure();
    if (avant && vue.ecran === 'moi') rendre();
    const vient = (t: number) => t > vuJusqua && t <= Date.now();
    const annonceArrivee = annoncesDeLaClasse.some((a) => vient(a.arrivee));
    const messageArrive = messages.some((m) => vient(m.arrivee));
    vuJusqua = Date.now();
    if (annonceArrivee && (vue.ecran === 'jour' || vue.ecran === 'classe')) rendre();
    else if (messageArrive && (vue.ecran === 'jour' || vue.ecran === 'messages' || vue.ecran === 'conversation')) rendre();
  }, 1000);
  // Les voix de l'appareil se chargent après la page : « Écouter » apparaît quand elles sont là.
  const voixChargees = () => (vue.ecran === 'jour' || vue.ecran === 'classe') && rendre();
  if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', voixChargees);
  envoyerLeNomALHeure();
  const reseauAttendu = setTimeout(() => vue.ecran === 'jour' && rendre(), HORS_LIGNE_MS + 100);
  ecouterLAppel();
  arrets.push(ecouterLaPorte(coeur, relais, classe.code, suivreLaPorte));

  return {
    code,
    rendre,
    revenir: () => {
      if (vue.ecran === 'signer') couper();
      vue = { ecran: 'jour' };
    },
    aLEntree: () => vue.ecran === 'jour',
    moment,
    // Un redessin pendant qu'on tape remettrait le nom d'avant dans les champs.
    reseau: () => {
      if (vue.ecran !== 'signer' && vue.ecran !== 'nom') rendre();
    },
    arreter: () => {
      arrete = true;
      if (vue.ecran === 'signer' && nav.affichee()) couper();
      for (const fin of arrets) fin();
      clearInterval(chaqueSeconde);
      clearTimeout(reseauAttendu);
      document.removeEventListener('keydown', auClavier);
      if ('speechSynthesis' in window) speechSynthesis.removeEventListener('voiceschanged', voixChargees);
    },
  };
}
