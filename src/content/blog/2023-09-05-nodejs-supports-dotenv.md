---
title: "Node.js includes built-in support for .env files"
tags:
  - typescript
  - javascript
  - node
  - dotenv
image: ../../assets/posts/node.png
imageAlt: "The Node.js logo"
imageWidth: 1920
imageHeight: 600
pubDate: "2023-09-05"
updatedDate: "2023-11-21"
---

With the [recent release of version 20.6.0](https://nodejs.org/en/blog/release/v20.6.0), Node.js now has built-in support for `.env` files. You can now load environment variables from a `.env` file into `process.env` in your Node.js application completely dependency-free.

Loading an `.env` file is now as simple as:

```sh
node --env-file .env
```

## What is .env?

`.env` files are used to configure environment variables that will be present within a running application. The idea comes from the [Twelve-Factor App methodology](https://12factor.net/), which says to [store everything that is likely to vary between deploys (e.g. dev, staging, production) in the environment](https://12factor.net/config).

Config should not be a part of your application code and should not be checked-in to version control. Things like API credentials, or other secrets, should be stored separately and loaded in the environment in which they are needed. A `.env` file lets you manage your config for applications where it isn't practical to set variables in the environment, like your development machine or <abbr title="continous integration">CI</abbr>.

There are libraries in many different languages that support using a `.env` file to load variables into the environment, they are usually called "dotenv", and the [Node.js dotenv](https://github.com/motdotla/dotenv) is no different. But now, Node.js itself supports this behaviour.

## How do you use .env in Node.js?

A `.env` file looks like this:

```ini
PASSWORD=supersecret
API_KEY=84de8263ccad4d3dabba0754e3c68b7a
# .env files can have comments too
```

By convention you would save this as `.env` in the root of your project, though you can call it whatever you want.

You can then set the variables in the file as environment variables by starting Node.js with the `--env-file` flag pointing to your `.env` file. When loaded, the variables are available as properties of `process.env`.

```sh
$ node --env-file .env
Welcome to Node.js v20.6.0.
Type ".help" for more information.
> console.log(process.env.PASSWORD)
supersecret
undefined
> console.log(process.env.API_KEY)
84de8263ccad4d3dabba0754e3c68b7a
undefined
```

### Supported features

Support right now is fairly basic compared to [dotenv](https://github.com/motdotla/dotenv). For example:

- You cannot currently use [multiline values](https://github.com/motdotla/dotenv#multiline-values)
- You cannot use [variable expansion](https://github.com/motdotla/dotenv-expand)

But, the feature is under active development. Since the 20.7.0 release, you can now specify multiple files. The variables from the last file will override any previous files.

```sh
node --env-file .env --env-file .env.development
```

There is more work to be done, and some of these features may be added. You can [follow the discussion on GitHub here](https://github.com/nodejs/node/issues/49148).

### Incorrect features

In the 20.6.0 release, [the documentation says](https://nodejs.org/dist/latest-v20.x/docs/api/cli.html#--env-fileconfig), "If the same variable is defined in the environment and in the file, the value from the environment takes precedence." This is the way that all dotenv packages work by default. However, that is not currently true of Node.js's implementation and variables in the `.env` file will override the environment.

This has been fixed as of version 20.7.0. Variables defined in the environment now take precedence over variables in a `.env` file.

### Benefits to Node.js's implementation

Even though this implementation is missing some features, it has some benefits over using a third-party package. Node.js loads and parses the `.env` file as it is starting up, so you can include [environment variables that configure Node.js itself](https://nodejs.org/dist/latest-v20.x/docs/api/cli.html#environment-variables), like [`NODE_OPTIONS`](https://nodejs.org/dist/latest-v20.x/docs/api/cli.html#node_optionsoptions).

So, you can have an `.env` file that looks like this:

```ini
NODE_OPTIONS="--no-warnings --inspect=127.0.0.1:9229"
```

Then, when you run `node --env-file=.env` the process will run without emitting warnings and it will activate the inspector on the IP address `127.0.0.1:9229`.

_Note: you cannot put `NODE_OPTIONS="--env-file .env` in your `.env` file. It is disallowed to avoid inifinite loops._

## Node.js just keeps improving

Go try out Node.js version 20.6.0! Version 20 has brought new features, like a [stable test runner](https://www.sonarsource.com/blog/node-js-test-runner/), [mock timers](https://nodejs.org/en/blog/release/v20.4.0), and now `.env` file support, as well as many other upgrades, fixes and improvements. [Version 20 becomes the active <abbr title="long term support">LTS</abbr> version of Node.js in October](https://github.com/nodejs/Release#release-schedule), so now is a good time to test these new features out and start considering upgrading your application to take advantage.
