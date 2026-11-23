// L'apprenant sans classe : taper le code, ou ouvrir le lien du QR, puis demander à entrer.
// L'adjoint invité ouvre son lien à lui, demande au chef, et attend son accord.

import { apprenant } from './apprenant';
import { type Contexte, faits, nomDe } from './contexte';
import { classes, ecrire, garderClasse, oublierClasse } from './etat';
import { formateur } from './formateur';
import { chercherPorte, codeNormal, envoyer, recevoir } from './lettres';
import { fusionner } from './responsables';
import { entree } from './routes';
import { codeDe, phrase } from './textes';
import { afficher, codeAffiche, esc, heure, ic } from './vue';

type Porte = ReturnType<Contexte['coeur']['choisir_porte']>;

export function sansClasse(ctx: Contexte): void {
  ctx.relais.changement = () => {};
  afficher(
    'tel',
    'Opn-Link',
    `<header class="barre"><h1 class="barre-titre">Opn-Link</h1></header>
     <main class="page">
       <section><h2 class="tres-gros" tabindex="-1">Rejoins ta classe</h2><p class="mono">Le formateur montre le QR de la classe à la salle. Vise-le avec l’appareil photo de ton téléphone.</p></section>
       <div class="liste"><button class="rangee" data-geste="code">${ic('pencil', 'ic-20')}<div><b>Taper un code</b><span class="mono">celui de ta classe</span></div>${ic('chevron-right')}</button></div>
     </main>`,
    { code: () => taperLeCode(ctx) },
  );
}

// Sans réseau, la recherche reprend d'elle-même dès qu'un relais répond.
function auRetourDuReseau(ctx: Contexte, reprendre: () => void): void {
  ctx.relais.changement = () => {
    if (!ctx.relais.ouvert) return;
    ctx.relais.changement = () => {};
    reprendre();
  };
}

function taperLeCode(ctx: Contexte, texte = '', erreur?: string): void {
  let cherche = false;
  const attente = erreur === 'sans-reseau';
  if (attente) erreur = undefined;
  afficher(
    'tel',
    'Code',
    `<header class="barre"><h1 class="barre-titre">Code</h1></header>
     <main class="page"><div class="bloc">
       <label class="champ-nom" for="code">Le code de ta classe</label>
       <input id="code" class="champ code${erreur ? ' faux' : ''}" value="${esc(texte)}" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false"${erreur ? ' aria-describedby="erreur"' : ''}>
       ${erreur ? `<p class="erreur" id="erreur" role="alert">${ic('info-box')}<span>${esc(phrase(erreur))}</span></p>` : `<p class="mono" id="etat" role="status">${attente ? esc(phrase('sans-reseau')) : ''}</p>`}
     </div></main>
     <footer class="bas"><div class="gestes"><button class="btn retour" data-geste="retour">${ic('arrow-left', 'ic-20')}Retour</button></div></footer>`,
    { retour: () => sansClasse(ctx) },
    true,
  );
  const champ = document.querySelector<HTMLInputElement>('#code')!;
  champ.focus();
  champ.setSelectionRange(champ.value.length, champ.value.length);
  const chercher = async () => {
    const valeur = champ.value;
    if (cherche || valeur.replace(/[\s-]/g, '').length < 15) return;
    cherche = true;
    const etat = document.querySelector('#etat');
    if (etat) etat.textContent = 'Je cherche la classe…';
    try {
      const porte = await chercherPorte(ctx.coeur, ctx.relais, valeur);
      rejoindre(ctx, codeNormal(valeur), porte);
    } catch (e) {
      taperLeCode(ctx, valeur, codeDe(e));
    }
  };
  champ.oninput = chercher;
  if (attente) auRetourDuReseau(ctx, chercher);
}

/// Le lien du QR mène ici : la classe s'affiche tout de suite, sans rien taper.
export function rejoindreParLien(ctx: Contexte, code: string, chef: string): Promise<void> {
  return chercherLaClasse(ctx, code, chef, (porte) => rejoindre(ctx, code, porte));
}

/// L'invitation d'un adjoint mène ici : la classe s'affiche, et le rôle proposé.
export function rejoindreCommeAdjoint(ctx: Contexte, lien: Invitation): Promise<void> {
  return chercherLaClasse(ctx, lien.code, lien.chef, (porte) => demanderAuChef(ctx, lien, porte));
}

interface Invitation {
  code: string;
  chef: string;
  jeton: string;
  role: 'formateur' | 'centre';
}

async function chercherLaClasse(ctx: Contexte, code: string, chef: string, suite: (porte: Porte) => void): Promise<void> {
  history.replaceState(null, '', location.pathname + location.search);
  const ecran = (corps: string) => afficher('tel', 'Rejoindre', `<header class="barre"><h1 class="barre-titre">Rejoindre</h1></header><main class="page">${corps}</main>`, {});
  const chercher = async () => {
    try {
      suite(await chercherPorte(ctx.coeur, ctx.relais, code, chef));
    } catch (e) {
      if (codeDe(e) !== 'sans-reseau') return taperLeCode(ctx, codeAffiche(code), codeDe(e));
      ecran(
        `<section class="reponse">${ic('reload', 'ic-32')}<div><h2 class="tres-gros" tabindex="-1">Pas de réseau</h2><p class="mono">Je cherche la classe dès qu’il revient</p></div></section>`,
      );
      auRetourDuReseau(ctx, chercher);
    }
  };
  ecran('<p class="mono" role="status">Je cherche la classe…</p>');
  await chercher();
}

type Erreurs = { prenom?: string; nom?: string };

const champDuNom = (erreurs: Erreurs, id: 'prenom' | 'nom', libelle: string, valeur: string, autocomplete: string) =>
  `<label class="champ-nom" for="${id}">${libelle}</label>
   <input id="${id}" class="champ${erreurs[id] ? ' faux' : ''}" value="${esc(valeur)}" autocomplete="${autocomplete}" autocapitalize="words" autocorrect="off" spellcheck="false"${erreurs[id] ? ` aria-describedby="erreur-${id}"` : ''}>
   ${erreurs[id] ? `<p class="erreur" id="erreur-${id}">${ic('info-box')}<span>${esc(erreurs[id]!)}</span></p>` : ''}`;

/// Le prénom et le nom tapés, ou les erreurs à montrer sous les champs.
function nomTape(): { prenom: string; nom: string; erreurs?: Erreurs } {
  const prenom = document.querySelector<HTMLInputElement>('#prenom')!.value.trim();
  const nom = document.querySelector<HTMLInputElement>('#nom')!.value.trim();
  if (prenom && nom) return { prenom, nom };
  return { prenom, nom, erreurs: { prenom: prenom ? undefined : 'Écris ton prénom.', nom: nom ? undefined : 'Écris ton nom.' } };
}

function rejoindre(ctx: Contexte, code: string, porte: Porte, prenom = '', nom = '', erreurs: Erreurs = {}): void {
  const chef = porte.responsables[0];
  const champ = (id: 'prenom' | 'nom', libelle: string, valeur: string, autocomplete: string) => champDuNom(erreurs, id, libelle, valeur, autocomplete);
  afficher(
    'tel',
    'Rejoindre',
    `<header class="barre"><h1 class="barre-titre">Rejoindre</h1></header>
     <main class="page">
       <section><h2 class="tres-gros" tabindex="-1">${esc(porte.nom)}</h2><p class="mono">${esc(porte.centre)} · ${esc(nomDe(chef))}, ${esc(chef.role)}</p></section>
       <div class="bloc">${champ('prenom', 'Prénom', prenom, 'given-name')}</div>
       <div class="bloc">${champ('nom', 'Nom', nom, 'family-name')}</div>
       <p class="mono">Les responsables de la classe verront ton prénom et ton nom.</p>
     </main>
     <footer class="bas"><div class="gestes"><button class="touche" data-geste="rejoindre">${ic('users', 'ic-24')}<span>Rejoindre</span></button></div></footer>`,
    {
      rejoindre: () => {
        const { prenom: p, nom: n, erreurs } = nomTape();
        if (erreurs) return rejoindre(ctx, code, porte, p, n, erreurs);
        const demande = ctx.moi.demander_entree(code, p, n, Date.now());
        for (const r of porte.responsables) envoyer(ctx.coeur, ctx.relais, r.boite, { v: 1, t: 'entree', code, demande });
        garderClasse({ code, role: 'apprenant', porte: porte.texte, demande });
        apprenant(ctx);
      },
    },
  );
}

// La demande d'un adjoint part au seul chef, avec le jeton de l'invitation : sans lui, le chef ne
// la voit pas. Elle est signée comme celle d'un apprenant, par l'appareil de celui qui demande.
function demanderAuChef(ctx: Contexte, lien: Invitation, porte: Porte, prenom = '', nom = '', erreurs: Erreurs = {}): void {
  const chef = porte.responsables[0];
  afficher(
    'tel',
    'Rejoindre',
    `<header class="barre"><h1 class="barre-titre">Rejoindre</h1></header>
     <main class="page">
       <section><h2 class="tres-gros" tabindex="-1">${esc(porte.nom)}</h2><p class="mono">${esc(porte.centre)} · ${esc(nomDe(chef))}, ${esc(chef.role)}</p></section>
       <div class="liste"><div class="rangee">${ic('users', 'ic-24')}<div><b>${esc(nomDe(chef))} t’invite comme adjoint</b><span class="mono">${lien.role} · publier, faire l’appel, voir le suivi</span></div></div></div>
       <div class="bloc">${champDuNom(erreurs, 'prenom', 'Prénom', prenom, 'given-name')}</div>
       <div class="bloc">${champDuNom(erreurs, 'nom', 'Nom', nom, 'family-name')}</div>
       <p class="mono">Ta demande part au chef. Une fois acceptée, la classe verra ton prénom et ton nom.</p>
     </main>
     <footer class="bas"><div class="gestes"><button class="touche" data-geste="demander">${ic('users', 'ic-24')}<span>Rejoindre</span></button></div></footer>`,
    {
      demander: () => {
        const { prenom: p, nom: n, erreurs } = nomTape();
        if (erreurs) return demanderAuChef(ctx, lien, porte, p, n, erreurs);
        const demande = ctx.moi.demander_entree(lien.code, p, n, Date.now());
        envoyer(ctx.coeur, ctx.relais, chef.boite, { v: 1, t: 'adjoint', code: lien.code, demande, jeton: lien.jeton });
        ecrire('moi', { prenom: p, nom: n });
        garderClasse({ code: lien.code, role: 'adjoint', porte: porte.texte, demande });
        attenteDAdjoint(ctx);
      },
    },
  );
}

/// L'adjoint attend l'accord du chef. La classe s'ouvre ici dès qu'il accepte : sa lettre porte la
/// porte qui compte l'adjoint, et l'état de la classe.
export function attenteDAdjoint(ctx: Contexte): void {
  const { coeur, relais, moi } = ctx;
  const classe = classes().find((c) => c.role === 'adjoint' && !c.fil)!;
  const porte = coeur.lire_porte(classe.code, classe.porte);
  const demande = coeur.lire_demande(classe.code, classe.demande!);
  const rendre = () => afficher(
    'tel',
    porte.nom,
    `<header class="barre pas-maintenant"><h1 class="barre-titre">${esc(porte.nom)}</h1><span class="mono">${esc(porte.centre)}</span></header>
     <main class="page">
       <section class="reponse">${ic('clock', 'ic-32')}<div><h2 class="tres-gros" tabindex="-1">Demande envoyée</h2><p class="mono">${heure(demande.quand)} · ${esc(nomDe(porte.responsables[0]))} va l’accepter</p></div></section>
       <div class="liste"><div class="rangee"><div><b>${esc(nomDe(demande))}</b><span class="mono">adjoint · le nom que verra la classe</span></div></div></div>
       <p class="mono">Tu n’as rien à faire. La classe s’ouvre ici dès que c’est accepté.</p>
       <div class="note-gestes"><button class="btn" data-geste="pasMaClasse">Ce n’est pas ma classe</button></div>
     </main>
     <footer class="bas">${faits(relais, `Demande partie · ${heure(demande.quand)}`)}</footer>`,
    {
      pasMaClasse: () => {
        relais.changement = () => {};
        oublierClasse(classe.code);
        entree(ctx);
      },
    },
  );
  relais.changement = rendre;
  rendre();
  recevoir(coeur, relais, moi, (l) => {
    if (l.t !== 'responsables' || l.code !== classe.code) return;
    const fusion = fusionner(ctx, classe, l);
    if (!fusion || !coeur.lire_porte(classe.code, fusion.classe.porte).responsables.some((r) => r.cle === moi.cle())) return;
    relais.changement = () => {};
    garderClasse({ ...fusion.classe, demande: undefined });
    formateur(ctx);
  });
}
