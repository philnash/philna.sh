---
title: "Better two factor authentication experiences with WebOTP"
tags:
  - web
  - javascript
  - security
  - user experience
image: ../../assets/posts/webotp/webotp-better-experiences.jpg
imageAlt: "Better two factor authentication experiences with WebOTP"
socialImage: ../../assets/posts/webotp/webotp-better-experiences-social.jpg
imageWidth: 1920
imageHeight: 600
pubDate: "2022-12-07"
---

Two factor authentication (2FA) is a great way to improve the security of user accounts in an application. It helps protect against common issues with passwords, like users picking easily guessable passwords or reusing the same password across multiple sites. There are different ways to implement two factor authentication, including SMS, using an authenticator application and WebAuthn.

SMS is the most widely used and [won't be going away](https://www.twilio.com/blog/sms-2fa-security), so it falls on us as developers to do our best to build the best SMS 2FA experience for our users. The WebOTP API is one way we can help reduce friction in the login experience and even provide some protection against phishing.

## What is the WebOTP API?

The [WebOTP API](https://developer.mozilla.org/en-US/docs/Web/API/WebOTP_API) is an extension to the [Credential Management API](https://developer.mozilla.org/en-US/docs/Web/API/Credential_Management_API). The Credential Management API started by giving us the ability to store and access credentials in a browser's password manager, but now encompasses [WebAuthn](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API) and two factor authentication. The WebOTP API allows us to request permission from the user to read a 2FA code out of an incoming SMS message.

When you implement the WebOTP API the second step of a login process can go from an awkward process of reading and copying a number of digits from an SMS, to a single button press. A great improvement, I think you'll agree.

<img src="/posts/webotp/webotp.gif" alt="An animation showing a login experience where after entering a username and password, a permissions dialog pops up asking for permission to read a 2FA code from an SMS. When approved, the code is entered into an input and the form submitted." loading="lazy" />

## How does it work?

To implement WebOTP you will need to do two things:

1. Update the message you send with the WebOTP format
2. Add some JavaScript to the login page to request permission to read the message

### The SMS message

To have the WebOTP API recognise a message as an incoming 2FA code you need to add a line to the end of the message that you send. That line must include an `@` symbol followed by the domain for the site that your user will be logging in to, then a space, the `#` symbol and then the code itself. If your user is logging in on `example.com` and the code you are sending them is `123456` then the message needs to look like this:

> Your code to log in to the application is 123456
>
> @example.com #123456

The domain ties the message to the website the user should be logging onto. This helps protect against phishing, WebOTP can't be used to request the code from an SMS if the domain the user is logging in to doesn't match the domain in the message. Obviously it can't stop a user copying a code across from a message, but it might give them pause if they come to expect this behaviour.

### The JavaScript

Once you have your messages set up in the right format you need some JavaScript on your 2nd factor page that will trigger the WebOTP API, ask the user permission for access to the message and collect the code.

The most minimal version of this code looks like this:

```js
if ('OTPCredential' in window) {
  navigator.credentials.get({
    otp: {
      transport: ['sms']
    }
  }).then((otp) => {
    submitOTP(otp.code);
  });
}
```

We ask the `navigator.credentials` object to get a one time password (OTP) from the SMS transport. If the browser detects an incoming message with the right domain and a code in it, the user will be prompted, asking for access. If the user approves the promise resolves with an `otp` object which has a `code` property. You can then submit that code to the form and complete the user's login process.

A more complete version of the code, that handles things like finding an input and form, cancelling the request if the form is submitted, and submitting the form if the request is successful, looks like this:

```js
if ('OTPCredential' in window) {
  window.addEventListener('DOMContentLoaded', e => {
    const input = document.querySelector('input[autocomplete="one-time-code"]');
    if (!input) return;
    const ac = new AbortController();
    const form = input.closest('form');
    if (form) {
      form.addEventListener('submit', e => ac.abort());
    }
    navigator.credentials.get({
      otp: { transport:['sms'] },
      signal: ac.signal
    }).then(otp => {
      input.value = otp.code;
      if (form) {
        form.submit();
      }
    }).catch(err => {
      console.error(err);
    });
  });
}
```

This will work for many sites, but copying and pasting code isn't the best way to share code, so I came up with something a bit easier.

### Declarative WebOTP with web components

On Safari, you can get similar behaviour to the WebOTP API by adding one attribute to the `<input>` element for the OTP code. Setting `autocomplete="one-time-code"` will trigger Safari to offer the code from the SMS via autocomplete.

Inspired by this, I wanted to make WebOTP just as easy. So, I published a web component, the [`<web-otp-input>` component](https://github.com/philnash/web-otp-input), that handles the entire process. You can see [all the code and how to use it on GitHub](https://github.com/philnash/web-otp-input). For a quick example, you can add the component to your page as an ES module:

```html
<script type="module" src="https://unpkg.com/@philnash/web-otp-input"></script>
```

Or install it to your project from npm:

```
npm install @philnash/web-otp-input
```

and import it to your application:

```js
import { WebOTPInput } from "@philnash/web-otp-input";
```

You can then wrap the `<web-otp-input>` around your existing `<input>` within a `<form>`, like this:

```html
<form action="/verification" method="POST">
  <div>
    <label for="otp">Enter your code:</label>
    <web-otp-input>
      <input type="text" autocomplete="one-time-code" inputmode="numeric" id="otp" name="otp" />
    </web-otp-input>
  </div>
  <button type="submit">Submit</button>
</form>
```

Then the WebOTP experience will happen automatically for anyone on a browser that supports it, without writing any additional JavaScript.

## WebOTP: a better experience

The WebOTP API makes two factor authentication with SMS a better experience. [For browsers that support it](https://caniuse.com/mdn-api_otpcredential), entering the code that is sent as a second factor becomes a breeze for users.

There are even circumstances where it works for desktop browsers too. For a user with Chrome on the desktop and Chrome on Android and signed into their Google account on both, signing in on the desktop will cause a notification on the mobile device asking to approve sending the code to the desktop. Approving that on the mobile devices transfers the code to the desktop browser. You don't even have to write more code to handle this, all you need is the JavaScript in this article.

For more on WebOTP, check out these articles:

* [Verify phone numbers on the web with the WebOTP API](https://web.dev/web-otp/)
* [Verify a phone number on desktop using WebOTP API](https://developer.chrome.com/blog/cross-device-webotp/)

If you are building two factor authentication or phone verification, consider implementing the WebOTP API as well to make that process easier for your users.