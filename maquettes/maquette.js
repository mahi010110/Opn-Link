const parametres = new URLSearchParams(location.search);
document.documentElement.dataset.theme = parametres.get('theme') === 'sombre' ? 'dark' : 'light';
// ?texte=200 : le texte agrandi comme dans les réglages du navigateur.
if (parametres.get('texte')) document.documentElement.style.fontSize = `${parametres.get('texte')}%`;

for (const i of document.querySelectorAll('i[data-ic]')) {
  const icone = document.createElement('span');
  icone.className = `ic ${i.dataset.t ?? ''}`.trim();
  icone.setAttribute('aria-hidden', 'true');
  const image = `url(../kit/assets/icons/${i.dataset.ic}.svg)`;
  icone.style.webkitMaskImage = image;
  icone.style.maskImage = image;
  i.replaceWith(icone);
}

// Une case par demi-journée. f : faite, n : maintenant, v : à venir, e : ailleurs (en entreprise),
// x : ailleurs et aujourd'hui, a : absent, j : absence justifiée. Le texte de la case suit la lettre.
const CASES = { f: 'faite', n: 'maintenant', v: '', e: 'ailleurs', x: 'ailleurs ici', a: 'absent', j: 'justifiee' };
const caseHTML = (code) => {
  const [lettre, ...texte] = code.trim().split(' ');
  return `<span class="case ${CASES[lettre]}">${texte.join(' ')}</span>`;
};

// Dans l'app, la semaine passe en rangs quand une heure ne tient plus dans sa case. Ici, c'est ?texte= qui le dit.
const texteAgrandi = Number(parametres.get('texte') ?? 100) >= 150;

for (const semaine of document.querySelectorAll('.semaine[data-jours]')) {
  const jours = semaine.dataset.jours.split('|');
  const ici = Number(semaine.dataset.ici ?? -1);
  if (texteAgrandi) {
    const matin = semaine.dataset.matin.split('|');
    const aprem = semaine.dataset.aprem.split('|');
    semaine.classList.add('en-rangs');
    semaine.innerHTML =
      '<span></span><span class="rang">Matin</span><span class="rang">Après-midi</span>' +
      jours.map((j, n) => `<span class="jour${n === ici ? ' ici' : ''}">${j}</span>${caseHTML(matin[n])}${caseHTML(aprem[n])}`).join('');
    continue;
  }
  const rang = (nom, codes) => `<span class="rang">${nom}</span>${codes.split('|').map(caseHTML).join('')}`;
  semaine.innerHTML =
    '<span></span>' +
    jours.map((j, n) => `<span class="jour${n === ici ? ' ici' : ''}">${j.replace(' ', '<br>')}</span>`).join('') +
    rang('Matin', semaine.dataset.matin) +
    rang('Après-<br>midi', semaine.dataset.aprem);
}

// La même ligne en petit : « f f|a f|e e|e e|e e », deux cases par jour.
for (const dix of document.querySelectorAll('.dix[data-cases]')) {
  dix.innerHTML = dix.dataset.cases
    .split('|')
    .map((jour) => `<span>${jour.trim().split(' ').map(caseHTML).join('')}</span>`)
    .join('');
}

for (const paves of document.querySelectorAll('.paves[data-total]')) {
  const fait = Number(paves.dataset.fait);
  paves.innerHTML = Array.from({ length: Number(paves.dataset.total) }, (_, n) => `<span class="pave${n < fait ? ' fait' : ''}"></span>`).join('');
}
