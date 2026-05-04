const CACHE_NAME = 'autoshop-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET and Supabase API requests
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.pathname.startsWith('/rest/') || url.pathname.startsWith('/auth/') || url.hostname.includes('supabase')) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache static assets
        if (response.ok && (url.pathname.match(/\.(js|css|svg|png|woff2?)$/) || url.pathname === '/')) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})
