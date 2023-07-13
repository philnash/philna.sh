---
title: "Easy and accessible pagination links for your Astro collections"
tags:
  - typescript
  - javascript
  - astro
  - pagination
image: ../../assets/posts/astro/astro-pagination.png
imageAlt: "The Astro logo in the background, with a <Pagination /> component in white in the foreground"
imageWidth: 1920
imageHeight: 600
socialImage: ../../assets/posts/astro/astro-pagination-social.png
pubDate: "2023-07-13"
---

Generating pagination links is not as straightforward as it may seem. So, while rebuilding my own site with Astro, I released a [`<Pagination />` component on npm as @philnash/astro-pagination](https://www.npmjs.com/package/@philnash/astro-pagination) that anyone can use in their Astro site. Read on to find out more.

## Pagination

Pagination is something that most content sites need. It is often better to list collections with lots of entries, like blog posts, across multiple pages because a single page would be overwhelming to scroll through.

[Astro](https://astro.build/) provides the [`paginate` function](https://docs.astro.build/en/reference/api-reference/#paginate) to the callback to [`getStaticPaths`](https://docs.astro.build/en/reference/api-reference/#getstaticpaths) to make it easy to turn a collection into a number of paths and pages. Once you have turned your collection into a list of pages, you then need to render links that your users can use to navigate through the list.

While this may at first seem straightforward, as with many things on the web, there are hidden depths to it. Not only do you need to write the code that parses the current page and produces links to the previous page, the next page and a window of pages around the current one, you also need to produce accessible HTML that will be easy to use for any of your site's visitors.

## An Astro Pagination component

To make this easy for anyone building with Astro, I released [@philnash/astro-pagination on npm](https://www.npmjs.com/package/@philnash/astro-pagination). It is a `<Pagination />` component that you can use in your Astro site to create pagination links based on a `Page` object.

### How to use it

Start by installing the package:

```sh
npm install @philnash/astro-pagination
```

Then in a list page, you can import and use the `Pagination` component. The component requires two properties, a `page`  and a `urlPattern`. The `page` should be an [Astro `Page`](https://docs.astro.build/en/reference/api-reference/#the-pagination-page-prop) object, typically provided through `Astro.props`. The `urlPattern` should be the path you are using for your paginated pages, with a `{}` where the page number should go. A simplified Astro page might look something like this:

```astro
---
import Pagination from "@philnash/astro-pagination";

export async function getStaticPaths({ paginate }) { /* ... */ }
const { page } = Astro.props;
---

{ /* render the items from the page */ }

<Pagination page={page} urlPattern="/blog/page/{}" />
```

This will render HTML that looks like:

```html
<nav role="navigation" aria-label="Pagination">
  <ul>
    <li>
      <a
        href="/blog/page/4"
        class="previous-page"
        aria-label="Go to previous page"
        >« Prev</a
      >
    </li>
    <li>
      <a class="number" href="/blog/page" aria-label="Go to page 1"> 1 </a>
    </li>
    <li>
      <span class="start-ellipsis">…</span>
    </li>
    <li>
      <a class="number" href="/blog/page/3" aria-label="Go to page 3"> 3 </a>
    </li>
    <li>
      <a class="number" href="/blog/page/4" aria-label="Go to page 4"> 4 </a>
    </li>
    <li>
      <em aria-current="page" aria-label="Current page, page 5"> 5 </em>
    </li>
    <li>
      <a class="number" href="/blog/page/6" aria-label="Go to page 6"> 6 </a>
    </li>
    <li>
      <a class="number" href="/blog/page/7" aria-label="Go to page 7"> 7 </a>
    </li>
    <li>
      <span class="end-ellipsis">…</span>
    </li>
    <li>
      <a class="number" href="/blog/page/10" aria-label="Go to page 10"> 10 </a>
    </li>
    <li>
      <a href="/blog/page/6" class="next-page" aria-label="Go to next page"
        >Next »</a
      >
    </li>
  </ul>
</nav>
```

This renders like this:

![An example of the pagination rendered. There is a previous link, then a link to page 1, an ellipsis, links to pages 3 and 4, a highlighted current page 5, links to pages 6 and 7, another ellipsis, a link to page 10, and a link to the next page.](../../assets/posts/astro/pagination-example.png)

Well, it renders like that with my site's CSS applied. You will need to style it yourself.

The generated markup includes a bunch of things, including accessibility features based on [research from a11ymatters on accessible pagination](https://www.a11ymatters.com/pattern/pagination/). There is:

* a link to the previous page
* a link to the first page
* a window of links around the current page
* ellipses to show where pages exist between the first/last page and the current window
* a link to the last page
* a link to the next page
* a `<nav>` element around the links, with a `role` attribute set to "navigation" and an [`aria-label` attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label) to describe it as "Pagination"
* a list of links, allowing assistive technology to announce how many items there are in the list and navigate through them
* an `aria-label` attribute on each link to provide a full description of the link's destination
* an [`aria-current` attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current) on the element representing the current page
* a helpful class name on each of the important elements to allow for styling

### Advanced usage

There are more properties you can pass to the `<Pagination />` component that give you greater control over the output. They include properties like `previousLabel` and `nextLabel`, that lets you set the text for the previous and next links, or `windowSize`, that lets you determine how many pages are shown in the middle of the range. You can [see all the the available options in the documentation](https://github.com/philnash/astro-components/tree/main/packages/astro-pagination#options-and-advanced-usage).

## Future improvements

While the `<Pagination />` component is ready to be used, and is already in use on my own site, there are definitely some improvements that I will be adding. For example, you should be able to:

* use a component for the `previousLabel` and `nextLabel`
* style the links like other Astro components
* add class names to the elements, so you can style using utility CSS frameworks
* handle internationalisation

Ultimately, I'd love for this to be a component that every Astro site considers using for pagination, from my blog right here to the [Astro blog itself](https://astro.build/blog/).

## Any feedack?

I tried to make this component simple to use and flexible. As I've described above, there's plenty more to do, but it's always worth asking for feedback too.

So, would you use this component to simplify pagination in your own Astro sites? Is there anything you'd add or change? Let me know [on Twitter](https://twitter.com/philnash), another [social network of choice](/links), or in [the GitHub issues](https://github.com/philnash/astro-components/issues).

## Astro Pagination

Check out [the source on GitHub](https://github.com/philnash/astro-components/tree/main/packages/astro-pagination) (give it a star, if you fancy) and let me know if you use this component.