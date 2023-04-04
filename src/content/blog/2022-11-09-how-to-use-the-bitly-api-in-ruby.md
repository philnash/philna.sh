---
title: "How to use the Bitly API in Ruby"
tags:
  - ruby
  - bitly
  - api
image: /posts/bitly/bitly-rubygem.png
socialImage: /posts/bitly/bitly-rubygem-social.png
imageAlt: "How to use the Bitly API in Ruby"
imageWidth: 1920
imageHeight: 600
pubDate: "2022-11-09"
---

Link shortening has been around for a long time and [Bitly](https://bitly.com/) is arguably the king of the link shorteners. It has support for shortening long URLs as well as custom short links, custom domains, and metrics to track how each link is performing.

For those of us with the power of code at our fingertips, [Bitly also has an API](https://dev.bitly.com/). With the Bitly API you can build all of the functionality of Bitly into your own applications and expose it to your users. In this post you'll learn how to use the [Bitly Ruby gem](https://rubygems.org/gems/bitly) to use the Bitly API in your Ruby applications.

## Getting started

To start shortening or expanding links with the Bitly gem, you'll need [Ruby installed](https://www.ruby-lang.org/en/downloads/) and a [Bitly account](https://bitly.com/pages/pricing).

To make API requests against the Bitly API you will need an access token. Log in to your Bitly account and head to the [API settings](https://app.bitly.com/settings/api/). Here you can enter your account password and generate a new token. This token will only be shown once, so copy it now.

## Using the Bitly API

Open a terminal and install the Bitly gem:

```shell
gem install bitly
```

Let's explore the gem in the terminal. Open an `irb` session:

```shell
irb
```

Require the gem:

```ruby
require "bitly"
```

Create an authenticated API client using the token you created in your Bitly account:

```ruby
client = Bitly::API::Client.new(
  token: "Enter your access token here"
)
```

### Shortening a URL

You can now use this `client` object to access all the Bitly APIs. For example, you can shorten a URL to a Bitlink like this:

```ruby
long_url = "https://twitter.com/philnash"
bitlink = client.shorten(long_url: long_url)
bitlink.link
# => "https://bit.ly/3zYdN21"
```

The [shorten endpoint](https://dev.bitly.com/api-reference/#createBitlink) is a simplified method of shortening a URL. You can also use the [create endpoint](https://dev.bitly.com/api-reference/#createBitlink) and set other attributes, like adding a title, tags or deeplinks into native applications.

```ruby
long_url = "https://twitter.com/philnash"
bitlink = client.create_bitlink(
  long_url: long_url,
  title: "Phil Nash on Twitter",
  tags: ["social media", "worth following"]
)
bitlink.link
# => "https://bit.ly/3zYdN21"
bitlink.title
# => "Phil Nash on Twitter"
```

### Expanding a URL

The API client can also be used to expand Bitlinks. You can use the `expand` method with any Bitlink, not just ones that you have shortened yourself. When you expand a URL you will get back publicly available information about the URL.

```ruby
bitlink = client.expand(bitlink: "bit.ly/3zYdN21")
bitlink.long_url
# => "https://twitter.com/philnash"
bitlink.title
# => nil
# (title is not public information)
```

If the URL was a Bitlink from your own account you get more detailed information when you use the `bitlink` method.

```ruby
bitlink = client.bitlink(bitlink: "bit.ly/3zYdN21")
bitlink.long_url
# => "https://twitter.com/philnash"
bitlink.title
# => "Phil Nash on Twitter"
```

### Other Bitlink methods

Once you have a `bitlink` object, you can call other methods on it. If you wanted to update the information about the link, for example, you can use the `update` method:

```ruby
bitlink.update(title: "Phil Nash on Twitter. Go follow him")
bitlink.title
# => "Phil Nash on Twitter. Go follow him"
```

You can also fetch metrics for your link, including the [`clicks_summary`](https://dev.bitly.com/api-reference/#getClicksSummaryForBitlink), [`link_clicks`](https://dev.bitly.com/api-reference/#getClicksForBitlink) and [`click_metrics_by_country`](https://dev.bitly.com/api-reference/#getMetricsForBitlinkByCountries). For example:

```ruby
click_summary = bitlink.clicks_summary
click_summary.total_clicks
# => 1
# (not very popular yet)
```

Methods that return a list of metrics implement `Enumerable` so you can loop through them using `each`:

```ruby
country_clicks = bitlink.click_metrics_by_country
country_clicks.each do |metric|
  puts "#{metric.value}: #{metric.clicks}"
end
# => AU: 1
# (it was just me clicking it)
```

With these methods, you can create or fetch short links and then retrieve metrics about them. Your application can shorten links and measure their impact with a few lines of code.

## There's more!

For advanced uses, you can also [authorise other Bitly accounts to create and fetch short links via OAuth2](https://github.com/philnash/bitly/blob/main/docs/authentication.md) as well as manage your account's [users](https://github.com/philnash/bitly/blob/main/docs/users.md), [groups](https://github.com/philnash/bitly/blob/main/docs/groups.md), and [organisations](https://github.com/philnash/bitly/blob/main/docs/organizations.md).

## A useful little tool

To find out more about using the Bitly API with Ruby, you can read the [Bitly API documentation](https://dev.bitly.com/), the [Bitly gem's generated documentation](https://www.rubydoc.info/gems/bitly/) and the [docs in the GitHub repo](https://github.com/philnash/bitly/tree/main/docs).

If you are interested, you can also read a bit more about the [backstory of the Bitly Ruby gem](/blog/2020/03/17/the-story-of-a-midly-popular-ruby-gem/). I've been working on this project since 2009, would you believe?

Are you using the Bitly API or do you have any feedback or feature requests? Let me know on [Twitter at @philnash](https://twitter.com/philnash) or [open an issue in the repo](https://github.com/philnash/bitly/issues).