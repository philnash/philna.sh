---
---
{% capture digest_paths %}{% for asset in assets %}{% unless asset[0] contains "/" %}{% unless asset[0] contains "merriweather" %}{% unless asset[0] contains "raleway" %}{{ asset[1].digest_path }},{% endunless %}{% endunless %}{% endunless %}{% endfor %}{% endcapture %}
var version = "v{{ site.sw_cache_version }}-";

var staticCacheName = version + "assets-{{ digest_paths | md5 }}";
var staticAssets = ['{{ digest_paths | prepend: "/assets/" | split: "," | join: "', '/assets/" }}'];

var pageCacheName = version + "pages";
var offlinePages = ['/', '/blog/', '/offline/'];
var currentCaches = [staticCacheName, pageCacheName];

self.addEventListener("install", function(event) {
  event.waitUntil(
    Promise.all([
      caches
        .open(staticCacheName)
        .then(function(cache) {
          return cache.addAll(staticAssets);
        }),
      caches
        .open(pageCacheName)
        .then(function(cache) {
          return cache.addAll(offlinePages);
        })
    ]).then(function() {
      self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.filter(function(name) {
        return currentCaches.indexOf(name) === -1;
      }).map(function(name) {
        return caches.delete(name);
      }));
    }).then(function() {
      self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function(event) {
  var url = new URL(event.request.url);
  if (url.pathname.match(/^\/(assets|images)\//)) {
    event.respondWith(returnFromCacheOrFetch(event.request, staticCacheName));
  }
  if (event.request.mode === 'navigate' ||
      event.request.headers.get('Accept').indexOf('text/html') !== -1) {
    // cache then network
    event.respondWith(cacheThenNetwork(event.request, pageCacheName));
  }
})

function returnFromCacheOrFetch(request, cacheName) {
  var cachePromise = caches.open(cacheName);
  var matchPromise = cachePromise.then(function(cache) {
    return cache.match(request);
  });

  return Promise.all([cachePromise, matchPromise]).then(function(responses) {
    var cache = responses[0];
    var cacheResponse = responses[1];
    // return the cached response if we have it, otherwise the result of the fetch.
    return cacheResponse || fetch(request).then(function(fetchResponse) {
      // Cache the updated file and then return the response
      if (fetchResponse.ok) {
        cache.put(request, fetchResponse.clone());
      }
      return fetchResponse;
    });
  });
}

function cacheThenNetwork(request, cacheName) {
  var cachePromise = caches.open(cacheName);
  var matchPromise = cachePromise.then(function(cache) {
    return cache.match(request);
  });

  return Promise.all([cachePromise, matchPromise]).then(function(responses) {
    var cache = responses[0];
    var cacheResponse = responses[1];
    if (cacheResponse) {
      fetch(request)
        .then(function(fetchResponse) {
          cache.put(request, fetchResponse);
        });
      return cacheResponse;
    } else {
      return fetch(request)
        .then(function(fetchResponse) {
          cache.put(request, fetchResponse.clone());
          return fetchResponse;
        }).catch(function() {
          return caches.match('/offline/');
        });
    }
  });
}
