---
layout: post
title: "Implementing one time passwords in Crystal"
tags:
  - crystal
  - two factor authentication
  - security
image: posts/crystal
image_alt: "The Crystal language logo"
image_width: 1920
image_height: 600
---

[Crystal](https://crystal-lang.org/) is still a young language, there aren't a lot of libraries available yet. For some this could be offputting, but for others this is a chance to learn about a language and provide useful tools for those also starting to use it.

I've given a [number of talks](/speaking/history/) over time, some of which were about [two factor authentication](https://www.youtube.com/watch?v=WipxMQjssRE). A while back I took the opportunity to improve my knowledge and implement the [one time password algorithm](https://en.wikipedia.org/wiki/HMAC-based_One-time_Password_algorithm) in Crystal.

This lead me to build the [CrOTP library for one time passwords in Crystal](https://github.com/philnash/crotp).

If you want to check out the code, most of the important implementation can be found in the [`CrOTP::OTP` module](https://github.com/philnash/crotp/blob/master/src/crotp/otp.cr). The [`CrOTP::HOTP`](https://github.com/philnash/crotp/blob/master/src/crotp/hotp.cr) and [`CrOTP::TOTP`](https://github.com/philnash/crotp/blob/master/src/crotp/totp.cr) classes take care of the different ways the counter is treated.

## Using CrOTP

To use the CrOTP library in your own Crystal project you need to add it to the dependencies in your `shard.yml` file.

```yaml
dependencies:
  crotp:
    github: philnash/crotp
```

Then install the dependencies with `shards install`.

Now you can `require "crotp"` and use it in your application. Most uses on the web of one time passwords are time based tokens for two factor authentication. Here's how to generate and verify time based OTPs.

### Getting started

First require the library and generate a random string to use as the secret.

```ruby
require "crotp"

secret = Random.new.hex(16)
```

Then create an instance of the `CrOTP::TOTP` class with that secret.

```ruby
totp = CrOTP::TOTP.new(secret)
```

### Sharing secrets

You can generate a URI that can be shared with authenticator apps like [Authy](https://authy.com/) or Google Authenticator. To do so call `authenticator_uri` with the name of your app as the issuer and the user account's username as the user.

```ruby
totp.authenticator_uri(issuer: "Test app", user: "philnash@example.com")
```

Turn the resulting URI into a QR code and users can scan it to add the account to their app.

### Generating and verifying

Now you can use the `totp` object to generate a new one time password that will be valid within the current 30 second period of time.

```ruby
password = totp.generate
```

To verify a code, you can use the same object, calling `verify` instead.

```ruby
totp.verify(password)
```

You can also allow a drift, to give users more time to enter their code. The drift is the number of periods (periods are 30 seconds long by default) that can pass after the token was generated.

```ruby
totp.verify(password, at: Time.now, allowed_drift: 2)
```

There are [more examples in the project repo](https://github.com/philnash/crotp/blob/master/example/crotp.cr).

## There's more work to be done

[CrOTP](https://github.com/philnash/crotp) does the basic work for generating and verifying one time passwords. Of course, there's more [to do on the project](https://github.com/philnash/crotp#todo) when I find the time.

I'd love to hear if this project is useful to you or if you're interested in helping implement the missing features. Let me know on Twitter at [@philnash](https://twitter.com/philnash).