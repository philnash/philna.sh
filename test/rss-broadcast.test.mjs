import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  buildBroadcastHtml,
  fetchFeed,
  findNewPosts,
  haveSameGuids,
  main,
  parseFeed,
  pollForDeployedFeed,
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

test("polls until the deployed GUID set matches the built feed", async () => {
  const oldXml = rss([item()]);
  const newXml = rss([
    item(),
    item({
      guid: "new",
      link: "https://philna.sh/new/",
    }),
  ]);
  const responses = [oldXml, newXml];
  const delays = [];

  const posts = await pollForDeployedFeed({
    feedUrl: "https://philna.sh/feed.xml",
    expectedItems: parseFeed(newXml),
    fetchImpl: async () => new Response(responses.shift()),
    delay: async (milliseconds) => delays.push(milliseconds),
    maxAttempts: 2,
    pollIntervalMs: 5,
  });

  assert.deepEqual(posts.map(({ guid }) => guid), [
    "https://philna.sh/post-1/",
    "new",
  ]);
  assert.deepEqual(delays, [5]);
});

test("retries a transient feed error while polling", async () => {
  const xml = rss([item()]);
  let attempts = 0;

  const posts = await pollForDeployedFeed({
    feedUrl: "https://philna.sh/feed.xml",
    expectedItems: parseFeed(xml),
    fetchImpl: async () => {
      attempts += 1;
      return attempts === 1
        ? new Response("Unavailable", { status: 503 })
        : new Response(xml);
    },
    delay: async () => {},
    maxAttempts: 2,
    pollIntervalMs: 0,
  });

  assert.equal(posts.length, 1);
  assert.equal(attempts, 2);
});

test("fails after the deployed feed polling limit", async () => {
  await assert.rejects(
    pollForDeployedFeed({
      feedUrl: "https://philna.sh/feed.xml",
      expectedItems: parseFeed(rss([item({ guid: "new" })])),
      fetchImpl: async () => new Response(rss([item()])),
      delay: async () => {},
      maxAttempts: 2,
      pollIntervalMs: 0,
    }),
    /did not match the built feed after 2 attempts/,
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

test("snapshot mode writes the fetched feed", async () => {
  const directory = await mkdtemp(join(tmpdir(), "rss-broadcast-"));
  const outputPath = join(directory, "before.xml");
  const xml = rss([item()]);

  await main([
    "snapshot",
    "https://philna.sh/feed.xml",
    outputPath,
  ], {
    fetchImpl: async () => new Response(xml),
    logger: { log() {} },
  });

  assert.equal(await readFile(outputPath, "utf8"), xml);
});

test("broadcast mode is a no-op when there are no new GUIDs", async () => {
  const directory = await mkdtemp(join(tmpdir(), "rss-broadcast-"));
  const snapshotPath = join(directory, "before.xml");
  const builtPath = join(directory, "built.xml");
  const xml = rss([item()]);
  await Promise.all([
    writeFile(snapshotPath, xml),
    writeFile(builtPath, xml),
  ]);
  const messages = [];

  await main([
    "broadcast",
    snapshotPath,
    builtPath,
    "https://philna.sh/feed.xml",
  ], {
    env: {},
    fetchImpl: async () => new Response(xml),
    logger: { log(message) { messages.push(message); } },
    resendFactory: () => {
      throw new Error("Resend should not be constructed");
    },
  });

  assert.deepEqual(messages, ["No new RSS posts to broadcast."]);
});

test("broadcast mode passes secrets and new RSS content to Resend", async () => {
  const directory = await mkdtemp(join(tmpdir(), "rss-broadcast-"));
  const snapshotPath = join(directory, "before.xml");
  const builtPath = join(directory, "built.xml");
  const beforeXml = rss([item()]);
  const deployedXml = rss([
    item(),
    item({
      guid: "new",
      title: "New post",
      link: "https://philna.sh/new/",
      description: "&lt;p&gt;New body&lt;/p&gt;",
      pubDate: "Fri, 31 Jul 2026 00:00:00 GMT",
    }),
  ]);
  await Promise.all([
    writeFile(snapshotPath, beforeXml),
    writeFile(builtPath, deployedXml),
  ]);
  let apiKey;
  const requests = [];

  await main([
    "broadcast",
    snapshotPath,
    builtPath,
    "https://philna.sh/feed.xml",
  ], {
    env: {
      RESEND_API_KEY: "secret",
      RESEND_FROM_EMAIL: "Phil <sender@philna.sh>",
      RESEND_SEGMENT_ID: "segment",
    },
    fetchImpl: async () => new Response(deployedXml),
    logger: { log() {} },
    resendFactory: (value) => {
      apiKey = value;
      return {
        broadcasts: {
          create: async (request) => {
            requests.push(request);
            return { data: { id: "broadcast-id" }, error: null };
          },
        },
      };
    },
  });

  assert.equal(apiKey, "secret");
  assert.deepEqual(requests, [{
    segmentId: "segment",
    from: "Phil <sender@philna.sh>",
    subject: "New post",
    html: `<p>New body</p>
<hr>
<p><a href="https://philna.sh/new/">Read this post on philna.sh</a></p>
<p><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Unsubscribe</a></p>`,
    send: true,
  }]);
});

test("broadcast mode fails when a required Resend secret is missing", async () => {
  const directory = await mkdtemp(join(tmpdir(), "rss-broadcast-"));
  const snapshotPath = join(directory, "before.xml");
  const builtPath = join(directory, "built.xml");
  const beforeXml = rss([item()]);
  const deployedXml = rss([
    item(),
    item({
      guid: "new",
      link: "https://philna.sh/new/",
    }),
  ]);
  await Promise.all([
    writeFile(snapshotPath, beforeXml),
    writeFile(builtPath, deployedXml),
  ]);

  await assert.rejects(
    main([
      "broadcast",
      snapshotPath,
      builtPath,
      "https://philna.sh/feed.xml",
    ], {
      env: {},
      fetchImpl: async () => new Response(deployedXml),
      logger: { log() {} },
    }),
    /RESEND_API_KEY/,
  );
});
