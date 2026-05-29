const CACHE = "kemet-v1";
const PRECACHE = ["/", "/offline.html", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    return;
  }
  event.respondWith(caches.match(req).then((c) => c || fetch(req).catch(() => caches.match("/offline.html"))));
});

self.addEventListener("push", (event) => {
  let data = { title: "KemetRise", body: "New notification" };
  try { data = event.data ? event.data.json() : data; } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title || "KemetRise", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: data.url || "/",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data || "/";
  event.waitUntil(self.clients.openWindow(url));
});
