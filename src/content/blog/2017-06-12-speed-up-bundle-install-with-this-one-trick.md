---
title: "Speed up bundle install with this one trick"
tags:
  - ruby
  - bundler
image: /posts/bundler.png
imageAlt: "Two illustrations from the Bundler website. One signifies installing a Ruby gem and the other Bundler itself."
imageWidth: 1920
imageHeight: 600
pubDate: "2017-06-12"
---

Did you know [bundler](https://bundler.io) can download and install gems in parallel?

That's right, using the `--jobs` option for `bundle install` means you can set the number of gems that can download and install at the same time. To use four jobs, for example, you can run:

```bash
bundle install --jobs=4
```

As a bonus, you don't even have to remember to use the `--jobs` option every time. You can set this in your global bundler config with this command:

```bash
bundle config --global jobs 4
```

## Does it really help?

I found all of this out recently, even though this has been available since bundler version 1.4.0, and I wanted to test how useful it actually was. Downloading and installing gems in parallel sounds like a delight, but I needed to test it with something to be sure.

I went looking for a large Rails project to try this out on. I happened upon the [GitLab Community Edition app](https://gitlab.com/gitlab-org/gitlab-ce/) and cloned the project. I didn't need to actually get the project running, I was just testing the installation time of the gems.

I was looking for a large application. `rake stats` told me that it contains 172 controllers, 208 models and 86,019 lines of code. In the Gemfile there are 197 gem dependencies which shakes out to 369 gems in total. I checked out [Discourse](https://github.com/discourse/discourse) and [Diaspora](https://github.com/diaspora/diaspora) too, but GitLab certainly had the largest number of gems, so it was perfect to test my theory.

I ran `time bundle install --path=./gems --quiet --force --jobs=n` five times each for n equal to 1 and 4. The median results for each were:

```
time bundle install --path=./gems --quiet --force --jobs=1
real  4m39.836s
user  1m59.692s
sys 0m50.291s
```

```
time bundle install --path=./gems --quiet --force --jobs=4
real  2m55.857s
user  2m0.005s
sys 0m47.897s
```

These tests were run on a MacBook Pro with 2.5 GHz Intel Core i7 and 16GB RAM.

With these results we can see that installing the gems for GitLab in parallel using 4 workers was ~1.6 times faster.

You should run your own tests with your own setup to see if this genuinely will save you time with installing gems. There has been [some research](http://archlever.blogspot.co.uk/2013/09/lies-damned-lies-and-truths-backed-by.html) into the [best number of jobs](http://blog.mroth.info/blog/2014/10/02/rubygems-bundler-they-took-our-jobs/). I've certainly set the default number of jobs to 4 for the future.

### Why isn't this default?

You might be wondering why Bundler doesn't just turn on parallel installation by default. A quick glance at the comments in the [source code](https://github.com/bundler/bundler/blob/7f1411cdb3279c25e8e8f2a8e3c1f8acf3dbe8f2/lib/bundler/installer.rb#L160-L163) gives this one away.

```ruby
# the order that the resolver provides is significant, since
# dependencies might affect the installation of a gem.
# that said, it's a rare situation (other than rake), and parallel
# installation is SO MUCH FASTER. so we let people opt in.
```

## Reading the docs

As a final point, I'd like to point out that reading the documentation, even for a project you may use every day, can turn up some interesting options you didn't know you could use. Bundler itself is full of other useful commands and options, check out [`bundle pristine`](https://bundler.io/v1.15/man/bundle-pristine.1.html), [`bundle gem`](https://bundler.io/v1.15/man/bundle-gem.1.html) and [`bundle outdated`](https://bundler.io/v1.15/man/bundle-outdated.1.html) for some ideas of what is available.

So, keep an eye out for interesting options in the software you use and go out there and install your gems faster.
