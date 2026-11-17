// Le téléphone de l'apprenant : attendre d'être accepté, puis signer sa présence.
// Il apprend sur le fil de la classe que l'appel est ouvert, puis clos. Sans réseau, il ne peut pas
// le savoir : la touche « Signer ma présence » reste là pendant les heures de la classe.
// Sans réponse au bout de dix secondes, l'écran montre seul le QR à tendre au formateur.

import { arreter, poser, viser } from './camera';
import { type Contexte, faits, nomDe } from './contexte';
import { type ClasseGardee, classes, ecrire, garderClasse, lire, oublierClasse } from './etat';
import { entree } from './routes';
import { ecouterLeFil, envoyer, recevoir } from './lettres';
import { phrase } from './textes';
import { afficher, dateIso, demiJournee, esc, heure, horaire, ic, installable, installer, jour, surIPhone, surLEcranDAccueil } from './vue';

interface Garde {
  seance: string;
  presence: string;
  signee: number;
  recu?: { quand: number; par: string };
}

type Vue = { ecran: 'jour' } | { ecran: 'signer'; chiffres: string; erreur?: string; erreurQr?: string; sansCamera?: boolean } | { ecran: 'sans-reseau' };

type Annonce = ReturnType<Contexte['coeur']['lire_annonce_de_l_appel']>;
interface AnnonceGardee {
  seance: string;
  date: string;
  demi: string;
  etat: string;
  quand: number;
  par: string;
}

const SANS_REPONSE_MS = 10_000;
// Le temps de joindre un relais au démarrage, avant de conclure qu'il n'y a pas de réseau.
const HORS_LIGNE_MS = 5_000;
const MENU = `<nav class="menu" aria-label="Entrées"><a href="#">Classe</a><a href="#">Messages</a><a href="#">Mes documents</a><a href="#">Moi</a></nav>`;

export function apprenant(ctx: Contexte): void {
  const { coeur, relais, moi } = ctx;
  let classe = classes().find((c) => c.role === 'apprenant') as ClasseGardee;
  let porte = coeur.lire_porte(classe.code, classe.porte);
  let garde = lire<Garde>('presence');
  let vue: Vue = { ecran: 'jour' };
  const demarrage = Date.now();
  // Les annonces de l'appel du jour, une par séance : la plus récente compte.
  let annonces = (lire<AnnonceGardee[]>('annonces-appel') ?? []).filter((a) => a.date === dateIso(Date.now()));

  const formateur = () => nomDe(porte.responsables[0]);
  const maintenant = () => Date.now();
  const demi = () => demiJournee(maintenant(), porte.apres_midi);
  const seance = () => coeur.seance(classe.code, dateIso(maintenant()), demi());
  const nomDuResponsable = (cle: string) => {
    const r = porte.responsables.find((x) => x.cle === cle);
    return r ? nomDe(r) : formateur();
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
  const cetteFois = () => (garde?.seance === seanceDuMoment() ? garde : undefined);
  const horsLigne = () => !relais.ouvert && Date.now() - demarrage > HORS_LIGNE_MS;
  const barre = (ouvert = false) =>
    `<header class="barre${ouvert ? ' maintenant' : ''}"><h1 class="barre-titre" tabindex="-1">Au centre</h1><span class="mono">${jour(maintenant())} · ${heure(maintenant())}</span></header>`;

  const recevoirAnnonce = (texte: string) => {
    let a: Annonce;
    try {
      a = coeur.lire_annonce_de_l_appel(classe.code, classe.fil!, texte, porte.responsables.map((r) => r.cle));
    } catch {
      return; // Une annonce qu'un responsable n'a pas signée ne compte pas.
    }
    if (a.date !== dateIso(maintenant())) return;
    const avant = annonces.find((x) => x.seance === a.seance);
    if (avant && avant.quand >= a.quand) return;
    annonces = [...annonces.filter((x) => x.seance !== a.seance), { seance: a.seance, date: a.date, demi: a.demi, etat: a.etat, quand: a.quand, par: a.par }];
    ecrire('annonces-appel', annonces);
    if (vue.ecran === 'jour') rendre();
  };
  const ecouterLAppel = () => {
    if (classe.fil) ecouterLeFil(coeur, relais, classe.fil, recevoirAnnonce);
  };

  const attente = () => {
    const demande = coeur.lire_demande(classe.code, classe.demande!);
    afficher(
      'tel',
      porte.nom,
      `<header class="barre pas-maintenant"><h1 class="barre-titre">${esc(porte.nom)}</h1><span class="mono">${esc(porte.centre)}</span></header>
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
          entree(ctx);
        },
      },
    );
  };

  const versSigner = (chiffres = '', erreur?: string) => {
    const sansCamera = vue.ecran === 'signer' && vue.sansCamera;
    vue = { ecran: 'signer', chiffres, erreur, sansCamera };
    rendre();
    if (sansCamera) return;
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
    arreter();
    garde = { seance: seanceSignee, presence, signee: maintenant() };
    ecrire('presence', garde);
    for (const r of porte.responsables) envoyer(coeur, relais, r.boite, { v: 1, t: 'presence', presence });
    vue = { ecran: 'jour' };
    const signee = garde.signee;
    setTimeout(() => {
      if (garde?.signee === signee && !garde.recu && vue.ecran === 'jour') {
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

  // Demandé une fois, juste après la première présence signée, avec la raison (conception, partie 4).
  const proposerLAccueil = () => !surLEcranDAccueil() && !lire<number>('accueil-propose') && (surIPhone() || installable());
  const accueil = () => {
    if (surIPhone()) {
      return `<section class="fen"><header class="barre"><h2 class="barre-titre">Sur cet iPhone</h2></header><div class="fen-corps">
        <h3 class="gros">Garde Opn-Link sur ton écran d’accueil</h3>
        <p class="lu">Sinon, l’iPhone peut effacer tes données après 7 jours sans visite.</p>
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
      <p class="lu">Tu le retrouves d’un geste, même sans réseau.</p>
      <div class="note-gestes"><button class="btn" data-geste="plusTard">Plus tard</button></div>
    </div></section>`;
  };

  const gestes = {
    plusTard: () => {
      ecrire('accueil-propose', Date.now());
      rendre();
    },
    installer: async () => {
      await installer();
      ecrire('accueil-propose', Date.now());
      rendre();
    },
    signer: () => versSigner(),
    chiffre: (c: HTMLElement) => taper(c.dataset.n!),
    effacer,
    retour: () => {
      arreter();
      vue = { ecran: 'jour' };
      rendre();
    },
  };

  document.addEventListener('keydown', (e) => {
    if (vue.ecran !== 'signer') return;
    if (/^[0-9]$/.test(e.key)) taper(e.key);
    if (e.key === 'Backspace') effacer();
  });

  const ecranDuJour = () => {
    const fois = cetteFois();
    const annonce = annonceDuMoment();
    const laDemi = annonce?.demi ?? demi();
    const qui = esc(annonce ? nomDuResponsable(annonce.par) : formateur());
    const [debut, fin] = (laDemi === 'matin' ? porte.matin : porte.apres_midi).split('-');
    const nomDeLaDemi = laDemi === 'matin' ? 'Matin' : 'Après-midi';
    const moment = `${nomDeLaDemi}, ${horaire(debut)} à ${horaire(fin)} · ${qui}`;
    const toucheSigner = `<div class="gestes"><button class="touche" data-geste="signer">${ic('qr-code', 'ic-24')}<span>Signer ma présence</span></button></div>`;
    const ouvert = !fois && annonce?.etat === 'ouvert';
    let reponse: string;
    let touche = '';
    let fenetre = '';
    if (fois?.recu) {
      reponse = `${ic('checkbox-on', 'ic-32')}<div><h2 class="tres-gros">Présence signée</h2><p class="mono">${heure(fois.recu.quand)} · reçue par ${esc(fois.recu.par)}</p></div>`;
      if (proposerLAccueil()) {
        fenetre = accueil();
        if (!surIPhone()) touche = `<div class="gestes"><button class="touche" data-geste="installer">${ic('download', 'ic-24')}<span>Installer</span></button></div>`;
      }
    } else if (fois) {
      reponse = `${ic('clock', 'ic-32')}<div><h2 class="tres-gros">Présence envoyée</h2><p class="mono">${heure(fois.signee)} · ${esc(formateur())} ne l’a pas encore reçue</p></div>`;
    } else if (ouvert) {
      reponse = `${ic('qr-code', 'ic-32')}<div><h2 class="tres-gros">L’appel est ouvert</h2><p class="mono">${moment}</p></div>`;
      touche = toucheSigner;
    } else if (annonce?.etat === 'clos') {
      reponse = `${ic('square-alert', 'ic-32')}<div><h2 class="tres-gros">Une absence</h2><p class="mono">${nomDeLaDemi} · appel clos à ${heure(annonce.quand)} par ${qui}</p></div>`;
    } else if (horsLigne()) {
      reponse = `${ic('qr-code', 'ic-32')}<div><h2 class="tres-gros">Ta présence</h2><p class="mono">${moment}</p></div>`;
      touche = toucheSigner;
    } else {
      reponse = `${ic('clock', 'ic-32')}<div><h2 class="tres-gros">Pas d’appel ouvert</h2><p class="mono">${moment}</p></div>`;
    }
    afficher('tel', 'Aujourd’hui', `${barre(ouvert)}${MENU}<main class="page"><section class="reponse">${reponse}</section>${fenetre}</main><footer class="bas">${touche}${faits(relais)}</footer>`, gestes);
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

  const rendre = () => {
    if (!classe.acceptation) return attente();
    if (vue.ecran === 'signer') return ecranSigner(vue);
    if (vue.ecran === 'sans-reseau') return ecranSansReseau();
    return ecranDuJour();
  };

  recevoir(coeur, relais, moi, (l) => {
    if (l.t === 'admis' && l.code === classe.code && !classe.acceptation) {
      try {
        const nouvellePorte = coeur.lire_porte(classe.code, l.porte);
        coeur.lire_acceptation(classe.code, l.acceptation, nouvellePorte.responsables.map((r) => r.cle));
        classe = { code: classe.code, role: 'apprenant', porte: l.porte, fil: l.fil, acceptation: l.acceptation };
        porte = nouvellePorte;
        garderClasse(classe);
        ecouterLAppel();
      } catch {
        return; // Une admission qu'un responsable n'a pas signée ne compte pas.
      }
    } else if (garde && 'seance' in l && l.seance === garde.seance && l.t === 'recu') {
      garde = { ...garde, recu: { quand: l.quand, par: l.par } };
      ecrire('presence', garde);
      vue = { ecran: 'jour' };
    } else if (garde && 'seance' in l && l.seance === garde.seance && l.t === 'refus' && !garde.recu) {
      const chiffres = garde.presence.split('.')[2] ?? '';
      garde = undefined;
      ecrire('presence', null);
      return versSigner(chiffres, l.raison);
    } else {
      return;
    }
    rendre();
  });
  relais.changement = () => {
    if (vue.ecran !== 'signer') rendre();
  };
  setTimeout(() => vue.ecran === 'jour' && rendre(), HORS_LIGNE_MS + 100);
  ecouterLAppel();
  rendre();
}
