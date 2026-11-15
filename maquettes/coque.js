const parametres = new URLSearchParams(location.search);
document.documentElement.dataset.theme = parametres.get('theme') === 'sombre' ? 'dark' : 'light';

const ONGLETS = [
  ['aujourdhui', 'Aujourd’hui', 'zap'],
  ['classes', 'Classes', 'users'],
  ['messages', 'Messages', 'message-text'],
  ['moi', 'Moi', 'user'],
];

const icone = (nom, taille = '') =>
  `<span class="ic ${taille}" style="-webkit-mask-image:url(../kit/assets/icons/${nom}.svg);mask-image:url(../kit/assets/icons/${nom}.svg)" aria-hidden="true"></span>`;

const corps = document.body;
const actif = corps.dataset.onglet;
const attendent = (corps.dataset.attend ?? '').split(' ');

function onglet([id, nom, ic], enBas) {
  const classes = [id === actif ? 'on' : '', attendent.includes(id) ? 'attend' : ''].join(' ').trim();
  const courant = id === actif ? ' aria-current="page"' : '';
  return enBas
    ? `<a href="#" class="${classes}" aria-label="${nom}"${courant}>${icone(ic)}<span class="bn-l">${nom}</span></a>`
    : `<a href="#" class="${classes}"${courant}>${nom}</a>`;
}

const ecran = document.querySelector('template#ecran').innerHTML;
const feuille = document.querySelector('template#feuille')?.innerHTML;

corps.innerHTML = `
<div class="app">
  <header class="hdr">
    <a class="brand" href="#">${icone('link', 'ic-20')}<b>OPN-LINK</b></a>
    <nav class="topnav" aria-label="Navigation principale">${ONGLETS.map((o) => onglet(o, false)).join('')}</nav>
    <div class="hdr-actions"></div>
  </header>
  <main class="main" id="main"><section class="view">${ecran}</section></main>
  <footer class="statusbar">
    <span>${icone('lock', 'ic-14')} local et privé, sans serveur</span>
    <span class="grow"></span>
    <span>Opn-Link, maquette</span>
  </footer>
  <nav class="bottomnav" aria-label="Navigation">
    ${onglet(ONGLETS[0], true)}${onglet(ONGLETS[1], true)}
    <button class="bn-add" aria-label="Scanner">${icone('qr-code', 'ic-20')}</button>
    ${onglet(ONGLETS[2], true)}${onglet(ONGLETS[3], true)}
  </nav>
</div>
${feuille ? `<div class="overlay open">${feuille}</div>` : ''}`;

for (const i of document.querySelectorAll('i[data-ic]')) i.outerHTML = icone(i.dataset.ic, i.dataset.t ?? '');
