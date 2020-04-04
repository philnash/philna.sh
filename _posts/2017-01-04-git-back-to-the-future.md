---
layout: post
title:  "Git back to the future"
image: posts/git
image_alt: "The git logo"
tags:
  - git
  - vcs
---

Git may be the best version control software I've used but it is a complex beast and makes it easy to shoot yourself in the foot. Recently, however, I learned of one way that you can unshoot yourself and potentially save yourself hours of lost work.

<figure class="post-image post-image-left"><a href="https://www.xkcd.com/1597/"><img src="https://imgs.xkcd.com/comics/git.png" alt="XKCD's take on Git, in brief it is about memorising a bunch of commands to use and deleting everything if you mess up."></a></figure>

`git reset` is useful when you've done something wrong. You can turn back the clock and undo commits.

`git reset --soft HEAD~1` undoes one commit and leaves the work from that commit still present in the working directory.

`git reset --hard HEAD~1` removes the commit and all the work.

The difference between the `--soft` and `--hard` flag is one of those ways you can shoot yourself in the foot. I know I've mixed the two up and lost work. Or so I thought.

## Enter the reflog

It turns out that git is watching us closer than we may think. When we make changes to any branch, git stores those changes in the reflog. Even if we were to remove a whole bunch of work by resetting with the `--hard` flag, git still knows about the commits we had made and we can recover them. The key is that the commits still exist, there just aren't any branches that currently point to them. This is where the reflog comes into play. It has a log of all commits made in the repo, as well as other actions, and we can use it to recover these lost commits.

### Warning!

Before I show you how this works, please note the following. If you have uncommitted changes in the working directory and you use `git reset --hard` no amount of fancy git knowledge about the reflog is going to get that back. The following will save only work that you have committed. Be warned!

## How to use the reflog to recover lost commits

Here's an example, I have a repo with one commit. Running `git log --oneline` and `git reflog` both show the commit has the hash `2daf3ba`.

<figure class="post-image post-image-outside">
  <picture>
    <source type="image/webp" srcset="{% asset posts/reflog1 @path %}.webp">
    <img src="{% asset posts/reflog1 @path %}" alt="Both log and reflog show the same initial commit.">
  </picture>
</figure>

Now we make a commit, something important of course.

<figure class="post-image post-image-outside">
  <picture>
    <source type="image/webp" srcset="{% asset posts/reflog2 @path %}.webp">
    <img src="{% asset posts/reflog2 @path %}" alt="Making an important commit adds another entry to both the log and the reflog.">
  </picture>
</figure>

What happens if we `git reset --hard HEAD~1`?

<figure class="post-image post-image-outside">
  <picture>
    <source type="image/webp" srcset="{% asset posts/reflog3 @path %}.webp">
    <img src="{% asset posts/reflog3 @path %}" alt="When we hard reset the branch the log shows only our first commit, but the reflog shows everything.">
  </picture>
</figure>

`git log` shows only one commit, but `git reflog` shows three actions; two commits and one reset. Note how the reset points to the same hash as the original commit. So, how do we get back to the last state before we reset? We can reset again.

<figure class="post-image post-image-outside">
  <picture>
    <source type="image/webp" srcset="{% asset posts/reflog4 @path %}.webp">
    <img src="{% asset posts/reflog4 @path %}" alt="We can reset the branch using the hash of the lost commit, the log then shows both our original commits.">
  </picture>
</figure>

This time we reset using the hash of our lost commit. You can always reset using hashes, in fact `HEAD~1` is really just a reference to a hash. What does the reflog look like now?

<figure class="post-image post-image-outside">
  <picture>
    <source type="image/webp" srcset="{% asset posts/reflog5 @path %}.webp">
    <img src="{% asset posts/reflog5 @path %}" alt="The reflog now shows the four actions that were taken; two commits and then two resets.">
  </picture>
</figure>

The reflog now shows the four actions that we took; two commits and then two resets. Now we have reset the branch to the state we were in before, no work has been lost, breathe a sigh of relief.

## May you never lose your work again

The git reflog keeps a track of everything we get up to with git. As with most things in git once you learn about the feature you can use it to your advantage. Knowing I have this trick up my sleeve has made me more confident using git.

I'd like to thank [Steve Smith](https://twitter.com/tarkasteve) for the talk he gave at [Codemotion Berlin](http://berlin2016.codemotionworld.com/) where I learned this trick. There is an [audio recording of his talk available](https://voicerepublic.com/talks/knowledge-is-power) and a much [more detailed article about git refs and the reflog on Atlassian's tutorial site](https://www.atlassian.com/git/tutorials/refs-and-the-reflog/the-reflog).

If you need more tips for escaping from nightmare git scenarios, check out [Oh shit, git!](http://ohshitgit.com/) a collection of git tips from [Katie Sylor-Miller](https://twitter.com/ksylor). She calls the reflog a magic time machine, I certainly agree and hopefully now you do too.

<footer>
  <small>Git logo by <a href="https://twitter.com/jasonlong">Jason Long</a>.</small>
</footer>
