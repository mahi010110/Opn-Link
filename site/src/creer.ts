// Créer une classe : le lien d'entrée « #creer », ou « Mes cours » chez un formateur.

import { ouvrirLesClasses } from './classes';
import { type Contexte } from './contexte';
import { type ClasseGardee, type Moi, ecrire, garderClasse, lire } from './etat';
import { champsDesHoraires, lireLesHoraires } from './horaires';
import { codeNormal, envoyer, publierPorte } from './lettres';
import { afficher, esc, ic } from './vue';

interface Saisie {
  prenom: string;
  nom: string;
  classe: string;
  centre: string;
  matin: [string, string];
  apresMidi: [string, string];
}

type Erreurs = Partial<Record<'prenom' | 'nom' | 'classe' | 'centre' | 'horaires', string>> & { heuresFausses?: string[] };

/// Le formulaire de la classe. Ouvert depuis « Mes cours », il a son « Retour ».
export function creer(ctx: Contexte, saisie?: Saisie, erreurs: Erreurs = {}, retour?: () => void): void {
  const moi = lire<Moi>('moi');
  const s: Saisie = saisie ?? { prenom: moi?.prenom ?? '', nom: moi?.nom ?? '', classe: '', centre: '', matin: ['9:00', '12:30'], apresMidi: ['13:30', '17:00'] };
  const champ = (id: 'prenom' | 'nom' | 'classe' | 'centre', libelle: string, valeur: string, extra = '') =>
    `<div class="bloc"><label class="champ-nom" for="${id}">${libelle}</label>
     <input id="${id}" class="champ${erreurs[id] ? ' faux' : ''}" value="${esc(valeur)}" autocorrect="off" spellcheck="false"${extra}${erreurs[id] ? ` aria-describedby="erreur-${id}"` : ''}>
     ${erreurs[id] ? `<p class="erreur" id="erreur-${id}">${ic('info-box')}<span>${esc(erreurs[id]!)}</span></p>` : ''}</div>`;
  afficher(
    'tel',
    'Créer une classe',
    `<header class="barre"><h1 class="barre-titre" tabindex="-1">Créer une classe</h1></header>
     <main class="page">
       ${moi ? '' : `${champ('prenom', 'Ton prénom', s.prenom, ' autocomplete="given-name" autocapitalize="words"')}${champ('nom', 'Ton nom', s.nom, ' autocomplete="family-name" autocapitalize="words"')}`}
       ${champ('classe', 'Nom de la classe', s.classe)}
       ${champ('centre', 'Nom du centre', s.centre)}
       ${champsDesHoraires({ matin: s.matin, apresMidi: s.apresMidi }, erreurs.horaires, erreurs.heuresFausses)}
       <p class="mono">Tu seras le chef de la classe.</p>
     </main>
     <footer class="bas"><div class="gestes">${retour ? `<button class="btn retour" data-geste="retour">${ic('arrow-left', 'ic-20')}Retour</button>` : ''}<button class="touche" data-geste="creer">${ic('plus', 'ic-24')}<span>Créer la classe</span></button></div></footer>`,
    {
      retour: () => retour?.(),
      creer: () => {
        const valeur = (id: string) => document.querySelector<HTMLInputElement>(`#${id}`)?.value.trim() ?? '';
        const horaires = lireLesHoraires();
        const lue: Saisie = {
          prenom: moi?.prenom ?? valeur('prenom'),
          nom: moi?.nom ?? valeur('nom'),
          classe: valeur('classe'),
          centre: valeur('centre'),
          matin: horaires.saisis.matin,
          apresMidi: horaires.saisis.apresMidi,
        };
        const manque: Erreurs = {};
        if (!lue.prenom) manque.prenom = 'Écris ton prénom.';
        if (!lue.nom) manque.nom = 'Écris ton nom.';
        if (!lue.classe) manque.classe = 'Écris le nom de la classe.';
        if (!lue.centre) manque.centre = 'Écris le nom du centre.';
        if (horaires.erreur) Object.assign(manque, { horaires: horaires.erreur, heuresFausses: horaires.heuresFausses });
        else [lue.matin, lue.apresMidi] = [horaires.lus!.matin, horaires.lus!.apresMidi];
        if (Object.keys(manque).length) return creer(ctx, lue, manque, retour);

        const { coeur, relais } = ctx;
        const code = codeNormal(coeur.nouveau_code_de_classe());
        const chef = [lue.prenom, lue.nom, 'formateur', ctx.moi.cle(), ctx.moi.boite()].join('\t');
        const porte = coeur.signer_porte(code, lue.classe, lue.centre, lue.matin.join('-'), lue.apresMidi.join('-'), chef, ctx.moi, Date.now());
        const classe: ClasseGardee = { code, role: 'chef', porte, fil: coeur.nouveau_secret_du_fil(), membres: [], demandes: [], dehors: [], portePubliee: Date.now() };
        ecrire('moi', { prenom: lue.prenom, nom: lue.nom });
        garderClasse(classe);
        publierPorte(coeur, relais, code, porte);
        envoyer(coeur, relais, ctx.moi.boite(), { v: 1, t: 'classe', classe });
        history.replaceState(null, '', location.pathname + location.search);
        ouvrirLesClasses(ctx, code);
      },
    },
  );
}
