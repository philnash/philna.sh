import assert from "node:assert/strict";
import { test } from "node:test";
import {
  rssWithCdataDescriptions,
  sanitizeFeedHtml,
} from "./feed_html.ts";

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
    <img src="/single.gif" srcset="/single.gif" alt="A single candidate">
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
  assert.match(result, /srcset="https:\/\/philna\.sh\/single\.gif"/);
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

test("retains comma-containing data URLs in srcset", () => {
  const html = `
    <img
      src="/fallback.gif"
      srcset="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw== 1x, /large.gif 2x"
      alt="Responsive pixel"
    >
  `;

  const result = sanitizeFeedHtml(html, postUrl);

  assert.match(
    result,
    /srcset="data:image\/gif;base64,R0lGODlhAQABAIAAAAAAAP\/\/\/ywAAAAAAQABAAACAUwAOw== 1x, https:\/\/philna\.sh\/large\.gif 2x"/,
  );
});

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
