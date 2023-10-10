---
title: "Balance heading and paragraph text with CSS text-wrap"
tags:
  - css
  - text-wrap
image: ../../assets/posts/object-groupby.png
imageAlt: "The function Object.groupBy on a JavaScript yellow background"
imageWidth: 1920
imageHeight: 600
pubDate: "2023-10-02"
---

I'm not normally one to worry too much about typography, but when a CSS feature appears that fixes an issue I didn't realise that I had, I'm all for it. Balancing text in an aesthetically pleasing way for both headings and longer bodies was something that used to take manual editing of the text with the little-known [`<wbr>` (line break opportunity) element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/wbr), or a [text balancing JavaScript library](https://github.com/adobe/balance-text), or even a [dedicated React component](https://github.com/shuding/react-wrap-balancer).

But now the [draft CSS Text Module Level 4](https://drafts.csswg.org/css-text-4) defines a [`text-wrap` property](https://drafts.csswg.org/css-text-4/#propdef-text-wrap)