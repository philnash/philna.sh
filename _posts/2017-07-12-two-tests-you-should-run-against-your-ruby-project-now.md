---
title: Two tests you should run against your Ruby project now
layout: post
tags:
  - ruby
  - security
  - licenses
  - copyright
image: /images/check-your-ruby-app.png
image_alt: "The Ruby logo next to the face screaming in fear emoji"
---

I had the fortune of attending the wonderful [Brighton Ruby conference](https://brightonruby.com/) last week. It was full of excellent advice, wisdom and code. There was one talk, however, that urged me to go home and do something straight away to ensure the security and usability of my projects.

[Andrew Nesbitt](https://twitter.com/teabass), with the backing of the [libraries.io open data](https://libraries.io/data), told tales of the hidden costs of open source software in Ruby and beyond. [His slides are available here](https://speakerdeck.com/andrew/can-my-friends-come-too) and I will link to the video when it is published.

## Counting the costs

There were two take aways from Andrew's talk that could be acted on immediately: check up on security vulnerabilities and license issues in my projects.

## Security audits

[Rubysec](https://rubysec.com/) maintains the [Ruby Advisory Database](https://github.com/rubysec/ruby-advisory-db), a database of vulnerable Ruby gems. The database currently contains 287 advisories across 147 gems. If you're worried that your project depends on a vulnerable gem they publish [bundler-audit](https://github.com/rubysec/bundler-audit), which is a gem that audits `Gemfile.lock`s against the their database.

To use bundler-audit you need to install it:

```bash
$ gem install bundler-audit
```

and run it in your project directory.

```bash
$ bundle-audit
No vulnerabilities found
```

### Second opinions

If one security audit isn't enough to quell your fears then you are in luck. While it isn't a Ruby tool and Andrew didn't mention it, [Snyk](https://snyk.io/) is a tool for monitoring vulnerabilities in Ruby, JavaScript and Java projects via their own [vulnerability database](https://snyk.io/vuln/).

They publish a [command line interface](https://snyk.io/docs/using-snyk) that you can use to check your applications. You do need to [create an account](https://snyk.io/signup) to use it and install Node.js and npm to run it. Once over those hurdles you can install and run it against your project like so:

```bash
# install
$ npm install -g snyk
# authenticate the client
$ snyk auth
# test the project in the current directory
$ snyk test
✓ Tested 23 dependencies for known vulnerabilities, no vulnerable paths found.
```

Now security has been checked, how about licenses?

## Licensing audits

Unlicensed code is copyrighted code that you do not have the permission to use.

This may not sound bad until you hear that _28% of all Ruby gems have no license declared_. That is over 37,000 gems. And you don't need to worry about just the gems that you install, but their dependencies. And their dependencies. And their... it goes on.

Thankfully there is a tool to check this too. [`license_finder` is maintained by Pivotal](https://github.com/pivotal/LicenseFinder/) and checks your dependencies for licenses. The tool reports back with each dependency's license. You then have to decide whether the license fits with your project. You can choose to accept each of your dependencies and you can bulk accept by whitelisting certain licenses. If you're not using Ruby, [`license_finder` works with many types of project](https://github.com/pivotal/LicenseFinder#supported-project-types).

You install `license_finder` with Ruby gems.

```bash
$ gem install license_finder
```

Then you run it within a project directory. This was the result when I ran it against [`envyable`](https://github.com/philnash/envyable):

```bash
$ license_finder
..............................................................................
Dependencies that need approval:
bundler, 1.12.5, MIT
codeclimate-test-reporter, 1.0.8, MIT
docile, 1.1.5, MIT
envyable, 1.2.0, MIT
minitest, 5.10.2, MIT
rake, 12.0.0, MIT
simplecov, 0.13.0, MIT
simplecov-html, 0.10.1, MIT
thor, 0.19.4, MIT
```

Then, when I whitelist the MIT license and run it again:

```bash
$ license_finder whitelist add MIT
$ license_finder
..............................................................................
All dependencies are approved for use
```

The licenses are approved.

## Test all the time

Whether there is a security vulnerability or an unlicensed project you could be subjecting yourself or your users to problems.

It doesn't take long to install and run these tools and I encourage you to do so too, they may save you from your dependencies. It takes a little longer, but it's probably worth it, to add them to your CI setup too.

To find out more look out for the video of Andrew's talk, check out [libraries.io](https://libraries.io/)'s list of [libraries without licenses](https://libraries.io/unlicensed-libraries) or even [take a dive into the data](https://libraries.io/data) and see what you can find out about our open source ecosystem.

