import { chargerCoeur } from './coeur';
import { creer } from './creer';
import { rejoindreParLien } from './entree';
import { adresseDuRelais, clesDeLAppareil, ecran } from './etat';
import { lireLien } from './lettres';
import { Relais } from './relais';
import { entree } from './routes';
import { salle } from './salle';

const theme = matchMedia('(prefers-color-scheme: dark)');
const suivreTheme = () => (document.documentElement.dataset.theme = theme.matches ? 'dark' : 'light');
theme.addEventListener('change', suivreTheme);
suivreTheme();

chargerCoeur().then((coeur) => {
  const ctx = { coeur, relais: new Relais(adresseDuRelais()), moi: clesDeLAppareil(coeur) };
  const lien = lireLien(location.hash);
  if (ecran === 'salle') return salle(ctx);
  if (location.hash === '#creer') return creer(ctx);
  if (lien) return rejoindreParLien(ctx, lien.code, lien.chef);
  entree(ctx);
});
