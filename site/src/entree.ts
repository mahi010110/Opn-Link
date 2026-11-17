// L'apprenant sans classe : taper le code, ou ouvrir le lien du QR, puis demander à entrer.

import { apprenant } from './apprenant';
import { type Contexte, nomDe } from './contexte';
import { garderClasse } from './etat';
import { chercherPorte, codeNormal, envoyer } from './lettres';
import { codeDe, phrase } from './textes';
import { afficher, codeAffiche, esc, ic } from './vue';

type Porte = ReturnType<Contexte['coeur']['choisir_porte']>;

export function sansClasse(ctx: Contexte): void {
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

function taperLeCode(ctx: Contexte, texte = '', erreur?: string): void {
  let cherche = false;
  afficher(
    'tel',
    'Code',
    `<header class="barre"><h1 class="barre-titre">Code</h1></header>
     <main class="page"><div class="bloc">
       <label class="champ-nom" for="code">Le code de ta classe</label>
       <input id="code" class="champ code${erreur ? ' faux' : ''}" value="${esc(texte)}" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false"${erreur ? ' aria-describedby="erreur"' : ''}>
       ${erreur ? `<p class="erreur" id="erreur" role="alert">${ic('info-box')}<span>${esc(phrase(erreur))}</span></p>` : '<p class="mono" id="etat"></p>'}
     </div></main>
     <footer class="bas"><div class="gestes"><button class="btn retour" data-geste="retour">${ic('arrow-left', 'ic-20')}Retour</button></div></footer>`,
    { retour: () => sansClasse(ctx) },
    true,
  );
  const champ = document.querySelector<HTMLInputElement>('#code')!;
  champ.focus();
  champ.setSelectionRange(champ.value.length, champ.value.length);
  champ.addEventListener('input', async () => {
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
  });
}

/// Le lien du QR mène ici : la classe s'affiche tout de suite, sans rien taper.
export async function rejoindreParLien(ctx: Contexte, code: string, chef: string): Promise<void> {
  history.replaceState(null, '', location.pathname + location.search);
  afficher('tel', 'Rejoindre', `<header class="barre"><h1 class="barre-titre">Rejoindre</h1></header><main class="page"><p class="mono">Je cherche la classe…</p></main>`, {});
  try {
    rejoindre(ctx, code, await chercherPorte(ctx.coeur, ctx.relais, code, chef));
  } catch (e) {
    taperLeCode(ctx, codeAffiche(code), codeDe(e));
  }
}

function rejoindre(ctx: Contexte, code: string, porte: Porte, prenom = '', nom = '', erreurs: { prenom?: string; nom?: string } = {}): void {
  const chef = porte.responsables[0];
  const champ = (id: 'prenom' | 'nom', libelle: string, valeur: string, autocomplete: string) =>
    `<label class="champ-nom" for="${id}">${libelle}</label>
     <input id="${id}" class="champ${erreurs[id] ? ' faux' : ''}" value="${esc(valeur)}" autocomplete="${autocomplete}" autocapitalize="words" autocorrect="off" spellcheck="false"${erreurs[id] ? ` aria-describedby="erreur-${id}"` : ''}>
     ${erreurs[id] ? `<p class="erreur" id="erreur-${id}">${ic('info-box')}<span>${esc(erreurs[id]!)}</span></p>` : ''}`;
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
        const p = document.querySelector<HTMLInputElement>('#prenom')!.value.trim();
        const n = document.querySelector<HTMLInputElement>('#nom')!.value.trim();
        if (!p || !n) {
          return rejoindre(ctx, code, porte, p, n, { prenom: p ? undefined : 'Écris ton prénom.', nom: n ? undefined : 'Écris ton nom.' });
        }
        const demande = ctx.moi.demander_entree(code, p, n, Date.now());
        for (const r of porte.responsables) envoyer(ctx.coeur, ctx.relais, r.boite, { v: 1, t: 'entree', code, demande });
        garderClasse({ code, role: 'apprenant', porte: porte.texte, demande });
        apprenant(ctx);
      },
    },
  );
}
