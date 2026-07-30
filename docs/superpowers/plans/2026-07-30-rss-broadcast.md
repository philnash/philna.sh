# RSS Broadcast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send one immediate Resend broadcast per newly deployed RSS item after the scheduled site deployment.

**Architecture:** A dependency-injected Node script snapshots the live RSS feed before deployment, polls it after deployment until its GUID set matches the built feed, diffs items by GUID, and sends new posts oldest-first. The GitHub Actions workflow only sequences the build, two script modes, and deployment; XML parsing, validation, email construction, polling, logging, and Resend calls remain in the script.

**Tech Stack:** Node.js 24 ESM, `node:test`, `fast-xml-parser`, `fast-xml-validator`, Resend Node SDK, GitHub Actions, Astro

## Global Constraints

- Send one broadcast per new RSS item, never a combined digest.
- Use RSS `<guid>` values as the sole identity and deduplication key.
- Use `RESEND_FROM_EMAIL` as the sender and `RESEND_SEGMENT_ID` as the segment.
- Create and send broadcasts immediately with `send: true`.
- Use the deployed RSS title, link, and decoded description as email source content.
- Send multiple posts oldest-first and stop at the first Resend failure.
- Fail loudly without adding durable retry or delivery state.
- Do not log secrets or full post bodies.
- Reject non-RSS and empty feed responses before using them as snapshots.
- Serialize workflow runs without cancelling an in-progress deployment.

---

## File Structure

- `scripts/rss-broadcast.mjs`: RSS parsing and validation, GUID comparison,
  email HTML construction, live-feed fetching and polling, sequential Resend
  sending, and `snapshot`/`broadcast` CLI modes.
- `test/rss-broadcast.test.mjs`: focused tests using generated RSS fixtures,
  fake `fetch`, fake delays, and a fake Resend client.
- `package.json`: direct XML parser/validator dependencies and script/test
  commands.
- `package-lock.json`: locked direct dependency metadata.
- `.github/workflows/trigger_deploy.yml`: invoke the two CLI modes around deploy
  and expose the required secrets only to the relevant steps.

### Task 1: Pure RSS comparison and email construction

**Files:**
- Create: `scripts/rss-broadcast.mjs`
- Create: `test/rss-broadcast.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `parseFeed(xml: string): FeedItem[]`
- Produces: `findNewPosts(beforeItems: FeedItem[], deployedItems: FeedItem[]): FeedItem[]`
- Produces: `haveSameGuids(leftItems: FeedItem[], rightItems: FeedItem[]): boolean`
- Produces: `buildBroadcastHtml(item: FeedItem): string`
- `FeedItem` has `guid`, `title`, `link`, `description`, `pubDate`, and `publishedAt`.

- [ ] **Step 1: Add the direct dependency and test commands**

Run:

```bash
npm install fast-xml-parser@^5.10.1 fast-xml-validator@^1.4.0
```

Add these scripts to `package.json`:

```json
"test": "node --test",
"rss:broadcast": "node scripts/rss-broadcast.mjs"
```

- [ ] **Step 2: Write failing parser, GUID comparison, ordering, and HTML tests**

Create `test/rss-broadcast.test.mjs` with `node:test` cases that:

```js
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

test("rejects missing and duplicate GUIDs", () => {
  assert.throws(() => parseFeed(rss([item({ guid: "" })])), /guid/i);
  assert.throws(
    () => parseFeed(rss([item(), item()])),
    /duplicate RSS item GUID/,
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
    item({ guid: "newer", link: "https://philna.sh/newer/", pubDate: "Thu, 30 Jul 2026 00:00:00 GMT" }),
    item({ guid: "older", link: "https://philna.sh/older/", pubDate: "Wed, 29 Jul 2026 00:00:00 GMT" }),
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
```

- [ ] **Step 3: Run the tests to verify they fail**

Run:

```bash
npm test
```

Expected: FAIL because `scripts/rss-broadcast.mjs` does not exist or does not
export the required functions.

- [ ] **Step 4: Implement the pure functions**

In `scripts/rss-broadcast.mjs`, configure `XMLParser` with attributes retained,
entity processing enabled, tag-value parsing disabled, and whitespace trimming
disabled. Add:

```js
import { XMLParser } from "fast-xml-parser";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  processEntities: true,
  trimValues: false,
});

function requiredText(value, field, index) {
  const text = typeof value === "object" && value !== null
    ? value["#text"]
    : value;
  if (typeof text !== "string" || text.trim() === "") {
    throw new Error(`RSS item ${index + 1} has no ${field}`);
  }
  return text.trim();
}

function validatedLink(value, index) {
  const link = requiredText(value, "link", index);
  const url = new URL(link);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`RSS item ${index + 1} has an invalid link`);
  }
  return link;
}

export function parseFeed(xml) {
  let document;
  try {
    document = xmlParser.parse(xml);
  } catch (error) {
    throw new Error("Could not parse RSS XML", { cause: error });
  }

  const rawItems = document?.rss?.channel?.item;
  const items = rawItems === undefined
    ? []
    : Array.isArray(rawItems) ? rawItems : [rawItems];
  const seenGuids = new Set();

  return items.map((rawItem, index) => {
    const guid = requiredText(rawItem?.guid, "guid", index);
    if (seenGuids.has(guid)) {
      throw new Error(`Duplicate RSS item GUID: ${guid}`);
    }
    seenGuids.add(guid);

    const pubDate = requiredText(rawItem?.pubDate, "pubDate", index);
    const publishedAt = new Date(pubDate);
    if (Number.isNaN(publishedAt.valueOf())) {
      throw new Error(`RSS item ${index + 1} has an invalid pubDate`);
    }

    return {
      guid,
      title: requiredText(rawItem?.title, "title", index),
      link: validatedLink(rawItem?.link, index),
      description: requiredText(rawItem?.description, "description", index),
      pubDate,
      publishedAt,
    };
  });
}

export function haveSameGuids(leftItems, rightItems) {
  if (leftItems.length !== rightItems.length) return false;
  const rightGuids = new Set(rightItems.map(({ guid }) => guid));
  return leftItems.every(({ guid }) => rightGuids.has(guid));
}

export function findNewPosts(beforeItems, deployedItems) {
  const beforeGuids = new Set(beforeItems.map(({ guid }) => guid));
  return deployedItems
    .filter(({ guid }) => !beforeGuids.has(guid))
    .sort((left, right) => left.publishedAt - right.publishedAt);
}

function escapeHtmlAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function buildBroadcastHtml(item) {
  return `${item.description}
<hr>
<p><a href="${escapeHtmlAttribute(item.link)}">Read this post on philna.sh</a></p>
<p><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Unsubscribe</a></p>`;
}
```

- [ ] **Step 5: Run the pure-function tests**

Run:

```bash
npm test
```

Expected: all current tests PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json scripts/rss-broadcast.mjs test/rss-broadcast.test.mjs
git commit -m "feat: compare RSS posts for broadcasts"
```

### Task 2: Feed polling, Resend sending, and CLI modes

**Files:**
- Modify: `scripts/rss-broadcast.mjs`
- Modify: `test/rss-broadcast.test.mjs`

**Interfaces:**
- Consumes: Task 1's `FeedItem`, `parseFeed`, `findNewPosts`,
  `haveSameGuids`, and `buildBroadcastHtml`.
- Produces: `fetchFeed(feedUrl, options): Promise<string>`
- Produces: `pollForDeployedFeed(options): Promise<FeedItem[]>`
- Produces: `sendBroadcasts(posts, options): Promise<string[]>`
- Produces: `main(argv, dependencies): Promise<void>`

- [ ] **Step 1: Write failing fetch, polling, sending, and CLI-oriented tests**

Extend `test/rss-broadcast.test.mjs` to verify:

```js
test("polls until the deployed GUID set matches the built feed", async () => {
  const oldXml = rss([item()]);
  const newXml = rss([item(), item({
    guid: "new",
    link: "https://philna.sh/new/",
  })]);
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
    item({ guid: "two", link: "https://philna.sh/two/" }),
  ])));

  assert.deepEqual(await sendBroadcasts(posts, {
    resend,
    segmentId: "segment",
    from: "Phil <sender@philna.sh>",
    logger: { log() {} },
  }), ["broadcast-1", "broadcast-2"]);
  assert.equal(calls[0].segmentId, "segment");
  assert.equal(calls[0].send, true);
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
  const posts = parseFeed(rss([item(), item({
    guid: "two",
    link: "https://philna.sh/two/",
  })]));

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
```

Import `pollForDeployedFeed` and `sendBroadcasts` from the script. Add a temporary
directory test for `main(["snapshot", feedUrl, outputPath], dependencies)` and a
no-new-post `broadcast` test that asserts the fake Resend factory is not called.

- [ ] **Step 2: Run tests to verify the new cases fail**

Run:

```bash
npm test
```

Expected: FAIL because the new async functions and CLI modes are not implemented.

- [ ] **Step 3: Implement fetching, polling, and sequential broadcasting**

Add Node imports for `readFile`, `writeFile`, `pathToFileURL`, and `Resend`.
Implement `fetchFeed` with a cache-busting query parameter, `Cache-Control:
no-cache`, `Pragma: no-cache`, response status validation, and returned response
text. Implement `pollForDeployedFeed` with defaults of 12 attempts and 5 seconds
between attempts. It must retry transient fetch/parse failures, return on exact
GUID-set equality, and throw an error that reports the attempt limit while
preserving the final failure as its cause.

Implement `sendBroadcasts` as:

```js
export async function sendBroadcasts(posts, {
  resend,
  segmentId,
  from,
  logger = console,
}) {
  const broadcastIds = [];
  for (const post of posts) {
    logger.log(`Sending broadcast for "${post.title}" (${post.guid})`);
    const { data, error } = await resend.broadcasts.create({
      segmentId,
      from,
      subject: post.title,
      html: buildBroadcastHtml(post),
      send: true,
    });
    if (error) {
      throw new Error(
        `Could not send broadcast for ${post.guid}: ${error.message ?? String(error)}`,
      );
    }
    if (!data?.id) {
      throw new Error(
        `Could not send broadcast for ${post.guid}: Resend returned no broadcast ID`,
      );
    }
    logger.log(`Sent broadcast ${data.id} for ${post.guid}`);
    broadcastIds.push(data.id);
  }
  return broadcastIds;
}
```

- [ ] **Step 4: Implement `snapshot` and `broadcast` CLI modes**

`snapshot <feed-url> <output-file>` fetches the live XML and writes it to the
output file.

`broadcast <snapshot-file> <built-feed-file> <feed-url>` reads and parses both
files, polls the deployed URL, finds new posts, logs and exits successfully if
there are none, validates `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and
`RESEND_SEGMENT_ID`, creates `new Resend(RESEND_API_KEY)`, then calls
`sendBroadcasts`.

Export `main(argv, dependencies)` for tests. Use `pathToFileURL(process.argv[1])`
to guard direct execution, print only the error message on failure, and set
`process.exitCode = 1`. Print usage and fail for unknown commands or wrong
argument counts.

- [ ] **Step 5: Run tests and checks**

Run:

```bash
npm test
npm run check
```

Expected: all tests PASS and Astro reports no errors.

- [ ] **Step 6: Commit**

```bash
git add scripts/rss-broadcast.mjs test/rss-broadcast.test.mjs
git commit -m "feat: send broadcasts for deployed RSS posts"
```

### Task 3: Deployment workflow integration and full verification

**Files:**
- Modify: `.github/workflows/trigger_deploy.yml`
- Modify: `test/rss-broadcast.test.mjs` only if workflow integration exposes a
  missed test case.

**Interfaces:**
- Consumes: `npm run rss:broadcast -- snapshot <feed-url> <output-file>`
- Consumes: `npm run rss:broadcast -- broadcast <snapshot-file> <built-feed-file> <feed-url>`

- [ ] **Step 1: Update the deployment workflow**

Add a top-level concurrency group so scheduled and manually dispatched runs wait
for the active deployment and broadcast sequence:

```yaml
concurrency:
  group: trigger-deploy
  cancel-in-progress: false
```

Add `RESEND_SEGMENT_ID: ${{ secrets.RESEND_SEGMENT_ID }}` to the build
environment. After Build and before Deploy, add:

```yaml
      - name: Snapshot deployed RSS feed
        run: >-
          npm run rss:broadcast -- snapshot
          https://philna.sh/feed.xml
          "$RUNNER_TEMP/feed-before.xml"
```

After Deploy, add:

```yaml
      - name: Broadcast new RSS posts
        run: >-
          npm run rss:broadcast -- broadcast
          "$RUNNER_TEMP/feed-before.xml"
          dist/client/feed.xml
          https://philna.sh/feed.xml
        env:
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          RESEND_FROM_EMAIL: ${{ secrets.RESEND_FROM_EMAIL }}
          RESEND_SEGMENT_ID: ${{ secrets.RESEND_SEGMENT_ID }}
```

- [ ] **Step 2: Run focused and project verification**

Run:

```bash
npm test
npm run check
npm run build
git diff --check
```

Expected: tests PASS, Astro check has zero errors, the production build
completes, and `git diff --check` emits no output.

- [ ] **Step 3: Exercise the safe no-op CLI path against fixtures**

Run the script with identical snapshot and built feeds using a temporary local
HTTP server or the test-injected CLI coverage. Confirm it reports zero new posts
and never requires or calls Resend.

- [ ] **Step 4: Review the final diff**

Confirm:

- the workflow snapshots before and broadcasts only after a successful deploy;
- GUIDs, not links, control equality and deduplication;
- only the broadcast step receives all three Resend secrets;
- no API keys, email bodies, or generated build artifacts are tracked;
- the design spec's failure and no-op behavior are covered.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/trigger_deploy.yml
git commit -m "ci: broadcast newly deployed blog posts"
```
