// Le téléphone de l'apprenant : attendre d'être accepté, puis signer sa présence.
// Sans réponse au bout de dix secondes, l'écran montre seul le QR à tendre au formateur.

import { type Contexte, faits, nomDe } from './contexte';
import { type ClasseGardee, classes, ecrire, garderClasse, lire, oublierClasse } from './etat';
import { entree } from './routes';
import { envoyer, recevoir } from './lettres';
import { phrase } from './textes';
import { afficher, dateIso, demiJournee, esc, heure, horaire, ic, jour } from './vue';

interface Garde {
  seance: string;
  presence: string;
  signee: number;
  recu?: { quand: number; par: string };
}

type Vue = { ecran: 'jour' } | { ecran: 'signer'; chiffres: string; erreur?: string } | { ecran: 'sans-reseau' };

const SANS_REPONSE_MS = 10_000;
const MENU = `<nav class="menu" aria-label="Entrées"><a href="#">Classe</a><a href="#">Messages</a><a href="#">Mes documents</a><a href="#">Moi</a></nav>`;

export function apprenant(ctx: Contexte): void {
  const { coeur, relais, moi } = ctx;
  let classe = classes().find((c) => c.role === 'apprenant') as ClasseGardee;
  let porte = coeur.lire_porte(classe.code, classe.porte);
  let garde = lire<Garde>('presence');
  let vue: Vue = { ecran: 'jour' };

  const formateur = () => nomDe(porte.responsables[0]);
  const maintenant = () => Date.now();
  const demi = () => demiJournee(maintenant(), porte.apres_midi);
  const seance = () => coeur.seance(classe.code, dateIso(maintenant()), demi());
  const cetteFois = () => (garde?.seance === seance() ? garde : undefined);
  const barre = () => `<header class="barre"><h1 class="barre-titre" tabindex="-1">Au centre</h1><span class="mono">${jour(maintenant())} · ${heure(maintenant())}</span></header>`;

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

  const signer = (chiffres: string) => {
    let presence: string;
    try {
      presence = moi.signer_code(seance(), chiffres, maintenant());
    } catch {
      vue = { ecran: 'signer', chiffres, erreur: 'code-inconnu' };
      return rendre();
    }
    garde = { seance: seance(), presence, signee: maintenant() };
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
    vue = { ecran: 'signer', chiffres };
    if (chiffres.length === 6) return signer(chiffres);
    rendre();
  };

  const effacer = () => {
    if (vue.ecran !== 'signer') return;
    vue = { ecran: 'signer', chiffres: vue.chiffres.slice(0, -1) };
    rendre();
  };

  const gestes = {
    signer: () => {
      vue = { ecran: 'signer', chiffres: '' };
      rendre();
    },
    chiffre: (c: HTMLElement) => taper(c.dataset.n!),
    effacer,
    retour: () => {
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
    const [debut, fin] = (demi() === 'matin' ? porte.matin : porte.apres_midi).split('-');
    const moment = `${demi() === 'matin' ? 'Matin' : 'Après-midi'}, ${horaire(debut)} à ${horaire(fin)} · ${esc(formateur())}`;
    let reponse: string;
    let touche = '';
    if (fois?.recu) {
      reponse = `${ic('checkbox-on', 'ic-32')}<div><h2 class="tres-gros">Présence signée</h2><p class="mono">${heure(fois.recu.quand)} · reçue par ${esc(fois.recu.par)}</p></div>`;
    } else if (fois) {
      reponse = `${ic('clock', 'ic-32')}<div><h2 class="tres-gros">Présence envoyée</h2><p class="mono">${heure(fois.signee)} · ${esc(formateur())} ne l’a pas encore reçue</p></div>`;
    } else {
      reponse = `${ic('qr-code', 'ic-32')}<div><h2 class="tres-gros">Ta présence</h2><p class="mono">${moment}</p></div>`;
      touche = `<div class="gestes"><button class="touche" data-geste="signer">${ic('qr-code', 'ic-24')}<span>Signer ma présence</span></button></div>`;
    }
    afficher('tel', 'Aujourd’hui', `${barre()}${MENU}<main class="page"><section class="reponse">${reponse}</section></main><footer class="bas">${touche}${faits(relais)}</footer>`, gestes);
  };

  const ecranSigner = (v: Extract<Vue, { ecran: 'signer' }>) => {
    const cases = Array.from({ length: 6 }, (_, n) => `<span${n === v.chiffres.length ? ' class="ici"' : ''}>${v.chiffres[n] ?? ''}</span>`).join('');
    const touches = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => `<button class="btn" data-geste="chiffre" data-n="${n}">${n}</button>`).join('');
    afficher(
      'tel',
      'Présence',
      `<header class="barre maintenant"><h1 class="barre-titre" tabindex="-1">Présence</h1><span class="mono">${demi() === 'matin' ? 'matin' : 'après-midi'} · ${esc(formateur())}</span></header>
       <main class="page">
         <div class="viseur-vide">La caméra viendra au prochain pas du prototype.</div>
         <section class="bloc">
           <p class="etiquette">Tape les 6 chiffres de l’écran</p>
           <div class="code6${v.erreur ? ' faux' : ''}" role="group" aria-label="Le code de l’appel"${v.erreur ? ' aria-describedby="erreur"' : ''}>${cases}</div>
           ${v.erreur ? `<p class="erreur" id="erreur" role="alert">${ic('info-box')}<span>${esc(phrase(v.erreur, formateur()))}</span></p>` : ''}
         </section>
         <div class="chiffres" aria-label="Chiffres">${touches}<span class="btn vide"></span><button class="btn" data-geste="chiffre" data-n="0">0</button><button class="btn" data-geste="effacer" aria-label="Effacer">${ic('delete', 'ic-24')}</button></div>
       </main>
       <footer class="bas"><div class="gestes"><button class="btn retour" data-geste="retour">${ic('arrow-left', 'ic-20')}Retour</button></div>${faits(relais)}</footer>`,
      gestes,
      v.chiffres.length > 0,
    );
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
      vue = { ecran: 'signer', chiffres, erreur: l.raison };
    } else {
      return;
    }
    rendre();
  });
  relais.changement = () => {
    if (vue.ecran !== 'signer') rendre();
  };
  rendre();
}
