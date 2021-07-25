---
layout: post
title:  "The web share API"
image: posts/share_header
image_alt: ""
image_width: 1920
image_height: 600
tags:
  - web
  - javascript
  - share
---

Recently I implemented the [web share API](https://developers.google.com/web/updates/2016/10/navigator-share) for my site as a means of testing it out. If you are using version 55 or above of Chrome on Android then you can see it in action by clicking "share it" at the bottom of this post.

If you don't have a browser that supports the API, then this is what it looks like when you hit the share link.

<div class="info">
  <p>The Web Share API origin trial has finished and after consideration is now supported in Chrome for Android. You can keep up with support by checking out the <a href="https://caniuse.com/#search=web-share">Web Share API on Can I Use</a>.</p>
</div>

I want to share how the API works and my thoughts on it so far.

<figure class="post-image post-image-left">
  <picture>
    <source type="image/web" srcset="{% asset posts/webshare @path %}.webp">
    {% asset posts/webshare alt="A tray slides up from the bottom of the screen with sharing options from your installed applications." %}
  </picture>
</figure>

## How it works

The web share API is actually quite a simple API. It is available on the `navigator` object and consists of one method; `share`. The method takes an object that can have `title`, `text` or `url` properties. It is mandatory to have either a `text` or `url` property, though you can have both.

You can only invoke `navigator.share` as a result of a user gesture, so sites can't surprise a user into sharing a page. Also, like other powerful new web platform features, it only works on sites hosted on HTTPS.

The API is Promise based, when a page is successfully shared the Promise will resolve. If the user is unable to or chooses not to share, the Promise will reject.

You can feature detect the existence of the API so you can progressively enhance a site with the web share API. This is good news right now as the API is only available as an [Origin Trial](https://github.com/jpchase/OriginTrials/blob/gh-pages/developer-guide.md). This means that it is not widely available and you need to opt in to testing the feature on your site. If you are on a browser that doesn't yet support the API and you click "share it" at the bottom of this post, you just get directed to the [Twitter web intent](https://dev.twitter.com/web/tweet-button/web-intent).

## Implementing the web share API

This is how you'd call the web share API on its own.

{% highlight javascript %}
navigator.share({ title: title, url: url })
  .then(function() { console.log("Share success!"); })
  .catch(function() { console.log("Share failure!"); });
{% endhighlight %}

And here is my first implementation of the web share API for this site.

{% highlight javascript %}
var shareLinks = [].slice.call(document.querySelectorAll('.share'));
shareLinks.forEach(function(link) {
  link.addEventListener('click', function (event) {
    if (typeof navigator.share !== 'undefined') {
      event.preventDefault();
      var canonicalElement = document.querySelector('link[rel=canonical]');
      if(canonicalElement !== undefined) {
        var url = canonicalElement.href;
      } else {
        var url = window.location.href;
      }
      var pageTitle = document.querySelector('.post-title').textContent;
      navigator.share({ title: pageTitle, url: url })
        .then(function() { console.log("Share success!"); })
        .catch(function() { console.log("Share failure!"); });
    } else {
      // No web share API...
    }
  });
});
{% endhighlight %}

As you can see, most of the code here is setting up listeners, feature checking and getting the actual data to share. Breaking it down, here's what happens:

1. Select all links with the class "share"
2. Add a "click" listener to each link
3. When a share link is clicked, check for the existence of `navigator.share`
4. If it does exist, stop the link from doing anything
5. Try to get the canonical URL for the page, first from the link element if it is present, otherwise from `window.location.href`
6. Get the page title from the page's h1 element
7. Share the title and url

You can see [the full code (at the time of writing) in GitHub](https://github.com/philnash/philna.sh/blob/3075d51dcf723b26eaae0fa1149dd5fa3a14b03e/_assets/js/main.js#L6-L49).

## Thoughts on the API

I like the API and I like the benefits it brings to both developers and users.

First up it's simple to implement. One method, 3 potential arguments, Promises for success and failure. You can dig a bit deeper into it, but on the surface a developer can have this implemented in a few minutes. Hopefully this simplicity will lead to swift adoption if the API becomes a standard.

There's more reasons I'm a fan though.

### User choice

It stops host websites choosing where users can share content to. Sure, Facebook and Twitter are popular share destinations, but there are so many more apps out there that you could share content to. This long tail effect means that it is neither satisfying to only supply one or two share buttons, nor remotely sensible to make sharing everywhere possible. [ShareThis may have a bunch of share buttons available](http://platform.sharethis.com/get-inline-share-buttons), but the selection still doesn't scratch the surface of possibility across the web.

Ultimately, a share API like this puts the control back into the users' hands, allowing them to share to the applications they choose to install on their device.

### Minimising JavaScript

You've seen the code above that I've used to implement the web share API. There's not much of it.

It's particularly small when you compare it to the scripts that popular sites supply to enable their share functionality. [Twitter's script](https://dev.twitter.com/web/javascript/loading) is ~32kB and [Facebook's](https://developers.facebook.com/docs/plugins/share-button) ~60kB (gzipped sizes). Best practice is to load those scripts asynchronously, so they shouldn't affect page load time. But that is a significant amount of JavaScript that needs to be loaded and parsed simply for a share button.

These scripts don't just function as the share buttons you are implementing as a developer. They allow Facebook, Twitter and the like to track their users around the web. The web share API not only gives site owners a more efficient way for users to share, but also gives back some user privacy.

### Better feedback

While it may make it harder for large social networks to track users, the web share API actually makes it easier for sites to learn about their users' behaviour. As the share API works with Promises, you can find out when the share link is clicked and when a click results in a share to another application.

## What's missing?

Currently the thing that is missing from the implementation of the web share API is the other side of it. [The web share target API](https://github.com/WICG/web-share-target) is an API that will allow web applications to register to appear in the share drawer when the web share API is invoked. Without the target API the web share API can only share directly to native applications available on a user's device. While this is probably still ok for those large social networks which already have applications installed on users' devices, this doesn't help the long tail of potential share targets.

I understand that becoming a share target is a much more complicated process than sharing. It is a good thing that the investigation of the share API and the share target API has been split up so that we can experiment with the web share API sooner. I hope to see the web share target API trialling ideas soon though.

## Share away

The web share API is currently an experiment ([which you can sign up to trial yourself](https://docs.google.com/forms/d/e/1FAIpQLSfO0_ptFl8r8G0UFhT0xhV17eabG-erUWBDiKSRDTqEZ_9ULQ/viewform?entry.1999497328=Web+Share+(Experimenting+until+April+2017))) but I think it's an interesting and well meaning one. Ultimately giving users the choice over what they can share to is better for users and better for the long tail of applications.

What do you think of the web share API? Let me know on Twitter at [@philnash](https://twitter.com/philnash). And if you're feeling generous, why not <a href="https://twitter.com/intent/tweet?text=The+web+share+API&url=https://philna.sh%2Fblog%2F2017%2F03%2F14%2Fthe-web-share-api%2F&via=philnash" class="share">share this post</a> too!
