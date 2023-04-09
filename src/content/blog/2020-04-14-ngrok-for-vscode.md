---
title: "I built a VSCode extension: ngrok for VSCode"
tags:
  - vscode
  - ngrok
  - showdev
image: ../../assets/posts/ngrok-for-vscode/nfv-header.png
imageAlt: "ngrok for VSCode"
imageWidth: 1920
imageHeight: 600
pubDate: "2020-04-14"
---

Over the Easter weekend, a four day weekend characterised by lockdowns all over the world, I decided to use the extra time I had at home to start a new project and learn a new skill. By the end of the weekend I was proud to release my first VSCode extension: [_ngrok for VSCode_](https://marketplace.visualstudio.com/items?itemName=philnash.ngrok-for-vscode).

## What's that now?

[ngrok](https://ngrok.com/) is a command line tool built by [Alan Shreve](https://github.com/inconshreveable) that you can use to expose your localhost server with a publicly available URL. It's great for sharing access to an application running on your own machine, testing web applications on mobile devices or testing webhook integrations. For example, [I'm a big fan of using ngrok to test my webhooks](https://www.twilio.com/blog/2015/09/6-awesome-reasons-to-use-ngrok-when-testing-webhooks.html) when I am working with Twilio applications.

[VSCode](https://code.visualstudio.com/) is my current favourite text editor, built by Microsoft and based on JavaScript (well, [mostly TypeScript](https://github.com/microsoft/vscode)).

As I was using VSCode last week I wondered if there was an extension that made it easier to use ngrok. I had a search and found [one under development](https://github.com/WassimBenzarti/Ngrok-connect) and one [that started a web server as well as running ngrok](https://github.com/ceyhunkeklik/vscode-ngrok-client). So I decided to build the extension I wanted to see in the marketplace.

## What does it do?

With version 1 of the extension you can start an ngrok tunnel with either a port number or by choosing one of your named tunnels from your [ngrok config file](https://ngrok.com/docs#config). There is one available setting, where you can set a custom path to a config file.

Once a tunnel is running you can then open [the ngrok dashboard](https://ngrok.com/docs#getting-started-inspect) or close the tunnel.

All the commands are available from the VSCode command palette.

It's simple so far, but I wanted to keep the scope small and get it released.

<figure>
  <img src="/posts/ngrok-for-vscode/start.png" alt="An animation showing using the extension from the VSCode command palette." loading="lazy">
</figure>

The code is all open source and [you can find it on GitHub](https://github.com/philnash/ngrok-for-vscode).

## What's next?

I would love for you to try the extension out, especially if you are already an ngrok user. If it's useful then I am looking for feedback, [bug reports and feature requests](https://github.com/philnash/ngrok-for-vscode/issues) so I can continue to improve it.

One idea I have already is to provide a [Status Bar Item](https://code.visualstudio.com/api/references/vscode-api#StatusBarItem) or [Tree View](https://code.visualstudio.com/api/extension-guides/tree-view) that can give more information on and control over currently running ngrok tunnels. I should probably work out how to write tests for the extension too.

## What do you think?

I really am after feedback, so [please install _ngrok for VSCode_](https://marketplace.visualstudio.com/items?itemName=philnash.ngrok-for-vscode) and let me know what you think [on Twitter](https://twitter.com/philnash) or via a [review on the VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=philnash.ngrok-for-vscode&ssr=false#review-details).
