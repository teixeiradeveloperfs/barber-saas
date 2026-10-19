/* Service worker do app da barbearia.
   - Assets com hash (/assets/*), ícones e imagens: cache first. Ícones da
     marca (/app-icon/*, /apple-touch-icon.png) ficam fora: mudam com o painel.
   - Manifest nunca vem do cache: é da barbearia do host.
   - Navegações: network first, cai no app shell em cache; sem rede e sem
     cache, mostra /offline.html.
   Versão no nome do cache: mude para invalidar tudo. */
const VERSION = 'v2'
const SHELL_CACHE = `luxe-shell-${VERSION}`
const ASSET_CACHE = `luxe-assets-${VERSION}`
const SHELL = ['/', '/offline.html', '/favicon.svg', '/icons/icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('luxe-') && ![SHELL_CACHE, ASSET_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(SHELL_CACHE).then((cache) => cache.put('/', copy))
          return response
        })
        .catch(async () => (await caches.match('/')) || (await caches.match('/offline.html'))),
    )
    return
  }

  // Ícones da marca ficam no cache HTTP (1 dia): o SW não prende ícone antigo.
  const brandIcon = url.pathname.startsWith('/app-icon/') || url.pathname === '/apple-touch-icon.png'
  const cacheable =
    !brandIcon &&
    (url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    /\.(png|jpg|jpeg|svg|webp|woff2?)$/.test(url.pathname))

  if (!cacheable) return

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        }),
    ),
  )
})
