import { chargerCoeur } from './coeur';
import { creer } from './creer';
import { rejoindreCommeAdjoint, rejoindreParLien } from './entree';
import { clesDeLAppareil, ecran, ecrire, lire, listeDesRelais } from './etat';
import { lireLien, lireLienDAdjoint } from './lettres';
import { Relais } from './relais';
import { entree } from './routes';
import { salle } from './salle';

const theme = matchMedia('(prefers-color-scheme: dark)');
const suivreTheme = () => (document.documentElement.dataset.theme = theme.matches ? 'dark' : 'light');
theme.addEventListener('change', suivreTheme);
suivreTheme();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

chargerCoeur().then((coeur) => {
  const envois = { lire: () => lire<string[]>('envois') ?? [], ecrire: (e: string[]) => ecrire('envois', e) };
  const ctx = { coeur, relais: new Relais(listeDesRelais(), envois), moi: clesDeLAppareil(coeur) };
  const lien = lireLien(location.hash);
  const invitation = lireLienDAdjoint(location.hash);
  if (ecran === 'salle') return salle(ctx);
  if (location.hash === '#creer') return creer(ctx);
  if (lien) return rejoindreParLien(ctx, lien.code, lien.chef);
  if (invitation) return rejoindreCommeAdjoint(ctx, invitation);
  entree(ctx);
});
