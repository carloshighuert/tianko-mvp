const CACHE_NAME = 'tianko-v2'

self.addEventListener('install', event => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // No cachear: HTML, Supabase, Anthropic, analytics
  if (
    event.request.mode === 'navigate' ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('anthropic') ||
    url.hostname.includes('google') ||
    url.hostname.includes('twilio')
  ) {
    return fetch(event.request)
  }

  // Solo cachear assets JS/CSS/imágenes del propio dominio
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request)
    )
  )
})
