import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  buildBroadcastHtml,
  fetchFeed,
  findNewPosts,
  main,
  parseFeed,
  parseGuidLedger,
  sendBroadcasts,
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

test("rejects malformed RSS XML", () => {
  assert.throws(
    () => parseFeed("<rss><channel><item></channel></rss>"),
    /Could not parse RSS XML/,
  );
});

test("rejects well-formed XML without a non-empty RSS channel", () => {
  assert.throws(
    () => parseFeed("<html><body>Temporary error</body></html>"),
    /non-empty RSS channel/,
  );
  assert.throws(
    () => parseFeed(rss([])),
    /non-empty RSS channel/,
  );
});

test("rejects missing or invalid required item fields", () => {
  const invalidItems = [
    [item({ title: "" }), /title/],
    [item({ link: "" }), /link/],
    [item({ link: "javascript:alert(1)" }), /invalid link/],
    [item({ description: "" }), /description/],
    [item({ pubDate: "" }), /pubDate/],
    [item({ pubDate: "not a date" }), /invalid pubDate/],
  ];

  for (const [invalidItem, expectedError] of invalidItems) {
    assert.throws(() => parseFeed(rss([invalidItem])), expectedError);
  }
});

test("validates a GUID ledger", () => {
  assert.deepEqual(parseGuidLedger('["one", "two"]'), ["one", "two"]);
  assert.throws(() => parseGuidLedger("{"), /Could not parse GUID ledger/);
  assert.throws(() => parseGuidLedger("{}"), /JSON array/);
  assert.throws(() => parseGuidLedger('["one", 2]'), /non-empty string/);
  assert.throws(() => parseGuidLedger('["one", ""]'), /non-empty string/);
  assert.throws(() => parseGuidLedger('["one", "one"]'), /Duplicate GUID/);
});

test("discovers solely by GUID and orders unseen posts oldest-first", () => {
  const deployed = parseFeed(rss([
    item({
      guid: "seen",
      title: "Changed",
      link: "https://philna.sh/changed/",
    }),
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
    findNewPosts(["seen"], deployed).map(({ guid }) => guid),
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

test("fetches the feed with cache-busting headers", async () => {
  let request;
  const xml = rss([item()]);

  const result = await fetchFeed("https://philna.sh/feed.xml", {
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(xml);
    },
    cacheBust: "test-run",
  });

  assert.equal(result, xml);
  assert.equal(
    request.url,
    "https://philna.sh/feed.xml?deployment_check=test-run",
  );
  assert.equal(request.options.headers["Cache-Control"], "no-cache");
  assert.equal(request.options.headers.Pragma, "no-cache");
});

test("rejects an unsuccessful feed response", async () => {
  await assert.rejects(
    fetchFeed("https://philna.sh/feed.xml", {
      fetchImpl: async () => new Response("Unavailable", {
        status: 503,
        statusText: "Service Unavailable",
      }),
    }),
    /503 Service Unavailable/,
  );
});

test("sends one immediate broadcast per post in sequence", async () => {
  const calls = [];
  const resend = {
    broadcasts: {
      create: async (request) => {
        calls.push(request);
        return { data: { id: `broadcast-${calls.length}` }, error: null };
      },
    },
  };
  const posts = findNewPosts([], parseFeed(rss([
    item({ guid: "one" }),
    item({
      guid: "two",
      link: "https://philna.sh/two/",
      pubDate: "Fri, 31 Jul 2026 00:00:00 GMT",
    }),
  ])));

  assert.deepEqual(await sendBroadcasts(posts, {
    resend,
    segmentId: "segment",
    from: "Phil <sender@philna.sh>",
    logger: { log() {} },
  }), ["broadcast-1", "broadcast-2"]);
  assert.deepEqual(calls[0], {
    segmentId: "segment",
    from: "Phil <sender@philna.sh>",
    subject: "Post & one",
    html: buildBroadcastHtml(posts[0]),
    send: true,
  });
  assert.equal(calls[1].subject, "Post & one");
});

test("stops and surfaces the first Resend error", async () => {
  let calls = 0;
  const resend = {
    broadcasts: {
      create: async () => {
        calls += 1;
        return { data: null, error: { message: "Rejected" } };
      },
    },
  };
  const posts = parseFeed(rss([
    item(),
    item({
      guid: "two",
      link: "https://philna.sh/two/",
    }),
  ]));

  await assert.rejects(
    sendBroadcasts(posts, {
      resend,
      segmentId: "segment",
      from: "sender@philna.sh",
      logger: { log() {} },
    }),
    /Rejected/,
  );
  assert.equal(calls, 1);
});

test("rejects a Resend response without a broadcast ID", async () => {
  await assert.rejects(
    sendBroadcasts(parseFeed(rss([item()])), {
      resend: {
        broadcasts: {
          create: async () => ({ data: {}, error: null }),
        },
      },
      segmentId: "segment",
      from: "sender@philna.sh",
      logger: { log() {} },
    }),
    /no broadcast ID/,
  );
});
