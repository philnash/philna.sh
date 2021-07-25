---
layout: post
title: "The story of a mildly popular Ruby gem"
tags:
  - open source
  - ruby
  - api
  - bitly
image: posts/bitly/bitly-rubygem
image_alt: "A story about the Bitly Ruby gem"
image_width: 1920
image_height: 600
---

The list on GitHub of repositories that depend on your repository is scary.

There's something nice about writing and releasing a library, module, Ruby gem, whatever. It is code that you wrote that worked for you. There may be download numbers on the registry, but they are fairly abstract and don't necessarily relate to use. Seeing that there are real projects using the code that you wrote is kind of terrifying. More so when some of that code is still around from 10 years ago.

<figure class="post-image post-image-left">
  <a href="https://github.com/philnash/bitly/network/dependents?package_id=UGFja2FnZS05OTI5">
    <picture>
      <source type="image/webp" srcset="{% asset posts/bitly/dependents @path %}.webp">
      <img src="{% asset posts/bitly/dependents @path %}" alt="The Bitly gem dependents page. Currently listed 639 repos and 20 packages.">
    </picture>
  </a>
</figure>

## The first days of the Bitly Ruby gem

I started out in the web development industry as a front-end developer. I joined a company that built sites in Ruby on Rails and eventually worked my way from working with views to controllers, then models, background jobs, mailers. The whole application stack. At that point I believed myself to be a Rails developer. I had never written any plain Ruby though. In an effort to change this, I decided I was going to write and release a gem.

As luck would have it I liked working with APIs, was building a lot of social applications at work at the time and the era of Twitter's serious 140 characters and link shortening was upon us. [Bitly](https://bitly.com/) announced they were releasing a new API and I took this as a chance to write my first Ruby. I made my [first commit to the GitHub repo on 21st January 2009](https://github.com/philnash/bitly/commit/8e8acfb2b45549f0baa879d4d6f214b5d928a314).

It appears that the first commit included enough code to shorten a URL with the API. [The tests were not good](https://github.com/philnash/bitly/commit/8e8acfb2b45549f0baa879d4d6f214b5d928a314#diff-0b3b8751a9471d9c3210979572e0bf28). Five days later it had grown into something I deemed worth releasing. On the 26th January 2009 I released version 0.1.0 into the world.

On the 27th January 2009 [I released version 0.1.1](https://github.com/philnash/bitly/commit/d8464c54d05cb352955fa00cad8a1800d736da93) because I'd forgotten a dependency and version 0.1.0 just didn't work.

Notably these releases came before [Rubygems.org](https://rubygems.org/) existed. (Remember those days? Me neither.) You cannot find these early releases available there, but that's probably for the best!

## It takes on a quiet life of its own

The beauty of open source software is that when you put something out into the world and other people find it useful they will also contribute back. Over the course of 2009 I received contributions from 7 different developers improving and adding functionality to this code. In 2010 I released version 0.5.0 which had support for Bitly's version 3 API (no, I was not very good at semantic versioning back then).

For the next 8 years, the gem didn't need a lot more work. I guess it just worked for its users. There were some feature additions and bug fixes from those that used it. In total, over the life of the project so far, there have been 17 contributors other than me. The project has never been perfect, it was my first after all, but it did the job for plenty of people.

## Your code is not you

...but it's hard to remember that at times. The Bitly project has long been my most starred project on GitHub, it sits at the top of my pinned repositories on [my profile page](https://github.com/philnash/) and has the [highest number of downloads on rubygems.org](https://rubygems.org/profiles/philnash) of my own projects. I'm proud of it, but up until recently there was still code in that project from 2009. It always niggled at the back of my mind that, even though the gem worked, it wasn't a good representation of my ability to code.

For this reason I embarked on a rewrite of the gem from the ground up in 2018. It was hard to motivate myself to complete it though, in fact I didn't get much beyond the OAuth2 implementation. It turns out that replacing working code is not a good reason to rewrite things, even if you don't like the existing code. In my head I was torn between rebuilding this project with the experience of 10 more years writing Ruby against using my time for other things that were important to me. Mostly my time won out, but it didn't stop me thinking about it.

Then in 2019 Bitly introduced the 4th version of the API. While that meant the rewrite pivoted from re-implementing the version 3 API, it still didn't drive motivation. Further, Bitly announced they would be stopping support for the version 3 API on the 1st March 2020.

Eventually that got me going and I managed to put the work in to put together what has just been released as [version 2 of the Bitly Ruby gem](https://rubygems.org/gems/bitly/versions/2.0.0). I'm happier with the library I have put together this time, it is better written, better tested and better documented than ever before. It is once more a project I can be proud of and I hope that many more projects can happily integrate it for their link shortening requirements.

## The open source iceberg

There are many differences between a Ruby project like the [Bitly gem](https://rubygems.org/gems/bitly) and [Rails](https://rubygems.org/gems/rails), [Devise](https://rubygems.org/gems/devise), or even [Jekyll](https://rubygems.org/gems/jekyll). So many open source projects are driven by a single maintainer and rely on their time and attention. They aren't core to applications, but they make developers' lives easier. There's a lot of talk in the open source world about how to sustain the large projects that I think ignores the mildly popular projects. Much of that talk about sustainability focuses on making open source easier for under-represented developers to get into, open source shouldn't be the bastion of those with enough time and money to dedicate some of it to work on projects like this. But there are considerably more small projects than the flagship libraries and frameworks that can attract funding and those projects will continue to be built by those with expendable time and effort. I don't have any answers here, I just wanted to draw a little attention to the many, many open source projects in this position.

## I have more code to write

I feel very fortunate to be able to find time to work on projects that allow me to practice my craft and potentially make another developer's life easier. The Bitly gem was my first foray into the world of creating an open source project and it lives on today. [Bitly have removed their support for the version 3 API](https://support.bitly.com/hc/en-us/articles/360004395631-Migrating-from-v3-to-v4-of-the-Bitly-API) so there should be plenty of developers looking to upgrade their implementations or the libraries they depend on. Hopefully version 2 will suit them, maybe there will be more work in this gem for me yet.

The list on GitHub of repositories that depend on your repository is scary.