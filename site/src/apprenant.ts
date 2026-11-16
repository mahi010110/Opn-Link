// Le téléphone de l'apprenant : signer sa présence, avec le code de la salle.
// Sans réponse au bout de dix secondes, l'écran montre seul le QR à tendre au formateur.

import type { Coeur } from './coeur';
import { type Config, ecrire, lire } from './config';
import { envoyer, recevoir } from './lettres';
import type { Relais } from './relais';
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

export function apprenant(coeur: Coeur, config: Config, relais: Relais): void {
  const moi = coeur.Appareil.relire(config.secrets);
  const formateur = `${config.formateur.prenom} ${config.formateur.nom}`;
  let garde = lire<Garde>('presence');
  let vue: Vue = { ecran: 'jour' };

  const maintenant = () => Date.now();
  const demi = () => demiJournee(maintenant(), config.classe.apresMidi);
  const seance = () => coeur.seance(config.classe.code, dateIso(maintenant()), demi());
  const cetteFois = () => (garde?.seance === seance() ? garde : undefined);
  const faits = () => {
    const n = relais.attend;
    if (!n) return `<p class="faits"><span>Tout est parti</span></p>`;
    return `<p class="faits"><span class="attend">${relais.ouvert ? '' : 'Pas de réseau · '}${n} envoi${n > 1 ? 's attendent' : ' attend'}</span></p>`;
  };
  const barre = (ouvert = false) =>
    `<header class="barre${ouvert ? ' maintenant' : ''}"><h1 class="barre-titre" tabindex="-1">Au centre</h1><span class="mono">${jour(maintenant())} · ${heure(maintenant())}</span></header>`;
  const MENU = `<nav class="menu" aria-label="Entrées"><a href="#">Classe</a><a href="#">Messages</a><a href="#">Mes documents</a><a href="#">Moi</a></nav>`;

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
    envoyer(coeur, relais, config.formateur.boite, { v: 1, t: 'presence', presence });
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
    const [debut, fin] = (demi() === 'matin' ? config.classe.matin : config.classe.apresMidi).split('-');
    const moment = `${demi() === 'matin' ? 'Matin' : 'Après-midi'}, ${horaire(debut)} à ${horaire(fin)} · ${esc(formateur)}`;
    let reponse: string;
    let touche = '';
    if (fois?.recu) {
      reponse = `${ic('checkbox-on', 'ic-32')}<div><h2 class="tres-gros">Présence signée</h2><p class="mono">${heure(fois.recu.quand)} · reçue par ${esc(fois.recu.par)}</p></div>`;
    } else if (fois) {
      reponse = `${ic('clock', 'ic-32')}<div><h2 class="tres-gros">Présence envoyée</h2><p class="mono">${heure(fois.signee)} · ${esc(formateur)} ne l’a pas encore reçue</p></div>`;
    } else {
      reponse = `${ic('qr-code', 'ic-32')}<div><h2 class="tres-gros">Ta présence</h2><p class="mono">${moment}</p></div>`;
      touche = `<div class="gestes"><button class="touche" data-geste="signer">${ic('qr-code', 'ic-24')}<span>Signer ma présence</span></button></div>`;
    }
    afficher('tel', 'Aujourd’hui', `${barre()}${MENU}<main class="page"><section class="reponse">${reponse}</section></main><footer class="bas">${touche}${faits()}</footer>`, gestes);
  };

  const ecranSigner = (v: Extract<Vue, { ecran: 'signer' }>) => {
    const cases = Array.from({ length: 6 }, (_, n) => `<span${n === v.chiffres.length ? ' class="ici"' : ''}>${v.chiffres[n] ?? ''}</span>`).join('');
    const touches = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => `<button class="btn" data-geste="chiffre" data-n="${n}">${n}</button>`).join('');
    afficher(
      'tel',
      'Présence',
      `<header class="barre maintenant"><h1 class="barre-titre" tabindex="-1">Présence</h1><span class="mono">${demi() === 'matin' ? 'matin' : 'après-midi'} · ${esc(formateur)}</span></header>
       <main class="page">
         <div class="viseur-vide">La caméra viendra au prochain pas du prototype.</div>
         <section class="bloc">
           <p class="etiquette">Tape les 6 chiffres de l’écran</p>
           <div class="code6${v.erreur ? ' faux' : ''}" role="group" aria-label="Le code de l’appel"${v.erreur ? ' aria-describedby="erreur"' : ''}>${cases}</div>
           ${v.erreur ? `<p class="erreur" id="erreur" role="alert">${ic('info-box')}<span>${esc(phrase(v.erreur, formateur))}</span></p>` : ''}
         </section>
         <div class="chiffres" aria-label="Chiffres">${touches}<span class="btn vide"></span><button class="btn" data-geste="chiffre" data-n="0">0</button><button class="btn" data-geste="effacer" aria-label="Effacer">${ic('delete', 'ic-24')}</button></div>
       </main>
       <footer class="bas"><div class="gestes"><button class="btn retour" data-geste="retour">${ic('arrow-left', 'ic-20')}Retour</button></div>${faits()}</footer>`,
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
      `<header class="barre maintenant"><h1 class="barre-titre">Présence</h1><span class="mono">${demi() === 'matin' ? 'matin' : 'après-midi'} · ${esc(formateur)}</span></header>
       <main class="page">
         <section><h2 class="gros" tabindex="-1">Montre ce QR à ${esc(formateur)}</h2><p class="mono">Signée à ${heure(fois.signee)} · pas encore reçue</p></section>
         <div class="qr" role="img" aria-label="Le QR de ta présence" data-presence="${esc(fois.presence)}">${coeur.svg_du_qr(fois.presence)}</div>
       </main>
       <footer class="bas"><div class="gestes"><button class="btn retour" data-geste="retour">${ic('arrow-left', 'ic-20')}Retour</button></div>${faits()}</footer>`,
      gestes,
    );
  };

  const rendre = () => {
    if (vue.ecran === 'signer') return ecranSigner(vue);
    if (vue.ecran === 'sans-reseau') return ecranSansReseau();
    return ecranDuJour();
  };

  recevoir(coeur, relais, moi, (l) => {
    if (!garde || !('seance' in l) || l.seance !== garde.seance) return;
    if (l.t === 'recu') {
      garde = { ...garde, recu: { quand: l.quand, par: l.par } };
      ecrire('presence', garde);
      vue = { ecran: 'jour' };
    } else if (l.t === 'refus' && !garde.recu) {
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
