# RSS rendered content and absolute URLs

## Goal

Generate each RSS item from the same Astro-rendered blog content used by the public post page. The feed must contain images, and every image or link URL must work independently of the site page that originally contained it.

## Rendering

`src/pages/feed.xml.ts` will stop parsing each post's raw Markdown with `markdown-it`. For every blog entry, it will call Astro's content collection `render()` function and render the returned `Content` component to an HTML string with Astro's server-side container.

This preserves the site's configured Markdown processing and lets Astro resolve source-relative image imports to their generated public asset URLs before the feed transforms them. The container request URL will be the post's canonical public URL so contextual rendering matches the post page.

Feed generation requires the configured `site` URL. If it is absent, generation will fail with a clear error because neither canonical post URLs nor absolute content URLs can be produced correctly.

## Sanitizing and URL rewriting

The rendered HTML will continue to pass through `sanitize-html`. The existing default policy will be retained, with `img` explicitly added because it is not included in the library's default allowed tags.

During sanitization, URL-bearing attributes will be normalized:

- `a[href]` values will be resolved against the post's canonical URL.
- `img[src]` values will be resolved against the post's canonical URL.
- Each candidate URL in `img[srcset]` will be resolved while retaining its width or pixel-density descriptor.
- URLs that already have a scheme, including `https:`, `mailto:`, and `data:`, will retain that scheme.
- Protocol-relative, root-relative, document-relative, query-only, and fragment-only references will become absolute using normal URL resolution rules.

Other HTML and the feed's existing titles, publication dates, links, categories, ordering, and channel metadata will remain unchanged.

## CDATA serialization

Each item's complete sanitized HTML will remain in its RSS `<description>` field and will be serialized as CDATA:

```xml
<description><![CDATA[<p>...</p><img src="https://philna.sh/...">]]></description>
```

CDATA wraps the entire item description, including any image elements; it does not wrap individual tags. Any `]]>` sequence in post content will be split across adjacent CDATA sections so the feed remains well-formed XML.

The installed `@astrojs/rss` serializer entity-encodes description strings and does not expose a CDATA option. Feed generation will therefore give the serializer unique placeholder descriptions and replace only those exact item placeholders with CDATA-wrapped HTML in the serialized response. The channel description will not be changed. Keeping full content in `<description>` also preserves compatibility with consumers that already read that field.

## Testing

Regression coverage will be added before production changes and observed failing against the current implementation. Tests will cover:

- an Astro-rendered source-relative Markdown image becoming a generated public asset URL;
- root-relative and document-relative image sources becoming absolute;
- every `srcset` candidate becoming absolute without losing its descriptor;
- root-relative, document-relative, and fragment links becoming absolute;
- already absolute and non-HTTP scheme URLs remaining valid;
- `<img>` elements surviving sanitization;
- item descriptions containing real HTML inside CDATA rather than entity-encoded HTML;
- safe handling of a `]]>` sequence;
- the generated result parsing as valid XML; and
- the full site build producing a feed with absolute image and link URLs.

Verification will run the focused regression tests, Astro's type/content checks, and a production build. The built `dist/client/feed.xml` will be inspected for CDATA-wrapped post HTML and absolute image and link URLs.
