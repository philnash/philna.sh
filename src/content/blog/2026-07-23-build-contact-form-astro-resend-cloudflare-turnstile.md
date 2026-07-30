---
title: "Build a contact form with Astro, Resend and Cloudflare Turnstile"
tags:
  - astro
  - resend
  - email
  - cloudflare
image: ../../assets/posts/related/astro-related-posts.jpg
imageAlt: "An abstract image depicting content that is connected or related."
socialImage: ../../assets/posts/related/astro-related-posts-social.webp
imageWidth: 1500
imageHeight: 500
pubDate: "2026-07-23"
---

I try to keep my email address from appearing on public websites to avoid spam. But I do like people to be able to contact me if they have something I might be interested in. The solution for this? A contact form!

This site is mostly statically generated, but since it is currently built with [Astro](https://astro.build/) and hosted on [Cloudflare Workers](https://developers.cloudflare.com/workers/) I can designate some of the endpoints as dynamic and perform server-side processing. So I used this to build myself a contact form using [Resend](https://resend.com/) to send the emails and [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) to protect me from bots.

You can see the final result on GitHub by checking out [the source code to my contact form here](https://github.com/philnash/philna.sh/blob/main/src/pages/contact.astro).

In this post I'll share how I built this contact form so that you can use some, all, or none of the ideas for your own.

## What it does

I'll start by describing the full functionality of the contact form. It begins by rendering an HTML page with a form on it containing three inputs; one for the user's email, a subject and the message they want to send. The page also loads the Cloudflare Turnstile JavaScript, which runs some invisible tests to check whether the user is a human or a bot.

When I first deployed the contact form, I didn't employ any protection from bots and subsequently received a bunch of emails that were automated and spammy. Cloudflare Turnstile stopped all of that and I consider it vital for bot protection.

When the user fills in the form and submits it, the browser makes a `POST` request to the same URL, and the server-side code kicks in. It extracts the details from the form, as well as the response from Turnstile. It validates that Turnstile thought the user was a person, and if all the email fields are present uses the Resend API to send a message to my email address. If Turnstile deemed the user to be a bot, they just receive the success page without sending the email. If the user didn't include all the details, the page is rendered again with error messages and the existing content of the form so that they can correct the details.

Let's see how that was built.

## Start with the HTML

Astro pages are simple to build; they start with the component script, which is effectively TypeScript frontmatter for your template, and finish with the component template, made up of HTML and other Astro components.

I wanted to build my contact form as a page at the `/contact` route, so I started with a file at the `src/pages/contact.astro` path in my Astro app. The contact form then starts with the HTML:

```astro
---
// Component script
---
<form method="POST">
  <div>
    <label for="email">Your email</label>
    <input type="email" id="email" name="email" placeholder="you@domain.com" required />
  </div>
  <div>
    <label for="subject">Subject</label>
    <input type="text" id="subject" name="subject" placeholder="Hi Phil! 👋" required />
  </div>
  <div>
    <label for="message">Message</label>
    <textarea id="message" name="message" placeholder="Your message" required></textarea>
  </div>
  <div>
    <button type="submit">Send</button>
  </div>
</form>
```

Setting the form's `method` to `"POST"` but not providing an `action` means that it will submit to the same route that rendered it. My site is set to output as a static site. To ensure that this route can respond to `POST` requests, as well as `GET` requests, turn on on-demand dynamic routing. To do this, just add the following to the component script:

```astro
---
export const prerender = false;
---
```

If the site is set to server-side rendering mode, this isn't required.

## Hook up the Resend API

To get the form to send emails we can now set up Resend. You'll need a [Resend account](https://resend.com/signup), a [domain verified with Resend](https://resend.com/docs/add-a-domain), and an [API key](https://resend.com/docs/create-an-api-key). With those sorted, add the API key, an email address you'll be using to send the email (using the verified domain), and the email address you're sending it to (yours), to the `.env` file:

```sh
RESEND_API_KEY=
RESEND_TO_EMAIL=
RESEND_FROM_EMAIL=
```

You can then load and validate these variables in Astro config in `astro.config.mjs`.

```js
import { defineConfig, envField } from "astro/config";

export default defineConfig({
  env: {
    schema: {
      RESEND_API_KEY: envField.string({ context: "server", access: "secret" }),
      RESEND_TO_EMAIL: envField.string({ context: "server", access: "secret" }),
      RESEND_FROM_EMAIL: envField.string({
        context: "server",
        access: "secret",
      }),
    },
  },
});
```

This config validates that the environment variables are present and then ensures that the server-side secrets aren't included in any bundled artifacts.
