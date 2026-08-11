"use strict";
const CACHE = "yy-chengzhang-v7";
const ASSETS = [
  "./", "./index.html", "./style.css", "./app.js", "./cards.js", "./banter.js", "./growth.js", "./style.js", "./fashion-people.js", "./huozhong.js", "./huozhong-works.js", "./huozhong-transcripts.js", "./column.js",
  "./manifest.webmanifest", "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png"
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    try {
      const r = await fetch(e.request);
      if (r && r.ok) c.put(e.request, r.clone());
      return r;
    } catch (err) {
      const m = await c.match(e.request);
      return m || c.match("./index.html");
    }
  }));
});
