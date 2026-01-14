---
title: "How wrong can a JavaScript Date calculation go?"
tags:
  - javascript
image: ../../assets/posts/js-dates/time-zones.jpg
imageAlt: "A terminal window shows a JavaScript REPL. The code creates a date on the 1st January, 2024, then adds a month to the date. The result is 4th March, 2023."
imageWidth: 1598
imageHeight: 978
pubDate: "2026-01-11"
updatedDate: "2026-01-14"
---

The `Date` object in JavaScript is frequently one that causes trouble. So much so, it is set to be replaced by [`Temporal`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) soon. This is the story of an issue that I faced that will be much easier to handle once `Temporal` is more widespread.

## The issue

In January 2025 I was in Santa Clara, California writing some JavaScript to perform some reporting. I wanted to be able to get a number of events that happened within a month, so I would create a date object for the first day of the month, add one month to it and then subtract a day to return the last day. Seems straightforward, right?

I got a really weird result though. I reduced the issue to the following code.

```js
const date = new Date("2024-01-01T00:00:00.000Z");
date.toISOString();
// => "2024-01-01T00:00:00.000Z" as expected
date.setMonth(1);
date.toISOString();
// => "2023-03-04-T00:00:00.000Z" WTF?
```

I added a month to the 1st of January 2024 and landed on the 4th March, 2023. What happened?

## Times and zones

You might have thought it was odd for me to set this scene on the West coast of the US, but it turned out this mattered. This code would have run fine in UTC and everywhere East of it.

JavaScript dates are more than just dates, they are responsible for time as well. Even though I only wanted to deal with days and months in this example the time still mattered.

I did know this, so I set the time to UTC thinking that this would work for me wherever I was. That was my downfall. Let's break down what happened.

Midnight on the 1st January, 2024 in UTC is still 4pm on the 31st December, 2023 in Pacific Time (UTC-8). `date.setMonth(1)` sets the date to February (as months are 0-indexed unlike days). But we started on 31st December, 2023 so JavaScript has to handle the non-existant date of 31st February, 2023. It does this by overflowing to the next month, so we get 3rd March. Finally, to print it out, the date is translated back into UTC, giving the final result: midnight on 4th March, 2023.

All of these steps feel reasonable when you break it down, the confusion stems from how unexpected that result was.

So, how do you fix this?

## Always use UTC

Since I didn't actually care for the time and I knew I wanted to work with UTC, I fixed this code using the `Date` object's [`setUTCMonth` method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setUTCMonth). My original code subtracted a day to get the last day in a month, so I used the [`setUTCDate` method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setUTCDate) too. All `set${timePeriod}` methods have a `setUTC${timePeriod}` equivalent to help you work with this.

```js
const date = new Date("2024-01-01T00:00:00.000Z");
date.toISOString();
// => "2024-01-01T00:00:00.000Z"
date.setUTCMonth(1);
date.toISOString();
// => "2024-02-01-T00:00:00.000Z"
```

So this fixed my issue. Can it be better though?

## Bring on Temporal

One of the reasons this went wrong was because I was trying to manipulate dates, but I was actually manipulating dates and times without thinking about it. I mentioned `Temporal` at the top of the post because it has objects specifically for this.

If I was to write this code using `Temporal` I would be able to use the [`Temporal.PlainDate`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDate) to represent a calendar date, a date without a time or time zone.

This simplifies things already, but `Temporal` also makes it more obvious how to manipulate dates. Rather than setting months and dates or adding milliseconds to update a date, you add a duration. You can either construct a duration with the [`Temporal.Duration` object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Duration) or use an object that defines a duration.

`Temporal` also makes objects immutable, so every time you change a date it returns a new object.

In this case I wanted to add a month, so with `Temporal` it would look like this:

```js
const startDate = Temporal.PlainDate.from("2024-01-01");
// => Temporal.PlainDate 2024-01-01
const nextMonth = startDate.add({ months: 1 });
// => Temporal.PlainDate 2024-02-01
const endDate = nextMonth.subtract({ days: 1 });
// => Temporal.PlainDate 2024-01-31
```

Date manipulation without worrying about times, wonderful!

Of course, there are many more benefits to the very well throught out `Temporal` API and I cannot wait for it to be a part of every JavaScript runtime.

## Mind the time zone

`Temporal` has still not made it to many JavaScript engines. At the time of writing, it is available in Firefox and nowhere else, so if you want to test this out open up Firefox or check out one of the polyfills [@js-temporal/polyfill](https://github.com/js-temporal/temporal-polyfill) or [temporal-polyfill](https://www.npmjs.com/package/temporal-polyfill).

<div class="info"><p><strong>Edit:</strong> Merely two days after publishing this, <a href="https://developer.chrome.com/blog/chrome-144-beta#the_temporal_api">support for Temporal started rolling out in Chrome 144</a>. According to <a href="https://caniuse.com/temporal">Can I Use, Temporal</a> is available behind a flag in Safari Technical Preview, so we might be close there too.</p></div>

If you still have to use `Date` make sure you keep your time zone in mind. I'd try to move to, or at least learn how to use, `Temporal` now.

And watch out for time zones, even when you try to avoid them they can end up giving you a headache.
