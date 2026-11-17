// Le service worker garde le site sur l'appareil : il s'ouvre ensuite sans réseau.
// La construction remplace la version et la liste des fichiers. La version change dès qu'un
// fichier gardé change, et l'ancienne réserve s'efface.

const CACHE = 'opn-link-__VERSION__';
const FICHIERS = __FICHIERS__;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((reserve) => reserve.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((noms) => Promise.all(noms.filter((n) => n.startsWith('opn-link-') && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const requete = e.request;
  if (requete.method !== 'GET' || new URL(requete.url).origin !== location.origin) return;
  if (requete.mode === 'navigate') {
    e.respondWith(caches.match('index.html').then((gardee) => gardee ?? fetch(requete)));
    return;
  }
  e.respondWith(
    caches.match(requete, { ignoreSearch: true }).then(
      (gardee) =>
        gardee ??
        fetch(requete).then((reponse) => {
          if (reponse.ok) {
            const copie = reponse.clone();
            caches.open(CACHE).then((reserve) => reserve.put(requete, copie));
          }
          return reponse;
        }),
    ),
  );
});
