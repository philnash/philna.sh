---
layout: post
title:  "Creating an asset pipeline with Jekyll-Assets"
tags:
  - jekyll
  - assets
---

When I started again on this site, I wanted to make sure it was going to load fast. [Performance matters](https://twitter.com/search?q=%23perfmatters).

Bundling, minifying and caching the static assets was high on the priority list. The site is built on [Jekyll](http://jekyllrb.com/) so I went looking for (and ultimately found) a plugin that would perform the following:

* Bundle static files together
* Minify the resulting files
* Generate a hash of the content of the file as the production filename ([the Rails documentation has a good explanation of this fingerprinting technique](http://guides.rubyonrails.org/asset_pipeline.html#what-is-fingerprinting-and-why-should-i-care-questionmark))

## Can't Jekyll do this?

Jekyll 3 can handle the bundling and minification of CSS. In fact, Jekyll comes with [Sass](http://sass-lang.com/) included which actually does the heavy lifting.

When you start a new Jekyll site, you will find a `css` directory with a `main.css` file present. That file then uses Sass imports to require other files from the `_sass` directory.

That's bundling handled already, how about minification? It takes one config update to enable that too. Add the following to your `_config.yml` file:

{% highlight yaml %}
sass:
  style: compressed
{% endhighlight %}

## Jekyll-Assets for all the features

If you're hosting a Jekyll site on [GitHub Pages](https://pages.github.com/) this is as good as it gets. You can't install other Jekyll plugins and GitHub handles the caching headers for your static files.

But what if you have your own server and want more control? What if you want those fingerprints so that you can set your own cache headers far into the future? What if you want to provide your own transpilers, processors or minifiers?

Those are the features I wanted. So I did a bit of research and found [Jekyll-Assets](https://jekyll.github.io/jekyll-assets/). It's a pretty powerful plugin, with lots of features for optimising assets. Here's how you can get started using it.

## Getting started with Jekyll-Assets

Let's set up Jekyll-Assets for a Jekyll site. First up, we need to install the jekyll-assets gem. Add it to the `Gemfile`:

{% highlight ruby %}
gem "jekyll-assets"
{% endhighlight %}

and install with `bundle install`. Then add it to the `_config.yml` file.

{% highlight yaml %}
gems:
  - jekyll-paginate
  - jekyll-assets
{% endhighlight %}

Jekyll-Assets comes with a comprehensive [default config](https://github.com/jekyll/jekyll-assets/wiki/Configuration#development-defaults) to make it quick to get started, so we don't need to change that right now. We do need to move a couple of files about though.

As we saw earlier, Jekyll comes with a `css` directory containing a `main.css` file and then a `_sass` directory with a few Sass imports. We want to move them all to the `_assets/css` directory.

{% highlight bash %}
$ mkdir -p _assets/css
$ mv css/main.css _assets/css
$ mv _sass/* _assets/css
{% endhighlight %}

Jekyll includes some empty [front matter](https://jekyllrb.com/docs/frontmatter/) in `main.css`. We need to get rid of that too.

{% highlight css %}
---
# Only the main Sass file needs front matter (the dashes are enough)
---
@charset "utf-8";
{% endhighlight %}

It may _say_ that the main Sass file needs front matter but with Jekyll-Assets that is no longer the case.

### Fixing up the HTML

The CSS is now no longer where the layout thinks it should be. We need to update the `_includes/head.html` to point to our new CSS file. As we are going to be generating unique filenames for our assets in production we need to use the Jekyll-Assets supplied liquid tags to fill them in.

Open up `_includes/head.html` and replace the existing `<link>` with:

```
{{ "{% css main " }}%}
```

If you want to see the filename digests working a quick config change is all you need. Open up `_config.yml` and add:

{% highlight yaml %}
assets:
  digest: true
{% endhighlight %}

Start the Jekyll development server with `bundle exec jekyll serve` and open up [http://localhost:4000](http://localhost:4000). The site will be displaying as you expect and if you view source you will see the generated `<link>` tag looking a little like this:

{% highlight html %}
<link type="text/css" rel="stylesheet" href="/assets/main-daf4744048a36abfd0aae160e2f7c309c4ae468f16d65e77d89c70fc8d7ba6ec.css">
{% endhighlight %}

Our digests are working! You can turn this off in development mode, Jekyll-Assets will generate digests, as well as bundle and minify, by default in production mode.

### Other assets

If you want other assets to get the Jekyll-Assets treatment, all you need to do is move them to their respective directory in `_assets` and refer to them using the relevant [liquid tags](https://jekyll.github.io/jekyll-assets/#tags). The default available directories include `_assets/images` and `_assets/js`.

### On the server

The entire purpose of adding Jekyll-Assets to my site was to set cache headers way into the future so that browsers can cache the assets as aggressively as they can. The easiest part of this turned out to be adding the config to my web server. I'm using nginx and all I needed was:

```
server {
  # other config

  location /assets/ {
    expires 1y;
    add_header Cache-Control "public";
  }

  # ...
}
```

## Bundled, minified, digested, cached

Using the Jekyll-Assets gem and a bit of nginx config I optimised the static assets on this site. There are loads more options for the gem including integrations with Babel for ES2015, CSS Autoprefixer and Image Magick for image optimisation. It is worth exploring [the code](https://github.com/jekyll/jekyll-assets) and the [documentation](https://jekyll.github.io/jekyll-assets/) to see what else can be achieved.

Now my assets are nicely optimised it's more fun to run [WebPageTest](http://www.webpagetest.org/) against the site. Looks like I better start looking into CDN options now. Thankfully Jekyll-Assets supports those too.

*[CDN]: Content Delivery Network
*[CSS]: Cascading Style Sheets
*[ES2015]: ECMAScript 2015
*[HTML]: Hypertext Markup Language
