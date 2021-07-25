---
layout: post
title: "Always install Bundler alongside Ruby with rbenv"
tags:
  - ruby
  - bundler
  - rbenv
image: posts/bundler
image_alt: "Two illustrations from the Bundler website. One signifies installing Ruby and the other Bundler itself."
image_width: 1920
image_height: 600
---

Here's a quick tip for anyone who uses [rbenv](https://github.com/rbenv/rbenv) and [ruby-build](https://github.com/rbenv/ruby-build) to manage installing and switching Ruby versions.

When installing a new version of Ruby I cannot think of a situation in which I wouldn't want [Bundler](http://bundler.io/) installed too. The good news is that you can get rbenv to install Bundler, or any other gem you like, as soon as you install a new version of Ruby. All you need is the [default-gems](https://github.com/rbenv/rbenv-default-gems) plugin.

## Default gems

If you installed rbenv with [Homebrew](https://brew.sh/), like me, then you can install default-gems with Homebrew too.

```bash
$ brew install rbenv-default-gems
```

Then you need to make a list of gems that you want installed. First create a file named `default-gems` in your `$(rbenv root)` directory. Mine is located at `~/.rbenv/default-gems`. Add the names of the gems you want to install, one per line. You can include an optional version or the option `--pre` for a prerelease version. For Bundler you will want the latest release, so the `default-gems` file would look like this:

```
bundler
```

Now when you install a new version of Ruby, Bundler will be installed as well.

<figure class="post-image post-image-outside">
  <picture>
    <source type="image/webp" srcset="{% asset posts/install_ruby_bundler @path %}.webp">
    {% asset posts/install_ruby_bundler alt="A terminal window shows the result of running `rbenv install 2.4.0`. Not only is Ruby 2.4.0 installed, but so is the latest version of Bundler." %}
  </picture>
</figure>

You can add other gems that you always use too. If you're a fan of [pry](http://pryrepl.org/), for example, then add a line for it in `default-gems` and you'll never have to remember to install it yourself.

## rbenv plugins

There are a number of [rbenv plugins](https://github.com/rbenv/rbenv/wiki/Plugins) which you can check out, but default-gems has always been a must have for me.

Are there any tools or plugins you use that make your Ruby development easier? I'd love to hear about them! Please [share your tips with me on Twitter](https://twitter.com).
