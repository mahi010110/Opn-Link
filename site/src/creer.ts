// Créer une classe : le lien d'entrée « #creer » ouvre l'interface du formateur.

import { type Contexte } from './contexte';
import { type ClasseGardee, type Moi, ecrire, garderClasse, lire } from './etat';
import { formateur } from './formateur';
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

/// Lit une heure comme on la tape : « 9 h 30 », « 9h », « 9:30 » ou « 930 ». Rend « 9:30 ».
export function lireHeure(texte: string): string | undefined {
  const t = texte.trim().toLowerCase();
  const m = /^(\d{1,2})\s*(?:[h:.]\s*(\d{2})?)?$/.exec(t) ?? /^(\d{1,2})(\d{2})$/.exec(t);
  if (!m) return undefined;
  const [heures, minutes] = [Number(m[1]), Number(m[2] ?? 0)];
  return heures < 24 && minutes < 60 ? `${heures}:${String(minutes).padStart(2, '0')}` : undefined;
}

const enMinutes = (h: string) => Number(h.split(':')[0]) * 60 + Number(h.split(':')[1]);
const affiche = (h: string) => (lireHeure(h) ?? h).replace(':', '\u00a0h\u00a0');

export function creer(ctx: Contexte, saisie?: Saisie, erreurs: Erreurs = {}): void {
  const moi = lire<Moi>('moi');
  const s: Saisie = saisie ?? { prenom: moi?.prenom ?? '', nom: moi?.nom ?? '', classe: '', centre: '', matin: ['9:00', '12:30'], apresMidi: ['13:30', '17:00'] };
  const champ = (id: 'prenom' | 'nom' | 'classe' | 'centre', libelle: string, valeur: string, extra = '') =>
    `<div class="bloc"><label class="champ-nom" for="${id}">${libelle}</label>
     <input id="${id}" class="champ${erreurs[id] ? ' faux' : ''}" value="${esc(valeur)}" autocorrect="off" spellcheck="false"${extra}${erreurs[id] ? ` aria-describedby="erreur-${id}"` : ''}>
     ${erreurs[id] ? `<p class="erreur" id="erreur-${id}">${ic('info-box')}<span>${esc(erreurs[id]!)}</span></p>` : ''}</div>`;
  const heure = (id: string, libelle: string, valeur: string) => {
    const faux = erreurs.heuresFausses?.includes(id);
    return `<input id="${id}" class="champ${faux ? ' faux' : ''}" value="${esc(affiche(valeur))}" inputmode="numeric" autocomplete="off" aria-label="${libelle}"${faux ? ' aria-describedby="erreur-horaires"' : ''}>`;
  };
  const horaire = (id: string, libelle: string, [debut, fin]: [string, string]) =>
    `<div class="rangee"><div><b>${libelle}</b></div><span class="horaire">${heure(`${id}-debut`, `Début, ${libelle.toLowerCase()}`, debut)}<span>à</span>${heure(`${id}-fin`, `Fin, ${libelle.toLowerCase()}`, fin)}</span></div>`;
  afficher(
    'tel',
    'Créer une classe',
    `<header class="barre"><h1 class="barre-titre" tabindex="-1">Créer une classe</h1></header>
     <main class="page">
       ${moi ? '' : `${champ('prenom', 'Ton prénom', s.prenom, ' autocomplete="given-name" autocapitalize="words"')}${champ('nom', 'Ton nom', s.nom, ' autocomplete="family-name" autocapitalize="words"')}`}
       ${champ('classe', 'Nom de la classe', s.classe)}
       ${champ('centre', 'Nom du centre', s.centre)}
       <section class="bloc"><p class="etiquette">Horaires</p><div class="liste">${horaire('matin', 'Matin', s.matin)}${horaire('apres-midi', 'Après-midi', s.apresMidi)}</div>
         ${erreurs.horaires ? `<p class="erreur" id="erreur-horaires">${ic('info-box')}<span>${esc(erreurs.horaires)}</span></p>` : ''}</section>
       <p class="mono">Tu seras le chef de la classe.</p>
     </main>
     <footer class="bas"><div class="gestes"><button class="touche" data-geste="creer">${ic('plus', 'ic-24')}<span>Créer la classe</span></button></div></footer>`,
    {
      creer: () => {
        const valeur = (id: string) => document.querySelector<HTMLInputElement>(`#${id}`)?.value.trim() ?? '';
        const lue: Saisie = {
          prenom: moi?.prenom ?? valeur('prenom'),
          nom: moi?.nom ?? valeur('nom'),
          classe: valeur('classe'),
          centre: valeur('centre'),
          matin: [valeur('matin-debut'), valeur('matin-fin')],
          apresMidi: [valeur('apres-midi-debut'), valeur('apres-midi-fin')],
        };
        const manque: Erreurs = {};
        if (!lue.prenom) manque.prenom = 'Écris ton prénom.';
        if (!lue.nom) manque.nom = 'Écris ton nom.';
        if (!lue.classe) manque.classe = 'Écris le nom de la classe.';
        if (!lue.centre) manque.centre = 'Écris le nom du centre.';
        const ids = ['matin-debut', 'matin-fin', 'apres-midi-debut', 'apres-midi-fin'];
        const heures = [...lue.matin, ...lue.apresMidi].map(lireHeure);
        const illisibles = ids.filter((_, i) => !heures[i]);
        const desordre = ids.filter((_, i) => i > 0 && heures[i] && heures[i - 1] && enMinutes(heures[i - 1]!) >= enMinutes(heures[i]!));
        if (illisibles.length) Object.assign(manque, { horaires: 'Écris les heures comme 9 h 00.', heuresFausses: illisibles });
        else if (desordre.length) Object.assign(manque, { horaires: 'Chaque heure vient après la précédente.', heuresFausses: desordre });
        else [lue.matin, lue.apresMidi] = [[heures[0]!, heures[1]!], [heures[2]!, heures[3]!]];
        if (Object.keys(manque).length) return creer(ctx, lue, manque);

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
        formateur(ctx);
      },
    },
  );
}
