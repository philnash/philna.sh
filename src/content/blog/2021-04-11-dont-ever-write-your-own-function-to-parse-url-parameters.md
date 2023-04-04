---
title: "Don't ever write your own function to parse URL parameters"
tags:
  - javascript
  - web
  - node
image: /posts/parse-url-parameters.png
imageAlt: "A line of code that reads `parse('foo=bar');`"
imageWidth: 1920
imageHeight: 960
pubDate: "2021-04-11"
---

Sometimes the platform we are building on provides more functionality than we can keep in our own heads. However, depending on the problem, we often find ourselves trying to write the code to solve the issue rather than finding and using the existing solution provided by the platform. I almost fell for this recently when trying to parse a query string.

## I can do it myself

A colleagues had a query string they needed to parse in a function, and asked for recommendations on how to do so. For some reason I decided to roll up my sleeves and code directly into Slack. I came up with something like this:

```javascript
function parse(input) {
  return input
    .split("&")
    .map((pairs) => pairs.split("="))
    .reduce((acc, [k, v]) => {
      acc[k] = decodeURIComponent(v);
      return acc;
    }, {});
}
```

Looks pretty good, right? It even uses `reduce` which makes all array operations look extra fancy. And it works:

```javascript
parse("name=Phil&hello=world");
// => { name: 'Phil', hello: 'world' }
```

Except for when it doesn't work. Like if the query string uses the `+` character to encode spaces.

```javascript
parse("name=Phil+Nash");
// => { name: 'Phil+Nash' }
```

Or if you have more than one value for a key, like this:

```javascript
parse("name=Phil&name=John")
// => { name: "John" }
```

I could have worked to fix these issues, but that would just bring up more questions. Like how should multiple values be represented? Always as an array? On as an array if there is more than one value?

The problem with all of this is that even after thinking about these extra issues, there are likely more hiding out there. All this thinking and coding is a waste anyway, because we have [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams).

## URLSearchParams has a specification and several implementations

The `URLSearchParams` class is specified in the [URL standard](https://url.spec.whatwg.org/#urlsearchparams) and started appearing in browsers in 2016 and in Node.js in 2017 (in version 7.5.0 as part of the `URL` standard library module and then in version 10.0.0 in the global namespace).

It handles all of the parsing problems above:

```javascript
const params = new URLSearchParams("name=Phil&hello=world");
params.get("name");
// => "Phil"
params.get("hello");
// => world

const multiParams = new URLSearchParams("name=Phil&name=John");
multiParams.get("name");
// => "Phil"
// ???
multiParams.getAll("name");
// => [ 'Phil', 'John' ]
```

And it handles more, like iterating over the parameters:

```javascript
for (const [key, value] of params) {
  console.log(`${key}: ${value}`)
}
// => name: Phil
// => hello: world

for (const [key, value] of multiParams) {
  console.log(`${key}: ${value}`)
}
// => name: Phil
// => name: John
```

Or adding to the parameters and serialising back to a query string:

```javascript
multiParams.append("name", "Terry");
multiParams.append("favouriteColour", "red");
multiParams.toString();
// => 'name=Phil&name=John&name=Terry&favouriteColour=red'
```

The final thing I like about `URLSearchParams` is that it is available in both the browser and Node.js. Node.js has had the [`querystring` module](https://nodejs.org/api/querystring.html) since version 0.10.0, but when APIs like this are available on the client and server side, then JavaScript developers can be more productive regardless of the environment in which they are working.

As an aside, one of the things I appreciate about the Deno project is [their aim for Deno to use web platform APIs where possible](https://deno.land/manual@v1.8.3/runtime/web_platform_apis).

## Use the platform that is available

This post started as a story about choosing to write code to solve a problem that the platform already had solved. Once I realised my mistake I jumped straight back into Slack to correct myself and recommend `URLSearchParams`. When you understand the capabilities of the platform you are working with you can both code more efficiently and avoid bugs.

I never have to write code to parse URL parameters, I wrote this post to remind myself of that. You never have to either.