---
title:  "August is iOS month"
image: /posts/xcode_swift.png
imageAlt: "The App Store and Swift logos"
imageWidth: 1920
imageHeight: 600
tags:
  - swift
  - ios
pubDate: "2016-08-01"
---

June saw me [ask for your help](/blog/2016/06/20/critique-my-swift-on-exercism/) as I started to learn Swift. July was busy with travel. Now August is iOS month.

I'm lucky that part of my job as a developer evangelist for [Twilio](https://www.twilio.com/) is to learn new things. That is why I attended the [Big Nerd Ranch Swift and iOS course](https://training.bignerdranch.com/classes/ios-essentials-with-swift) in June and is what has lead me to dedicate August to building my first iOS application.

## My first app

By first application, I really mean my first one that I am going to take from beginning to end, from blank Xcode project to the App Store, all by myself. I have worked on iOS applications before. I remember a time when I managed to crash an iPad app so badly while working on it, that checking out the previous version of the app still lead to crashes in the feature that I'd spent too long looking at. I did not receive too many more tasks to complete on that application. But those were the days of memory managed Objective C and working in a team.

Now, with my newly gained knowledge of Swift, it's just me, Xcode and a month of clear space to build something.

<figure>
  <img src="/posts/new_xcode_project.png" alt="The view of Xcode when you start a new project." loading="lazy" />
</figure>

## 2,000,000 applications

Of course, the question one always lands on is what that something should be. This is my first application and a solo effort at that, so I'm looking for something with a constrained scope, something that will be achievable this month, something that will be achievable by me. When I remembered that Apple announced at WWDC this year that the App Store now had [more than 2 million applications available to download](http://www.theverge.com/2016/6/13/11922926/apple-apps-2-million-wwdc-2016) I realised that I'm not looking for a brand new idea. Anything that can be built by a novice developer within a month has almost certainly already been built.

I decided the best idea would be to tackle something I have done before in a different environment. As it happens, I own [fxrat.es](http://fxrat.es/), the world's least popular exchange rate calculator. It's best feature is not up to the minute exchange rate data, but that it works offline in modern browsers. It's a web application I wanted to use myself when abroad.

## New and improved

I have been thinking about rewriting it for a couple of reasons. Firstly, sometimes it just doesn't work and I've never found out why. Secondly, it currently works offline using the web platform's Application Cache. The AppCache is going away, [for good reasons](http://alistapart.com/article/application-cache-is-a-douchebag), so it is time to update to use my new favourite browser feature, the Service Worker. However that will not work in Safari.

This seems to me like a good opportunity to both rewrite my existing application for the web and produce a new, offline capable native application for iOS that I can release in the App Store.

## The task is set

So that is August for me. Buried in Xcode creating a new application. Wish me luck and follow [my progress on GitHub](https://github.com/philnash/fxrates-ios).

See you in the App Store.
