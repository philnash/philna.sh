---
layout: post
title:  "The surprise multipart/form-data"
tags:
  - javascript
  - node
  - express
---

Building up and sending an Ajax request is so much easier than it ever used to be. No longer must we hassle ourselves with `XMLHttpRequest`, never mind the horror of ActiveX's `ActiveXObject("Microsoft.XMLHTTP")`. The [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) is here (and it is [polyfilled](https://github.com/github/fetch) for older browsers). Then there's the [`FormData` object](https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects) that makes building up and submitting form data really easy, especially compared to [the 130 or so lines of JavaScript you'd need to do it yourself](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#A_little_vanilla_framework).

But you can still get things wrong. _I_ can definitely get things wrong.

So I wanted to write about what I got wrong to remind myself for the future. My mistakes involved the Fetch API, `FormData` and a simple [Express](http://expressjs.com/) server in Node.js.

## I couldn't POST any data

It was simple, I wanted to POST some data to my server. I had Express set up, I'd installed [body-parser](https://github.com/expressjs/body-parser) (normally something I forget to do until this kind of problem comes along), I had a route that was ready to receive my data and do something with it.

It looked a little like this:

{% highlight javascript %}
const Express = require("express");
const bodyParser = require("body-parser");

const app = new Express();

app.use(bodyParser.urlencoded({ extended: true }));

app.post("/", function(request, response) {
  console.log(request.body.foo);
  response.send("OK");
});

app.listen(3000, function() {
  console.log("Application is listening on localhost:3000");
});
{% endhighlight %}

OK, it was more complicated than that, but that's all we need to demonstrate this.

The front end was going to be even easier.

{% highlight javascript %}
var formData = new FormData();
formData.append("foo", "bar");
fetch("/", {
  method: "POST",
  body: formData
}).then(function(response) {
  // Yay!
}).catch(function(err) {
  // Boo!
});
{% endhighlight %}

The plan was simple: run the server, run the front end code, see "bar" printed in the console, celebrate.

{% asset posts/formdata/undefined alt='The console logged out "undefined"' %}

`undefined`, the JavaScript developer's worst enemy (aside from perhaps callback hell and developers from other languages telling them that they're doing it wrong).

I searched up and down the `request` object, looking for that simple piece of data that I had sent. I checked in all the places I thought it might be `request.body`, `request.params`, `request.query`, Express has all of those you know. I checked in plenty of places I didn't think it would be. Finally I did what any sensible developer would do. I asked the internet.

## The internet is a wonderful support network

I love that out there is a resource where I can ask questions and people respond and help me. The internet came up trumps in this case, I asked and many people chimed in with ways to fix the issue.

The first solution was to set the content type to JSON and just send JSON to the server.

{% highlight javascript %}
var data = { foo: "bar" };
fetch("/", {
  method: "POST",
  body: JSON.stringify(data),
  headers: {
    "Content-Type": "application/json"
  }
}).then(function(response) {
  // Yay!
}).catch(function(err) {
  // Boo!
});
{% endhighlight %}

This worked, but I was confused. I had this really easy `FormData` object to work with, but the solution was to throw it away and use `JSON.stringify`? It didn't seem right. It worked but I wanted to persist and make it work the way I had intended.

## It works in Rails

Eventually [Edd](https://twitter.com/edds) sorted me out. Firstly he said that my front end JavaScript wasn't wrong, the same code worked with a Rails back end. I think that put him on the route to find [the correct answer](http://stackoverflow.com/questions/36918287/cant-post-data-using-javascript-fetch-api) though.

It turns out that body-parser doesn't understand `multipart/form-data` encoded forms (though as Edd pointed out, [Rails does](http://guides.rubyonrails.org/form_helpers.html#uploading-files)). And `FormData`, when added to a Fetch API request (or an `XMLHttpRequest` as it happens, I checked), will set the content type to `multipart/form-data`. It actually says that right here in the [first paragraph of the MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects). In bold.

I like to say that "people don't read things on the internet". _I_ don't read things on the internet.

In my defence, I would have thought that body-parser might parse the body of the request. Once again skimming over the documentation was my downfall. Check out [line 2 of the body-parser readme](https://www.npmjs.com/package/body-parser#readme).

In fact, the body-parser readme doesn't just say that it won't handle `multipart/form-data` bodies, it even goes as far as suggesting other modules to use for those requests.

I ended up using [formidable](https://www.npmjs.com/package/formidable#readme) via the [express-formidable middleware](https://www.npmjs.com/package/express-formidable). Our example server now looks like this:

{% highlight javascript %}
const Express = require("express");
const bodyParser = require("body-parser");
const formidable = require("express-formidable");

const app = new Express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(formidable());

app.post("/", function(request, response) {
  console.log(request.fields.foo)
  response.send("OK");
});

app.listen(3000, function() {
  console.log("Application is listening on localhost:3000");
});
{% endhighlight %}

## Lessons learned

`FormData` objects set the content type of a Fetch API (or `XMLHttpRequest`) request to `multipart/form-data` automagically.

body-parser doesn't support parsing the body of a `multipart/form-data` request. But there are [many](https://www.npmjs.org/package/busboy#readme) [options](https://www.npmjs.org/package/multiparty#readme) [that](https://www.npmjs.org/package/formidable#readme) [do](https://www.npmjs.org/package/multer#readme).

The internet is a very helpful place. Thank you to Edd and others who suggested what I might be doing wrong.

READ THE DOCUMENTATION. Then probably read it again just to make sure.

## There are no surprises

There are actually very few surprises in development, particularly when using modern browser APIs and well supported frameworks and reading the documentation. I learned quite a bit from this one small episode as you can see above. The next thing I need to do is write some documentation for someone else. Eventually, they'll read it and be thankful as I was.
