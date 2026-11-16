// L'écran de la salle : le QR qui change, les six chiffres et les pavés. Aucun nom, jamais.

import type { Coeur } from './coeur';
import type { Config } from './config';
import { recevoir } from './lettres';
import type { Relais } from './relais';
import { afficher, esc, heure, jour, paves } from './vue';

const AFFICHER_CLOS_MS = 3000;

export function salle(coeur: Coeur, config: Config, relais: Relais): void {
  const moi = coeur.Appareil.relire(config.secrets);
  const titre = `Appel · ${config.classe.nom}`;
  let appel: InstanceType<Coeur['Appel']> | undefined;
  let compte = [0, config.inscrits.length];
  let clos: number | undefined;
  let dernier = '';

  const attente = () =>
    afficher(
      'salle',
      config.classe.nom,
      `<header class="barre"><h1 class="barre-titre" tabindex="-1">${esc(config.classe.nom)}</h1><span class="mono">${jour(Date.now())}</span></header>
       <main class="salle-corps" style="grid-template-columns: 1fr"><p class="salle-mot">Lance l’appel depuis ton téléphone.<br>Il s’affichera ici.</p></main>`,
      {},
    );

  const rendre = () => {
    const maintenant = Date.now();
    if (clos !== undefined) {
      afficher(
        'salle',
        titre,
        `<header class="barre"><h1 class="barre-titre" tabindex="-1">${esc(titre)}</h1><span class="mono">${jour(maintenant)}</span></header>
         <main class="salle-corps" style="grid-template-columns: 1fr"><p class="salle-titre">Appel clos · ${heure(clos)}</p></main>
         <footer class="salle-bas">${paves(compte[0], compte[1])}<p class="salle-compte">${compte[0]} sur ${compte[1]}</p></footer>`,
        {},
      );
      return;
    }
    if (!appel) return attente();
    let qr;
    try {
      qr = appel.qr(maintenant);
    } catch {
      return attente();
    }
    dernier = qr.texte;
    const code = `${qr.code.slice(0, 3)} ${qr.code.slice(3)}`;
    afficher(
      'salle',
      titre,
      `<header class="barre maintenant"><h1 class="barre-titre" tabindex="-1">${esc(titre)}</h1><span class="mono">${jour(maintenant)} · ${heure(maintenant)}</span></header>
       <main class="salle-corps">
         <div class="salle-qr" role="img" aria-label="Le QR de l’appel" data-qr="${esc(qr.texte)}">${coeur.svg_du_qr(qr.texte)}</div>
         <div>
           <p class="salle-mot">Visez le QR avec Opn-Link,<br>ou tapez le code</p>
           <p class="salle-code" data-code="${qr.code}">${code}</p>
         </div>
       </main>
       <footer class="salle-bas">${paves(compte[0], compte[1])}<p class="salle-compte">${compte[0]} sur ${compte[1]}</p></footer>`,
      {},
      true,
    );
  };

  recevoir(coeur, relais, moi, (l) => {
    if (l.t === 'appel') {
      appel = coeur.Appel.relire(l.journal, l.secret, moi);
      const [presents, inscrits] = appel.compte();
      compte = [presents, inscrits];
      clos = undefined;
    } else if (appel && 'seance' in l && l.seance === appel.seance()) {
      if (l.t === 'compte') compte = [l.presents, l.inscrits];
      if (l.t === 'reouvert') clos = undefined;
      if (l.t === 'clos') {
        compte = [l.presents, l.presents + l.absents];
        if (Date.now() - l.quand < AFFICHER_CLOS_MS) {
          clos = l.quand;
          setTimeout(() => {
            if (clos === l.quand) {
              clos = undefined;
              appel = undefined;
              rendre();
            }
          }, AFFICHER_CLOS_MS);
        } else {
          appel = undefined;
        }
      }
    } else {
      return;
    }
    rendre();
  });

  setInterval(() => {
    if (!appel || clos !== undefined) return;
    try {
      if (appel.qr(Date.now()).texte !== dernier) rendre();
    } catch {
      rendre();
    }
  }, 500);
  attente();
}
