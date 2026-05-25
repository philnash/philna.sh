---
title: "I built a new app and I don't know how I feel about it"
tags:
  - ai
  - web development
image: ../../assets/posts/ai-assisted/working-with-codex.jpg
imageAlt: " "
imageWidth: 1500
imageHeight: 500
pubDate: "2026-05-25"
---

Much like almost every other developer on the planet, I have been trying to work out my relationship with coding agents. I have been using AI-assisted coding since the GitHub Copilot beta came out in 2021 (yes, that long ago) and have seen them evolve from being a fancy autocomplete to sidebar assistants to full-blown applications that don't even show you the code (unless you want to see it).

I've used almost all variations of coding assistants, but one thing I hadn't experimented with was building something new via prompts alone. I wanted to see what I could achieve with minimal touching of the code. So I powered up [OpenAI's Codex](https://openai.com/codex/) and built a new app. I've launched it, I use it regularly, and I still don't know how I feel about it.

## I built a time zone conversion app

The application I wanted to build was a time zone converter. I work on a globally distributed team and it's often very useful to know what time it is for everyone, especially if you want to send someone a message or organise a meeting. There are apps that do this already, like [Savvy Time](https://savvytime.com/converter) and [World Time Buddy](https://www.worldtimebuddy.com/). They both work but have their issues; they are both full of adverts and seem to require page loads whenever you select a city to add to your time conversion, World Time Buddy doesn't work well on a mobile device, and Savvy Time is full of unnecessary information about time zones (presumably for SEO reasons).

I wanted to build something I could use and enjoy. Something that used [modern web APIs to handle time zones](https://philna.sh/blog/2021/02/22/display-dates-in-your-users-time-zone/), that prioritised performance, and that worked offline. Here is the first prompt I gave to Codex:

> Create a plan to build a clean, simple, modern time zone comparison application, like the functionality in savvytime.com. It should be a modern HTML, CSS and JS front-end only application that can be made available offline using service workers. It should use the JavaScript Intl APIs to convert between time zones, but will need to map popular cities around the world to their time zone. By default the time you compare across different cities is the current time and date, but you should be able to choose the time and date. The state (cities, time and date selected) should be stored in the URL and loaded from the URL when the page is loaded. Use the Web Navigation API to control this.
>
> It should work well on mobile as well as desktop and respect whether the user's system is using light or dark mode.

I started this one evening and over the next few hours, and then sporadically the next morning, Codex planned and I critiqued, it implemented and I reviewed, it wrote code and I tested the app. We had to work out fallbacks for APIs I thought were more available, design decisions for various elements and layouts, and ways to optimise the app. And after that there was an app that could be deployed. You can use the app here: [https://time.philna.sh/](https://time.philna.sh/).

This wasn't some sort of magical one-shot prompt and then I had an app. The first version that was built did satisfy the initial requirements, but that felt like the proof-of-concept that we could then build upon.

So how was the experience, the code, and the result?

## The good

I was very impressed that in less than a day, and with a lot less attention than that, I was able to build an application that handles international time zones successfully with Codex. Codex did follow the directions I gave it, using [`Intl` APIs for time zone handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat), the [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API) for handling URL changes, though we added a [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) fallback. It also built this entirely as a vanilla JavaScript application with no framework, but a live-updating interface.

Codex also surprised me in a few ways. Its initial plan included making this a PWA that would work offline. It found an npm module ([city-timezones](https://www.npmjs.com/package/city-timezones)) that had a list of cities mapped to their time zones that the `Intl` API would be able to use. It wrote end to end tests using Playwright.

## The bad

It wasn't all good though. I certainly had to give Codex some extra direction to avoid potentially bad things.

It used the city-timezones module to generate a JSON data file that the front-end would load, but it included way too many fields from the original dataset. This app had no need for the latitude and longitude of the cities, nor their populations, but including that blew out the size of the data file. I got Codex to only include the properties we needed and the size of the JSON file dropped by nearly half.

I also added a feature to share the current URL, which contains all the cities you are comparing, optionally including the time and date that you are looking at, by copying it to the clipboard. Initially Codex chose to use the [deprecated, non-standard `document.execCommand('copy');` function](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand). Had I not checked on the code for this feature, I wouldn't have noticed. I followed up with a prompt to use the [standard `Clipboard` API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) and we got it fixed and future-proof.

## The ugly

While neither good nor bad, there are some parts of building this app that I found... uncomfortable. The JavaScript for the application is a single file of over 1300 lines, I probably spent more time trying to lay out and align the buttons at the top of the page than on anything else, and while it works, I still haven't been through all of the code to see exactly how.

Maybe that doesn't matter, at least with an app of this scale, but it's a different feeling. Was I burning tokens on CSS that I could have written myself? Does 1300 lines of JavaScript matter when that's a fraction of the context size available and Codex is good at searching for the right code to add to the context? Does it matter that I haven't read the routing logic when I've tested it and it works?

## Some thoughts about this

This has been a good experiment. I have built a new application that I enjoy using, I managed to do so without touching the code (much), and there's a much smaller chance I would have built it without this assistance, and it definitely wouldn't have been as quick.

That being said, when I did check some parts of the code I found mistakes and things that could degrade the application's performance or even features over time. I was able to get Codex to fix them, but I had to know what had gone wrong and what the right approach was. Because I knew a few details that mattered, like using the `Intl` APIs for time zone calculations, I could direct Codex more effectively and give it a better chance of success.

One thing I wonder is, if I was capable of building this app without touching the code, could someone who didn't know how to code? I think the answer is yes, they probably could build something similar, but would it work as well? I don't think so. My knowledge of JavaScript and the web platform saved this app from making some errors that someone without that experience wouldn't think to ask about.

I could have spent more time up front speccing out the application, but that's honestly not how I usually work. I actually really enjoyed the back and forth collaboration that likely resulted in a better app than had I written this on my own.

It is important to call out that this was a new, entirely front-end project, not a 15-year-old enterprise codebase that supports millions of users. My experiences with this are not the same as that sort of app, or many other different types of apps that have different sizes, user bases, or risk profiles. But I do think experimenting with how we build with AI is important. I don't think I'm quite at the level of a [Dark Factory](https://www.danshapiro.com/blog/2026/01/the-five-levels-from-spicy-autocomplete-to-the-software-factory/) yet, but using applications like this is a good way to try to get there and see if it works for me. Plus, now I have a new app I like using.

## In the end

I am pleased I built this [time zone comparison app](https://time.philna.sh/). Weirdly, it has taken me a long time to share that I did. Maybe that's because not writing the code meant it didn't feel like my own. Writing this retrospective on it has changed that though. This application wouldn't exist if I hadn't decided to build it, prompted the experience I wanted, collaborated with Codex to get it right, and shipped it. The code isn't the output, the application is, and that is what I built.
