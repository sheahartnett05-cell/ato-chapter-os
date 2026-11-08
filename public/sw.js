/* Chaptera service worker — network-first shell + local notification clicks */
const CACHE = 'chaptera-shell-v4'
const SHELL = [
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navigations / HTML must always prefer network so deploys aren't stuck on stale shell.
  const isNavigation =
    request.mode === 'navigate' ||
    url.pathname === '/' ||
    (request.headers.get('accept') || '').includes('text/html')

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Keep a fresh copy of the app document for offline reopen.
          if (response.ok) {
            const copy = response.clone()
            void caches.open(CACHE).then((cache) => cache.put('/', copy))
          }
          return response
        })
        .catch(() => caches.match('/') || caches.match(request))
    )
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const path = url.pathname
        const cacheable =
          response.ok &&
          (path.endsWith('.svg') ||
            path.endsWith('.png') ||
            path.endsWith('.webmanifest') ||
            path === '/sw.js')
        if (cacheable && path !== '/sw.js') {
          const copy = response.clone()
          void caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          void client.focus()
          if ('navigate' in client) void client.navigate(target)
          return
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target)
    })
  )
})
