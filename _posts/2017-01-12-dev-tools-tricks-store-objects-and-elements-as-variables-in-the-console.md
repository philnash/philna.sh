---
layout: post
title: "Dev Tools Tricks: Store objects and elements as variables in the console"
tags:
  - dev tools
  - javascript
  - chrome
  - firefox
image: posts/dev-tools-tricks-header
show_image: false
---

Browser dev tools are so full of features it's hard to keep up. I bet every developer knows a different set of features to each other. I wanted to share a few little tips that I use, that you might not know and that if I don't write down I might forget.

Read on and discover the magic of `$0`, `$_` and `temp0`.

## Access selected elements as variables

When you're clicking around the Inspector in Firefox or the Elements tab in Chrome and you want to use the selected element in the console, you need a reference to that element. You could type out a `querySelector` that would pick the element out of the document, but that's far too much work. Instead, leave the element selected and use `$0` in the console to get the reference you need.

<figure class="post-image">
  {% asset posts/dev-tools-tricks/firefox-dollar-zero alt="Typing $0 in the Firefox dev tools console will grab a reference to the currently selected element." %}
</figure>

Chrome even hints at this by showing `== $0` next to the HTML.

<figure class="post-image">
  {% asset posts/dev-tools-tricks/chrome-dollar-zero alt="Typing $0 in the Chrome dev tools console will grab a reference to the currently selected element." %}
</figure>

Be aware though, if you select a different element in the inspector then it will become the subject of `$0` and you will lose the reference to the old one.

Firefox has another trick for this. Right click on an element and choose "Use in console". This places a variable called `temp0` into the console's command line which is a reference to that selected element.

<figure class="post-image">
  {% asset posts/dev-tools-tricks/firefox-use-in-console alt="In Firefox you can right click on an element and choose 'Use in console' to use it in the console as a variable named temp0." %}
</figure>

## Turn any object in the console into a global variable

If you're dealing with other objects in the console, perhaps something you've logged from your own code, and you want to reference them then there are a couple of ways to do that too.

`$_`, for example, is a reference to the last object that was returned in the console.

<figure class="post-image">
  {% asset posts/dev-tools-tricks/firefox-dollar-underscore alt="Typing $_ in the dev tools console will grab a reference to the last returned object in the console." %}
</figure>

More generally, any object that has been returned or logged to the console can be turned into a global variable by right clicking on it and selecting "Store as global variable". You will get a variable called `temp0` which references that object. Even better, do it for more objects and you'll get new variables called `temp1`, then `temp2` and so on.

<figure class="post-image">
  {% asset posts/dev-tools-tricks/store-as-global alt="Right click on any object in the console and choose 'Store as global object' to save it as a variable." %}
</figure>

## Dev tools go deep

There is so much to learn about dev tools, these are just a few little tricks that might help when debugging your code. If you're looking for more tips like this, I recommend signing up to [Umar Hansa's Dev Tips](https://umaar.com/dev-tips/) or watch his [ffconf 2016 talk](https://www.youtube.com/watch?v=N33lYfsAsoU&list=PLXmT1r4krsTpDoGcdh1baZPIV6DtX9_rX).

Don't forget to share your own tips or things you've found in dev tool. If you've got any good ones, please send them to me on Twitter at [@philnash](https://twitter.com/philnash).

