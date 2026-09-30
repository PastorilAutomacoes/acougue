/* Service worker do Açougue Pa$toril: guarda a "casca" do app para abrir sem sinal.
   Os dados (Supabase) nunca passam por aqui: vão sempre direto ao servidor. */
const CACHE = 'acougue-v1';
const CASCA = ['./', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CASCA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.hostname.endsWith('supabase.co')) return;

  /* páginas: tenta a versão nova primeiro; sem sinal, abre a última guardada */
  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r)
        .then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put('./', cp)); return res; })
        .catch(() => caches.match('./'))
    );
    return;
  }

  /* arquivos (ícones, bibliotecas, fontes): usa o guardado e atualiza por trás */
  e.respondWith(
    caches.match(r).then(hit => {
      const rede = fetch(r).then(res => {
        if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
        return res;
      }).catch(() => hit);
      return hit || rede;
    })
  );
});
