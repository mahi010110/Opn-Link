import { ouvrirLesClasses } from './classes';
import { chargerCoeur } from './coeur';
import { creer } from './creer';
import { rejoindreCommeAdjoint, rejoindreParLien } from './entree';
import { appliquerLeTheme, classes, clesDeLAppareil, ecran, ecrire, lire, listeDesRelais, rangerParClasse } from './etat';
import { lireLien, lireLienDAdjoint } from './lettres';
import { Relais } from './relais';
import { salle } from './salle';

appliquerLeTheme();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

chargerCoeur().then((coeur) => {
  const envois = { lire: () => lire<string[]>('envois') ?? [], ecrire: (e: string[]) => ecrire('envois', e) };
  const ctx = { coeur, relais: new Relais(listeDesRelais(), envois), moi: clesDeLAppareil(coeur) };
  if (ecran === 'salle') return salle(ctx);
  rangerParClasse();
  if (location.hash === '#creer') return creer(ctx);
  const lien = lireLien(location.hash);
  const invitation = lireLienDAdjoint(location.hash);
  const code = (lien ?? invitation)?.code;
  // Le lien d'une classe qu'on suit déjà l'ouvre : y entrer une seconde fois effacerait l'acceptation.
  const connue = classes().some((c) => c.code === code);
  if (lien && !connue) return rejoindreParLien(ctx, lien.code, lien.chef);
  if (invitation && !connue) return rejoindreCommeAdjoint(ctx, invitation);
  if (code) history.replaceState(null, '', location.pathname + location.search);
  ouvrirLesClasses(ctx, code);
});
