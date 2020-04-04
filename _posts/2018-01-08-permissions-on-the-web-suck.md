---
layout: post
title: "Permissions on the web suck"
tags:
  - ux
  - pwa
  - push notifications
  - permission
image: posts/permissions/header
image_alt: "A permissions dialog that says 'philna.sh wants to annoy you constantly"
scripts:
  - <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>
---

I am a fan of progressive web apps and the powers that they bestow on web developers to build the next generation of applications. We can write web applications that work offline, [download large files in the background](https://philna.sh/blog/2017/07/04/experimenting-with-the-background-fetch-api/), [send push notifications](https://www.twilio.com/blog/2016/02/web-powered-sms-inbox-with-service-worker-push-notifications.html), and much more. I was so excited about push notifications on the web that I wrote a whole talk about it in 2015 and was fortunate enough to give it in a bunch of places around the world.

<div class="post-video">
  <iframe src="https://www.youtube.com/embed/4-WnlHhqcjU?t=14" frameborder="0" gesture="media" allow="encrypted-media" allowfullscreen></iframe>
</div>

But perhaps I was a little too prescient with that talk title, "The web is getting pushy." Web applications themselves are getting pushy and now I see tweets like this:

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Dear Every Single Website in Existence,<br><br>No, I do not want Notifications turned on.<br><br>Thanks,<br><br>Dan</p>&mdash; Dan Szymborski (@DSzymborski) <a href="https://twitter.com/DSzymborski/status/921260402146672641?ref_src=twsrc%5Etfw">October 20, 2017</a></blockquote>

And this:

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Dear websites: no one wants push notifications. Love, every person who uses the internet</p>&mdash; Andrea Whitmer (@nutsandbolts) <a href="https://twitter.com/nutsandbolts/status/925421346259193862?ref_src=twsrc%5Etfw">October 31, 2017</a></blockquote>

And blog posts like How-To Geek's [how to stop websites from asking to show notifications](https://www.howtogeek.com/288946/how-to-stop-websites-from-asking-to-show-notifications/).

Push notifications are getting a bad reputation and I don't think they deserve it. Here are the problems I think we are facing with this and some potential solutions.

## It's not the fault of the notifications

I have a theory. It's not that users don't want push notifications. There is a time and a place for a good push notification. Native mobile application developers seem to be getting this right now, at least in my experience, and [innovative web teams like those at the Guardian have done some really interesting and impressive push notification experiments](https://medium.com/the-guardian-mobile-innovation-lab/generating-images-in-javascript-without-using-the-canvas-api-77f3f4355fad).

<figure class="post-image-left">
  <picture>
    <source type="image/webp" srcset="{% asset posts/permissions/guardian @path %}.webp">
    {% asset posts/permissions/guardian alt="The Guardian's experiment with creating images for the current state of the UK General Election entirely within a push notification." class="post-image-left" %}
  </picture>
</figure>

My theory is that users might want push notifications. They might want them for newsworthy moments, like the Guardian's election night experiments. They might want notifications that someone has sent them a message or that their taxi is arriving or their flight has been delayed. There are countless reasons a user might want to receive push notifications.

But the top way to annoy any user is to pop up that permission dialog asking to send push notifications on page load without any context, any information at all, that would allow them to make that decision.

<figure class="post-image">
  <picture>
    <source type="image/webp" srcset="{% asset posts/permissions/sitepoint @path %}.webp">
    {% asset posts/permissions/sitepoint alt="Sitepoint pops up a permissions dialog on page load" %}
  </picture>
</figure>

I noticed [Sitepoint](http://sitepoint.com/), a web tutorial site that really should know better, doing this. And other well known sites; [Product Hunt](https://www.producthunt.com/), [cnet](https://www.cnet.com/) and even [Facebook](https://www.facebook.com/) in their early experimentation with the feature, have been spotted doing it too. There are probably many more examples.

These permission dialogs suck.

## Permission for what?

Read that dialog from the screenshot again. All it says is "www.sitepoint.com wants to show notifications" and there are two buttons, "Block" or "Allow". It doesn't say what the notifications will contain, how often they might be sent, why the user should even care. That permission dialog can't say that. There is nothing in the [`PushManager` API](https://developer.mozilla.org/en-US/docs/Web/API/PushManager) that can be used to add any context to a popup like this.

I believe that the intention for the API is to encourage developers to build an intermediary step where the application explains why it wants permission to send push notifications. Then when the user agrees to that, trigger the real permission notification.

This is a pattern that Matt Gaunt explains beautifully with his airline example from [his article on permissions UX](https://developers.google.com/web/fundamentals/push-notifications/permission-ux). The real key to each of the patterns in Matt's article is that the permission dialog never surprises the user, they always know why they are being asked permission by the browser to send notifications.

## Permissions solved

If everyone just reads Matt's article and implements friendly patterns for asking for permission then everything is solved, right? If only.

It doesn't matter how good an article on UX is or how many people read it, it can't reach everyone. So we still end up with permissions popping up at page load. You might think that this is just bad for the site that is providing the poor experience, but check those tweets at the start of this post. They don't care any more, they never want notifications. They want to be able to turn them all off for good. And they can, that's what the How-To Geek article explains. Firefox is soon releasing a global disable option too, and if you read the responses you'll see that this is being welcomed.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">There is now a global &quot;disable&quot; option for all push notification prompts<a href="https://t.co/b01ZCoWOfK">https://t.co/b01ZCoWOfK</a> <a href="https://t.co/0JSSYoaysb">pic.twitter.com/0JSSYoaysb</a></p>&mdash; Firefox Nightly (@FirefoxNightly) <a href="https://twitter.com/FirefoxNightly/status/950321939129815040?ref_src=twsrc%5Etfw">January 8, 2018</a></blockquote>

The problem here is that all these poor experiences with permissions are causing users to revoke the permission not just from the offending sites but from the entire platform. Once notifications are turned off globally, it's almost impossible to get users to turn them back on again. Now, even if you've built the best push notification permission flow, a user who has outright blocked notifications will never see it and never experience your application the way you built it.

I think we need more than just best practice UX articles to solve this.

## Power to the browser

I believe the power is in the hands of the browsers. We've seen them deal with unnecessary popups before. Remember, back in the day, installing popup blockers because the web was a fraught mess of windows popping up everywhere. Now every browser has a built in popup blocker. Most of what these built in popup blockers do is restrict the [`window.open` function](https://developer.mozilla.org/en-US/docs/Web/API/Window/open) to only work on user interaction. This means that users browsing the web don't end up with a whole bunch of unexpected popups or worse, popunders.

I would like to see the same for permission dialogs. If the browsers enforced a user interaction before you could show a permission dialog then the page load permission dialog would disappear immediately. The platform would then encourage all developers to explain the permission before asking for it and lead to better experiences all round.

## Together we can save permissions

It's going to be a team effort, but I think we can save permissions dialogs, push notifications and the web platform.

<strong>Developers</strong>: never show a permissions dialog on page load, instead read [Matt Gaunt's article on permission UX](https://developers.google.com/web/fundamentals/push-notifications/permission-ux) and build better experiences.

<strong>Browsers</strong>: please consider a permissions popup blocker and encourage developers to build better applications by making poor experiences harder to build.

<strong>Users</strong>: don't block all permissions, please, you might be missing out on something really useful somewhere else on the web.

I hope we can all agree that there are uses for push notifications, what we really need to fix are the permissions.
