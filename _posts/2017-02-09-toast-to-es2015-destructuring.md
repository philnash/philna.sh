---
layout: post
title:  "A toast to ES2015 destructuring"
image: "/images/destructured_beers.jpg"
image_alt: ""
tags:
  - javascript
  - es2015
  - es6
---

I think the [ES2015 destructuring syntax](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) is pretty cool. It might not grab the headlines like Promises, Generators or the class syntax, but I find it really useful. It's also [surprisingly detailed when you read into it](http://exploringjs.com/es6/ch_destructuring.html).

The only shame is that most of the examples I've found focus on just the syntax and not real life usage. Like this one from the [MDN docs](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment):

```javascript
var a, b;
[a, b] = [10, 20];
console.log(a); // 10
console.log(b); // 20
```

Luckily I have a real life use case for destructuring for you right here.

## Keeping Promises

One of my favourite uses for destructuring is when using `Promise.all` to wait for a number of asynchronous tasks to complete. The result of `Promise.all` is returned as an array and you would normally iterate over it or pick out the results you need by hand.

But, if you know what objects you are expecting to receive you can use parameter destructuring to make your life easier and your code both prettier and more descriptive by naming the parameters up front. Let's see an example.

## Comparing beers

Let's say you want to compare two of [BrewDog's delicious beers](https://www.brewdog.com/beer/headliners), something I find myself doing in real life [all the time](https://untappd.com/user/philnash). We can get the information about them from Sam Mason's gloriously named [Punk API](https://punkapi.com/). To implement this we use the `fetch` API to get the data on each beer from the API. We need both requests to resolve before we can compare the beers.

Let's take a look at the code:

{% highlight javascript %}
  const punkAPIUrl = "https://api.punkapi.com/v2/beers/106";
  const deadPonyClubUrl = "https://api.punkapi.com/v2/beers/91";
  const punkAPIPromise = fetch(punkAPIUrl)
    .then(res => res.json())
    .then(data => data[0]);
  const deadPonyClubPromise = fetch(deadPonyClubUrl)
    .then(res => res.json())
    .then(data => data[0]);

  Promise.all([punkAPIPromise, deadPonyClubPromise])
    .then(beers => {
      const punkIPA = beers[0];
      const deadPonyClub = beers[1];
      const stronger = (punkIPA.abv < deadPonyClub.abv ? deadPonyClub.name : punkIPA.name) + " is stronger";
      console.log(stronger);
    });
{% endhighlight %}

We can tidy that Promise up with parameter destructuring:

{% highlight javascript %}
  Promise.all([punkAPIPromise, deadPonyClubPromise])
    .then(([punkIPA, deadPonyClub]) => {
      const stronger = (punkIPA.abv < deadPonyClub.abv ? deadPonyClub.name : punkIPA.name) + " is stronger";
      console.log(stronger);
    });
{% endhighlight %}

We know we're getting two beers as a result and the way this example is constructed we even know which beer is which. So we can use the parameter destructuring to name the beers in the array instead of plucking them out.

## More examples

Ok, this may still seem like a made up example, but it certainly is closer to real life. The first time I found myself using this technique was when writing about [Service Workers for 12 Devs of Christmas](http://12devsofxmas.co.uk/2016/01/day-9-service-worker-santas-little-performance-helper/). It came in handy when writing the method `returnFromCacheOrFetch` which implements the "stale while revalidate" caching method using the `caches` and `fetch` APIs.

The method opens up a named cache and tries to match the current request against the cache. Before returning, it then kicks off a `fetch` request for the requested resource, caching the result. Finally if the request was found in the cache the cached response is returned, otherwise the new fetch request is returned. You can read more about it in [the original blog post](http://12devsofxmas.co.uk/2016/01/day-9-service-worker-santas-little-performance-helper/).

The final code looked like this:

{% highlight javascript %}
function returnFromCacheOrFetch(request, cacheName) {
  const cachePromise = caches.open(cacheName);
  const matchPromise = cachePromise
    .then((cache) => cache.match(request));

  // Use the result of both the above Promises to return the Response. Promise.all returns an array, but we destructure that in the callback.
  return Promise.all([cachePromise, matchPromise])
    .then(([cache, cacheResponse]) => {
      // Kick off the update request
      const fetchPromise = fetch(request)
        .then((fetchResponse) => {
          // Cache the updated file and then return the response
          cache.put(request, fetchResponse.clone());
          return fetchResponse;
        });
      // return the cached response if we have it, otherwise the result of the fetch.
      return cacheResponse || fetchPromise;
    });
}
{% endhighlight %}

In this case I needed both the result of `caches.open` and `cache.match(request)` in order to perform the background fetch and return the cached response. I drew them together using `Promise.all` and destructured the resulting array keeping the code tidy and descriptive.

## Naming things

In these examples, parameter destructuring allows us to name the results we expect to get from the resolved Promises we pass to `Promise.all`. In fact, anywhere we use parameter destructuring, particularly with arrays, it allows us to name objects early and more descriptively. This in turn makes the code more readable and more maintainable in the long term.

Are there other places in your code that you've found the ES2015 destructuring syntax helpful? I'd love to know how you use the feature too, so please share your destructuring tips with [me on Twitter](https://twitter.com/philnash).
