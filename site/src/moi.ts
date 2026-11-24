// « Moi » et la fenêtre « Nom », chez l'apprenant comme chez un responsable : le nom que voient les
// autres, qu'on corrige soi-même, et le thème. Mes appareils et la phrase de secours viendront
// avec l'étape « Plusieurs appareils ».

import { nomDe } from './contexte';
import { champDuNom, type Erreurs } from './entree';
import { type Theme, appliquerLeTheme, ecrire, lire } from './etat';
import { afficher, esc, ic } from './vue';

type Gestes = Parameters<typeof afficher>[3];
type Nom = { prenom: string; nom: string };

/// Ce qui change d'un rôle à l'autre : qui voit le nom, et à qui part la correction.
export interface PourQui {
  /// « le nom que voient les responsables »
  voit: string;
  /// « part aux responsables »
  part: string;
  /// La phrase de la fenêtre « Nom ».
  verront: string;
}

const retour = `<button class="btn retour" data-geste="retour">${ic('arrow-left', 'ic-20')}Retour</button>`;

/// « Moi » : le nom, avec « Corriger », ou le nom qui attend de partir, avec « Annuler ». Puis le thème.
export function afficherMoi(classe: string, nom: Nom, attente: (Nom & { part: number }) | undefined, pourQui: PourQui, faits: string, gestes: Gestes): void {
  const choisi = lire<Theme>('theme');
  const choix = (valeur: string, libelle: string, coche: boolean) =>
    `<label><input type="radio" name="theme" value="${valeur}"${coche ? ' checked' : ''}><span class="rond"></span>${libelle}</label>`;
  const ligneDuNom = attente
    ? `<div class="rangee"><div><b>${esc(nomDe(attente))}</b><span class="mono">${pourQui.part} dans ${Math.max(1, Math.ceil((attente.part - Date.now()) / 1000))} s</span></div><button class="btn" data-geste="annulerNom">${ic('undo')}Annuler</button></div>`
    : `<div class="rangee"><div><b>${esc(nomDe(nom))}</b><span class="mono">${pourQui.voit}</span></div><button class="btn" data-geste="corrigerNom">Corriger</button></div>`;
  afficher(
    'tel',
    'Moi',
    `<header class="barre"><h1 class="barre-titre" tabindex="-1">Moi</h1><span class="mono">${esc(classe)}</span></header>
     <main class="page">
       <div class="liste">${ligneDuNom}</div>
       <section class="bloc"><p class="etiquette">Thème</p><div class="choix" role="radiogroup" aria-label="Thème">${choix('telephone', 'Comme le téléphone', !choisi)}${choix('clair', 'Clair', choisi === 'clair')}${choix('sombre', 'Sombre', choisi === 'sombre')}</div></section>
     </main>
     <footer class="bas"><div class="gestes">${retour}</div>${faits}</footer>`,
    gestes,
  );
  for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="theme"]')) {
    radio.onchange = () => {
      ecrire('theme', radio.value === 'telephone' ? null : radio.value);
      appliquerLeTheme();
    };
  }
}

/// La fenêtre « Nom » : les deux champs de « Rejoindre », et qui verra la correction.
export function afficherNom(classe: string, saisi: Nom, erreurs: Erreurs, pourQui: PourQui, faits: string, gestes: Gestes): void {
  afficher(
    'tel',
    'Nom',
    `<header class="barre"><h1 class="barre-titre" tabindex="-1">Nom</h1><span class="mono">${esc(classe)}</span></header>
     <main class="page">
       <div class="bloc">${champDuNom(erreurs, 'prenom', 'Prénom', saisi.prenom, 'given-name')}</div>
       <div class="bloc">${champDuNom(erreurs, 'nom', 'Nom', saisi.nom, 'family-name')}</div>
       <p class="mono">${pourQui.verront}</p>
     </main>
     <footer class="bas"><div class="gestes">${retour}<button class="touche" data-geste="corriger">${ic('pencil', 'ic-24')}<span>Corriger</span></button></div>${faits}</footer>`,
    gestes,
    true,
  );
}
