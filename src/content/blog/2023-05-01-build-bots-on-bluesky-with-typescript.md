---
title: "Build bots on Bluesky with Node.js and GitHub Actions"
tags:
  - bluesky
  - atproto
  - typescript
  - javascript
  - node
image: ../../assets/posts/bsky/beautiful-blue-sky.jpg
imageAlt: "A view of white clouds and a blue sky"
imageWidth: 1920
imageHeight: 600
socialImage: ../../assets/posts/bsky/beautiful-blue-sky-social.jpg
pubDate: "2023-05-16"
updatedDate: "2024-11-25"
---

[Bluesky](https://bsky.app/) is the new social network in town and it's an exciting place to explore right now. I was fortunate enough to get an invite early on and take part in the early community. But Bluesky is not just a Twitter clone, it's an application on top of [The AT Protocol](https://atproto.com/), a (still being built) federated protocol for social networks with some interesting properties.

Because there's a protocol, that also means there's an API. If you remember far enough back to the early days of Twitter, the API drove a lot of exciting applications and features for users. There was a swarm of activity around Twitter's API and now, even in the early days, there is a similar excitement about Bluesky's API. So let's look into how to get started with the API using TypeScript and build a bot that runs on a schedule using [GitHub Actions](https://docs.github.com/en/actions).

## What you will need

In order to build against the Bluesky API you will need an account. As I write this, accounts are invite only, but as the application and protocol stabilises, I expect there to me more available.

You will also need:

- [Node.js](https://nodejs.org/en) version 22
- A [GitHub](https://github.com/) account

## Getting started with the API

Let's write a quick script to post a status to Bluesky from JavaScript. In your terminal [create a new Node.js project](/blog/2019/01/10/how-to-start-a-node-js-project/):

```sh
mkdir bluesky-bot
cd bluesky-bot
npm init --yes
```

Add an `.nvmrc` file with the version 18.16.0 so that we can guarantee the Node.js version this will run on.

```sh
echo 22 > .nvmrc
```

Install the [AT Protocol/Bluesky API client](https://www.npmjs.com/package/@atproto/api):

```sh
npm install @atproto/api
```

This library gives us easy access to the Bluesky API, a rich text library for formatting links and mentions, and lower level access to the AT Protocol itself.

### Send your first Bluesky post

Create a file called `index.js` and open it in your editor.

Start by requiring the `AtpAgent` class from the package.

```js
const { AtpAgent } = require("@atproto/api");
```

Create an asynchronous function that will connect to the service and send a post. Within that function instantiate a new agent, setting the service to `"https://bsky.social"`, the only available AT Protocol service at the moment. Then log the agent in with your Bluesky identifier (your username) and an [app password](https://blueskyfeeds.com/en/faq-app-password). This is just a quick script to get going with, so we're just going to embed our credentials for now, in reality you want to keep credentials out of your code and load them through environment variables or similar.

```js
async function sendPost() {
  const agent = new AtpAgent({ service: "https://bsky.social" });
  await agent.login({
    identifier: "YOUR_IDENTIFIER_HERE",
    password: "YOUR_PASSWORD_HERE",
  });
  // ...
}
```

Once you've logged in, you can then use the agent to post a status.

```js
async function sendPost(text) {
  const agent = new AtpAgent({ service: "https://bsky.social" });
  await agent.login({
    identifier: "YOUR_IDENTIFIER_HERE",
    password: "YOUR_PASSWORD_HERE",
  });
  await agent.post({ text });
}
```

Now you can call the `sendPost` method with the text you want to send to the API:

```js
sendPost("Hello from the Bluesky API!");
```

Run this code in your terminal with `node index.js` and you will see your first post from the API on your Bluesky account.

### Sending posts with rich text

If you want to send links or mentions on the platform you can't just send plain text. Instead you need to send rich text, and the library provides a function to create that. Let's update the above code to generate rich text and use it to make a post.

First, require the `RichText` module.

```js
const { AtpAgent, RichText } = require("@atproto/api");
```

Then take the text you want to send and create a new `RichText` object with it. Use that object to detect the facets in the text, then pass both the text and the facets to the `post` method.

```js
async function sendPost(text) {
  const agent = new AtpAgent({ service: "https://bsky.social" });
  await agent.login({
    identifier: "YOUR_IDENTIFIER_HERE",
    password: "YOUR_PASSWORD_HERE",
  });
  const richText = new RichText({ text });
  await richText.detectFacets(agent);
  await agent.post({
    text: richText.text,
    facets: richText.facets,
  });
}
```

If you call the `sendPost` function with text that includes a user mention or a link, it will be correctly linked in Bluesky and notify the mentioned user.

```js
sendPost("Hello from the Bluesky API! Hi @philna.sh!");
```

That's the basics on creating posts using the Bluesky API. Now let's take a look at scheduling the posts.

## Scheduling with GitHub Actions

GitHub Actions lets you automate things in your repositories. This means we can use it to automate posting to Bluesky. One of the triggers for a GitHub Action is the [schedule](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule) which lets you run a workflow at specified times using cron syntax.

We can add a GitHub Actions workflow to this application that will start working when we push the repo up to GitHub. Before we do that, we should remove our credentials first. Update the code that logs in to the Bluesky service to use environment variables instead of hard coding the credentials:

```js
  await agent.login({
    identifier: process.env.BSKY_HANDLE,
    password: process.env.BSKY_PASSWORD,
  });
```

Next, create a directory called `.github` with a directory called `workflows` inside.

```sh
mkdir -p .github/workflows
```

Create a YAML file called `post.yml` and open it in your editor. Add the following:

```yaml
name: "Post to Bluesky"

on: workflow_dispatch

jobs:
  post:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version-file: ".nvmrc"
      - run: npm ci
      - name: Send post
        run: node index.js
        env:
          BSKY_HANDLE: ${{ secrets.BSKY_HANDLE }}
          BSKY_PASSWORD: ${{ secrets.BSKY_PASSWORD }}
```

This workflow file does a bunch of things. It sets up one job called post that will:

* run on the latest Ubuntu
* checkout the repository
* install the Node.js version listed in the `.nvmrc` file we created earlier
* install the dependencies
* run the `index.js` file, with two secrets added to the environment

In the workflow above the [`workflow_dispatch` trigger](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch) is present instead of the `schedule` trigger. The `workflow_dispatch` trigger allows you to start a workflow by visiting it in the GitHub UI and pressing a button. It's a great way to test your workflow is working without having to wait for the schedule or push a new commit.

Create a GitHub repo, and push all this code up to it. In the repo settings, find *Actions secrets and variables*. Add two secrets called `BSKY_HANDLE` and `BSKY_PASSWORD` which contain the credentials you were using earlier.

### Testing it out

With your code and secrets in place head to the *Actions* tab for your repo. Click on the workflow called "Post to Bluesky" and then find the button that says "Run workflow". This is the `workflow_dispatch` trigger and it will run the workflow, eventually running your code and posting to Bluesky. Use this to test out the workflow and any changes to the code before you eventually write the schedule.

### Scheduling the workflow

Once you are happy with your code and that the workflow is working it's time to set up a schedule. Remove the `workflow_dispatch` trigger and replace it with the `schedule` trigger, which looks like this:

```yaml
on:
  schedule:
    - cron: "30 5,17 * * *"
```

I don't read cron, but [crontab.guru](https://crontab.guru/#30_5,17_*_*_*) tells me that this would run the workflow at 5:30 and 17:30 every day. I recommend playing around with that tool to get your schedule correct.

Once you are happy, save, commit and push to GitHub and your Bluesky bot will set off posting.

## A template to make this easier

To make this easier, I [created a template](https://github.com/philnash/bsky-bot) that has all of the above ready to go for you. Hit the big green "Use this template" button on the repo and you will get your own project ready to go. All you need to do is [provide your own function](https://github.com/philnash/bsky-bot/blob/main/src/lib/getPostText.ts) that will return the text that will get posted to Bluesky. There are also instructions in the [README](https://github.com/philnash/bsky-bot#readme) to walk you through it all.

## My first bot

I've used this template repo to create my first bot on the Bluesky platform. It's a simple but fun one. It [posts an hourly dad joke to Bluesky](https://staging.bsky.app/profile/dadjokes.skybot.club) from the [icanhazdadjoke.com API](https://icanhazdadjoke.com/). You can find [the code for this bot on GitHub](https://github.com/philnash/phils-bsky-bots) too.

## Bluesky is going to be a lot of fun

When Twitter first started the availability of the API caused a wave of creativity from developers. Even though Bluesky remains in very early invite only mode there is already a [lot of things being built](https://github.com/beeman/awesome-atproto) and it is exciting to see.

I'm looking forward to creating bots with this method, but also exploring more of the API, data and protocol to see what can be achieved.

If you have an account with Bluesky, [come follow me here](https://staging.bsky.app/profile/philna.sh). See you in the sky!