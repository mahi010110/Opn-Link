import { apprenant } from './apprenant';
import { chargerCoeur } from './coeur';
import { type Config, lire } from './config';
import { formateur } from './formateur';
import { Relais } from './relais';
import { salle } from './salle';
import { afficher } from './vue';

const theme = matchMedia('(prefers-color-scheme: dark)');
const suivreTheme = () => (document.documentElement.dataset.theme = theme.matches ? 'dark' : 'light');
theme.addEventListener('change', suivreTheme);
suivreTheme();

const config = lire<Config>('config');
if (!config) {
  afficher(
    'tel',
    'Opn-Link',
    `<header class="barre"><h1 class="barre-titre" tabindex="-1">Opn-Link</h1></header><main class="page"><p class="lu">Cet appareil n’a pas encore de classe. Le prototype se prépare avec ses tests : voir docs/prototype.md.</p></main>`,
    {},
  );
} else {
  chargerCoeur().then((coeur) => ({ apprenant, formateur, salle })[config.role](coeur, config, new Relais(config.relais)));
}
