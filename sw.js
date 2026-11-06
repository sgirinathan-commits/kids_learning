/* Offline support: the app keeps working without internet once it has been opened.
   (Listening to the child's speech still needs internet - the speech service is online.)
   Bump VERSION whenever you publish changes so devices pick them up. */
const VERSION = "wq-v2";
const CORE = [
  "./", "index.html", "manifest.webmanifest", "css/style.css",
  "js/data.js", "js/speech.js", "js/hero.js", "js/app.js",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/favicon-64.png",
  // phonics clips, so letter sounds work offline from the very first visit
  "audio/phonics/a.wav", 
  "audio/phonics/a_long.wav", 
  "audio/phonics/ai.wav", 
  "audio/phonics/ar.wav", 
  "audio/phonics/ay.wav", 
  "audio/phonics/b.wav", 
  "audio/phonics/c.wav", 
  "audio/phonics/ch.wav", 
  "audio/phonics/ck.wav", 
  "audio/phonics/d.wav", 
  "audio/phonics/e.wav", 
  "audio/phonics/e_long.wav", 
  "audio/phonics/ea.wav", 
  "audio/phonics/ee.wav", 
  "audio/phonics/er.wav", 
  "audio/phonics/f.wav", 
  "audio/phonics/ff.wav", 
  "audio/phonics/g.wav", 
  "audio/phonics/gg.wav", 
  "audio/phonics/h.wav", 
  "audio/phonics/i.wav", 
  "audio/phonics/i_long.wav", 
  "audio/phonics/ir.wav", 
  "audio/phonics/j.wav", 
  "audio/phonics/k.wav", 
  "audio/phonics/l.wav", 
  "audio/phonics/ll.wav", 
  "audio/phonics/m.wav", 
  "audio/phonics/n.wav", 
  "audio/phonics/ng.wav", 
  "audio/phonics/o.wav", 
  "audio/phonics/o_long.wav", 
  "audio/phonics/oa.wav", 
  "audio/phonics/oo.wav", 
  "audio/phonics/or.wav", 
  "audio/phonics/p.wav", 
  "audio/phonics/q.wav", 
  "audio/phonics/qu.wav", 
  "audio/phonics/r.wav", 
  "audio/phonics/s.wav", 
  "audio/phonics/sh.wav", 
  "audio/phonics/ss.wav", 
  "audio/phonics/t.wav", 
  "audio/phonics/th.wav", 
  "audio/phonics/u.wav", 
  "audio/phonics/u_long.wav", 
  "audio/phonics/ur.wav", 
  "audio/phonics/v.wav", 
  "audio/phonics/w.wav", 
  "audio/phonics/wh.wav", 
  "audio/phonics/x.wav", 
  "audio/phonics/y.wav", 
  "audio/phonics/z.wav", 
  "audio/phonics/zz.wav"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Serve from cache straight away, refresh the cache in the background.
// Phonics clips and Google Fonts get cached the first time they are used.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const cacheable = url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!cacheable) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: url.origin === location.origin });
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
