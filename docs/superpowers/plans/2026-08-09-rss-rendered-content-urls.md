# RSS Rendered Content and Absolute URLs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate full RSS item descriptions from Astro-rendered post HTML, make image and link URLs absolute, and serialize each item description as CDATA.

**Architecture:** Keep feed-specific HTML transformation and RSS serialization in a focused `src/utils/feed_html.ts` module. The feed endpoint will use Astro's content renderer and server-side container to obtain the same compiled HTML as a post page, pass that HTML through the helper, and then use a wrapper around `@astrojs/rss` that substitutes CDATA descriptions without changing other RSS metadata.

**Tech Stack:** Astro 7 content collections and container API, `@astrojs/rss`, `sanitize-html`, Node 24 built-in test runner, TypeScript, `xmllint`.

## Global Constraints

- Render every post through Astro before rewriting URLs so source-relative content images become generated public assets.
- Resolve `a[href]`, `img[src]`, and every `img[srcset]` candidate against the post's canonical public URL.
- Retain already absolute schemes and normal URL-resolution semantics for root-relative, document-relative, query-only, and fragment-only references.
- Keep full post HTML in each item's existing `<description>` field.
- Wrap the complete item description in CDATA and safely split any `]]>` sequence.
- Preserve existing feed titles, publication dates, links, categories, ordering, and channel metadata.
- Do not add dependencies; use the packages and Node runtime already installed.

---

## File structure

- Create `src/utils/feed_html.ts`: sanitize rendered HTML, absolutize link and image attributes, and wrap `@astrojs/rss` output with CDATA item descriptions.
- Create `src/utils/feed_html.test.ts`: focused unit tests for URL rewriting, image retention, `srcset`, CDATA, and unchanged channel metadata.
- Modify `src/pages/feed.xml.ts`: render collection entries through Astro and delegate transformation and serialization to `feed_html.ts`.
- Create `scripts/feed-output.test.mjs`: inspect the production-built feed using a real post containing a source-relative Astro image and a root-relative internal link.
- Modify `package.json`: expose the focused Node test suite as `npm test`.

### Task 1: Sanitize rendered post HTML and make URLs absolute

**Files:**
- Create: `src/utils/feed_html.ts`
- Create: `src/utils/feed_html.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: an Astro-rendered HTML string and the canonical post URL.
- Produces: `sanitizeFeedHtml(html: string, baseUrl: URL): string` for the feed endpoint and the CDATA serializer added in Task 2.

- [ ] **Step 1: Add the focused test command and failing URL-transformation tests**

Add this script to `package.json`:

```json
"test": "node --test src/utils/feed_html.test.ts"
```

Create `src/utils/feed_html.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeFeedHtml } from "./feed_html.ts";

const postUrl = new URL(
  "https://philna.sh/blog/2026/03/05/talking-tips/",
);

test("keeps images and makes src and srcset URLs absolute", () => {
  const html = `
    <img
      src="/_astro/example.hash.gif"
      srcset="/_astro/example.hash.gif 1x, images/example-large.gif 2x"
      alt="An example"
    >
    <img src="images/local.gif" alt="A local example">
  `;

  const result = sanitizeFeedHtml(html, postUrl);

  assert.match(
    result,
    /src="https:\/\/philna\.sh\/_astro\/example\.hash\.gif"/,
  );
  assert.match(
    result,
    /srcset="https:\/\/philna\.sh\/_astro\/example\.hash\.gif 1x, https:\/\/philna\.sh\/blog\/2026\/03\/05\/talking-tips\/images\/example-large\.gif 2x"/,
  );
  assert.match(
    result,
    /src="https:\/\/philna\.sh\/blog\/2026\/03\/05\/talking-tips\/images\/local\.gif"/,
  );
  assert.match(result, /alt="An example"/);
});

test("makes internal and same-document links absolute", () => {
  const html = `
    <a href="/speaking">Speaking</a>
    <a href="../another-post/">Another post</a>
    <a href="?format=full">Full view</a>
    <a href="#examples">Examples</a>
  `;

  const result = sanitizeFeedHtml(html, postUrl);

  assert.match(result, /href="https:\/\/philna\.sh\/speaking"/);
  assert.match(
    result,
    /href="https:\/\/philna\.sh\/blog\/2026\/03\/05\/another-post\/"/,
  );
  assert.match(
    result,
    /href="https:\/\/philna\.sh\/blog\/2026\/03\/05\/talking-tips\/\?format=full"/,
  );
  assert.match(
    result,
    /href="https:\/\/philna\.sh\/blog\/2026\/03\/05\/talking-tips\/#examples"/,
  );
});

test("retains URLs that already have a scheme", () => {
  const html = `
    <a href="https://example.com/path">External</a>
    <a href="mailto:phil@example.com">Email</a>
    <img src="//cdn.example.com/image.png" alt="CDN image">
    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" alt="Pixel">
  `;

  const result = sanitizeFeedHtml(html, postUrl);

  assert.match(result, /href="https:\/\/example\.com\/path"/);
  assert.match(result, /href="mailto:phil@example\.com"/);
  assert.match(result, /src="https:\/\/cdn\.example\.com\/image\.png"/);
  assert.match(result, /src="data:image\/gif;base64,R0lGODlh/);
});
```

- [ ] **Step 2: Run the focused tests and verify the RED state**

Run:

```bash
npm test
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/utils/feed_html.ts` because the production helper does not exist yet.

- [ ] **Step 3: Implement the minimal sanitizing and URL-rewriting helper**

Create `src/utils/feed_html.ts`:

```ts
import sanitize from "sanitize-html";

function absoluteUrl(value: string, baseUrl: URL): string {
  return new URL(value, baseUrl).toString();
}

function absoluteSrcset(value: string, baseUrl: URL): string {
  return value
    .split(",")
    .map((candidate) => {
      const match = candidate.trim().match(/^(\S+)(.*)$/);
      if (!match) return candidate.trim();

      const [, url, descriptor] = match;
      return `${absoluteUrl(url, baseUrl)}${descriptor}`;
    })
    .join(", ");
}

export function sanitizeFeedHtml(html: string, baseUrl: URL): string {
  return sanitize(html, {
    allowedTags: [...sanitize.defaults.allowedTags, "img"],
    allowedSchemesByTag: {
      ...sanitize.defaults.allowedSchemesByTag,
      img: [...sanitize.defaults.allowedSchemes, "data"],
    },
    transformTags: {
      a(tagName, attribs) {
        return {
          tagName,
          attribs: {
            ...attribs,
            ...(attribs.href
              ? { href: absoluteUrl(attribs.href, baseUrl) }
              : {}),
          },
        };
      },
      img(tagName, attribs) {
        return {
          tagName,
          attribs: {
            ...attribs,
            ...(attribs.src
              ? { src: absoluteUrl(attribs.src, baseUrl) }
              : {}),
            ...(attribs.srcset
              ? { srcset: absoluteSrcset(attribs.srcset, baseUrl) }
              : {}),
          },
        };
      },
    },
  });
}
```

- [ ] **Step 4: Run the focused tests and verify the GREEN state**

Run:

```bash
npm test
```

Expected: 3 tests pass with no failures.

- [ ] **Step 5: Run the Astro type and content check**

Run:

```bash
npm run check
```

Expected: Astro reports 0 errors. Record any pre-existing hints separately; do not broaden this task to fix them.

- [ ] **Step 6: Commit the URL transformation**

```bash
git add package.json src/utils/feed_html.ts src/utils/feed_html.test.ts
git commit -m "Add absolute RSS content URLs"
```

### Task 2: Serialize item descriptions as CDATA

**Files:**
- Modify: `src/utils/feed_html.ts`
- Modify: `src/utils/feed_html.test.ts`

**Interfaces:**
- Consumes: `RSSOptions` whose `items` value is an `RSSFeedItem[]` and whose item descriptions contain sanitized HTML.
- Produces: `rssWithCdataDescriptions(options: RSSOptionsWithItems): Promise<Response>`, preserving the `@astrojs/rss` response while replacing only item-description placeholders with CDATA.

- [ ] **Step 1: Add failing CDATA and boundary tests**

Append to `src/utils/feed_html.test.ts`:

```ts
import { rssWithCdataDescriptions } from "./feed_html.ts";

test("wraps item HTML in CDATA without changing the channel description", async () => {
  const response = await rssWithCdataDescriptions({
    title: "Test feed",
    description: "Channel <summary>",
    site: "https://philna.sh",
    items: [
      {
        title: "Test post",
        link: "/blog/test-post/",
        description: '<p>Post</p><img src="https://philna.sh/image.png">',
      },
    ],
  });
  const xml = await response.text();

  assert.match(
    xml,
    /<channel><title>Test feed<\/title><description>Channel &lt;summary&gt;<\/description>/,
  );
  assert.match(
    xml,
    /<description><!\[CDATA\[<p>Post<\/p><img src="https:\/\/philna\.sh\/image\.png">\]\]><\/description>/,
  );
  assert.doesNotMatch(xml, /&lt;img src=/);
});

test("splits a CDATA terminator across adjacent CDATA sections", async () => {
  const response = await rssWithCdataDescriptions({
    title: "Test feed",
    description: "Channel summary",
    site: "https://philna.sh",
    items: [
      {
        title: "Test post",
        description: "<p>Before ]]> after</p>",
      },
    ],
  });
  const xml = await response.text();

  assert.match(
    xml,
    /<!\[CDATA\[<p>Before \]\]\]\]><!\[CDATA\[> after<\/p>\]\]>/,
  );
});
```

Combine the two imports from `./feed_html.ts` at the top of the file:

```ts
import {
  rssWithCdataDescriptions,
  sanitizeFeedHtml,
} from "./feed_html.ts";
```

- [ ] **Step 2: Run only the new tests and verify the RED state**

Run:

```bash
node --test --test-name-pattern="CDATA" src/utils/feed_html.test.ts
```

Expected: FAIL because `rssWithCdataDescriptions` is not exported.

- [ ] **Step 3: Implement CDATA-safe RSS serialization**

Add these imports at the top of `src/utils/feed_html.ts`:

```ts
import rss from "@astrojs/rss";
import type { RSSFeedItem, RSSOptions } from "@astrojs/rss";
```

Append this implementation:

```ts
type RSSOptionsWithItems = Omit<RSSOptions, "items"> & {
  items: RSSFeedItem[];
};

function cdata(value: string): string {
  return `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
}

export async function rssWithCdataDescriptions(
  options: RSSOptionsWithItems,
): Promise<Response> {
  const descriptions = new Map<string, string>();
  const items = options.items.map((item, index) => {
    if (item.description === undefined) return item;

    const placeholder = `__RSS_ITEM_DESCRIPTION_${index}__`;
    descriptions.set(placeholder, item.description);
    return { ...item, description: placeholder };
  });

  const response = await rss({ ...options, items });
  let xml = await response.text();

  for (const [placeholder, description] of descriptions) {
    const serializedPlaceholder =
      `<description>${placeholder}</description>`;
    const firstMatch = xml.indexOf(serializedPlaceholder);
    const secondMatch = xml.indexOf(
      serializedPlaceholder,
      firstMatch + serializedPlaceholder.length,
    );

    if (firstMatch === -1 || secondMatch !== -1) {
      throw new Error(
        `Expected exactly one serialized RSS description placeholder: ${placeholder}`,
      );
    }

    xml = xml.replace(
      serializedPlaceholder,
      `<description>${cdata(description)}</description>`,
    );
  }

  return new Response(xml, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });
}
```

- [ ] **Step 4: Run the complete focused suite and verify the GREEN state**

Run:

```bash
npm test
```

Expected: 5 tests pass with no failures.

- [ ] **Step 5: Run the Astro check**

Run:

```bash
npm run check
```

Expected: Astro reports 0 errors.

- [ ] **Step 6: Commit CDATA serialization**

```bash
git add src/utils/feed_html.ts src/utils/feed_html.test.ts
git commit -m "Serialize RSS post content as CDATA"
```

### Task 3: Render real Astro post content in the feed

**Files:**
- Modify: `src/pages/feed.xml.ts`
- Create: `scripts/feed-output.test.mjs`

**Interfaces:**
- Consumes: `sanitizeFeedHtml(html: string, baseUrl: URL): string` and `rssWithCdataDescriptions(options: RSSOptionsWithItems): Promise<Response>` from Tasks 1 and 2.
- Produces: a production `dist/client/feed.xml` whose item descriptions contain Astro-generated asset URLs, absolute links, and CDATA-wrapped HTML.

- [ ] **Step 1: Add the production-feed regression test**

Create `scripts/feed-output.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("built feed contains Astro-rendered images and absolute content URLs in CDATA", async () => {
  const feed = await readFile("dist/client/feed.xml", "utf8");
  const item = feed.match(
    /<item><title>5 quick tips for giving better presentations<\/title>.*?<\/item>/s,
  )?.[0];

  assert.ok(item, "expected the talking tips post in the built feed");
  assert.match(item, /<description><!\[CDATA\[/);
  assert.match(
    item,
    /<img [^>]*src="https:\/\/philna\.sh\/_astro\/zooming-vscode\.[^"]+\.gif"/,
  );
  assert.match(
    item,
    /<a href="https:\/\/philna\.sh\/speaking">speaking publicly<\/a>/,
  );
  assert.doesNotMatch(item, /\b(?:href|src)="(?:\/|\.\.?\/)/);
  assert.match(item, /\]\]><\/description>/);
});
```

- [ ] **Step 2: Build the unchanged endpoint and verify the integration test is RED**

Run:

```bash
npm run build
node --test scripts/feed-output.test.mjs
```

Expected: the build succeeds, then the test FAILS because the current feed entity-encodes HTML, strips the source-relative image, and retains `/speaking`.

- [ ] **Step 3: Replace raw Markdown parsing with Astro rendering**

Replace `src/pages/feed.xml.ts` with:

```ts
import type { APIContext } from "astro";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { render } from "astro:content";
import { postPath, sortedBlogPosts } from "../utils/blog_posts";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts";
import {
  rssWithCdataDescriptions,
  sanitizeFeedHtml,
} from "../utils/feed_html";

export async function GET({ site, generator }: APIContext) {
  if (!site) {
    throw new Error(
      "The RSS feed requires Astro's site configuration to generate absolute URLs.",
    );
  }

  const posts = await sortedBlogPosts();
  const container = await AstroContainer.create();
  const items = await Promise.all(
    posts.map(async (post) => {
      const postUrl = new URL(postPath(post), site);
      const { Content } = await render(post);
      const renderedHtml = await container.renderToString(Content, {
        request: new Request(postUrl),
      });

      return {
        title: post.data.title,
        description: sanitizeFeedHtml(renderedHtml, postUrl),
        pubDate: post.data.pubDate,
        link: postPath(post),
        customData: post.data.tags
          .map((tag) => `<category>${tag}</category>`)
          .join(""),
      };
    }),
  );

  return rssWithCdataDescriptions({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site,
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    customData: `
      <atom:link href="${site}feed.xml" rel="self" type="application/rss+xml" />
      <pubDate>${posts[0].data.pubDate.toUTCString()}</pubDate>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      <generator>${generator}</generator>
    `,
    items,
  });
}
```

- [ ] **Step 4: Run the focused unit tests and Astro check**

Run:

```bash
npm test
npm run check
```

Expected: 5 unit tests pass and Astro reports 0 errors.

- [ ] **Step 5: Build and verify the real feed is GREEN**

Run:

```bash
npm run build
node --test scripts/feed-output.test.mjs
xmllint --noout dist/client/feed.xml
```

Expected: the production build succeeds, the production-feed regression test passes, and `xmllint` exits 0 without output.

- [ ] **Step 6: Inspect the generated feed for the required output boundaries**

Run:

```bash
rg -n -m 5 "CDATA|zooming-vscode|https://philna.sh/speaking" dist/client/feed.xml
```

Expected: the talking-tips item contains a CDATA description, an absolute `https://philna.sh/_astro/zooming-vscode...gif` image URL, and an absolute `https://philna.sh/speaking` link.

- [ ] **Step 7: Commit the endpoint integration**

```bash
git add src/pages/feed.xml.ts scripts/feed-output.test.mjs
git commit -m "Render full Astro posts in RSS feed"
```

### Task 4: Final verification

**Files:**
- Verify only; no planned file changes.

**Interfaces:**
- Consumes: the completed implementation from Tasks 1 through 3.
- Produces: recorded evidence that unit behavior, Astro validation, the production build, RSS output behavior, and XML well-formedness all pass together.

- [ ] **Step 1: Run every automated verification command from a clean worktree**

Run:

```bash
git status --short
npm test
npm run check
npm run build
node --test scripts/feed-output.test.mjs
xmllint --noout dist/client/feed.xml
git diff --check HEAD~3..HEAD
```

Expected: the initial status is clean, all 5 unit tests pass, Astro reports 0 errors, the build and integration test pass, `xmllint` exits 0, and `git diff --check` emits no output.

- [ ] **Step 2: Review the final commit series and generated-feed evidence**

Run:

```bash
git log -5 --oneline
rg -n -m 5 "CDATA|zooming-vscode|https://philna.sh/speaking" dist/client/feed.xml
```

Expected: the log contains the design and implementation-plan commits plus the three focused implementation commits, and the built feed shows CDATA-wrapped HTML with absolute image and link URLs.
