// Minimal service worker — enables PWA install. Network-first, no aggressive caching
// so chat content is always fresh.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
