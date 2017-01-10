---
layout: post
title:  "Install a service worker declaratively"
tags:
  - service worker
  - javascript
image: /images/service-worker.png
image_alt: "Three cogs on a yellow background, intended to represent the idea of the Service Worker"
---

There's been some interesting updates in service workers recently. The big news is that the [Microsoft Edge development version now has service workers, alongside push notifications and background sync, behind flags](http://www.ghacks.net/2016/08/14/microsoft-edge-improves-on-windows-10-14901/). There was a new feature that caught my eye though; a declarative method for registering service workers.

Up until now, to register a service worker, you need to write JavaScript. It would look something like this (emoji logging optional):

{% highlight html %}
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register("/sw.js", { scope: "/blog/" })
      .then(function(registration) { console.log("🍻"); })
      .catch(function(error) { console.log("😭", error); });
  }
</script>
{% endhighlight %}

If you allow the service worker lifecycle to play out naturally and you're not using [push notifications](https://www.twilio.com/blog/2016/02/web-powered-sms-inbox-with-service-worker-push-notifications.html) or background sync then this is all you need. New in Chrome 54 (currently Canary) there is an experiment to make this even simpler, more declarative, with the use of a `<link>` tag in the HTML or via a `Link` header.

I've put together a quick example repository showing all three approaches which you can use to install a service worker. There's the JavaScript way, as seen above. Or, [you can just use a `<link>` tag](https://github.com/philnash/install-service-worker/blob/master/public/link/index.html#L5), like so:

{% highlight html %}
<link rel="serviceworker" href="/sw.js" scope="/blog/">
{% endhighlight %}

Or, you can [install the service worker with an HTTP header](https://github.com/philnash/install-service-worker/blob/master/index.js#L5) that looks like this:

{% highlight http %}
Link: </sw.js>; rel="serviceworker"; scope="/blog/"
{% endhighlight %}

Each of these methods will install the service worker file `/sw.js` with the scope `"/blog/"`. I've produced an example of [how you'd use these methods to install a service worker on GitHub](https://github.com/philnash/install-service-worker). Make sure to enable "Experimental Web Platform features" in Chrome Canary before you try it out.

## Foreign fetch

It turns out that these alternative ways to register a service worker stem from the foreign fetch proposal.

When you have a service worker registered it can respond to any fetch request made from a page under its control. Foreign fetch intends to make it possible to register a service worker and respond to cross origin requests. You can read more about the [foreign fetch proposal in the spec on GitHub](https://github.com/slightlyoff/ServiceWorker/blob/master/foreign_fetch_explainer.md). The take away for me was that foreign fetch will make it more robust to rely on third party APIs that you call from the browser in our web apps.

As you can imagine, cross origin requests for resources like an API won't be running your regular JavaScript that would install your service worker. This is where the `Link` header comes in.

## The service worker revolution marches on

Whether it's new developments in browsers that already support service workers or new browsers joining the fold (come on Safari&hellip;), I continue to be excited about the potential this technology is bringing to our web applications. I particularly like simplifications to the process and installing a service worker with just a `<link>` tag appeals to me.

If you want to catch me speaking about my excitement for service workers I'll be doing so all over Europe this Autumn. Look out for me at [Frontend Conference Zurich](https://frontendconf.ch/speakers/#phil-nash), [Refresh in Tallinn](http://refresh.rocks/speakers#phil) and [DevDay in Kraków](http://devday.pl/). I hope to see you there!
