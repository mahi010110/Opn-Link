const parametres = new URLSearchParams(location.search);
document.documentElement.dataset.theme = parametres.get('theme') === 'sombre' ? 'dark' : 'light';

for (const i of document.querySelectorAll('i[data-ic]')) {
  const icone = document.createElement('span');
  icone.className = `ic ${i.dataset.t ?? ''}`.trim();
  icone.setAttribute('aria-hidden', 'true');
  const image = `url(../kit/assets/icons/${i.dataset.ic}.svg)`;
  icone.style.webkitMaskImage = image;
  icone.style.maskImage = image;
  i.replaceWith(icone);
}
