import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBroadcastHtml,
  findNewPosts,
  haveSameGuids,
  parseFeed,
} from "../scripts/rss-broadcast.mjs";

function rss(items) {
  return `<?xml version="1.0"?><rss><channel>${items.join("")}</channel></rss>`;
}

function item({
  guid = "https://philna.sh/post-1/",
  title = "Post &amp; one",
  link = "https://philna.sh/post-1/",
  description = "&lt;p&gt;Body &amp;amp; more&lt;/p&gt;",
  pubDate = "Thu, 30 Jul 2026 00:00:00 GMT",
} = {}) {
  return `<item><title>${title}</title><link>${link}</link><guid isPermaLink="true">${guid}</guid><description>${description}</description><pubDate>${pubDate}</pubDate></item>`;
}

test("parses a single item and decodes its HTML description", () => {
  assert.deepEqual(parseFeed(rss([item()]))[0], {
    guid: "https://philna.sh/post-1/",
    title: "Post & one",
    link: "https://philna.sh/post-1/",
    description: "<p>Body &amp; more</p>",
    pubDate: "Thu, 30 Jul 2026 00:00:00 GMT",
    publishedAt: new Date("Thu, 30 Jul 2026 00:00:00 GMT"),
  });
});

test("parses multiple items", () => {
  const posts = parseFeed(rss([
    item(),
    item({
      guid: "https://philna.sh/post-2/",
      link: "https://philna.sh/post-2/",
    }),
  ]));

  assert.equal(posts.length, 2);
});

test("rejects a missing GUID", () => {
  assert.throws(() => parseFeed(rss([item({ guid: "" })])), /guid/i);
});

test("rejects duplicate GUIDs", () => {
  assert.throws(
    () => parseFeed(rss([item(), item()])),
    /duplicate RSS item GUID/i,
  );
});

test("compares and deduplicates solely by GUID", () => {
  const before = parseFeed(rss([item()]));
  const changed = parseFeed(rss([item({
    title: "Changed",
    link: "https://philna.sh/changed/",
  })]));

  assert.equal(haveSameGuids(before, changed), true);
  assert.deepEqual(findNewPosts(before, changed), []);
});

test("returns new posts oldest-first", () => {
  const deployed = parseFeed(rss([
    item({
      guid: "newer",
      link: "https://philna.sh/newer/",
      pubDate: "Thu, 30 Jul 2026 00:00:00 GMT",
    }),
    item({
      guid: "older",
      link: "https://philna.sh/older/",
      pubDate: "Wed, 29 Jul 2026 00:00:00 GMT",
    }),
  ]));

  assert.deepEqual(
    findNewPosts([], deployed).map(({ guid }) => guid),
    ["older", "newer"],
  );
});

test("builds HTML from the RSS body with post and unsubscribe links", () => {
  const [post] = parseFeed(rss([item()]));

  assert.equal(
    buildBroadcastHtml(post),
    `<p>Body &amp; more</p>
<hr>
<p><a href="https://philna.sh/post-1/">Read this post on philna.sh</a></p>
<p><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Unsubscribe</a></p>`,
  );
});
