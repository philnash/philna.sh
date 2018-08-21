---
layout: post
title:  "Git commands to keep a fork up to date"
image: posts/git
image_alt: "The git logo"
tags:
  - git
  - vcs
  - github
scripts:
  - <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>
---

I've seen the following tweet about git making its way around Twitter recently:

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">I ❤️ Git. But honestly, it intimidated me for years. I thought I needed to understand all its powerful features to be productive. I found that&#39;s not the case. You can be quite productive in Git with around 6 commands: <br><br>branch<br>checkout<br>add<br>commit<br>pull<br>push</p>&mdash; Cory House 🏠 (@housecor) <a href="https://twitter.com/housecor/status/1031190760278970368?ref_src=twsrc%5Etfw">August 19, 2018</a></blockquote>

And it's true, you _can_ do most of your work with those commands.

What if you want to fork and contribute to an open source project on GitHub, GitLab or BitBucket though? You're going to need a few more commands so that you can keep your fork up to date, namely `remote`, `fetch` and `merge`. Let's see how they are used.

## Fork away

When you fork a project, you make a copy of it under your own namespace. To work with the project you then clone the repository to your own machine. Let's use a repo I have forked as an example: [Twilio's Node.js package](https://github.com/philnash/twilio-node). After forking, we clone the repo:

```bash
git clone git@github.com:philnash/twilio-node.git
```

We can now see the first use case for `remote`. Run `git remote` in the `twilio-node` directory and we see the following:

```bash
git remote
origin
```

OK, that's not too useful, it just shows we have one remote repo called "origin". Running it again with the `--verbose` flag shows a bit more information:

```bash
git remote --verbose
origin	git@github.com:philnash/twilio-node.git (fetch)
origin	git@github.com:philnash/twilio-node.git (push)
```

That's better, this shows that the remote repository is the one we cloned and that we can fetch from and push to it.

## Making changes

When contributing something back to the repo, it is easiest to do so on a branch. That keeps the master branch clean and makes it easy to keep up to date. Setting up your changes is covered by the six commands Cory listed in his tweet; you create a new branch with `branch`, `checkout` the branch, make the changes you want, `commit` as many times as necessary and finally `push` the branch to the origin, your fork. Then you can create your pull request and hope it gets accepted.

Sometime later down the line you find you want to make another pull request, but the original repo has moved on. You need to update your fork so that you're working with the latest code. You could delete your fork and go through the process of forking and cloning the repo again, but that's a lot of unnecessary work. Instead, add the upstream repository as another remote for the repo and work with it from the command line.

## Adding the upstream

To do this, we use the `remote` command again, this time to `add` a new remote. Find the original repo's URL and add it as a new remote. By convention this remote is called "upstream" though you can call it whatever you want.

```bash
git remote add upstream git@github.com:twilio/twilio-node.git
```

Now if we inspect the repo's remotes again, we will see both the origin and the upstream. You can use `-v` as a shortcut for `--verbose`.

```bash
git remote -v
origin	  git@github.com:philnash/twilio-node.git (fetch)
origin	  git@github.com:philnash/twilio-node.git (push)
upstream	git@github.com:twilio/twilio-node.git (fetch)
upstream	git@github.com:twilio/twilio-node.git (push)
```

## Fetching the latest

To bring the repo up to date, we can now `fetch` the latest from the upstream repo. It looks like this:

```bash
git fetch upstream
remote: Counting objects: 6427, done.
remote: Compressing objects: 100% (549/549), done.
remote: Total 6427 (delta 5156), reused 5105 (delta 4939), pack-reused 934
Receiving objects: 100% (6427/6427), 2.54 MiB | 1.28 MiB/s, done.
Resolving deltas: 100% (5399/5399), completed with 391 local objects.
From github.com:twilio/twilio-node
   6a6733a8..73656c50  master           -> upstream/master
```

`git fetch` downloads objects and refs from the repository, but doesn't apply it to the branch we are working on. We want to apply the updates to the master branch, so make sure it is checked out.

```bash
git checkout master
```

## Merging it all together

To bring the master branch up to date with the remote `merge` the remote's master branch into our own, like so:

```bash
git merge upstream/master
```

If you have kept your work off the master branch this will go ahead smoothly. Finally `push` these updates to the fork so that it is up to date too.

```bash
git push origin master
```

Now everything on the master branch of the fork is up to date. If you need to update a different branch, substitute the branch name master for the branch you are working with.

## Shortcuts

If you have been working with `git pull` then you may have already seen a potential shortcut. `pull` is the combination of `fetch` and `merge`, so to perform these two actions in one command you can run:

```bash
git pull upstream master
```

## Fork happy

That's all you need to know for keeping your fork up to date when contributing to open source. Add the upstream as a new `remote` repo, `fetch` the upstream repo and `merge` the branch you want to update.

For more detail on the various commands here, take a look at ["Working with Remotes" from the Pro Git book](https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes).

And remember, if you get stuck with something with git, check out [Oh shit, git!](http://ohshitgit.com/) for all your expletive based ways to save yourself.

Happy forking!