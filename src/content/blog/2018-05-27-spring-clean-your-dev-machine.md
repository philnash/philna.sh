---
title: "Spring clean your dev machine"
tags:
  - maintenance
  - ruby
  - node
  - docker
image: /posts/spring-clean-header.png
imageAlt: " "
imageWidth: 1920
imageHeight: 600
pubDate: "2018-05-27"
---

Development machines can build up such a lot of cruft. Old versions, oudated programs and unused caches litter the hard drive. It's good to take time once in a while to clean all of this up and free up some space.

Here are some tips for commands you can run or actions you can take to clean up your machine. If you have a tip that I'm missing here, please share it with me on [Twitter](https://twitter.com/philnash).

## Homebrew

If you're using [Homebrew](https://brew.sh/) to manage packages on macOS you can run `brew cleanup` to remove old versions of packages and old downloads from the cache.

```bash
$ brew cleanup
Removing: ...
...
==> This operation has freed approximately 6.9GB of disk space.
```

Using the `-s` flag scrubs the downloads for the latest package versions from the cache to give you back even more space. Thanks to [David Guyon](https://twitter.com/DavidGuyon) for that [tip](https://twitter.com/DavidGuyon/status/995038050341281792).

To really turn it up to the max, [Daniel Miller](https://twitter.com/dalanmiller) [suggested a bash alias](https://twitter.com/dalanmiller/status/994729616077082624) to update Homebrew, upgrade packages and then cleanup after yourself. Add the following to your `.bash_profile`:

```bash
alias bu="brew update && brew upgrade && brew cleanup"
```

Then run the commands with:

```bash
bu
```

Everything should be up to date and leave no mess behind!

### Homebrew bonus

Once all the caches have been tidied up, take a moment to make sure Homebrew  itself is running smoothly. Run the following command for a list of actions you can take to tidy up your install.

```bash
brew doctor
```

## Docker

A few gigabytes of packages is a pretty good, but can we do better? If you're using [Docker](https://www.docker.com/) you can clean things up with:

```bash
$ docker volume prune
...
Total reclaimed space: 40.77GB
```

I am not a big Docker user myself, this was [a tip from Jack Wearden](https://twitter.com/JackWeirdy/status/991637143612215296).

## Rubies

I install multiple versions of Ruby using [rbenv](https://github.com/rbenv/rbenv) and [ruby-build](https://github.com/rbenv/ruby-build). I just checked the versions I have installed and I found 12 Rubies that are beyond end of life. Since they also have their gems installed alongside them, clearing them out saved me tens to hundreds of megabytes per Ruby version.

You can check the versions you have installed with:

```bash
rbenv versions
```

You can then uninstall an unwanted version of Ruby with:

```bash
rbenv uninstall 2.1.0
```

## Nodes

I also use [nvm](https://github.com/creationix/nvm) to manage multiple versions of Node.js. The drill is the same here as with Ruby. Find the old Node versions that you have hanging around with:

```bash
nvm ls
```

Then uninstall with:

```bash
nvm uninstall v6.9.2
```

## Any other ideas?

That should clear up a bunch of space on your machine, it sure did on mine. Now you have more room for more installs, more containers and more versions of more languages!

I'd love to collect any other tips that you might have to keep a development machine running smooth and lean. Let me know how you spring clean your development machine on Twitter at [@philnash](https://twitter.com/philnash).

<footer>
  <small>Dust icon by <a href="https://thenounproject.com/smalllike/collection/cleaning/?i=1683969">Smalllike from the Noun Project</a></small>
</footer>