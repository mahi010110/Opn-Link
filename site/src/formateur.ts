// Le téléphone du formateur : sa classe, les demandes d'entrée, et l'appel.
// La salle montre le QR, le téléphone montre les noms. Sa caméra lit le QR d'un apprenant sans réseau.

import { arreter, poser, viser } from './camera';
import type { Appel } from './coeur';
import { type Contexte, faits, nomDe } from './contexte';
import { type Creneau, type Demi, enJour, enTexte, lireCreneau, lundiDe, ouvre, plusJours, proposerLeProchain, rang, suivant } from './creneaux';
import { type ClasseGardee, type Moi, classes, ecrire, garderClasse, lire } from './etat';
import { annoncerLAppel, annoncerLeProchain, envoyer, lienDeLaClasse, publierPorte, recevoir } from './lettres';
import { codeDe, phrase } from './textes';
import { afficher, codeAffiche, dateIso, demiJournee, esc, heure, heureCourte, horaire, ic, jour, paves } from './vue';

type Vue =
  | { ecran: 'cours' }
  | { ecran: 'inviter'; montre: boolean; copie?: boolean }
  | { ecran: 'accepter'; dehors: Set<string> }
  | { ecran: 'membres' }
  | { ecran: 'nom'; cle: string }
  | { ecran: 'lire'; cle: string; erreur?: string; sansCamera?: boolean }
  | { ecran: 'prochain'; choix: Creneau };

const ANNULER_MS = 30_000;
const HUIT_SEMAINES = 56;
// « Changer » propose les trois semaines qui viennent : une alternance tient dedans.
const JOURS_PROPOSES = 21;

/// « lundi 23, matin »
const leCours = (c: Creneau): string =>
  `${new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric' }).format(enJour(c.date))}, ${c.demi === 'matin' ? 'matin' : 'après-midi'}`;

// Le formateur lit le QR d'un autre : les phrases du cœur s'adressent à l'apprenant, celles-ci à lui.
const phraseDuQr = (code: string, formateur: string): string =>
  code === 'qr-inconnu'
    ? 'Ce QR n’est pas une présence. Vise celui de son téléphone.'
    : code === 'autre-seance'
      ? 'Cette présence est celle d’un autre appel.'
      : code === 'membre-inconnu'
        ? 'Cette présence est celle de quelqu’un qui n’est pas dans la classe.'
        : phrase(code, formateur);
const UN_JOUR_MS = 24 * 3600 * 1000;

export function formateur(ctx: Contexte): void {
  const { coeur, relais, moi } = ctx;
  let classe = classes().find((c) => c.role === 'chef') as ClasseGardee;
  const porte = coeur.lire_porte(classe.code, classe.porte);
  const responsables = porte.responsables.map((r) => r.cle);
  const nomFormateur = nomDe(lire<Moi>('moi') ?? porte.responsables[0]);
  const garde = lire<{ journal: string; secret?: string }>('appel');
  let appel = garde ? coeur.Appel.relire(garde.journal, garde.secret ?? undefined, moi) : undefined;
  let vue: Vue = { ecran: 'cours' };

  const membres = () => (classe.membres ?? []).map((a) => coeur.lire_acceptation(classe.code, a, responsables));
  const demandes = () => (classe.demandes ?? []).map((d) => coeur.lire_demande(classe.code, d));
  const lien = () => lienDeLaClasse(coeur, classe.code, porte.responsables[0].cle);

  const changer = (nouvelle: ClasseGardee) => {
    classe = nouvelle;
    garderClasse(classe);
    envoyer(coeur, relais, moi.boite(), { v: 1, t: 'classe', classe });
  };
  const garderAppel = () => {
    if (appel) ecrire('appel', { journal: appel.journal(), secret: appel.secret() });
  };
  const versLaSalle = () => {
    if (!appel) return;
    const [presents, inscrits] = appel.compte();
    envoyer(coeur, relais, moi.boite(), { v: 1, t: 'compte', seance: appel.seance(), presents, inscrits });
  };
  // Les apprenants l'apprennent sur le fil : leur téléphone montre « L'appel est ouvert », puis clos.
  const annoncer = () => {
    if (appel && classe.fil) annoncerLAppel(coeur, relais, classe.fil, appel.annonce(classe.fil, Date.now()));
  };
  const montrer = (quoi: 'rejoindre' | 'rien') => envoyer(coeur, relais, moi.boite(), { v: 1, t: 'montrer', code: classe.code, quoi });
  // Le prochain cours, dit à la classe sur le fil : c'est ainsi que les apprenants savent quand
  // revient l'appel, et que leur téléphone sait les jours sans cours. Il part à toute la classe et
  // remplace le précédent : il attend trente secondes, qu'on peut annuler (règle 6). Proposé à la
  // clôture, il part avec la feuille, quand la clôture ne s'annule plus.
  const finDeLaCloture = () => (appel?.close() ? (appel.cloture_a() ?? 0) + ANNULER_MS : 0);
  const preparerProchain = (c: Creneau) => {
    const part = Math.max(Date.now() + ANNULER_MS, finDeLaCloture());
    changer({ ...classe, prochainEnAttente: { ...c, part } });
  };
  const envoyerLeProchainALHeure = () => {
    const attente = classe.prochainEnAttente;
    if (!attente || Date.now() < attente.part || !classe.fil) return;
    const quand = Date.now();
    annoncerLeProchain(coeur, relais, classe.fil, moi.prochain_cours(classe.fil, attente.date, attente.demi, quand), attente.date);
    changer({ ...classe, prochain: { date: attente.date, demi: attente.demi, quand }, prochainEnAttente: undefined });
  };
  const proposerALaCloture = (a: Appel) => {
    const ce: Creneau = { date: a.date(), demi: a.demi() as Demi };
    const limite = plusJours(ce.date, -HUIT_SEMAINES);
    const cours = [...new Set([...(classe.cours ?? []), enTexte(ce)])].filter((t) => t >= limite).sort();
    classe = { ...classe, cours };
    preparerProchain(proposerLeProchain(cours.map(lireCreneau), ce));
  };

  if (!classe.portePubliee || Date.now() - classe.portePubliee > UN_JOUR_MS) {
    publierPorte(coeur, relais, classe.code, classe.porte);
    changer({ ...classe, portePubliee: Date.now() });
  }

  const lancer = () => {
    const maintenant = Date.now();
    const inscrits = membres().map((m) => [m.prenom, m.nom, m.cle, m.boite].join('\t')).join('\n');
    appel = coeur.Appel.ouvrir(classe.code, dateIso(maintenant), demiJournee(maintenant, porte.apres_midi), moi, inscrits, maintenant);
    garderAppel();
    envoyer(coeur, relais, moi.boite(), { v: 1, t: 'appel', journal: appel.journal(), secret: appel.secret()! });
    annoncer();
    vue = { ecran: 'cours' };
    rendre();
  };

  const repondre = (presence: string, voie: 'reseau' | 'qr'): string | undefined => {
    let cle: string;
    try {
      cle = coeur.cle_de_la_presence(presence);
    } catch (e) {
      return codeDe(e);
    }
    const qui = membres().find((m) => m.cle === cle);
    if (!appel) {
      if (qui) envoyer(coeur, relais, qui.boite, { v: 1, t: 'refus', seance: '', raison: 'appel-clos' });
      return 'appel-clos';
    }
    try {
      appel.recevoir(presence, voie, Date.now());
    } catch (e) {
      if (qui) envoyer(coeur, relais, qui.boite, { v: 1, t: 'refus', seance: appel.seance(), raison: codeDe(e) });
      return codeDe(e);
    }
    garderAppel();
    versLaSalle();
    const ligne = appel.lignes().find((l) => l.cle === cle);
    if (qui && ligne) envoyer(coeur, relais, qui.boite, { v: 1, t: 'recu', seance: appel.seance(), quand: ligne.quand, par: nomFormateur });
    return undefined;
  };

  const accepter = (dehors: Set<string>) => {
    const acceptees: string[] = [];
    for (const d of classe.demandes ?? []) {
      const m = coeur.lire_demande(classe.code, d);
      if (dehors.has(m.cle)) continue;
      const acceptation = moi.accepter(classe.code, d, Date.now());
      envoyer(coeur, relais, m.boite, { v: 1, t: 'admis', code: classe.code, porte: classe.porte, fil: classe.fil!, acceptation });
      acceptees.push(acceptation);
    }
    changer({ ...classe, membres: [...(classe.membres ?? []), ...acceptees], demandes: [], dehors: [...(classe.dehors ?? []), ...dehors] });
  };

  const vers = (v: Vue) => {
    if (vue.ecran === 'inviter' && vue.montre && v.ecran !== 'inviter') montrer('rien');
    if (vue.ecran === 'lire' && v.ecran !== 'lire') arreter();
    vue = v;
    rendre();
  };

  // La caméra lit cinq images par seconde : un QR refusé n'est refusé qu'une fois, sans renvoyer
  // de refus à l'apprenant à chaque image.
  let dernierQrRefuse = '';
  const lirePresence = (texte: string) => {
    if (vue.ecran !== 'lire' || texte === dernierQrRefuse) return;
    const erreur = repondre(texte, 'qr');
    if (!erreur) return vers({ ecran: 'cours' });
    dernierQrRefuse = texte;
    vers({ ...vue, erreur });
  };
  const ouvrirLaCamera = (cle: string) => {
    dernierQrRefuse = '';
    vers({ ecran: 'lire', cle });
    viser(coeur, lirePresence).then((ouverte) => {
      if (!ouverte && vue.ecran === 'lire') vers({ ...vue, sansCamera: true });
    });
  };

  const gestes = {
    lancer,
    inviter: () => vers({ ecran: 'inviter', montre: false }),
    montrer: () => {
      if (vue.ecran !== 'inviter') return;
      montrer(vue.montre ? 'rien' : 'rejoindre');
      vers({ ecran: 'inviter', montre: !vue.montre });
    },
    envoyerLien: async () => {
      try {
        if (navigator.share) await navigator.share({ title: porte.nom, url: lien() });
        else await navigator.clipboard.writeText(lien());
        if (vue.ecran === 'inviter') vers({ ...vue, copie: !navigator.share });
      } catch {
        // Renoncer au partage ne change rien.
      }
    },
    accepter: () => vers({ ecran: 'accepter', dehors: new Set() }),
    cocher: (c: HTMLElement) => {
      if (vue.ecran !== 'accepter') return;
      const dehors = new Set(vue.dehors);
      if (dehors.has(c.dataset.cle!)) dehors.delete(c.dataset.cle!);
      else dehors.add(c.dataset.cle!);
      vers({ ecran: 'accepter', dehors });
    },
    valider: () => {
      if (vue.ecran !== 'accepter') return;
      accepter(vue.dehors);
      vers({ ecran: 'cours' });
    },
    classe: () => vers({ ecran: 'membres' }),
    nom: (c: HTMLElement) => vers({ ecran: 'nom', cle: c.dataset.cle! }),
    retour: () => vers({ ecran: 'cours' }),
    ici: () => {
      if ((vue.ecran !== 'nom' && vue.ecran !== 'lire') || !appel) return;
      appel.signer_ici(vue.cle, Date.now());
      garderAppel();
      versLaSalle();
      vers({ ecran: 'cours' });
    },
    retard: () => {
      if (vue.ecran !== 'nom' || !appel) return;
      appel.noter_retard(vue.cle, Date.now(), Date.now());
      garderAppel();
      vers({ ecran: 'cours' });
    },
    lireQr: () => {
      if (vue.ecran === 'nom') ouvrirLaCamera(vue.cle);
    },
    clore: () => {
      if (!appel) return;
      const [presents, absents] = appel.clore(Date.now());
      garderAppel();
      envoyer(coeur, relais, moi.boite(), { v: 1, t: 'clos', seance: appel.seance(), presents, absents, quand: Date.now() });
      annoncer();
      proposerALaCloture(appel);
      rendre();
    },
    changerProchain: () => {
      const actuel = classe.prochainEnAttente ?? classe.prochain;
      vers({ ecran: 'prochain', choix: actuel ? { date: actuel.date, demi: actuel.demi as Demi } : suivant(creneauDuMoment()) });
    },
    annoncerProchain: () => {
      if (vue.ecran !== 'prochain') return;
      preparerProchain(vue.choix);
      vers({ ecran: 'cours' });
    },
    annulerProchain: () => {
      changer({ ...classe, prochainEnAttente: undefined });
      rendre();
    },
    annuler: () => {
      if (!appel) return;
      appel.annuler_cloture(Date.now());
      changer({ ...classe, prochainEnAttente: undefined });
      garderAppel();
      envoyer(coeur, relais, moi.boite(), { v: 1, t: 'reouvert', seance: appel.seance() });
      annoncer();
      versLaSalle();
      rendre();
    },
  };

  const MENU = `<nav class="menu" aria-label="Entrées"><a href="#" data-geste="classe">Classe</a><a href="#">Messages</a><a href="#">Mes cours</a><a href="#">Moi</a></nav>`;
  const barre = (maintenant: number, ouvert: boolean) =>
    `<header class="barre${ouvert ? ' maintenant' : ''}"><h1 class="barre-titre" tabindex="-1">${esc(porte.centre)}</h1><span class="mono">${jour(maintenant)} · ${heure(maintenant)}</span></header>`;
  const retour = `<button class="btn retour" data-geste="retour">${ic('arrow-left', 'ic-20')}Retour</button>`;
  const creneauDuMoment = (): Creneau => ({ date: dateIso(Date.now()), demi: demiJournee(Date.now(), porte.apres_midi) });
  const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

  const avant = (maintenant: number) => {
    const demi = demiJournee(maintenant, porte.apres_midi);
    const [debut, fin] = (demi === 'matin' ? porte.matin : porte.apres_midi).split('-');
    const n = membres().length;
    const enAttente = demandes().length;
    const touche = n === 0
      ? `<button class="touche" data-geste="inviter">${ic('qr-code', 'ic-24')}<span>Inviter des apprenants</span></button>`
      : `<button class="touche" data-geste="lancer">${ic('qr-code', 'ic-24')}<span>Lancer l’appel</span></button>`;
    afficher(
      'tel',
      porte.nom,
      `${barre(maintenant, false)}${MENU}
       <main class="page">
         <section class="reponse">${ic('users', 'ic-32')}<div>
           <h2 class="tres-gros">${esc(porte.nom)}</h2>
           <p class="mono">${demi === 'matin' ? 'Matin' : 'Après-midi'}, ${horaire(debut)} à ${horaire(fin)} · ${pluriel(n, 'apprenant')}</p>
         </div></section>
         ${enAttente ? `<section class="bloc"><p class="etiquette">À suivre</p><div class="liste"><div class="rangee"><div><b>${enAttente > 1 ? `${enAttente} demandent à entrer` : `${esc(nomDe(demandes()[0]))} demande à entrer`}</b><span class="mono">depuis ${heure(Math.min(...demandes().map((d) => d.quand)))}</span></div><button class="btn" data-geste="accepter">${ic('check')}Accepter</button></div></div></section>` : ''}
       </main>
       <footer class="bas"><div class="gestes">${touche}</div>${faits(relais)}</footer>`,
      gestes,
      true,
    );
  };

  const inviter = (v: Extract<Vue, { ecran: 'inviter' }>) => {
    afficher(
      'tel',
      'Inviter',
      `<header class="barre"><h1 class="barre-titre" tabindex="-1">Inviter</h1><span class="mono">${esc(porte.nom)}</span></header>
       <main class="page">
         <div class="qr" role="img" aria-label="Le QR de la classe" data-lien="${esc(lien())}">${coeur.svg_du_qr(lien())}</div>
         <p class="grand-code" data-code="${esc(classe.code)}">${codeAffiche(classe.code)}</p>
         <div class="note-gestes" style="justify-content: center">
           <button class="btn" data-geste="montrer">${ic('projector')}${v.montre ? 'Arrêter de montrer' : 'Montrer à la salle'}</button>
           <button class="btn" data-geste="envoyerLien">${ic('share')}${v.copie ? 'Lien copié' : 'Envoyer le lien'}</button>
         </div>
         <p class="mono">Chaque apprenant demande à entrer, et un responsable accepte.</p>
       </main>
       <footer class="bas"><div class="gestes">${retour}</div>${faits(relais)}</footer>`,
      gestes,
      true,
    );
  };

  const ecranAccepter = (v: Extract<Vue, { ecran: 'accepter' }>) => {
    const liste = demandes();
    const gardes = liste.filter((d) => !v.dehors.has(d.cle));
    const libelle = gardes.length === 0 ? 'Laisser dehors' : gardes.length === 1 ? `Accepter ${esc(nomDe(gardes[0]))}` : `Accepter les ${gardes.length}`;
    afficher(
      'tel',
      'Accepter',
      `<header class="barre"><h1 class="barre-titre">Accepter</h1><span class="mono">${esc(porte.nom)}</span></header>
       <main class="page">
         <section><h2 class="tres-gros" tabindex="-1">${liste.length > 1 ? `${liste.length} demandent à entrer` : '1 demande à entrer'}</h2><p class="mono">Décoche un nom pour le laisser dehors.</p></section>
         <div class="liste">${liste
           .map((d) => `<button class="rangee" role="checkbox" aria-checked="${!v.dehors.has(d.cle)}" data-geste="cocher" data-cle="${d.cle}">${ic(v.dehors.has(d.cle) ? 'checkbox' : 'checkbox-on', 'ic-24')}<div><b>${esc(nomDe(d))}</b></div><span class="mono">${heureCourte(d.quand)}</span></button>`)
           .join('')}</div>
       </main>
       <footer class="bas"><div class="gestes">${retour}<button class="touche" data-geste="valider">${ic('check', 'ic-24')}<span>${libelle}</span></button></div>${faits(relais)}</footer>`,
      gestes,
      true,
    );
  };

  const ecranMembres = () => {
    const liste = membres().sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    afficher(
      'tel',
      'Membres',
      `<header class="barre"><h1 class="barre-titre" tabindex="-1">Membres</h1><span class="mono">${esc(porte.nom)}</span></header>
       <main class="page">
         <section class="bloc"><p class="etiquette">Responsables</p><div class="liste">${porte.responsables
           .map((r, n) => `<div class="rangee"><div><b>${esc(nomDe(r))}</b><span class="mono">${esc(r.role)}${n === 0 ? ' · chef' : ' · adjoint'}</span></div></div>`)
           .join('')}</div></section>
         ${liste.length ? `<section class="bloc"><p class="etiquette">${pluriel(liste.length, 'apprenant')}</p><div class="liste">${liste
           .map((m) => `<div class="rangee"><div><b>${esc(nomDe(m))}</b><span class="mono">accepté le ${jour(m.quand)}</span></div></div>`)
           .join('')}</div></section>` : ''}
         <div class="note-gestes"><button class="btn" data-geste="inviter">${ic('qr-code')}Inviter des apprenants</button></div>
       </main>
       <footer class="bas"><div class="gestes">${retour}</div>${faits(relais)}</footer>`,
      gestes,
    );
  };

  const liste = (a: Appel, maintenant: number) => {
    const lignes = a.lignes();
    const manquent = lignes.filter((l) => l.etat !== 'present');
    const ont = lignes.filter((l) => l.etat === 'present').sort((x, y) => y.quand - x.quand);
    const [presents, inscrits] = a.compte();
    const comment = (l: (typeof lignes)[number]) => (l.voie === 'ici' ? 'sur ton téléphone · ' : l.voie === 'qr' ? 'QR lu · ' : '');
    afficher(
      'tel',
      'L’appel',
      `${barre(maintenant, true)}${MENU}
       <main class="page">
         <section class="bloc">
           <div><h2 class="tres-gros" tabindex="-1">${presents} sur ${inscrits}</h2><p class="mono">${esc(porte.nom)} · l’appel est ouvert</p></div>
           ${paves(presents, inscrits)}
         </section>
         ${manquent.length ? `<section class="bloc"><p class="etiquette">Pas encore signé</p><div class="liste">${manquent
           .map((l) => `<button class="rangee" data-geste="nom" data-cle="${l.cle}"><div><b>${esc(l.prenom)} ${esc(l.nom)}</b>${l.retard ? `<span class="mono">retard noté à ${heureCourte(l.retard)}</span>` : ''}</div>${ic('chevron-right')}</button>`)
           .join('')}</div></section>` : ''}
         ${ont.length ? `<section class="bloc"><p class="etiquette">Ont signé</p><div class="liste">${ont
           .map((l) => `<div class="rangee faite"><div><b>${esc(l.prenom)} ${esc(l.nom)}</b></div><span class="mono">${comment(l)}${heureCourte(l.quand)}</span></div>`)
           .join('')}</div></section>` : ''}
       </main>
       <footer class="bas"><div class="gestes"><button class="touche" data-geste="clore">${ic('check', 'ic-24')}<span>Clore et signer<small>${pluriel(presents, 'présent')} · ${pluriel(inscrits - presents, 'absent')}</small></span></button></div>${faits(relais, 'Ton ordinateur montre le QR à la salle')}</footer>`,
      gestes,
      true,
    );
  };

  const nom = (a: Appel, cle: string) => {
    const l = a.lignes().find((x) => x.cle === cle);
    if (!l) return;
    afficher(
      'tel',
      `${l.prenom} ${l.nom}`,
      `<header class="barre maintenant"><h1 class="barre-titre" tabindex="-1">${esc(l.prenom)} ${esc(l.nom)}</h1><span class="mono">pas encore signé</span></header>
       <main class="page"><div class="liste">
         <button class="rangee" data-geste="ici">${ic('smartphone', 'ic-24')}<div><b>Signer sur mon téléphone</b><span class="mono">sans téléphone</span></div>${ic('chevron-right')}</button>
         <button class="rangee" data-geste="lireQr">${ic('qr-code', 'ic-24')}<div><b>Lire son QR</b><span class="mono">sans réseau</span></div>${ic('chevron-right')}</button>
         <button class="rangee" data-geste="retard">${ic('clock', 'ic-24')}<div><b>Noter un retard</b><span class="mono">l’heure s’écrit sur la feuille</span></div>${ic('chevron-right')}</button>
       </div></main>
       <footer class="bas"><div class="gestes">${retour}</div>${faits(relais)}</footer>`,
      gestes,
    );
  };

  // Sans caméra, le chemin de secours est déjà là : l'apprenant signe sur le téléphone du formateur.
  const lireQr = (v: Extract<Vue, { ecran: 'lire' }>) => {
    const l = membres().find((x) => x.cle === v.cle);
    afficher(
      'tel',
      'Lire son QR',
      `<header class="barre maintenant"><h1 class="barre-titre" tabindex="-1">Lire son QR</h1><span class="mono">${esc(l ? nomDe(l) : '')}</span></header>
       <main class="page">
         <div class="viseur" role="img" aria-label="La caméra">
           <i class="viseur-coin hg"></i><i class="viseur-coin hd"></i><i class="viseur-coin bg"></i><i class="viseur-coin bd"></i>
           <p class="viseur-mot">${v.sansCamera ? 'La caméra ne s’ouvre pas' : 'Vise le QR de son téléphone'}</p>
         </div>
         ${v.erreur ? `<p class="erreur" role="alert">${ic('info-box')}<span>${esc(phraseDuQr(v.erreur, nomFormateur))}</span></p>` : ''}
         ${v.sansCamera ? `<div class="liste"><button class="rangee" data-geste="ici">${ic('smartphone', 'ic-24')}<div><b>Signer sur mon téléphone</b><span class="mono">à la place de son QR</span></div>${ic('chevron-right')}</button></div>` : ''}
       </main>
       <footer class="bas"><div class="gestes">${retour}</div>${faits(relais)}</footer>`,
      gestes,
      true,
    );
    poser();
  };

  // Pendant le délai de la clôture, son « Annuler » vaut aussi pour le prochain cours : la ligne
  // garde « Changer ». Ensuite, un prochain cours qui attend a son propre « Annuler ».
  const ligneDuProchain = (maintenant: number, clotureAnnulable: boolean) => {
    const attente = classe.prochainEnAttente;
    const affiche = attente ?? classe.prochain;
    if (!affiche) return '';
    const etat = attente ? `part à la classe dans ${Math.max(1, Math.ceil((attente.part - maintenant) / 1000))}\u00a0s` : 'les apprenants le voient';
    const geste = attente && !clotureAnnulable ? `<button class="btn" data-geste="annulerProchain">${ic('undo')}Annuler</button>` : `<button class="btn" data-geste="changerProchain">Changer</button>`;
    return `<div class="liste"><div class="rangee">${ic('calendar', 'ic-20')}<div><b>Prochain cours : ${esc(leCours({ date: affiche.date, demi: affiche.demi as Demi }))}</b><span class="mono">${etat}</span></div>${geste}</div></div>`;
  };

  const apres = (a: Appel, maintenant: number) => {
    const lignes = a.lignes();
    const [presents, inscrits] = a.compte();
    const cloture = a.cloture_a() ?? maintenant;
    const reste = Math.ceil((cloture + ANNULER_MS - maintenant) / 1000);
    const absents = lignes.filter((l) => l.etat === 'absent');
    afficher(
      'tel',
      'Clos et signé',
      `${barre(maintenant, false)}${MENU}
       <main class="page">
         <section class="reponse">${ic('checkbox-on', 'ic-32')}<div>
           <h2 class="tres-gros" tabindex="-1">Clos et signé</h2>
           <p class="mono">${esc(porte.nom)} · ${heure(cloture)} · ${pluriel(presents, 'présent')}, ${pluriel(inscrits - presents, 'absent')}</p>
         </div></section>
         ${ligneDuProchain(maintenant, reste > 0)}
         ${absents.length ? `<section class="bloc"><p class="etiquette">À suivre</p><div class="liste">${absents
           .map((l) => `<div class="rangee"><div><b>${esc(l.prenom)} ${esc(l.nom)}</b><span class="mono">une absence ce ${a.demi() === 'matin' ? 'matin' : 'après-midi'}</span></div></div>`)
           .join('')}</div></section>` : ''}
       </main>
       <footer class="bas">${reste > 0 ? `<div class="gestes"><button class="btn retour" data-geste="annuler">${ic('undo', 'ic-20')}Annuler la clôture · ${reste} s</button></div>` : ''}${faits(relais, reste > 0 ? 'La feuille part au registre public dans 30 secondes' : `Feuille close · empreinte ${a.empreinte().slice(0, 12)}`)}</footer>`,
      gestes,
      true,
    );
  };

  // Les demi-journées des trois semaines qui viennent, groupées par semaine. Le choix vit dans la
  // page tant qu'on n'annonce pas : un redessin ne le perd pas, la vue le suit.
  const ecranProchain = (v: Extract<Vue, { ecran: 'prochain' }>) => {
    const premier = suivant(creneauDuMoment());
    const semaines = new Map<string, Creneau[]>();
    for (let n = 0; n < JOURS_PROPOSES; n++) {
      const date = plusJours(premier.date, n);
      if (!ouvre(date)) continue;
      const lundi = lundiDe(date);
      const creneaux = (['matin', 'apres-midi'] as Demi[]).map((demi) => ({ date, demi })).filter((c) => rang(c) >= rang(premier));
      semaines.set(lundi, [...(semaines.get(lundi) ?? []), ...creneaux]);
    }
    const titre = (lundi: string) =>
      lundi === lundiDe(dateIso(Date.now()))
        ? 'Cette semaine'
        : `Semaine du ${new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(enJour(lundi))}`;
    const ligne = (c: Creneau) =>
      `<label><input type="radio" name="prochain" value="${enTexte(c)}"${rang(c) === rang(v.choix) ? ' checked' : ''}><span class="rond"></span>${esc(leCours(c))}</label>`;
    afficher(
      'tel',
      'Prochain cours',
      `<header class="barre"><h1 class="barre-titre" tabindex="-1">Prochain cours</h1><span class="mono">${esc(porte.nom)}</span></header>
       <main class="page">
         <p class="mono">Les apprenants de la classe le voient sur leur téléphone.</p>
         ${[...semaines]
           .map(([lundi, creneaux]) => `<section class="bloc"><p class="etiquette">${esc(titre(lundi))}</p><div class="choix" role="radiogroup" aria-label="${esc(titre(lundi))}">${creneaux.map(ligne).join('')}</div></section>`)
           .join('')}
       </main>
       <footer class="bas"><div class="gestes">${retour}<button class="touche" data-geste="annoncerProchain">${ic('send', 'ic-24')}<span>Annoncer à la classe</span></button></div>${faits(relais)}</footer>`,
      gestes,
      true,
    );
    for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="prochain"]')) {
      radio.onchange = () => {
        if (vue.ecran === 'prochain') vue = { ...vue, choix: lireCreneau(radio.value) };
      };
    }
  };

  const rendre = () => {
    const maintenant = Date.now();
    if (vue.ecran === 'prochain') return ecranProchain(vue);
    if (vue.ecran === 'inviter') return inviter(vue);
    if (vue.ecran === 'accepter') return ecranAccepter(vue);
    if (vue.ecran === 'membres') return ecranMembres();
    if (vue.ecran === 'nom' && appel && !appel.close()) return nom(appel, vue.cle);
    if (vue.ecran === 'lire' && appel && !appel.close()) return lireQr(vue);
    const autreDemi = appel && (appel.date() !== dateIso(maintenant) || appel.demi() !== demiJournee(maintenant, porte.apres_midi));
    if (!appel || (appel.close() && autreDemi)) return avant(maintenant);
    if (appel.close()) return apres(appel, maintenant);
    return liste(appel, maintenant);
  };

  recevoir(coeur, relais, moi, (l) => {
    if (l.t === 'presence') {
      repondre(l.presence, 'reseau');
    } else if (l.t === 'entree' && l.code === classe.code) {
      let demande;
      try {
        demande = coeur.lire_demande(classe.code, l.demande);
      } catch {
        return; // Une demande mal signée ne s'affiche pas.
      }
      const connue = [...membres(), ...demandes()].some((m) => m.cle === demande.cle) || (classe.dehors ?? []).includes(demande.cle);
      if (connue) return;
      changer({ ...classe, demandes: [...(classe.demandes ?? []), l.demande] });
    } else {
      return;
    }
    if (vue.ecran === 'cours' || vue.ecran === 'accepter') rendre();
  });
  relais.changement = () => {
    if (vue.ecran !== 'lire') rendre();
  };
  setInterval(() => {
    const avant = classe.prochainEnAttente;
    envoyerLeProchainALHeure();
    const decompte = (appel?.close() && !appel.definitive(Date.now() - 2000)) || avant;
    if (decompte && vue.ecran === 'cours') rendre();
  }, 1000);
  envoyerLeProchainALHeure();
  rendre();
}
