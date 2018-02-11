---
layout: post
title: "Doing things wrong"
tags:
  - learning
  - community
image: posts/fix_it
image_alt: "A git log showing a commit that posted my last blog post followed by four commits that just say 'fix it'."
---

[I wrote a blog post last week](https://philna.sh/blog/2017/02/09/toast-to-es2015-destructuring/) and bits of it were wrong. This is not a retraction of that blog post, I just wanted to share the feedback that I got, the things I changed and some lessons that I learned.

## Inconsistency sucks

The first feedback I received was from [posting the article on /r/javascript](https://www.reddit.com/r/javascript/comments/5szzfd/es2015_destructuring_promises_and_beer/). The comment is deleted now so I can't credit the author, but they pointed out a few things:

* Code styles between my two examples were different
* Two semicolons were missing
* It was better to format chains of Promises by placing the `.then` on the following line and indenting

I knew that the style of the two snippets was different as one had been written a year ago for the [12 Devs of Christmas blog](http://12devsofxmas.co.uk/2016/01/day-9-service-worker-santas-little-performance-helper/) and I had opted to retain the original code. But, mixing code styles in a project is unforgivable so why should a blog post be any different?

The formatting issues were also obvious once they had been pointed out to me. So, I went back to the post, improved the [Promise formatting](https://github.com/philnash/philna.sh/commit/9bd9af741934c5903d300c70e483d22f6de767cc) and fixed both the [semicolons and the code style](https://github.com/philnash/philna.sh/commit/707e0f9fe7724be999c3b381d34636042bc196ae).

## Over promising under delivers

The second piece of feedback came over Twitter, firstly in a direct message from [Masse Fierro](https://twitter.com/elmasse) and then in a mention from [James DiGioia](https://twitter.com/JamesDiGioia/status/830163324092481536). I'd gotten paranoid with my Promises and written one or two too many. I just needed to return the final data and not resolve another Promise.

```diff
   const punkAPIPromise = fetch(punkAPIUrl)
     .then(res => res.json())
-    .then(data => Promise.resolve(data[0]));
+    .then(data => data[0]);
```

Thanks to Masse and James [I fixed that too](https://github.com/philnash/philna.sh/commit/ea38977e47e60768f430cc5a00758d44cb0d15b6).

## Accessibility matters

The last thing to be pointed out, and probably the most important, was not about the content of the blog post but the accessibility of my site in general. [Charlotte Spencer pointed out that my site failed colour contrast tests](https://twitter.com/Charlotteis/status/830416813091614720) for both the code samples and links on the site. The tests they referred to are the [Web Content Accessibility Guidelines on colour contrast](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html) which recommend a contrast ratio of at least 4.5:1 for regular body text. I learned some interesting things trying to fix this:

* [tota11y](https://khan.github.io/tota11y/), by the [Khan Academy](https://www.khanacademy.org/), is a really awesome tool
  * I learned about it from the link Charlotte shared with me
  * It suggests colours that are similar to the existing colour that would pass the test
  * It also has other plugins that visualise things like out of order heading usage, poor link text, missing alt attributes and a few more, helping you to ensure your site is as accessible as possible
* Syntax highlighting themes are really bad at accessible contrast levels
  * I was using a version of [Solarized Dark](http://ethanschoonover.com/solarized) which failed in a number of places
  * I couldn't find any syntax highlighting theme that had decent contrast for all elements out of the box
  * Using syntax highlighting in your editor is one thing, you can use whichever contrast levels you are comfortable with, but on the web anyone could be reading it

Eventually I chose to use the suggestions from tota11y to [fix the four colours in Solarized Dark that were too low contrast](https://github.com/philnash/philna.sh/commit/60201a04397ad577f7e1b37809e157d3b5309c74). I also fixed my link text colour.

I was a little embarrassed about this because, [as I said in a tweet](https://twitter.com/philnash/status/830421373776515074), I thought I used to be good at this sort of thing. So much so that almost 10 years ago I wrote a blog post on the very matter of [colour in web accessibility](http://www.unintentionallyblank.co.uk/2007/09/27/web-accessibility-colour/). This just goes to show that not only do we learn new things every day in web development, retaining old things is just as important.

## Always be improving

I want to thank Masse, James, Charlotte and the now mystery Redditor for giving me the feedback that helped to improve both my blog post and my site. If you see anything on this site that could be improved I welcome the feedback. I learned that I should keep my eye on the formatting and consistency of my code, not to over promise and to pay closer attention to accessibility concerns.

Overall I learned that in order to always be improving&mdash;my code, my site, myself&mdash;sometimes I need to do things wrong.
