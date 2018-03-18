---
layout: post
title: "CSS: select first-of-class with the subsequent sibling combinator"
tags:
  - CSS
  - CSS selectors
image: posts/subsequent-sibling-combinator
image_alt: "A tilde symbol, the symbol used as the subsequent sibling combinator in CSS selectors"
---

There are a [whole bunch of CSS selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) available to web developers, but sometimes there's still not enough. I found this recently when building the [speaking section of my site](https://philna.sh/speaking/) and wanted to use the non-existent `:first-of-class` pseudo class to apply some styles.

## The problem

The pseudo class `:first-of-type` does exist, but it is limited. It is a special case of the `:nth-of-type()` pseudo class. From the spec (emphasis mine):

> The :nth-of-type(An+B) pseudo-class notation represents the same elements that would be matched by :nth-child(\|An+B\| of S), _**where S is a type selector**_ and namespace prefix matching the element in question.

That means, when using `:nth-of-type()` or `:first-of-type` the selector can only be a type selector. That is, you can only refer directly to elements&mdash;like `<p>` or `<h1>`&mdash;when using `:first-of-type`. So, if you had the following HTML:

```html
<div>
  <p>This is paragraph 1</p>
  <p class="special">This is paragraph 2</p>
  <p class="special">This is paragraph 3</p>
</div>
```

And this CSS:

```css
div p { color: #333; }
div p:first-of-type { color: red; }
div p.special:first-of-type { color: green; }
```

You might expect paragraph 1 to be coloured red and paragraph 2 to be coloured green. But `div p.special` is not a type selector, so `:first-of-type` doesn't apply here and nothing is green.

## The subsequent sibling combinator

This can be solved with a technique created by [Daniel Tan](https://stackoverflow.com/questions/2717480/css-selector-for-first-element-with-class) and [Lea Verou](https://stackoverflow.com/questions/5287272/css-select-first-element-with-a-certain-class/5293095#5293095) and shared on Stack Overflow. Rather than using pseudo classes at all, we can use the [subsequent or general sibling combinator](https://www.w3.org/TR/selectors/#general-sibling-combinators).

The subsequent sibling combinator looks like `A ~ B` where `A` and `B` are two compound selectors (not just type selectors). It allows you to select `B` where `A` and `B` share a parent and `A` precedes `B` in the document.

With the following HTML, the selector `h2 ~ p` would select the second `<p>` as it follows the `<h2>` but not the first `<p>`.

```html
<div>
  <h1>Heading</h1>
  <p>Meta data</p>
  <h2>Subheading</h2>
  <p>Some article text</p>
</div>
```

## The subsequent sibling combinator and :first-of-class

The trick to using the combinator to emulate a `:first-of-class` psuedo class is to use a regular selector to style all the elements of the class with the style you want. Then use the combinator to turn it off for all but the first element. In our original example, the CSS now looks like this:

```css
div p { color: #333; }
div p:first-of-type { color: red; }
div p.special { color: green; }
div p.special ~ p.special { color: #333; }
```

Now the first paragraph will be red, the second green and the last one grey. You can check out a [live example of this on Codepen](https://codepen.io/philnash/pen/WzoNwG/).

## CSS Selectors level 4

After posting this, [Šime Vidas](https://twitter.com/simevidas) [pointed out on Twitter](https://twitter.com/simevidas/status/975394813863432192) that the future of CSS holds more promise for this style of selector. In the CSS Selectors level 4 specification the `:nth-child()` pseudo class takes an argument that looks like: `An+B [of S]?`. The `An+B` part means you can provide a function to calculate what `n` is, but the optional `of S` means the pseudo class will match the Nth element that matches the selector.

This means we can update our example to use `:nth-child()` instead of two rules like we did above. Check out the CSS below:

```css
div p { color: #333; }
div p:first-of-type { color: red; }
div :nth-child(1 of p.special) { color: green; }
```

Using `:nth-child(1 of p.special)` means we are selecting the first child of the `<div>` that is a `<p>` with a class of "special". This is exactly what I wanted.

The only drawback with this technique? It only works in Safari right now. I've updated the [Codepen, check it out in Safari to see all your future selector dreams come true](https://codepen.io/philnash/pen/WzoNwG/).

## CSS hacking is still fun

I've been writing CSS on and off for more than a decade now and while all the modern layout capabilities of CSS mean that there's a lot less hacking, sometimes you need to come up with a creative solution to a problem. I could have solved this with an extra class or a rearrangement of my HTML, but when CSS can do the job for you it feels more satisfying.

Thanks to Daniel and Lea for sharing their solutions on Stack Overflow and particularly to Daniel who's [answer goes into a lot more detail about CSS selector and pseudo class misunderstandings](https://stackoverflow.com/questions/2717480/css-selector-for-first-element-with-class/8539107#8539107).

Maybe one day we'll see a `:first-of-class` pseudo class. With the latest version of `:nth-child()` maybe we don't even need a `:first-of-class`, we're just waiting for browser support. In the meantime the subsequent sibling combinator remains our friend.