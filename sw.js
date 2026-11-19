/* Service Worker：静态资源缓存优先，数据文件网络优先（保证信息流最新） */
var CACHE = "tyan-v34";
var STATIC = [
  "platform.html", "index.html", "data/data.js",
  "manifest.json", "assets/icon-192.png", "assets/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(STATIC); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  // 数据文件：网络优先，失败回退缓存
  if (url.pathname.endsWith("data.json")) {
    e.respondWith(
      fetch(e.request).then(function (r) {
        var copy = r.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return r;
      }).catch(function () { return caches.match(e.request); })
    );
    return;
  }
  // 其他：缓存优先，后台更新
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      var net = fetch(e.request).then(function (r) {
        if (r.ok) caches.open(CACHE).then(function (c) { c.put(e.request, r.clone()); });
        return r;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
