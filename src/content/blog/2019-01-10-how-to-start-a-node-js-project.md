---
title: "How to start a Node.js project"
tags:
  - node
  - javascript
  - open source
image: ../../assets/posts/node.png
imageAlt: "The Node.js logo"
imageWidth: 1920
imageHeight: 600
scripts:
  - <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
pubDate: "2019-01-10"
---

Sometimes I write blog posts to remind myself what I've learned and sometimes I write them because someone else shares something and I want to remember that better. This post is one of the latter.

## Starting a Node.js project

Usually when I start a new Node.js project I use `npm` to generate my initial project.

```bash
npm init
```

`npm` then asks me some questions and builds a `package.json` file for me. Then I start building the project.

Later I inevitably copy and paste a `.gitignore` file from GitHub's useful repo of `.gitignore` templates. And if I remember I'll actually create a `LICENSE` file with the open source license that I intended to use.

This is not efficient.

Then this week I saw [Tierney Cyren](https://twitter.com/bitandbang) tweet this:

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">How to start any new Node.js project:<br><br>$ npx license mit &gt; LICENSE<br>$ npx gitignore node<br>$ npx covgen YOUR_EMAIL_ADDRESS<br>$ npm init -y<br><br>You&#39;re ready to start coding.</p>&mdash; Tierney Cyren (@bitandbang) <a href="https://twitter.com/bitandbang/status/1082331715471925250?ref_src=twsrc%5Etfw">January 7, 2019</a></blockquote>

These four commands do everything that I was doing manually and more, setting up a project for success right from the start.

* `npx license mit` uses the [license package](https://www.npmjs.com/package/license) to download a license of choice, in this case the [MIT license](https://opensource.org/licenses/MIT)
* `npx gitignore node` uses the [gitignore package](https://www.npmjs.com/package/gitignore) to automatically download the relevant `.gitignore` file from [GitHub's repo](https://github.com/github/gitignore)
* `npx covgen` uses the [covgen package](https://www.npmjs.com/package/covgen) to generate the [Contributor Covenant](https://www.contributor-covenant.org/) and give your project a code of conduct that will be welcoming to all contributors

_If you've not seen [`npx`](https://www.npmjs.com/package/npx) before it looks locally to see if there is a command to run and executes it, if there is no local command it will try to download, install the command from `npm`, and run it. This is really useful when generating new projects and saves you from globally installing a bunch of `npm` packages that are only used in this setup mode._

* `npm init -y` accepts all of the default options that `npm init` asks you about

Tierney also suggested customising your `npm init` defaults so that the output of `npm init -y` is correct.

## Customising `npm init`

You can see your current `npm` config by entering `npm config list` on the command line. To just see the config that affects `npm init` you can `grep` for "init":

```bash
npm config list | grep init
```

There are a number of defaults you can set; author name, author email, author url, the license, and the version. To set them, you can enter them on the command line or use `npm config edit` to open up the config file in your text editor. The command line is easy enough though, you can set all five defaults like so:

```bash
npm set init.author.name "Your name"
npm set init.author.email "your@email.com"
npm set init.author.url "https://your-url.com"
npm set init.license "MIT"
npm set init.version "1.0.0"
```

Once you have that customised to your liking, `npm init -y` will always produce the right settings.

## Building your own init script

There are some improvements that I'd make to Tierney's commands, though I appreciate they were constrained by Twitter. Here's a bash script I have come up with inspired by their tweet.

```bash
function node-project {
  git init
  npx license $(npm get init.license) -o "$(npm get init.author.name)" > LICENSE
  npx gitignore node
  npx covgen "$(npm get init.author.email)"
  npm init -y
  git add -A
  git commit -m "Initial commit"
}
```

To the original I've added fetching the license type, the author name and email from the `npm init` defaults. I've also initialised a new git repository and committed the results of this script as the "Initial commit".

You can take this function and add it to your `~/.bash_profile`. Then, either `source ~/.bash_profile` or open a new command line window and run `node-project`. Feel free to add or remove other bits as you see fit to create your perfect initialisation script.

## Go start a project

Now you have the perfect script to start a Node.js project why not go create a new one? I have a few small projects in mind that I plan to build this year and this is a nice basis to start from.

If you have any more suggestions to improve the script, let me know on [Twitter at @philnash](https://twitter.com). Happy open sourcing!