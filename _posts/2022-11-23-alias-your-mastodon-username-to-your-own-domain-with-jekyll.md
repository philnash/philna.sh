---
layout: post
title: "Alias your Mastodon username to your own domain with Jekyll"
tags:
  - ruby
  - jekyll
  - mastodon
image: posts/mastodon/mastodon-and-jekyll
image_alt: "Alias your Mastodon username to your own domain with Jekyll"
image_width: 1200
image_height: 600
---

Mastodon is different to most online services. It is a federated network, so when you set up an account you need to [choose a server to use](https://docs.joinmastodon.org/user/signup/). Your username then becomes a combination of your handle and that server you signed up to. For example, I am currently [@philnash@mastodon.social](https://mastodon.social/@philnash).

But what if you want to personalise that a bit more? What if you wanted to use your own domain for your Mastodon account without having to host a whole Mastodon server? Using your own domain means that no matter what instance you used, or if you moved instance, you could share one Mastodon username that always pointed to the right profile and was personalised to your own site.

## WebFinger to the rescue

It turns out that you can do this. [Maarten Balliauw wrote about how Mastodon uses WebFinger to attach extra information to an email address](https://blog.maartenballiauw.be/post/2022/11/05/mastodon-own-donain-without-hosting-server.html). Information like an associated profile page or [ActivityPub](https://activitypub.rocks/) stream.

Implementing WebFinger requires your domain to respond to a request to `/.well-known/webfinger` with a JSON representation of the associated accounts. If you have a Mastodon account you can check out what your WebFinger JSON looks like by making a request to `https://#{instance}/.well-known/webfinger?resource=acct:#{username}@#{instance}`. For example, my WebFinger JSON is available at this URL: [https://mastodon.social/.well-known/webfinger?resource=acct:philnash@mastodon.social](https://mastodon.social/.well-known/webfinger?resource=acct:philnash@mastodon.social).

To associate a Mastodon account with your own domain, you can serve this JSON yourself from a `/.well-known/webfinger` endpoint.

## WebFinger with Jekyll

As Maarten pointed out in his post, you can copy the JSON response from your Mastodon instance to a file that you then serve from your own site. My site is powered by [Jekyll](https://jekyllrb.com/), so I wanted to make it easy for me, and anyone else using Jekyll, to create and serve that WebFinger JSON. I've also built Jekyll plugins before, like [jekyll-gzip](https://github.com/philnash/jekyll-gzip), [jekyll-brotli](https://github.com/philnash/jekyll-brotli), [jekyll-zopfli](https://github.com/philnash/jekyll-zopfli), and [jekyll-web_monetization](https://github.com/philnash/jekyll-web_monetization).

I got to work and built [jekyll-mastodon_webfinger](https://github.com/philnash/jekyll-mastodon_webfinger).

### How to use it

You can serve up your own WebFinger JSON on your Jekyll site to point to your Mastodon profile by following these steps:

1. Add `jekyll-mastodon_webfinger` to your Gemfile:

   ```
   bundle add jekyll-mastodon_webfinger
   ```

2. Add the plugin to your list of plugins in `_config.yml`:

   ```yml
   plugins:
     - jekyll/mastodon_webfinger
   ```

3. Add your Mastodon username and instance to `_config.yml`:

   ```yml
   mastodon:
     username: philnash
     instance: mastodon.social
   ```

Next time you build the site, you will find a `/.well-known/webfinger` file in your output directory, and when you deploy you will be able to refer to your Mastodon account using your own domain.

You can see the result of this by checking the WebFinger endpoint on my domain: [https://philna.sh/.well-known/webfinger](https://philna.sh/.well-known/webfinger) or by searching for `@phil@philna.sh` on your Mastodon instance.

<figure>
  <img src="{% asset posts/mastodon/search @path %}" alt="When you search for @phil@philna.sh on your Mastodon instance, you will find my account">
</figure>

As this is a static file it sort of acts like a catch-all email address. You can actually search for `@any_username@philna.sh` and you will find me. If you wanted to restrict this, you would need to build an endpoint that could respond dynamically to the request.

## Other ways to serve Mastodon WebFinger responses

I'm not the only one to have considered this. Along with [Maarten's original post on the topic](https://blog.maartenballiauw.be/post/2022/11/05/mastodon-own-donain-without-hosting-server.html), others have built tools or posted about how to do this with your own site.

Lindsay Wardell wrote up [how to integrate Mastodon with Astro](https://www.lindsaykwardell.com/blog/integrate-mastodon-with-astro) including showing how to display her feed within her Astro site.

Dominik Kundel put together a [Netlify plugin that generates a Mastodon WebFinger](https://github.com/dkundel/netlify-plugin-mastodon-alias) file for your Netlify hosted site.

## Take a trip into the Fediverse

An interesting side-effect of the increase in popularity of Mastodon is learning and understanding the protocols that underpin federating a social network like this. [WebFinger](http://webfinger.net/) and [ActivityPub](https://activitypub.rocks/) are having their moment and I look forward to see what further integrations and applications can be built on top of them.

In the meantime, you can use the techniques in this post to use your own domain as an alias for your Mastodon profile. And if you fancy it, connect with me on Mastodon by searching for `@phil@philna.sh` or at [https://mastodon.social/@philnash](https://mastodon.social/@philnash).