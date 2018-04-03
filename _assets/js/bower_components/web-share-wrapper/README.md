# `<web-share-wrapper>`

A custom element that can be used to wrap existing share buttons and replace them with a button that invokes the [Web Share API](https://philna.sh/blog/2017/03/14/the-web-share-api/).

For example, in supporting browsers the following HTML will show a plain `<button>` saying "Share". In browsers that don't support the Web Share API, the default link to share on Twitter will be displayed.

```html
<web-share-wrapper>
  <a href="https://twitter.com/intent/tweet?text=Share+Text&amp;url=SHARE_URL">Share on Twitter</a>
</web-share-wrapper>
```

## ⚠️ Warning

This is an experiment right now, it is not built for production. There are no polyfills and no element will be registered for browsers that don't support `customElements`.

Currently the only browser that supports the Web Share API (Chrome on Android) also supports custom elements and templates, so this should be fine.

## How to use

The `<web-share-wrapper>` is a web component that you can use to enhance your website with the Web Share API. If the API is available, the component will replace its contents with a single share button or a template that you provide.

The component only activates if the Web Share API is available, otherwise it will just show it's contents.

### Installation

You can install the component with bower.

```bash
bower install --save web-share-wrapper
```

### Example

```html
<web-share-wrapper>
  <a href="https://twitter.com/intent/tweet?text=Share+Text&amp;url=SHARE_URL">Share on Twitter</a>
</web-share-wrapper>
```

If `navigator.share` is available, the contents of the `<web-share-wrapper>` will be replaced with a single `<button>` element, which when clicked will invoke the Web Share API.

Check out [this page with more examples](https://philnash.github.io/web-share-wrapper).

### Attributes

You can set attributes to control the text on the share button and the text and URL that is shared. The available attributes are:

* **text**: Sets the text on the share button.
* **template**: An id for a `<template>` element. The component will find the template, hydrate it and add it as the child of the component. This overrides the `text` attribute.
* **sharetitle**: Sets the title to be shared.
* **sharetext**: Sets the text to be shared. Falls back to the text contents of the `<title>` element.
* **shareurl**: Sets the URL to be shared. Fallsback to the `href` of the canonical link, failing that `window.location.href`.

```html
<web-share-wrapper text="Share this" sharetitle="This amazing thing was shared" sharetext="You should really click on the link to learn more" shareurl="http://example.com/amazing">
  <a href="https://twitter.com/intent/tweet?text=Share+Text&amp;url=SHARE_URL">Share on Twitter</a>
</web-share-wrapper>
```

Check out [this page with more examples](https://philnash.github.io/web-share-wrapper).

### Events

The `<web-share-wrapper>` emits one of two events in response to the result of using `navigator.share`.

If the share is successful then a `share-success` event is fired. The share title, text and URL are emitted in the `event`'s `details` (though the user may have edited them in the share target).

If the share is unsuccessful then a `share-failure` event is fired. The share title, text, URL and the error that was thrown are emitted in the `event`'s `details`.

## Installation

[TODO: tidy up, release to npm, include installation instructions]

## Tests

[TODO]

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/philnash/web-share-wrapper. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](http://contributor-covenant.org/) code of conduct.

## License

The code is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).

## Code of Conduct

Everyone interacting in the `<web-share-wrapper>` project’s codebases, issue trackers, chat rooms and mailing lists is expected to follow the [code of conduct](https://github.com/philnash/web-share-wrapper/blob/master/CODE_OF_CONDUCT.md).
