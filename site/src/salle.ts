// L'écran de la salle : le QR pour rejoindre la classe, puis celui de l'appel. Aucun nom, jamais.
// Il tourne sur l'ordinateur du formateur, qui reçoit de son téléphone l'état de ses classes. Il
// montre la classe dont le téléphone lance l'appel, ou qu'il montre à la salle.

import type { Appel } from './coeur';
import { type Contexte } from './contexte';
import { type ClasseGardee, ecrire, lire } from './etat';
import { lienDeLaClasse, recevoir } from './lettres';
import { afficher, codeAffiche, esc, heure, jour, paves } from './vue';

const AFFICHER_CLOS_MS = 3000;
const CLOTURE_RECENTE_MS = 60_000;

export function salle(ctx: Contexte): void {
  const { coeur, relais, moi } = ctx;
  const connues = lire<Record<string, ClasseGardee>>('classes-de-la-salle') ?? {};
  // Avant le 24 novembre 2026, la salle ne gardait qu'une classe.
  const ancienne = lire<ClasseGardee>('classe-de-la-salle');
  if (ancienne) {
    connues[ancienne.code] ??= ancienne;
    ecrire('classes-de-la-salle', connues);
    ecrire('classe-de-la-salle', null);
  }
  const seules = Object.keys(connues);
  let code = seules.length === 1 ? seules[0] : undefined;
  const classe = () => (code ? connues[code] : undefined);
  let rejoindre = false;
  let appel: Appel | undefined;
  let compte = [0, 0];
  let clos: number | undefined;
  let dernier = '';

  const porte = () => {
    const c = classe();
    return c ? coeur.lire_porte(c.code, c.porte) : undefined;
  };
  const nom = () => porte()?.nom ?? 'Opn-Link';

  const attente = () =>
    afficher(
      'salle',
      nom(),
      `<header class="barre"><h1 class="barre-titre" tabindex="-1">${esc(nom())}</h1><span class="mono">${jour(Date.now())}</span></header>
       <main class="salle-corps" style="grid-template-columns: 1fr"><p class="salle-mot">Lance l’appel depuis ton téléphone.<br>Il s’affichera ici.</p></main>`,
      {},
    );

  const ecranRejoindre = () => {
    const c = classe()!;
    const p = porte()!;
    const lien = lienDeLaClasse(coeur, c.code, p.responsables[0].cle);
    const ont = (c.membres?.length ?? 0) + (c.demandes?.length ?? 0);
    afficher(
      'salle',
      `Rejoindre · ${p.nom}`,
      `<header class="barre"><h1 class="barre-titre" tabindex="-1">Rejoindre · ${esc(p.nom)}</h1><span class="mono">${esc(p.centre)}</span></header>
       <main class="salle-corps">
         <div class="salle-qr" role="img" aria-label="Le QR de la classe" data-lien="${esc(lien)}">${coeur.svg_du_qr(lien)}</div>
         <div>
           <p class="salle-mot">Visez ce QR avec l’appareil photo<br>de votre téléphone</p>
           <p class="salle-mot" style="margin-top: 5vh">ou allez sur ${esc(location.host)}<br>et tapez le code de la classe</p>
           <p class="salle-code" style="font-size: 4.9vw" data-code="${esc(c.code)}">${codeAffiche(c.code)}</p>
         </div>
       </main>
       <footer class="salle-bas">${paves(ont, Math.max(ont, 1))}<p class="salle-compte">${ont} ${ont > 1 ? 'ont' : 'a'} rejoint</p></footer>`,
      {},
      true,
    );
  };

  const rendre = () => {
    const maintenant = Date.now();
    const titre = `Appel · ${nom()}`;
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
    if (!appel) return rejoindre && classe() ? ecranRejoindre() : attente();
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
    if (l.t === 'classe') {
      connues[l.classe.code] = l.classe;
      ecrire('classes-de-la-salle', connues);
      code ??= Object.keys(connues).length === 1 ? l.classe.code : undefined;
    } else if (l.t === 'montrer') {
      code = l.code;
      rejoindre = l.quoi === 'rejoindre';
    } else if (l.t === 'appel') {
      code = l.code ?? code;
      appel = coeur.Appel.relire(l.journal, l.secret, moi);
      const [presents, inscrits] = appel.compte();
      compte = [presents, inscrits];
      clos = undefined;
      rejoindre = false;
    } else if (appel && 'seance' in l && l.seance === appel.seance()) {
      if (l.t === 'compte') compte = [l.presents, l.inscrits];
      if (l.t === 'reouvert') clos = undefined;
      if (l.t === 'clos') {
        compte = [l.presents, l.presents + l.absents];
        // Une lettre arrivée un peu en retard montre encore la clôture, trois secondes à partir de là.
        if (Date.now() - l.quand < CLOTURE_RECENTE_MS) {
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
  rendre();
}
