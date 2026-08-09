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
