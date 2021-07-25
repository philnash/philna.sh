---
layout: post
title: "Service workers: beware Safari's range request"
tags:
  - javascript
  - service worker
  - web
  - pwa
image: posts/service-worker
image_alt: 'Three cogs on a yellow background, intended to represent the idea of the Service Worker'
image_width: 1920
image_height: 600
---

You've implemented a service worker to cache some assets. Everything is working well, your service worker is a success, you're feeling good. But then...

Some time passes and you deploy a video to your site. Everything is still working well in Chrome, in Firefox, in Edge. You check Safari. The video is broken. You don't know what's gone wrong.

That was me last month. I published an article on [animating in the canvas with React](/blog/2018/09/27/techniques-for-animating-on-the-canvas-in-react/) and wanted to use an animation as the header image. [A video was much smaller than using a comparable gif](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/replace-animated-gifs-with-video/) so I implemented the header as a video. When I came to check things in Safari I found it had stopped working and I had no idea why.

## Diagnosing the problem

I first thought it could have something to do with the CDN I'm using. There were some false positives regarding streaming video through a CDN that resulted in some extra research that was ultimately fruitless. Once I'd exhausted that line of inquiry I went back to the failing request.

Observing the request in Safari's inspector lead to further trawling the internet and eventually things started to add up. Safari was sending an initial request to fetch the video with a `Range` header set to `bytes=0-1`. You see, [Safari requires HTTP servers that are serving video and audio to support `Range` requests like this](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/CreatingVideoforSafarioniPhone/CreatingVideoforSafarioniPhone.html#//apple_ref/doc/uid/TP40006514-SW6).

Nginx was serving correct responses to `Range` requests. So was the CDN. The only other problem? The service worker. And this broke the video in Safari.

Time to fix the service worker then. With inspiration from this [example of caching videos from the Chrome team](https://googlechrome.github.io/samples/service-worker/prefetch-video/), here's what I did.

## Range requests in Service Workers

My existing service worker implementation was checking for requests to my assets or images directories and responding with a cache then network strategy.

```javascript
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);
  if (url.pathname.match(/^\/((assets|images)\/|manifest.json$)/)) {
    event.respondWith(returnFromCacheOrFetch(event.request, staticCacheName));
  }
  // other strategies
});
```

The video requests are going to be served from the assets or image directories, so this is the place to interject. I checked for the existence of the range header and responded with a different approach.

```javascript
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);
  if (url.pathname.match(/^\/((assets|images)\/|manifest.json$)/)) {
    if (event.request.headers.get('range')) {
      event.respondWith(returnRangeRequest(event.request, staticCacheName));
    } else {
      event.respondWith(returnFromCacheOrFetch(event.request, staticCacheName));
    }
  }
  // other strategies
});
```

Now, to implement `returnRangeRequest`. This starts with a cache then network approach that you may have seen in a service worker before. The cache is opened and checked against the request. If there is a cached response it is returned and if it is not present in the cache it is fetched from the network, the response cloned and stored in the cache and the result returned.

The important thing is that the result is turned into an [`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) using [`Response#arrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/Body/arrayBuffer). This will give us access to the raw bytes to build our response from later.

```javascript
function returnRangeRequest(request, cacheName) {
  return caches
    .open(cacheName)
    .then(function(cache) {
      return cache.match(request.url);
    })
    .then(function(res) {
      if (!res) {
        return fetch(request)
          .then(res => {
            const clonedRes = res.clone();
            return caches
              .open(cacheName)
              .then(cache => cache.put(request, clonedRes))
              .then(() => res);
          })
          .then(res => {
            return res.arrayBuffer();
          });
      }
      return res.arrayBuffer();
    })
    .then(...); // The rest goes here
}
```

Now we have an `arrayBuffer`, from either the cache or network response, the real work starts. The [`Range` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range) looks like:

```
Range: bytes=200-1000
```

In this case, the request is for the bytes between the 200th and 1000th byte of the response. The `Range` header may omit the end byte, meaning that it wants all the bytes from the first value until the end of the file. We can extract these figures with a little regular expression:

```javascript
  }).then(function(arrayBuffer) {
    const bytes = /^bytes\=(\d+)\-(\d+)?$/g.exec(
      request.headers.get('range')
    );
    // and so on
  });
}
```

Breaking this regex down quickly, it looks for a string that starts with the "bytes=" followed by some digits a hyphen and optionally some more digits before the end of the string. The two sets of digits are captured, using the brackets, so that we can use them later.

I check to see if the header satisfied the regex and if so, turn the start and end byte values into integers to index into the `arrayBuffer`. If the end byte index is not present then it is set to the end of the file. With the byte indices the response can be generated.

The body of the response is the [slice](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/slice) of the `arrayBuffer` from the start until the end defined by the `Range` header. The response carries a [206 status](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/206), meaning partial content. It also requires a `Content-Range` header, which is similar to the original `Range` header. It tells the browser the response is made of the range of bytes and also returns the total size of the file.

If the regex fails then the service worker will return a [416 error](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/416) instead.

```javascript
  }).then(function(arrayBuffer) {
    const bytes = /^bytes\=(\d+)\-(\d+)?$/g.exec(
      request.headers.get('range')
    );
    if (bytes) {
      const start = Number(bytes[1]);
      const end = Number(bytes[2]) || arrayBuffer.byteLength - 1;
      return new Response(arrayBuffer.slice(start, end + 1), {
        status: 206,
        statusText: 'Partial Content',
        headers: [
          ['Content-Range', `bytes ${start}-${end}/${arrayBuffer.byteLength}`]
        ]
      });
    } else {
      return new Response(null, {
        status: 416,
        statusText: 'Range Not Satisfiable',
        headers: [['Content-Range', `*/${arrayBuffer.byteLength}`]]
      });
    }
  });
}
```

That fixed it. With a reload of the service worker my video started playing in all the browsers again.

## Service workers and browsers

You can see the [full function in my service worker on GitHub](https://github.com/philnash/philna.sh/blob/ba798a2d5d8364fc7c1dae1819cbd8ef103c8b67/sw.js#L50-L94). It's quite a lot of extra work just to get Safari to agree to display video, but it did teach me a bit about what browsers expect when loading video content, how to respond to more intricate requests within a service worker, and how picky Safari can be.

If you have this same problem, I hope my code helps. If you are using Workbox for a service worker it has a [range request module](https://developers.google.com/web/tools/workbox/modules/workbox-range-requests) that you can use for this too.

If you discovered this problem yourself or if you have another solution for this, I'd love to hear about it. Just drop me a note on Twitter at [@philnash](https://twitter.com/philnash).
