---
---
{% capture digest_paths %}{% for asset in assets %}{% unless asset[0] contains "/" %}{{ asset[1].digest_path }},{% endunless %}{% endfor %}{% endcapture %}

var cacheName = "assets-{{ digest_paths | md5 }}";

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(cacheName)
      .then(function(cache) {
        return cache.addAll([
          '{{ digest_paths | prepend: "/assets/" | split: "," | join: "', '/assets/" }}'
        ]);
      })
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.filter(function(name) {
        return name !== cacheName;
      }).map(function(name) {
        return caches.delete(name);
      }));
    })
  );
});

self.addEventListener("fetch", function(event) {
  var url = new URL(event.request.url);
  if (url.pathname.match(/^\/assets\//)) {
    event.respondWith(
      caches.match(event.request).then(function(response) {
          return response || fetch(event.request);
        })
    )
  }
})
