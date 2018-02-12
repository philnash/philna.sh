---
layout: post
title: "The Boy Scout rule and open source documentation"
tags:
  - open source
  - documentation
image: posts/campfire
image_alt: "A campfire"
---

Recently I [called out Mike Riethmuller on Twitter for complaining about documentation](https://twitter.com/mikeriethmuller/status/953830059881545728). Mike had a difference of opinion with the [Stylus](http://stylus-lang.com/) documentation and I pointed out that if the documentation were open source it could be changed.

This interaction got me thinking about the way we work with and consume open source projects and their documentation.

## The Boy Scout Rule

In his book _Clean Code_, [Bob Martin wrote about the "Boy Scout Rule,"](http://www.informit.com/articles/article.aspx?p=1235624&seqNum=6) encouraging developers to:

> Leave the campground cleaner than you found it.

His idea was simple, when you check code in don't just complete the feature or fix the bug, improve something else about the file in which you were working. If the code keeps on improving it can't rot or fall foul of overwhelming technical debt. By definition, it just keeps getting better.

I think we can do better than that.

## There's more to software than the campground you currently inhabit

Martin's Boy Scout Rule is fine for working on a project with your own team. But as open source software has become more and more social (notably, Clean Code was published in the same year GitHub launched) it is rare to work on any project without multiple external, open source dependencies.

All of these dependencies, these frameworks and libraries that underpin the work we do day to day, need constant effort to keep them running, up to date, and well documented. This is where I think we need to reapply the Boy Scout Rule outside of our own work.

While working on projects recently I've found the occasional sticking point with a dependency. Either unclear documentation or a small bug that got in my way. Then, once I solved the problem for myself, I tried to feed that back to the project.

This has lead to me making a small bunch of open source contributions. For example after I [set up 2 factor authentication for the npm CLI](https://www.twilio.com/blog/2017/10/protect-your-npm-account-with-2fa-and-authy.html) I contributed back to the [npm documentation](https://github.com/npm/docs/pulls?utf8=%E2%9C%93&q=author%3Aphilnash+). When [I found a broken favicon in the Crystal documentation](https://philna.sh/blog/2017/01/27/on-fixing-a-favicon/) I [tried to fix it](https://github.com/crystal-lang/crystal-website/pulls?utf8=%E2%9C%93&q=author%3Aphilnash). As I wrote about [receiving SMS messages with Hanami](https://www.twilio.com/blog/2017/11/how-to-receive-and-respond-to-text-messages-in-ruby-with-hanami-and-twilio.html) I was able to [improve parts of the documentation](https://github.com/hanami/hanami.github.io/pulls?utf8=%E2%9C%93&q=author%3Aphilnash).

I've been subconsciously and haphazardly applying the Boy Scout Rule to other people's projects.

## The conscious camper

As we work with another project we see the gaps appear where we might make improvements. Indeed, the projects we best understand and have the greatest chance of improving are the ones we are working with closely.

While working with these projects we inevitably come across confusing code or wrong or missing documentation. Once we have understood the problem and fixed it for ourselves we become the most qualified person to tidy up that code or write the documentation.

In fact, even if nothing is wrong with the documentation, you might be able to offer a different perspective on the project or an alternate example that makes a use case a bit more clear.

In fixing or adding to the documentation, we make life better for the next developer that comes along.

As I write code, build projects and user other developers' code going forward, I am going to try to keep this top of mind. To stretch the metaphor, I won't just be trying to keep my campground clean, but to tidy up my neighbours campgrounds as best I can too.

## Making the open source world a better place

Bob Martin's Boy Scout Rule actually scoped down and paraphrased [Lord Baden-Powell's last message in 1941](https://en.wikiquote.org/wiki/Robert_Baden-Powell) which was:

> Leave this world a little better than you found it.

I think this version of the Boy Scout Rule is applicable to software now more than ever. All of us have the ability to improve the open source projects we use by helping to better document them. When we do, we leave the open source world just that little bit better than when we found it. I encourage you to join me in considering how you could improve a project that you are using in your work today.

If you were wondering what happened with Mike and Stylus, he made that [pull request, it was merged](https://github.com/stylus/stylus/pull/2352) and it's now live in the [Stylus documentation](http://stylus-lang.com/docs/variables.html). [He's even offering to help anyone who wants to contribute in this way but hasn't before](https://twitter.com/MikeRiethmuller/status/958888245466619904).

He's not the only one of course. If you'd like to contribute to an open source project but you don't know where to start, [shoot me a mention or a DM on Twitter at @philnash](https://www.twitter.com/philnash) and I'd be glad to help.