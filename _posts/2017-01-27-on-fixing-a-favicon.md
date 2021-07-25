---
layout: post
title:  "On fixing a favicon"
image: posts/tiny_changes
image_alt: The GitHub summary for a pull request, showing 1 addition and 2 deletions.
image_width: 1920
image_height: 600
tags:
  - open source
  - favicon
  - crystal
---

Sometimes open source work is just fixing one tiny thing that bugs you. However, rolling up your sleeves and delving into even the smallest amount of code can lead to surprising results.

I fixed a favicon recently. Here's what happened.

## I fixed something for me

At the very least, fixing this issue has made me happier. The problem was that the [Crystal standard library documentation](https://crystal-lang.org/api/0.20.5/) wasn't showing a favicon, so when I had a bunch of tabs open in my browser I couldn't tell which ones had the Crystal docs I was using.

## I fixed something for someone else

This is a guess, but if I found this an issue then we can presume at least one other person out there on the internet did.

## I learned more about favicons

This was the bit I didn't expect. I've built websites for a long time now, I thought I knew all there was to know about favicons. How wrong I was.

I started by making a mistake. My [original pull request was against the Crystal project itself](https://github.com/crystal-lang/crystal/pull/3832) and added `<link>` elements to the `<head>` of the documentation's HTML layout. This would make it dependent on the structure of the Crystal website though.

Feedback lead me to try again. This time I wanted to make the favicon for the Crystal website work by default for any pages situated on the crystal-lang.org domain, including the docs. This lead to a bunch of discoveries about favicons.

* If you have a `<link>` for both a `.png` and a `.ico` favicon, [Chrome and Safari will always pick the `.ico`](http://www.jonathantneal.com/blog/understand-the-favicon/)
* Firefox will always pick the `.png`
* Internet Explorer only started supporting `.png` favicons since version 11

So, if you want to use a high quality `.png` favicon and a fallback for old Internet Explorer then the best course of action is to include a `<link>` to the `.png` icon in the `<head>` and place the `.ico` version in the default location: `/favicon.ico`. This way Chrome, Safari, Firefox and IE11/Edge will all choose the `.png` icon and old Internet Explorer will ignore the `<link>` and look for `/favicon.ico`.

Of course, as with anything on the web, [there is even more to it than that](https://github.com/audreyr/favicon-cheat-sheet). However, this was [my resulting pull request](https://github.com/crystal-lang/crystal-website/pull/15/files) and it was merged. Now favicons work on the documentation as well as the main site.

## I learned more about the Crystal project

In my early pull request I learned about how the Crystal standard library documentation is generated and rendered. Then, when exploring the [Crystal website](https://github.com/crystal-lang/crystal-website) I found that not only is it currently built on [Jekyll](https://jekyllrb.com/) but that there was an [open issue](https://github.com/crystal-lang/crystal-website/issues/12) pointing to my blog post on [using Jekyll Assets to build an asset pipeline](https://philna.sh/blog/2016/06/28/asset-pipelines-with-jekyll-assets/). If there was one thing in the world that I was definitely capable of it was using my own blog post to make caching assets better. So I rolled up my sleeves and prepared [another pull request](https://github.com/crystal-lang/crystal-website/pull/16).

Now I am more familiar with the Crystal website and the team behind it that have commented on, reviewed and merged my pull requests.

## The simplest piece of work can lead you anywhere

I just wanted to make favicons work yet it lead to 3 pull requests, a rabbit hole of discovery about favicons and browsers and the motivation to write a blog post about it. Ultimately, I did get what I wanted in the first place though: more recognisable tabs when I'm working with Crystal.

Open source is a lot of things to a lot of people. To me, it's a way to learn while I help, however small the task may seem. I'd love for you to share with [me on Twitter](https://twitter.com/philnash) what open source means to you.
