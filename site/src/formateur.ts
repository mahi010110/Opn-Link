// Le téléphone du formateur : lancer l'appel, voir qui manque, clore et signer.
// La salle montre le QR, le téléphone montre les noms.

import type { Coeur } from './coeur';
import { type Config, ecrire, lire } from './config';
import { envoyer, recevoir } from './lettres';
import type { Relais } from './relais';
import { codeDe, phrase } from './textes';
import { afficher, dateIso, demiJournee, esc, heure, heureCourte, horaire, ic, jour, paves } from './vue';

type Vue = { ecran: 'appel' } | { ecran: 'nom'; cle: string } | { ecran: 'lire'; cle: string; erreur?: string; texte?: string };

const ANNULER_MS = 30_000;
const MENU = `<nav class="menu" aria-label="Entrées"><a href="#">Classe</a><a href="#">Messages</a><a href="#">Mes cours</a><a href="#">Moi</a></nav>`;

export function formateur(coeur: Coeur, config: Config, relais: Relais): void {
  const moi = coeur.Appareil.relire(config.secrets);
  const nomFormateur = `${config.moi.prenom} ${config.moi.nom}`;
  const garde = lire<{ journal: string; secret?: string }>('appel');
  let appel = garde ? coeur.Appel.relire(garde.journal, garde.secret ?? undefined, moi) : undefined;
  let vue: Vue = { ecran: 'appel' };

  const garder = () => {
    if (appel) ecrire('appel', { journal: appel.journal(), secret: appel.secret() });
  };
  const versLaSalle = () => {
    if (!appel) return;
    const [presents, inscrits] = appel.compte();
    envoyer(coeur, relais, moi.boite(), { v: 1, t: 'compte', seance: appel.seance(), presents, inscrits });
  };
  const inscrit = (cle: string) => config.inscrits.find((i) => i.cle === cle);
  const faits = (texte = 'Tout est parti') => {
    const n = relais.attend;
    if (!n) return `<p class="faits"><span>${texte}</span></p>`;
    return `<p class="faits"><span class="attend">${relais.ouvert ? '' : 'Pas de réseau · '}${n} envoi${n > 1 ? 's attendent' : ' attend'}</span></p>`;
  };

  const lancer = () => {
    const maintenant = Date.now();
    const demi = demiJournee(maintenant, config.classe.apresMidi);
    const inscrits = config.inscrits.map((i) => [i.prenom, i.nom, i.cle, i.boite].join('\t')).join('\n');
    appel = coeur.Appel.ouvrir(config.classe.code, dateIso(maintenant), demi, moi, inscrits, maintenant);
    garder();
    envoyer(coeur, relais, moi.boite(), { v: 1, t: 'appel', journal: appel.journal(), secret: appel.secret()! });
    vue = { ecran: 'appel' };
    rendre();
  };

  const repondre = (presence: string, voie: 'reseau' | 'qr'): string | undefined => {
    if (!appel) return 'appel-clos';
    let cle: string;
    try {
      cle = coeur.cle_de_la_presence(presence);
    } catch (e) {
      return codeDe(e);
    }
    const qui = inscrit(cle);
    try {
      appel.recevoir(presence, voie, Date.now());
    } catch (e) {
      if (qui) envoyer(coeur, relais, qui.boite, { v: 1, t: 'refus', seance: appel.seance(), raison: codeDe(e) });
      return codeDe(e);
    }
    garder();
    versLaSalle();
    const ligne = appel.lignes().find((l) => l.cle === cle);
    if (qui && ligne) envoyer(coeur, relais, qui.boite, { v: 1, t: 'recu', seance: appel.seance(), quand: ligne.quand, par: nomFormateur });
    return undefined;
  };

  const gestes = {
    lancer,
    nom: (c: HTMLElement) => {
      vue = { ecran: 'nom', cle: c.dataset.cle! };
      rendre();
    },
    retour: () => {
      vue = { ecran: 'appel' };
      rendre();
    },
    ici: () => {
      if (vue.ecran !== 'nom' || !appel) return;
      appel.signer_ici(vue.cle, Date.now());
      garder();
      versLaSalle();
      vue = { ecran: 'appel' };
      rendre();
    },
    retard: () => {
      if (vue.ecran !== 'nom' || !appel) return;
      appel.noter_retard(vue.cle, Date.now(), Date.now());
      garder();
      vue = { ecran: 'appel' };
      rendre();
    },
    lireQr: () => {
      if (vue.ecran !== 'nom') return;
      vue = { ecran: 'lire', cle: vue.cle };
      rendre();
    },
    validerQr: () => {
      if (vue.ecran !== 'lire') return;
      const texte = document.querySelector<HTMLTextAreaElement>('#texte-qr')?.value.trim() ?? '';
      const erreur = repondre(texte, 'qr');
      vue = erreur ? { ...vue, erreur, texte } : { ecran: 'appel' };
      rendre();
    },
    clore: () => {
      if (!appel) return;
      const [presents, absents] = appel.clore(Date.now());
      garder();
      envoyer(coeur, relais, moi.boite(), { v: 1, t: 'clos', seance: appel.seance(), presents, absents, quand: Date.now() });
      rendre();
    },
    annuler: () => {
      if (!appel) return;
      appel.annuler_cloture(Date.now());
      garder();
      envoyer(coeur, relais, moi.boite(), { v: 1, t: 'reouvert', seance: appel.seance() });
      versLaSalle();
      rendre();
    },
  };

  const barre = (maintenant: number, ouvert: boolean) =>
    `<header class="barre${ouvert ? ' maintenant' : ''}"><h1 class="barre-titre" tabindex="-1">${esc(config.classe.centre)}</h1><span class="mono">${jour(maintenant)} · ${heure(maintenant)}</span></header>`;

  const avant = (maintenant: number) => {
    const demi = demiJournee(maintenant, config.classe.apresMidi);
    const [debut, fin] = (demi === 'matin' ? config.classe.matin : config.classe.apresMidi).split('-');
    afficher(
      'tel',
      config.classe.nom,
      `${barre(maintenant, false)}${MENU}
       <main class="page">
         <section class="reponse">${ic('users', 'ic-32')}<div>
           <h2 class="tres-gros">${esc(config.classe.nom)}</h2>
           <p class="mono">${demi === 'matin' ? 'Matin' : 'Après-midi'}, ${horaire(debut)} à ${horaire(fin)} · ${config.inscrits.length} apprenants</p>
         </div></section>
       </main>
       <footer class="bas"><div class="gestes"><button class="touche" data-geste="lancer">${ic('qr-code', 'ic-24')}<span>Lancer l’appel</span></button></div>${faits()}</footer>`,
      gestes,
    );
  };

  const liste = (a: InstanceType<Coeur['Appel']>, maintenant: number) => {
    const lignes = a.lignes();
    const manquent = lignes.filter((l) => l.etat !== 'present');
    const ont = lignes.filter((l) => l.etat === 'present').sort((x, y) => y.quand - x.quand);
    const [presents, inscrits] = a.compte();
    const comment = (l: (typeof lignes)[number]) =>
      l.voie === 'ici' ? 'sur ton téléphone · ' : l.voie === 'qr' ? 'QR lu · ' : '';
    afficher(
      'tel',
      'L’appel',
      `${barre(maintenant, true)}${MENU}
       <main class="page">
         <section class="bloc">
           <div><h2 class="tres-gros" tabindex="-1">${presents} sur ${inscrits}</h2><p class="mono">${esc(config.classe.nom)} · l’appel est ouvert</p></div>
           ${paves(presents, inscrits)}
         </section>
         ${manquent.length ? `<section class="bloc"><p class="etiquette">Pas encore signé</p><div class="liste">${manquent
           .map((l) => `<button class="rangee" data-geste="nom" data-cle="${l.cle}"><div><b>${esc(l.prenom)} ${esc(l.nom)}</b>${l.retard ? `<span class="mono">retard noté à ${heureCourte(l.retard)}</span>` : ''}</div>${ic('chevron-right')}</button>`)
           .join('')}</div></section>` : ''}
         ${ont.length ? `<section class="bloc"><p class="etiquette">Ont signé</p><div class="liste">${ont
           .map((l) => `<div class="rangee faite"><div><b>${esc(l.prenom)} ${esc(l.nom)}</b></div><span class="mono">${comment(l)}${heureCourte(l.quand)}</span></div>`)
           .join('')}</div></section>` : ''}
       </main>
       <footer class="bas"><div class="gestes"><button class="touche" data-geste="clore">${ic('check', 'ic-24')}<span>Clore et signer<small>${presents} présent${presents > 1 ? 's' : ''} · ${inscrits - presents} absent${inscrits - presents > 1 ? 's' : ''}</small></span></button></div>${faits('Ton ordinateur montre le QR à la salle')}</footer>`,
      gestes,
      true,
    );
  };

  const nom = (a: InstanceType<Coeur['Appel']>, cle: string) => {
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
       <footer class="bas"><div class="gestes"><button class="btn retour" data-geste="retour">${ic('arrow-left', 'ic-20')}Retour</button></div>${faits()}</footer>`,
      gestes,
    );
  };

  const lireQr = (v: Extract<Vue, { ecran: 'lire' }>) => {
    const l = config.inscrits.find((x) => x.cle === v.cle);
    afficher(
      'tel',
      'Lire son QR',
      `<header class="barre maintenant"><h1 class="barre-titre" tabindex="-1">Lire son QR</h1><span class="mono">${esc(l ? `${l.prenom} ${l.nom}` : '')}</span></header>
       <main class="page">
         <div class="viseur-vide">La caméra viendra au prochain pas du prototype.</div>
         <div class="bloc">
           <label class="champ-nom">Le texte du QR<textarea id="texte-qr" class="champ code${v.erreur ? ' faux' : ''}" rows="4" autocapitalize="off" autocorrect="off" spellcheck="false"${v.erreur ? ' aria-describedby="erreur"' : ''}>${esc(v.texte ?? '')}</textarea></label>
           ${v.erreur ? `<p class="erreur" id="erreur">${ic('info-box')}<span>${esc(phrase(v.erreur, nomFormateur))}</span></p>` : ''}
         </div>
       </main>
       <footer class="bas"><div class="gestes"><button class="btn retour" data-geste="retour">${ic('arrow-left', 'ic-20')}Retour</button><button class="touche" data-geste="validerQr">${ic('check', 'ic-24')}<span>Valider</span></button></div>${faits()}</footer>`,
      gestes,
    );
  };

  const apres = (a: InstanceType<Coeur['Appel']>, maintenant: number) => {
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
           <p class="mono">${esc(config.classe.nom)} · ${heure(cloture)} · ${presents} présent${presents > 1 ? 's' : ''}, ${inscrits - presents} absent${inscrits - presents > 1 ? 's' : ''}</p>
         </div></section>
         ${absents.length ? `<section class="bloc"><p class="etiquette">À suivre</p><div class="liste">${absents
           .map((l) => `<div class="rangee"><div><b>${esc(l.prenom)} ${esc(l.nom)}</b><span class="mono">une absence ce ${a.demi() === 'matin' ? 'matin' : 'après-midi'}</span></div></div>`)
           .join('')}</div></section>` : ''}
       </main>
       <footer class="bas">${reste > 0 ? `<div class="gestes"><button class="btn retour" data-geste="annuler">${ic('undo', 'ic-20')}Annuler la clôture · ${reste} s</button></div>` : ''}${faits(reste > 0 ? 'La feuille part au registre public dans 30 secondes' : `Feuille close · empreinte ${a.empreinte().slice(0, 12)}`)}</footer>`,
      gestes,
      true,
    );
  };

  const rendre = () => {
    const maintenant = Date.now();
    if (vue.ecran === 'nom' && appel && !appel.close()) return nom(appel, vue.cle);
    if (vue.ecran === 'lire' && appel && !appel.close()) return lireQr(vue);
    const autreDemi = appel && (appel.date() !== dateIso(maintenant) || appel.demi() !== demiJournee(maintenant, config.classe.apresMidi));
    if (!appel || (appel.close() && autreDemi)) return avant(maintenant);
    if (appel.close()) return apres(appel, maintenant);
    return liste(appel, maintenant);
  };

  recevoir(coeur, relais, moi, (l) => {
    if (l.t !== 'presence') return;
    repondre(l.presence, 'reseau');
    if (vue.ecran === 'appel') rendre();
  });
  relais.changement = () => {
    if (vue.ecran !== 'lire') rendre();
  };
  setInterval(() => {
    if (appel?.close() && vue.ecran === 'appel' && !appel.definitive(Date.now() - 2000)) rendre();
  }, 1000);
  rendre();
}
