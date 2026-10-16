// Self-unregistering Service Worker to clear any stale localhost SW registration
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  self.registration.unregister();
});

