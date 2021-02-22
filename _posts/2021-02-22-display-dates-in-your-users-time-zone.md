---
layout: post
title: "How to display dates in your user's time zone with the Intl API"
tags:
  - javascript
  - web
  - time
  - i18n
image: posts/intl-time
image_alt: "Different sides of the world offset by clocks showing different times"
social_image: posts/intl-time-social
---

Time zones are hard. Not only are there a lot of them, but they don't fit nicely into whole hour blocks, daylight savings time changes individual zones some of the time, and zones move around and change all the time. In short, it is a hassle.

<figure>
  <picture>
    <source type="image/webp" srcset="{% asset posts/time_zones @path %}.webp">
    {% asset posts/time_zones alt="A map of time zones across the world" %}
  </picture>
  <figcaption><a href="https://commons.wikimedia.org/wiki/File:World_Time_Zones_Map.png">Time zones of the world, via Wikimedia Commons</a>, aren't they nice and easy?</figcaption>
</figure>

Events are happening online all the time and since people can join an online event from anywhere it is important to tell people what time that event will be happening for them. We need to combine an event's time, a user's time zone, and even their language and formatting preferences, to show a user a meaningful time.

Let's take a look at [the `Intl` API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl), the ECMAScript Internationalisation API, and specifically [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat) which will aid us with date and time functions to achieve just that.

## Get a user's time zone in JavaScript

There are two keys to getting a time correct in a user's time zone: the time in its original time zone and the user's time zone. If you have the time of an event, then it's up to you to provide that with its time zone, ideally in [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601). But what can we do about getting the user's time zone?

`Intl.DateTimeFormat` is an object that can help us format the time. It also comes with a utility that tells us more about the user's time. Running `Intl.DateTimeFormat().resolvedOptions()` in a browser tells us everything the browser knows about the user's date and time preferences. If I run it for myself I get:

```javascript
Intl.DateTimeFormat().resolvedOptions();
// => {
//   locale: "en-AU",
//   calendar: "gregory",
//   numberingSystem: "latn",
//   timeZone: "Australia/Melbourne",
//   year: "numeric",
//   month: "2-digit",
//   day: "2-digit",
// };
```

We can see that the browser knows I am in the "Australia/Melbourne" time zone. As I write this, that's Australian Eastern Daylight Time (AEDT), UTC+11. Between some time in April and October it will be Australian Eastern Standard Time (AEST), which is only UTC+10. See what I mean about this being hard? The place stays the same, but the time zone can change depending on the time of year. The good news is that `Intl` is aware of when that changes, so it can give us the time zone "Australia/Melbourne" and internally know when that translates to AEDT or AEST.

Now we have the time zone, we need to take a time and print it out for the time zone.

## Showing a time in a time zone

The main job of `Intl.DateTimeFormat` is to format a time for a user. It takes a language and then a bunch of options, including the time zone, and returns a formatter function. That function takes a datetime object as an argument and returns a string that you can display to the user.

I can create a formatter that will format times for my time zone like this:

```javascript
const formatter = Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne" });
```

Then I can use that formatter to print out a date. I'll use the date I am writing this as an example, that way I can just use `new Date()`.

```javascript
const date = new Date();
formatter.format(date);
// => "22/02/2021"
```

You don't actually need to provide a language or time zone to the formatter, it will pick the system defaults.

```javascript
const minimalFormatter = Intl.DateTimeFormat();
minimalFormatter.format(date);
// => "22/02/2021"
```

By default, the formatter outputs a short date form, even though the time is in there too. This is useful though, as we can still see that the time zone side of things is working. It may be the 22nd as I write this, but on the West coast of the USA it's still the 21st. We can see this by setting the time zone to something like "America/Los_Angeles":

```javascript
const USFormatter = Intl.DateTimeFormat("en-AU", { timeZone: "America/Los_Angeles" });
USFormatter.format(date);
// => "21/02/2021"
```

A day behind, as expected. Note that `Intl.DateTimeFormat` takes a language string too. I've been using Australian English as the setting, but we can set this to US English too.

```javascript
const reallyUSFormatter = Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles" });
reallyUSFormatter.format(date);
// => "02/21/2021"
```

Now we get the date in mm/dd/yyyy format, far and away *the worst format*. But, since `Intl.DateTimeFormat` knows international preferences for this, I can provide the language and the result will be formatted in the way the user expects and I never have to see a date with the month in the most significant place.

As an aside, there are a few ways to get a user's preferred language in the browser. [`navigator.languages`](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorLanguage/languages) returns an array of a user's preferred languages. `navigator.language` is supposed to return the first element of `navigator.languages`, but some browsers disagree and return the language of the browser UI, which is not necessarily the same. See more about [the inconsistencies in this API on CanIUse](https://caniuse.com/mdn-api_navigatorlanguage_languages).

### Formatting the time

Now we know how to create a formatter that outputs a short date format, we need to know how to use it to format times the way we want. We saw that `Intl.DateTimeFormat` takes a language and then an object of options, including `timeZone`, to create a formatter. It is that object of options that we can use to add or remove parts of the date and time in the output. [MDN has great documentation on the parameters for `Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#parameters), but let's take a quick look at some options.

In the examples above, we gave no input for how we wanted to format the date. This is the equivalent of passing the defaults we saw above in the response to `Intl.DateTimeFormat().resolvedOptions()`:

```javascript
{
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
}
```

The `day`, `month` and `year` options can be set to "numeric" or "2-digit" and `month` can also be "long", "short" or "narrow". Let's see what happens if we change things:

```javascript
const newFormatter = Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Melbourne",
  month: "long",
  year: "2-digit"
});
newFormatter.format(date);
// => "February 21"
```

In this case I defined `month` and `year` and left `date` off, so `date` no longer appears. Using "2-digit" for the `year` changes the output from "2021" to "21" and using "long" for the `month` prints out the full name of the month, "February".

We can add other elements to this format too, like `weekday`, `era`, `hour`, `minute`, `second` and `timeZoneName`. Here's a fully written out date time:

```javascript
const fullFormatter = Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Melbourne",
  day: "numeric",
  month: "long",
  year: "numeric",
  weekday: "long",
  era: "short",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  timeZoneName: "short"
});
fullFormatter.format(date);
// => "Monday, 22 February 2021 AD, 5:05:52 pm AEDT"
```

There are a couple of shortcuts you can use too; `timeStyle` and `dateStyle` can be "full", "long", "medium" or "short" and you can use them together, but not with the above options.

```javascript
const shortcutFormatter = Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Melbourne",
  timeStyle: "long",
  dateStyle: "short"
});
shortcutFormatter.format(date);
// => "22/2/21, 5:05:52 pm AEDT"
```

## When is your event?

Now, we can take all this knowledge and apply it to the date of an event. As I write this, it is the 22nd February, so let's consider an event in the future for me. Say it will occur on Friday 26th February, at 10am in the morning Pacific Time (UTC-8).

First we convert that time to [ECMAScript compatible ISO 8601](https://262.ecma-international.org/11.0/#sec-date-time-string-format) format: `2021-02-26T18:00:00.000Z` (Z means UTC with no offset, so 10am Pacific Time is 6pm in UTC). Other formats are supported by browsers, but by convention only, not as part of the standard.

We take the date string and create a new `Date` object with it. We also create a date formatter. We feed the date to the formatter and we get the date out in the correct time zone and format.

```javascript
const excitingEventTime = "2021-02-26T18:00:00.000Z";
const eventDate = new Date(excitingEventTime);
const formatter = Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Melbourne",
  day: "numeric",
  month: "long",
  year: "numeric",
  weekday: "long",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  timeZoneName: "short"
});
formatter.format(eventDate);
// => Saturday, 27 February 2021, 5:00:00 am AEDT
```

So there we go, Friday morning events in Pacific Time happen early Saturday morning in AEDT.

## Use Intl more

The `Intl` APIs, and in particular `Intl.DateTimeFormat`, make it easier for us as developers to display datetimes in the format, the time zone and the language of our users.

As a bonus and because `Intl` is part of ECMAScript, it is also available in Node.js. You will want to be more careful with defaults when working on server though. The time zone, for example, is going to be where the server is located, not the time zone of your user. I recommend working in UTC on servers and using users' time zones when displaying the datetime.

I recommend you familiarise yourself with everything that is available under [`Intl`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) so you understand how you can use the platform to make your applications work better for your users wherever they are.