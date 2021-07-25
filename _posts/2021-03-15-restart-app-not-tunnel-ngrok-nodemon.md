---
layout: post
title: "Restart your app and not your tunnel with ngrok and nodemon"
tags:
  - node.js
  - ngrok
  - nodemon
  - webdev
image: posts/nodemon-ngrok
image_alt: "The logos for nodemon and ngrok"
image_width: 1920
image_height: 960
---

When I am developing web applications in Node.js, I like the server to restart when I make changes, so I use [nodemon](https://nodemon.io/). When I am developing an application that consumes [webhooks](https://www.twilio.com/docs/glossary/what-is-a-webhook) or that I want to share publicly, [I use ngrok](https://www.twilio.com/blog/2015/09/6-awesome-reasons-to-use-ngrok-when-testing-webhooks.html). In fact, I like ngrok so much, I volunteered to help maintain the [Node.js wrapper for ngrok](https://github.com/bubenshchykov/ngrok/).

Now, you can run ngrok and nodemon separately and things work fine. But what if you always want to run them together and you want just one command to do that. Since nodemon is a Node package and ngrok has a Node wrapper, we can do this. Here's how.

## An example with a basic Express app

You might already have an application you want to do with this, but for the purposes of the post, let's create an example [Express](https://expressjs.com/) application. We can create a basic application with the [Express generator](https://expressjs.com/en/starter/generator.html) like this:

```bash
npx express-generator test-app
cd test-app
npm install
```

Start the application with:

```bash
npm start
```

Open your browswer to `localhost:3000` and you will see the welcome page. You can also open `localhost:3000/users` and it will say "respond with a resource". Open `routes/users.js` and change the route from:

```javascript
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
```

to:

```javascript
router.get('/', function(req, res, next) {
  res.send('respond with a list of users');
});
```

Refresh `localhost:3000/users` and you will see it still returns "respond with a resource". Stop the application, restart it with `npm start`, and when you reload the page it will have changed. We can make this better with nodemon.

## Starting the app with nodemon

To start the application with nodemon, you first need to install the package:

```bash
npm install nodemon --save-dev
```

You can then run the application by opening `package.json` and changing the start script from `"start": "node ./bin/www"` to `"start": "nodemon ./bin/www"`. This works great and your application now restarts when you make changes.

## Adding ngrok to the mix

This all works great with nodemon on its own, but now we want to give the application a public URL while we are developing it. We can use ngrok for this and we can build it in using the [ngrok Node package](https://github.com/bubenshchykov/ngrok). Start by installing ngrok:

```bash
npm install ngrok --save-dev
```

Now, we could add ngrok to the `./bin/www` script that the Express generator created for us. But if you do this, then every time you change something, nodemon will restart the application and your ngrok tunnel. If you're using a free or unregistered ngrok account then your ngrok URL will keep changing on every restart. Instead, let's build a script that starts an ngrok tunnel and then uses nodemon to run the application script `./bin/www`.

Create a new file in the `bin` directoy called `./bin/dev`. You might need to make this file executable with `chmod 755 ./bin/dev`. Open it in your editor.

Start by adding a [shebang](https://en.wikipedia.org/wiki/Shebang_(Unix)) for Node. We'll also add in a protection to make sure this script isn't run in production.

```javascript
#!/usr/bin/env node

if (process.env.NODE_ENV === "production") {
  console.error(
    "Do not use nodemon in production, run bin/www directly instead."
  );
  process.exitCode = 1;
  return;
}
```

In this case, if the environment variable `NODE_ENV` is set to production the script will just return early.

Next, require the ngrok and nodemon packages.

```javascript
const ngrok = require("ngrok");
const nodemon = require("nodemon");
```

Use ngrok to open up a tunnel connecting to a port 3000 on localhost, the port that Express uses. To open the tunnel we call on the [`connect` method of ngrok](https://github.com/bubenshchykov/ngrok#connect) which returns a promise that resolves with the URL of the ngrok tunnel.

```javascript
ngrok
  .connect({
    proto: "http",
    addr: "3000",
  })
  .then(url => {
    console.log(url);
  })
```

You can run this in the terminal with `./bin/dev`, you will see an ngrok URL logged. So now we have started the ngrok tunnel, but we aren't yet running the Node application.

Let's make the logging a bit nicer and then move on to starting the application with nodemon.

```javascript
ngrok
  .connect({
    proto: "http",
    addr: "3000",
  })
  .then(url => {
    console.log(`ngrok tunnel opened at: ${url}`);
    console.log("Open the ngrok dashboard at: https://localhost:4040\n");

    nodemon({
      script: "./bin/www",
      exec: `NGROK_URL=${url} node`,
    });
  })
```

Here we call on nodemon and pass two arguments via an object. The `script` is the file we want to run to start the application, in this case `./bin/www`. The `exec` option tells nodemon what script to execute to run the script. We set the `NGROK_URL` environment variable to the URL that ngrok created for us so that we can refer to the ngrok URL within the application if we need it. Then the rest of the `exec` command is `node`.

Start the application with `./bin/dev` and you will see the application start up. You can load it at `localhost:3000` or at the ngrok URL that is logged. You will also find that if you change the response in `routes/users.js` then it will update on the next refresh. Now you have ngrok and nodemon working together.

### Finessing the script

This is working now, but there are a couple more things we can do to improve the script. We can listen to events on nodemon to give us more information about what is happening to the application and when the underlying application quits, we should close the ngrok tunnel too. We should also catch any errors that might happen to ngrok when connecting a tunnel. Here's the full script:

```javascript
#!/usr/bin/env node

if (process.env.NODE_ENV === "production") {
  console.error(
    "Do not use nodemon in production, run bin/www directly instead."
  );
  process.exitCode = 1;
  return;
}

const ngrok = require("ngrok");
const nodemon = require("nodemon");

ngrok
  .connect({
    proto: "http",
    addr: "3000",
  })
  .then((url) => {
    console.log(`ngrok tunnel opened at: ${url}`);
    console.log("Open the ngrok dashboard at: https://localhost:4040\n");

    nodemon({
      script: "./bin/www",
      exec: `NGROK_URL=${url} node`,
    }).on("start", () => {
      console.log("The application has started");
    }).on("restart", files => {
      console.group("Application restarted due to:")
      files.forEach(file => console.log(file));
      console.groupEnd();
    }).on("quit", () => {
      console.log("The application has quit, closing ngrok tunnel");
      ngrok.kill().then(() => process.exit(0));
    });
  })
  .catch((error) => {
    console.error("Error opening ngrok tunnel: ", error);
    process.exitCode = 1;
  });
```

Go back to `package.json` change the `start` script back to `node ./bin/www` and add a new script to run the application in dev mode:

```json
  "scripts": {
    "start": "node ./bin/www",
    "dev": "node ./bin/dev"
  },
```

Now you can start your application with `npm run dev` and it will use nodemon to restart on file changes and open an ngrok tunnel which doesn't change when the application restarts.

<figure>
  <picture>
    <source type="image/webp" srcset="{% asset posts/nodemon-ngrok-working-together @path %}.webp">
    {% asset posts/nodemon-ngrok-working-together alt='A terminal window showing the application running with both nodemon and ngrok. The logs show that some pages have been visited, then one of the routes changed and the app was reloaded.' %}
  </picture>
</figure>


## Nodemon and ngrok working in tandem

You can adjust the script above to work for any of your applications. Indeed, aside from needing Node to run the nodemon and ngrok packages, you could use this for any application you are building. For more details, check out the [nodemon documentation](https://github.com/remy/nodemon#nodemon) and the [ngrok documentation](https://github.com/bubenshchykov/ngrok#ngrok).

If you are a VS Code user and you prefer having ngrok at the tip of your command prompt, take a look at my [ngrok for VS Code plugin](https://marketplace.visualstudio.com/items?itemName=philnash.ngrok-for-vscode).

The script in this post was inspired by [Santiago Palladino's version](https://gist.github.com/spalladino/45a6e54d7942ac0bad64dd54d7d12467) which I brought up to date and added usage instructions. Thanks to Santiago, [Alex Bubenshchykov](https://github.com/bubenshchykov), the author of the ngrok Node package, [Remy Sharp](https://remysharp.com/), the author of nodemon, and [Alan Shreve](https://inconshreveable.com/), the creator of ngrok, all for making this possible.