---
title: "Build a contact form with Astro and Resend"
tags:
  - astro
  - resend
  - email
  - cloudflare
image: ../../assets/posts/astro-email.png
imageAlt: "An abstract image depicting content that is connected or related."
socialImage: ../../assets/posts/astro-email.png
imageWidth: 1500
imageHeight: 500
pubDate: "2026-09-21"
---

I try to keep my email address from appearing on public websites to avoid spam. But I do like people to be able to contact me if they have something I might be interested in. The solution for this? A contact form!

This site is mostly statically generated, but as it is currently built with [Astro](https://astro.build/) and hosted on [Cloudflare Workers](https://developers.cloudflare.com/workers/), I can designate an endpoint as dynamic, use it to accept a form submission, validate the data on the server, and send it to my email inbox using [Resend](https://resend.com/).

In this post, I'll show you how I built it.

## What it does

When you visit `/contact`, the Astro framework renders an HTML page with a form on it containing three inputs: the user's email address, a subject, and the message they want to send.

When the user fills in the form and submits it, the browser makes a `POST` request to the same URL, and the server-side code kicks in. It extracts the details from the form, validates the data, and uses the [Resend API to send a message](https://resend.com/docs/dashboard/emails/introduction) to my email address. If the user didn't include all the details, the page is rendered again with error messages and the existing content of the form so that they can correct the form and submit again.

For full disclosure, I currently work at Resend, but I [implemented the first version of this back in 2024](https://github.com/philnash/philna.sh/commits/main/src/pages/contact.astro). It's always nice when you go from a happy user of a service to working there.

Let's see how to build this.

## Start with the HTML

Astro pages are simple to build; they start with the component script, which is effectively TypeScript frontmatter for your template, and finish with the component template, made up of HTML and other Astro components.

I built my contact form as a page at the `/contact` route, so I started with a file at the `src/pages/contact.astro` path in my Astro app. The contact form then starts with the HTML:

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
    <input type="text" id="subject" name="subject" placeholder="Hi Phil!" required />
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

Setting the form's `method` to `"POST"` but not providing an `action` means that it will submit to the same route that rendered it.

My site is set to output as a static site, but you can enable [on-demand dynamic routes](https://docs.astro.build/en/guides/routing/#on-demand-dynamic-routes) and rather than prerender a static page, it will dynamically render pages and respond to `POST` requests. To do this, just add the following to the component script:

```astro
---
export const prerender = false;
---
```

If your Astro site is set to [server mode](https://docs.astro.build/en/guides/on-demand-rendering/#server-mode), this isn't required.

## Set up your secrets

To send emails with Resend you will need a [Resend account](https://resend.com/signup), a [domain verified with Resend](https://resend.com/docs/add-a-domain), and an [API key](https://resend.com/docs/create-an-api-key). With those sorted, add the API key, an email address you'll be using to send the email using the verified domain, and the email address you're sending it to (yours), to the `.env` file:

```sh
RESEND_API_KEY=
RESEND_TO_EMAIL=
RESEND_FROM_EMAIL=
```

You can then load and validate these variables in Astro config in `astro.config.mjs`.

```js
// astro.config.mjs
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
    validateSecrets: true,
  },
});
```

This is incredibly useful as this config both validates that the environment variables are present when you build or run the application and ensures that the server-side secrets aren't included in any bundled artifacts.

Return to the `src/pages/contact.astro` page. You can now import those environment variables from `astro/env:server`. Another bonus is that they will be correctly typed.

```astro
---
export const prerender = false;

import { RESEND_API_KEY, RESEND_TO_EMAIL, RESEND_FROM_EMAIL } from "astro:env/server"
---
```

## Prepare values and errors

For both `GET` and `POST` requests, the page renders the current field values in the HTML. It may also need to render validation errors or a success message. Let's set those up in `contact.astro`.

```astro
---
type ContactErrors = {
  email?: string[] | undefined;
  subject?: string[] | undefined;
  message?: string[] | undefined;
};

let errors: ContactErrors = {};
let email = "",
  subject = "",
  message = "",
  successMessage = "";
---
```

The page can be updated to show the success message if it is present or the form and any values or errors.

```astro
---
// Component script
---
{
  successMessage ? (
    <p>{successMessage}</p>
  ) : (
    <form method="POST">
      <div>
        <label for="email">Your email</label>
        {errors.email && errors.email.map((error) => (<p class="form-error">{error}</p>))}
        <input value={email} type="email" id="email" name="email" placeholder="you@domain.com" required />
      </div>
      <div>
        <label for="subject">Subject</label>
        {errors.subject && errors.subject.map((error) => (<p class="form-error">{error}</p>))}
        <input value={subject} type="text" id="subject" name="subject" placeholder="Hi Phil!" required />
      </div>
      <div>
        <label for="message">Message</label>
        {errors.message && errors.message.map((error) => (<p class="form-error">{error}</p>))}
        <textarea id="message" name="message" placeholder="Your message" required>
          {message}
        </textarea>
      </div>
      <div>
        <button type="submit">Send</button>
      </div>
    </form>
  )
}
```

## Verify the input

Next, we need to validate the submitted data. I chose to do this with [zod](https://zod.dev/), since it is already installed as part of Astro. Start by importing zod and defining two schemas.

```astro
---
import { z } from "astro/zod";

const normalizedFormSchema = z.object({
  email: z.string().trim().catch(""),
  subject: z.string().trim().catch(""),
  message: z.string().trim().catch(""),
});

const contactFormSchema = z.object({
  email: z.email({ message: "Please enter a valid email address" }).trim(),
  subject: z.string().trim().min(1, { message: "Please enter a subject" }),
  message: z.string().trim().min(1, { message: "Please enter a message" }),
});
```

Check to see if the request is a `POST` by checking `Astro.request.method`. If it is, commence the work of validating the input and sending the email.

I used two different zod schemas to help with parsing the submitted data. The `normalizedFormSchema` will always return an object containing `email`, `subject`, and `message` properties, defaulting each property to an empty string. The parsed values can be assigned to the default values for the `email`, `subject` and `message` that we set up earlier.

Parsing with the `contactFormSchema` does the real validation. If parsing succeeds then we have all the information required to send an email. If validation fails, we collect the errors using [zod's `flattenError` function](https://zod.dev/error-formatting?id=zflattenerror#zflattenerror) and pass them to the component to render.

```astro
---
if (Astro.request.method === "POST") {
  const data = await Astro.request.formData();
  const normalizedFormData = normalizedFormSchema.parse(
    Object.fromEntries(data),
  );
  ({ email, subject, message } = normalizedFormData);
  const contactFormData = contactFormSchema.safeParse(normalizedFormData);
  if (contactFormData.success) {
    // The data is correct, send the email
  } else {
    errors = z.flattenError(contactFormData.error).fieldErrors;
  }
}
```

## Hook up the Resend API

Now that the data is validated, we can send the email. It's easiest to send with Resend using the [Resend Node.js SDK](https://github.com/resend/resend-node):

```bash
npm install resend
```

Import the SDK at the top of `contact.astro`:

```astro
---
export const prerender = false;

import { RESEND_API_KEY, RESEND_TO_EMAIL, RESEND_FROM_EMAIL } from "astro:env/server";
import { Resend } from "resend";
```

Then, when the data has been parsed and validated correctly, create an instance of the Resend client and use it to send the email:

```astro
---
  // validate the data

  if (contactFormData.success) {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      to: RESEND_TO_EMAIL,
      from: RESEND_FROM_EMAIL,
      replyTo: contactFormData.data.email,
      subject: contactFormData.data.subject,
      text: contactFormData.data.message,
    });
    if (error) {
      throw new Error(`Failed to send contact email: ${error.message}`);
    }
    successMessage = "Thanks for your email, I'll get back to you soon!";
  } else {
    errors = z.flattenError(contactFormData.error).fieldErrors;
  }
---
```

Here we are using an email address on our own domain to send the email since we can't send on behalf of the user using the contact form. We set the user's email address as the `replyTo` property, so that when you hit reply in your email client, it goes back to them.

If Resend returns an error, we throw it so that Astro responds with a 500 status and our monitoring can alert us. Otherwise, we set `successMessage` and render the confirmation.

## Spam protection

I initially built my contact form like this to keep from publishing my email address on the public web and avoid getting picked up by spammers. While that worked, it did not stop another class of bots from finding the contact form and filling it out themselves. I was so excited when I got my first email from the form, and then it turned out to be spam anyway.

So, while this is how to set up a contact form using Astro, there is more work to do before you publish: you need to stop bots from abusing it. Ultimately, I put [Cloudflare's Turnstile](https://www.cloudflare.com/products/turnstile/) in place, though you might consider things like [Google's reCAPTCHA](https://developers.google.com/recaptcha) or [hCaptcha](https://www.hcaptcha.com/). In another post I'll share how I implemented Turnstile.

## Happy emailing

This is how to build a contact form with Astro and Resend. I like how Astro's pages allow you to do all of this in one file, and how sending the email with Resend is just a couple of lines of code.

Thankfully, once I'd shut down the bots, I've also received some really useful emails through this form.

I hope this is a helpful look at how to add just a touch of interactivity to an otherwise static site using Astro.
