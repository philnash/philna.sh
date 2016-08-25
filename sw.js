---
---
{% capture digest_paths %}{% for asset in assets %}{% unless asset[0] contains "/" %}{{ asset[1].digest_path }},{% endunless %}{% endfor %}{% endcapture %}

function returnFromCacheOrFetch(request, cacheName) {
  var cachePromise = caches.open(cacheName);
  var matchPromise = cachePromise.then(function(cache) {
    return cache.match(request);
  });

  return Promise.all([cachePromise, matchPromise]).then(function(responses) {
    var cache = responses[0];
    var cacheResponse = responses[1];
    // Kick off the update request
    var fetchPromise = fetch(request).then(function(fetchResponse) {
      // Cache the updated file and then return the response
      cache.put(request, fetchResponse.clone());
      return fetchResponse;
    });
    // return the cached response if we have it, otherwise the result of the fetch.
    return cacheResponse || fetchPromise;
  });
}

var cacheName = "assets-{{ digest_paths | md5 }}";
var fontCache = "fonts-cache";

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
  } else if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(returnFromCacheOrFetch(event.request, fontCache))
  }
})
