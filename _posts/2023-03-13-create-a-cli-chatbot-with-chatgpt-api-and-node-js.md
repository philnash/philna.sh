---
layout: post
title: "Create a CLI Chatbot with the ChatGPT API and Node.js"
tags: openai, chatgpt, javascript, node
image: posts/chatgpt/openai-node
image_alt: "The OpenAI logo and the Node.js API"
image_width: 1920
image_height: 600
social_image: posts/chatgpt/openai-node-social
---

ChatGPT has taken the world by storm and this week [OpenAI released the ChatGPT API](https://openai.com/blog/introducing-chatgpt-and-whisper-apis). I've spent some time playing with [ChatGPT in the browser](https://chat.openai.com/chat), but the best way to really get on board with these new capabilities is to try building something with it. With the API available, now is that time.

This was inspired by [Greg Baugues's implementation of a chatbot command line interface (CLI) in 16 lines of Python](https://www.haihai.ai/chatgpt-api/). I thought I'd start by trying to build the same chatbot but using JavaScript.

_(It turns out that [Ricky Robinett also had this idea and published his bot code here](https://www.haihai.ai/chatgpt-api-js/), it's pleasing to see how similar the implementations are!)_

## The code

It turns out that Node.js requires a bit more code to deal with command line input than Python, so where Greg's version was 16 lines mine takes 31. Having built this little bot, I'm no less excited about the potential for building with this API though.

Here's the full code, I'll explain what it is doing further down.

```javascript
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output, env } from "node:process";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({ apiKey: env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);
const readline = createInterface({ input, output });

const chatbotType = await readline.question(
  "What type of chatbot would you like to create? "
);
const messages = [{ role: "system", content: chatbotType }];
let userInput = await readline.question("Say hello to your new assistant.\n\n");

while (userInput !== ".exit") {
  messages.push({ role: "user", content: userInput });
  try {
    const response = await openai.createChatCompletion({
      messages,
      model: "gpt-3.5-turbo",
    });

    const botMessage = response.data.choices[0].message;
    if (botMessage) {
      messages.push(botMessage);
      userInput = await readline.question("\n" + botMessage.content + "\n\n");
    } else {
      userInput = await readline.question("\nNo response, try asking again\n");
    }
  } catch (error) {
    console.log(error.message);
    userInput = await readline.question("\nSomething went wrong, try asking again\n");
  }
}

readline.close();
```

When you run this code it looks like this:

<figure class="post-image post-image-left">
  {% asset posts/chatgpt/chatgpt alt="An example of the chatbot running. I ask it to respond in haiku and it does twice." loading="lazy" %}
</figure>

Let's dig into how it works and how you can build your own.

## Building a chatbot

You will need an [OpenAI platform account](https://platform.openai.com/overview) to interact with the ChatGPT API. Once you have signed up, [create an API key](https://platform.openai.com/account/api-keys) from your account dashboard.

As long as you have Node.js installed, the only other thing you'll need is the [`openai` Node.js module](https://www.npmjs.com/package/openai).

Let's start a Node.js project and create this CLI application. First create a directory for the project, change into it and initialise it with npm:

```bash
mkdir chatgpt-cli
cd chatgpt-cli
npm init --yes
```

Install the `openai` module as a dependency:

```bash
npm install openai
```

Open `package.json` and add the key `"type": "module"` to the configuration, so we can build this as an ES module which will allow us to use [top level await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await#top_level_await).

Create a file called `index.js` and open it in your editor.

### Interacting with the OpenAI API

There are two parts to the code, dealing with input and output on the command line and dealing with the OpenAI API. Let's start by looking at how the API works.

First we import two objects from the `openai` module, the `Configuration` and `OpenAIApi`. The `Configuration` class will be used to create a configuration that holds the API key, you can then use that configuration to create an `OpenAIApi` client.

```javascript
import { env } from "node:process";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({ apiKey: env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);
```

In this case, we'll store the API key in the environment and read it with `env.OPENAI_API_KEY`.

To interact with the API we now use the OpenAI client to create chat completions for us. OpenAI's text generating models don't actually converse with you, but are built to take input and come up with plausible sounding text that would follow that input, [a completion](https://platform.openai.com/docs/guides/completion/introduction). With ChatGPT, [the model is configured to receive a list of messages and then come up with a completion for the conversation](https://platform.openai.com/docs/guides/chat/introduction). Messages in this system can come from one of 3 different entities, the "system", "user" and "assistant". The "assistant" is ChatGPT itself, the "user" is the person interacting and the system allows the program (or the user, as we'll see in this example) to provide instructions that define how the assistant behaves. Changing the system prompts for how the assistant behaves is one of the most interesting things to play around with and allows you to create different types of assistants.

With our `openai` object configured as above, we can create messages to send to an assistant and request a response like this:

```javascript
const messages = [
  { role: "system", content: "You are a helpful assistant" },
  { role: "user", content: "Can you suggest somewhere to eat in the centre of London?" }
];
const response = await openai.createChatCompletion({
  messages,
  model: "gpt-3.5-turbo",
});
console.log(response.data.choices[0].message);
// => "Of course! London is known for its diverse and delicious food scene..."
```

As the conversation goes on, we can add the user's questions and assistant's responses to the messages array, which we send with each request. That gives the bot history of the conversation, context for which it can build further answers on.

To create the CLI, we just need to hook this up to user input in the terminal.

### Interacting with the terminal

Node.js provides the [Readline module](https://nodejs.org/api/readline.html) which makes it easy to receive input and write output to streams. To work with the terminal, those streams will be `stdin` and `stdout`.

We can import `stdin` and `stdout` from the `node:process` module, renaming them to `input` and `output` to make them easier to use with Readline. We also import the `createInterface` function from `node:readline`

```javascript
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
```

We then pass the `input` and `output` streams to `createInterface` and that gives us an object we can use to write to the output and read from the input, all with the [`question` function](https://nodejs.org/api/readline.html#rlquestionquery-options):

```javascript
const readline = createInterface({ input, output });

const chatbotType = await readline.question(
  "What type of chatbot would you like to create? "
);
```

The above code hooks up the input and output stream. The `readline` object is then used to post the question to the output and return a promise. When the user replies by writing into the terminal and pressing return, the promise resolves with the text that the user wrote.

### Completing the CLI

With both of those parts, we can write all of the code. Create a new file called `index.js` and enter the code below.

We start with the imports we described above:

```javascript
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output, env } from "node:process";
import { Configuration, OpenAIApi } from "openai";
```

Then we initialise the API client and the Readline module:

```javascript
const configuration = new Configuration({ apiKey: env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);
const readline = createInterface({ input, output });
```

Next, we ask the first question of the user: "What type of chatbot would you like to create?". We will use the answer of this to create a "service" message in a new array of messages that we will continue to add to as the conversation goes on.

```javascript
const chatbotType = await readline.question(
  "What type of chatbot would you like to create? "
);
const messages = [{ role: "system", content: chatbotType }];
```

We then prompt the user to start interacting with the chatbot and start a loop that says while the user input is not equal to the string ".exit" keep sending that input to the API. If the user enters ".exit" the program will end, like in the Node.js REPL.

```javascript
let userInput = await readline.question("Say hello to your new assistant.\n\n");

while (userInput !== ".exit") {
  // loop
}

readline.close();
```

Inside the loop we add the `userInput` to the messages array as a "user" message. Then, within a try/catch block, send it to the OpenAI API. We set the model as "gpt-3.5-turbo" which is the underlying name for ChatGPT.

When we get a response from the API we get the message out of the `response.data.choices` array. If there is a message we store it as an "assistant" message in the array of messages and output it to the user, waiting for their input again using readline. If there is no message in the response from the API, we alert the user and wait for further user input. Finally, if there is an error making a request to the API we catch the error, log the message and tell the user to try again.

```javascript
while (userInput !== ".exit") {
  messages.push({ role: "user", content: userInput });
  try {
    const response = await openai.createChatCompletion({
      messages,
      model: "gpt-3.5-turbo",
    });

    const botMessage = response.data.choices[0].message;
    if (botMessage) {
      messages.push(botMessage);
      userInput = await readline.question("\n" + botMessage.content + "\n\n");
    } else {
      userInput = await readline.question("\nNo response, try asking again\n");
    }
  } catch (error) {
    console.log(error.message);
    userInput = await readline.question(
      "\nSomething went wrong, try asking again\n"
    );
  }
}
```

Put that all together and you have your assistant. The full code is at the top of this post or [on GitHub](https://github.com/philnash/asst/blob/basic-asst/index.js).

You can now run the assistant by passing it your OpenAI API key as an environment on the command line:

```bash
OPENAI_API_KEY=YOUR_API_KEY node index.js
```

This will start your interaction with the assistant, starting with it asking what kind of assistant you want. Once you've declared that, you can start chatting with it.

## Experimenting helps us to understand

Personally, I'm not actually sure how useful ChatGPT is. It is clearly impressive, its ability to return text that reads as if it was written by a human is incredible. However, it returns content that is not necessarily correct, regardless of how confidently it presents that content.

Experimenting with ChatGPT is the only way that we can try to understand what it useful for, thus building a simple chat bot likes this gives us grounds for that experiment. Learning that the system commands can give the bot different personalities and make it respond in different ways is very interesting.

You might have heard, for example, that you can ask ChatGPT to help you with programming, but you could also specify a JSON structure and effectively use it as an API as well. But as you experiment with that you will likely find that it should not be an information API, but more likely something you can use to understand your natural text and turn it into a JSON object. To me this is exciting as it means that ChatGPT could help create more natural voice assistants, that can translate meaning from speech better than the existing crop that expect commands to be given in a more exact manner. I still have experimenting to do with this idea, and having this tool gives me that opportunity.

## This is just the beginning

If experimenting with this technology is the important thing for us to understand what we can build with it and what we should or should not build with it, then making it easier to experiment is the next goal. My next goal is to expamnd this tool so that it can save, interact with and edit multiple assistants so that you can continue to work with them and improve them over time.

In the meantime, you can check out [the full code for this first assistant in GitHub](https://github.com/philnash/asst/tree/basic-asst), follow the repo to keep up with improvements.