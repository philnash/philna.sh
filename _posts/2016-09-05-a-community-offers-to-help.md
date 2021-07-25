---
layout: post
title:  "A community offers to help"
tags:
  - ruby
  - community
image: posts/thank-you
image_alt: "The Ruby logo and the text 'Thank you'"
image_width: 1920
image_height: 450
scripts:
  - <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>
---

Last week I was blown away by the response to a problem I was experiencing from maintainers of two of the larger open source projects in the Ruby world. And not just your average large Ruby projects, but implementations of Ruby itself.

I had [trouble running the tests](https://travis-ci.org/philnash/envyable/builds/156080057) for [envyable](https://github.com/philnash/envyable), my [gem to manage environment variables in your projects](https://www.twilio.com/blog/2015/02/managing-development-environment-variables-across-multiple-ruby-applications.html), on Rubinius on TravisCI. After installing the version of Rubinius locally, I couldn't reproduce the issue. So I tweeted.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Anyone seen this error on <a href="https://twitter.com/travisci">@travisci</a> with <a href="https://twitter.com/codeclimate">@codeclimate</a> coverage on <a href="https://twitter.com/rubinius">@rubinius</a>? <a href="https://t.co/fydiHoElCa">https://t.co/fydiHoElCa</a>. I can&#39;t repro locally and am confused.</p>&mdash; Phil Nash (@philnash) <a href="https://twitter.com/philnash/status/770542433901969409">August 30, 2016</a></blockquote>

Not only did [Brian Shirai](https://twitter.com/brixen), maintainer of [Rubinius](http://rubinius.com/), reach out to suggest some ideas for how to fix it. He also [forked the project and tried to get it working himself](https://github.com/rubinius/envyable/commit/fe574af226021f278b36f77278de3ad57768d7b2).

<blockquote class="twitter-tweet" data-conversation="none" data-lang="en"><p lang="en" dir="ltr"><a href="https://twitter.com/philnash">@philnash</a> you&#39;re using an ancient version 3.29. Ensure you&#39;re using Trusty distro and &#39;rbx&#39; in .travis.yml <a href="https://twitter.com/travisci">@travisci</a> <a href="https://twitter.com/codeclimate">@codeclimate</a></p>&mdash; Rubinius (@rubinius) <a href="https://twitter.com/rubinius/status/770647800514093056">August 30, 2016</a></blockquote>

But that wasn't all. I followed his advice but eventually had to settle with moving Rubinius to the allowed failures list in my TravisCI config. I'm still working with the TravisCI support team to try to fix the issue. We're getting there as it turns out [TravisCI was looking in the wrong place for the latest Rubinius binaries](https://github.com/travis-ci/travis-rubies/commit/308d29198f0eeec87bf10d9110eb1df45c7dbb13). That issue is fixed but I am now getting [timeouts for my builds](https://travis-ci.org/philnash/envyable/builds/157463309).

This affected [JRuby](http://jruby.org/) too and when I mentioned that on Twitter, [Charles Nutter](https://twitter.com/headius) from the JRuby core team also offered to help out if it was a JRuby bug.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr"><a href="https://twitter.com/philnash">@philnash</a> <a href="https://twitter.com/travisci">@travisci</a> <a href="https://twitter.com/rubinius">@rubinius</a> That JRuby failure looks like a timeout installing the base gemset in rvm. Happy to help if it is a JRuby bug.</p>&mdash; Charles Nutter (@headius) <a href="https://twitter.com/headius/status/770792465955557376">August 31, 2016</a></blockquote>

My project is not the biggest or the most important Ruby project. Not by a long way. The issues are also likely not with Rubinius or JRuby. But the willingness for Brian and Charles to reach out to help was amazing. I'm sure they are very busy people and just the response was appreciated.

## Thank you

So thank you Brian and thank you Charles. Thank you for your work in the Ruby community and thank you specifically for offering your help to me. Acts like this maintain my belief in the power and the strength of the Ruby community.
