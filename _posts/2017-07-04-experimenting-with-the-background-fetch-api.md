---
title: Experimenting with the background fetch API
layout: post
tags:
  - javascript
  - service worker
image: posts/service-worker
image_alt: "Three cogs on a yellow background, intended to represent the idea of the Service Worker"
---

The service worker API is expanding as more ways to use the background dwelling worker emerge. I've written before about [push notifications](https://www.twilio.com/blog/2016/02/web-powered-sms-inbox-with-service-worker-push-notifications.html) and [background sync](https://www.twilio.com/blog/2017/02/send-messages-when-youre-back-online-with-service-workers-and-background-sync.html) and I recently explored the very new [background fetch API](https://github.com/WICG/background-fetch). Here's what I found out about it.

## Downloads and uploads

The background fetch API seeks to solve two problem:

* When a service worker is downloading large files to cache and the user navigates away, even when using `event.waitUntil` the service worker may eventually be killed
* When uploading files and the user navigates away the upload is interrupted and will fail

The background fetch API allows a developer to perform and control fetches to large files or lists of files outside the context of a single page. This can increase the likelihood of successful uploads and downloads and allow the service worker to cache the results too.

This API is available to test, at the time of writing, in Chrome with the experimental web platform features flag turned on in the chrome://flags settings.

## Testing out an example

To try to understand how the API worked, I decided to build a simple proof of concept. The [example can be found here on Glitch](https://fan-hubcap.glitch.me/) or you can [check out and run the source code from GitHub](https://github.com/philnash/service-worker-background-fetch). I didn't want to mess around with large files, so this example tries to load an image that has a 10 second delay on it (4.5 seconds on Glitch).

There is a service worker set up to serve the image directly from the cache if it is present, otherwise it goes to the network.

```javascript
// sw.js
self.addEventListener('fetch', function(event) {
  if (event.request.url.match(/images/)) {
    event.respondWith(
      caches.open('downloads').then(cache => {
        return cache.match(event.request).then(response => {
          return response || fetch(event.request);
        });
      })
    );
  } else {
    event.respondWith(caches.match(event.request));
  }
});
```

Pretty standard service worker stuff so far, here's the new stuff.

Clicking on the "Start download" button will kick off a background fetch. The fetch is tagged 'large-file' (I was feeling creative). While the background fetch is going on, you can navigate away from the page, the download will continue to work in the background.

```javascript
// index.html
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(function(reg) {
    const button = document.getElementById('download');
    if ('backgroundFetch' in reg) {
      button.addEventListener('click', function(event) {
        reg.backgroundFetch.fetch('large-file', [new Request('/images/twilio.png')], {
          title: 'Downloading large image'
        }).then(function(backgroundFetch) { console.log(backgroundFetch) });
      })
    }
  });
}
```

When the download is complete the service worker receives the `backgroundfetched` event. The event has a `fetches` property that points to an array of objects containing each request and response. The code loops through the `fetches` (even though in this case we know there's only one) and puts the response into the cache.

```javascript
self.addEventListener('backgroundfetched', function(event) {
  event.waitUntil(
    caches.open('downloads').then(function(cache) {
      event.updateUI('Large file downloaded');
      registration.showNotification('File downloaded!');
      const promises = event.fetches.map(({ request, response }) => {
        if (response && response.ok) {
          return cache.put(request, response.clone());
        }
      });
      return Promise.all(promises);
    })
  );
});
```

Now, when the image is requested it will be served directly from the service worker cache, no more slow download.

## Thoughts on the background fetch API

As you can see, it's not too hard to implement the background fetch API. There are some events I didn't implement on this initial exploration, the `backgroundfetchfail`, `backgroundfetchabort` and `backgroundfetchclick` events. In a fully featured application you would expect to do so.

### Audio difficulties

I initially started this experiment with an audio file, but found it hard to prove I had stored the audio file successfully in the cache. I don't blame the background fetch API for this, rather the [issues in dealing with range requests in the service worker fetch event](https://samdutton.github.io/samples/service-worker/prefetch-video/). Given that this API is very useful for downloading large audio and video assets for rich applications, making this easier for developers should be an important part of service worker discussions for anyone working on this feature.

### Popping up in the downloads

When testing this in Chrome on the desktop I was surprised to find that the file was downloaded in a user visible manner. My expectations were that the file would be left for the service worker to handle and cache. Instead it appeared in my downloads folder. If you were using the background fetch API to fetch resources for a game, for example, I would not expect to litter the user's downloads folder with resources that are only of use within the application. This didn't happen when I tested on an Android device though.

### What UI?

Within the API there are places to affect the browser UI, you can set a title and icons for the fetch and update the title using the `event.updateUI` method. However, I couldn't see this UI anywhere in my testing on desktop or mobile. I can only assume that this is being worked on and will arrive with another version of Canary.

## To the future

I like to play with these early APIs, there's such a lot of potential in them (I'm excited for the return of the [Web Share API](https://philna.sh/blog/2017/03/14/the-web-share-api/) too!). The background fetch API is going to be great for applications that require downloading large files or large amounts of files, with more control than just using the service worker cache. It's obviously going to be useful for video and audio applications, but games and virtual reality experiences will surely benefit from it too.

I think there is still work to be done in browser to make this experience a good one for both developers and users, but it's exciting to see how the service worker is progressing. My next plan is to build an application that fully takes advantage of the background fetch API, as well as other service worker features, in a real world situation. Keep an eye on [my GitHub profile](http://github.com/philnash/) to follow the progress.

If you're interested in the background fetch API there are [more examples and discussion on the proposal on GitHub](https://github.com/WICG/background-fetch). Give me a shout on [Twitter](https://twitter.com/philnash) if you're also excited about features like this coming to the browser.
