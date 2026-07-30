# RSS Broadcast GUID Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send one Resend broadcast for each RSS post that has not appeared in the repository's checked-in GUID ledger.

**Architecture:** After deployment, a Node `prepare` command validates the live RSS feed and checked-in GUID ledger, writes unseen posts to an ephemeral pending file, and appends their GUIDs to the ledger. The workflow commits and pushes that ledger update to `main` before a separate `send` command constructs Resend and sends the pending posts sequentially.

**Tech Stack:** Node.js 24 ESM, `node:test`, `fast-xml-parser`, `fast-xml-validator`, Resend Node SDK, GitHub Actions, Astro

## Global Constraints

- Send one immediate broadcast per unseen RSS GUID with `send: true`.
- Use `RESEND_FROM_EMAIL` as sender and `RESEND_SEGMENT_ID` as segment.
- Use the deployed RSS title, link, and decoded description as email content.
- Sort multiple unseen posts by `pubDate` ascending and stop at the first Resend failure.
- Reject malformed or duplicate RSS and ledger GUIDs; do not silently repair state.
- Preserve historical GUIDs that no longer appear in the feed.
- Commit and push new GUIDs before sending; push failure must prevent all sends.
- Empty pending state must not construct Resend or require Resend secrets.
- Fail loudly and rely on manual recovery if sending fails after the ledger commit.
- Run only from the repository default branch and serialize runs without cancellation.
- Never log secrets or full post bodies.

---

## File Structure

- `scripts/rss-broadcast.mjs`: RSS validation, ledger/pending validation, GUID discovery, file preparation, Resend sending, and `prepare`/`send` CLI modes.
- `test/rss-broadcast.test.mjs`: pure and integration-style Node tests using generated RSS, temporary files, fake `fetch`, and fake Resend clients.
- `.github/rss-broadcast-guids.json`: append-only JSON array seeded from the current deployed feed.
- `.github/workflows/trigger_deploy.yml`: deploy, prepare, commit/push state, then send.

### Task 1: GUID ledger parsing and discovery

**Files:**
- Modify: `test/rss-broadcast.test.mjs`
- Modify: `scripts/rss-broadcast.mjs`

**Interfaces:**
- Produces: `parseGuidLedger(json: string): string[]`
- Produces: `findNewPosts(seenGuids: string[], deployedItems: FeedItem[]): FeedItem[]`
- Retains: `parseFeed(xml: string): FeedItem[]`
- Retains: `buildBroadcastHtml(item: FeedItem): string`

- [ ] **Step 1: Replace obsolete comparison tests with failing ledger tests**

Import `parseGuidLedger` and update discovery calls to pass GUID strings. Add:

```js
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
    item({ guid: "seen", title: "Changed", link: "https://philna.sh/changed/" }),
    item({ guid: "newer", link: "https://philna.sh/newer/", pubDate: "Thu, 30 Jul 2026 00:00:00 GMT" }),
    item({ guid: "older", link: "https://philna.sh/older/", pubDate: "Wed, 29 Jul 2026 00:00:00 GMT" }),
  ]));
  assert.deepEqual(
    findNewPosts(["seen"], deployed).map(({ guid }) => guid),
    ["older", "newer"],
  );
});
```

Remove tests and imports for `haveSameGuids`, `pollForDeployedFeed`, snapshot behavior, and built/deployed feed convergence.

- [ ] **Step 2: Run the tests to verify RED**

Run:

```bash
npm test
```

Expected: FAIL because `parseGuidLedger` is not exported and `findNewPosts` still expects feed items.

- [ ] **Step 3: Implement ledger validation and GUID-based discovery**

Add:

```js
export function parseGuidLedger(json) {
  let value;
  try {
    value = JSON.parse(json);
  } catch (error) {
    throw new Error("Could not parse GUID ledger as JSON", { cause: error });
  }
  if (!Array.isArray(value)) {
    throw new Error("GUID ledger must be a JSON array");
  }
  const seen = new Set();
  for (const guid of value) {
    if (typeof guid !== "string" || guid.trim() === "") {
      throw new Error("Every GUID ledger entry must be a non-empty string");
    }
    if (seen.has(guid)) {
      throw new Error(`Duplicate GUID in ledger: ${guid}`);
    }
    seen.add(guid);
  }
  return value;
}

export function findNewPosts(seenGuids, deployedItems) {
  const seen = new Set(seenGuids);
  return deployedItems
    .filter(({ guid }) => !seen.has(guid))
    .sort((left, right) => left.publishedAt - right.publishedAt);
}
```

Delete `haveSameGuids`, polling, and delay helpers.

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
npm test
```

Expected: all retained parser, discovery, HTML, fetch, and Resend tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/rss-broadcast.mjs test/rss-broadcast.test.mjs
git commit -m "refactor: discover RSS posts from GUID ledger"
```

### Task 2: Prepare and send command modes

**Files:**
- Modify: `test/rss-broadcast.test.mjs`
- Modify: `scripts/rss-broadcast.mjs`

**Interfaces:**
- Produces: `parsePendingPosts(json: string): FeedItem[]`
- Produces: `prepareBroadcasts(options): Promise<FeedItem[]>`
- Produces: `sendPendingBroadcasts(options): Promise<string[]>`
- Produces: `main(argv: string[], dependencies): Promise<void>`

- [ ] **Step 1: Write failing pending validation and prepare tests**

Add tests that create a temporary ledger and pending file:

```js
test("prepare appends unseen GUIDs while preserving historical entries", async () => {
  const directory = await mkdtemp(join(tmpdir(), "rss-broadcast-"));
  const ledgerPath = join(directory, "guids.json");
  const pendingPath = join(directory, "pending.json");
  await writeFile(ledgerPath, JSON.stringify(["historical", "seen"]));
  const xml = rss([
    item({ guid: "newer", link: "https://philna.sh/newer/", pubDate: "Thu, 30 Jul 2026 00:00:00 GMT" }),
    item({ guid: "seen" }),
    item({ guid: "older", link: "https://philna.sh/older/", pubDate: "Wed, 29 Jul 2026 00:00:00 GMT" }),
  ]);

  const pending = await prepareBroadcasts({
    feedUrl: "https://philna.sh/feed.xml",
    ledgerPath,
    pendingPath,
    fetchImpl: async () => new Response(xml),
    logger: { log() {} },
  });

  assert.deepEqual(pending.map(({ guid }) => guid), ["older", "newer"]);
  assert.deepEqual(
    JSON.parse(await readFile(ledgerPath, "utf8")),
    ["historical", "seen", "older", "newer"],
  );
  assert.deepEqual(
    JSON.parse(await readFile(pendingPath, "utf8")).map(({ guid }) => guid),
    ["older", "newer"],
  );
});

test("prepare writes an empty pending file and leaves a complete ledger unchanged", async () => {
  const directory = await mkdtemp(join(tmpdir(), "rss-broadcast-"));
  const ledgerPath = join(directory, "guids.json");
  const pendingPath = join(directory, "pending.json");
  await writeFile(ledgerPath, JSON.stringify(["seen"]));
  const before = await readFile(ledgerPath, "utf8");

  await prepareBroadcasts({
    feedUrl: "https://philna.sh/feed.xml",
    ledgerPath,
    pendingPath,
    fetchImpl: async () => new Response(rss([item({ guid: "seen" })])),
    logger: { log() {} },
  });

  assert.equal(await readFile(ledgerPath, "utf8"), before);
  assert.deepEqual(JSON.parse(await readFile(pendingPath, "utf8")), []);
});
```

Add malformed pending cases for non-array data, missing required post fields, invalid `publishedAt`, and duplicate GUIDs.

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm test
```

Expected: FAIL because `prepareBroadcasts` and `parsePendingPosts` do not exist.

- [ ] **Step 3: Implement pending serialization and prepare**

Serialize `publishedAt` as an ISO string in pending JSON. On read, validate the array and each post's `guid`, `title`, `link`, `description`, `pubDate`, and `publishedAt`, including duplicate GUID rejection. Implement:

```js
export async function prepareBroadcasts({
  feedUrl,
  ledgerPath,
  pendingPath,
  fetchImpl = globalThis.fetch,
  logger = console,
}) {
  const [xml, ledgerJson] = await Promise.all([
    fetchFeed(feedUrl, { fetchImpl }),
    readFile(ledgerPath, "utf8"),
  ]);
  const deployedItems = parseFeed(xml);
  const seenGuids = parseGuidLedger(ledgerJson);
  const pending = findNewPosts(seenGuids, deployedItems);
  await writeFile(pendingPath, `${JSON.stringify(pending, null, 2)}\n`);
  if (pending.length > 0) {
    const updated = [...seenGuids, ...pending.map(({ guid }) => guid)];
    await writeFile(ledgerPath, `${JSON.stringify(updated, null, 2)}\n`);
  }
  logger.log(`Prepared ${pending.length} RSS post(s) for broadcast.`);
  return pending;
}
```

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 5: Write failing send-mode tests**

Add:

```js
test("send mode does not construct Resend for an empty pending file", async () => {
  const directory = await mkdtemp(join(tmpdir(), "rss-broadcast-"));
  const pendingPath = join(directory, "pending.json");
  await writeFile(pendingPath, "[]\n");
  await main(["send", pendingPath], {
    env: {},
    logger: { log() {} },
    resendFactory: () => { throw new Error("Resend should not be constructed"); },
  });
});

test("send mode passes pending RSS content and secrets to Resend", async () => {
  const directory = await mkdtemp(join(tmpdir(), "rss-broadcast-"));
  const pendingPath = join(directory, "pending.json");
  const [post] = parseFeed(rss([item()]));
  await writeFile(pendingPath, JSON.stringify([post]));
  const requests = [];
  await main(["send", pendingPath], {
    env: {
      RESEND_API_KEY: "secret",
      RESEND_FROM_EMAIL: "Phil <sender@philna.sh>",
      RESEND_SEGMENT_ID: "segment",
    },
    logger: { log() {} },
    resendFactory: (apiKey) => {
      assert.equal(apiKey, "secret");
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
  assert.equal(requests.length, 1);
  assert.equal(requests[0].subject, "Post & one");
  assert.equal(requests[0].send, true);
});
```

Also add CLI arity tests for `prepare` and `send`, and retain the sequential stop, missing-secret, Resend error, and missing-ID coverage.

- [ ] **Step 6: Run tests to verify RED**

Run:

```bash
npm test
```

Expected: FAIL because the CLI still supports `snapshot` and `broadcast`, not `prepare` and `send`.

- [ ] **Step 7: Implement prepare/send CLI modes**

Change usage to:

```text
Usage:
  npm run rss:broadcast -- prepare <feed-url> <ledger-file> <pending-file>
  npm run rss:broadcast -- send <pending-file>
```

`prepare` delegates to `prepareBroadcasts`. `send` reads and validates pending posts, returns early when empty, then validates `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `RESEND_SEGMENT_ID`, constructs Resend, and calls `sendBroadcasts`.

- [ ] **Step 8: Run tests to verify GREEN**

Run:

```bash
npm test
```

Expected: all tests PASS with no obsolete snapshot/polling coverage.

- [ ] **Step 9: Commit**

```bash
git add scripts/rss-broadcast.mjs test/rss-broadcast.test.mjs
git commit -m "feat: prepare and send ledger-backed RSS broadcasts"
```

### Task 3: Seed the ledger and update the workflow

**Files:**
- Create: `.github/rss-broadcast-guids.json`
- Modify: `.github/workflows/trigger_deploy.yml`
- Test: `test/rss-broadcast.test.mjs`

**Interfaces:**
- Consumes: `npm run rss:broadcast -- prepare <feed-url> <ledger-file> <pending-file>`
- Consumes: `npm run rss:broadcast -- send <pending-file>`
- Produces: a default-branch-only workflow with write permission and commit-before-send ordering.

- [ ] **Step 1: Write a failing migration-only seed test**

Temporarily add a test that reads `.github/rss-broadcast-guids.json` and `dist/client/feed.xml`, validates both, and asserts that every currently built feed GUID is seeded. Run `npm run build` first so the generated feed exists.

Run:

```bash
npm run build
npm test
```

Expected: FAIL because the ledger does not exist or one or more built GUIDs are absent.

- [ ] **Step 2: Seed the ledger from the current deployed feed**

Fetch `https://philna.sh/feed.xml`, validate it through `parseFeed`, and write every current GUID to `.github/rss-broadcast-guids.json` as a formatted JSON array with a trailing newline. Confirm the count equals the feed's item count and the set has no duplicates.

Run:

```bash
npm test
```

Expected: all tests PASS, including complete built-feed coverage by the seeded ledger.

Remove the migration-only test after observing it pass. Keeping it would require
future unpublished posts to be added to the ledger before deployment, which
would incorrectly suppress their broadcasts.

- [ ] **Step 3: Update the workflow**

Add:

```yaml
permissions:
  contents: write
```

Guard the job and check out the default branch:

```yaml
jobs:
  run-updater:
    if: github.ref_name == github.event.repository.default_branch
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          ref: ${{ github.event.repository.default_branch }}
```

After deploy, prepare and commit state:

```yaml
      - name: Prepare RSS broadcasts
        run: >-
          npm run rss:broadcast -- prepare
          https://philna.sh/feed.xml
          .github/rss-broadcast-guids.json
          "$RUNNER_TEMP/rss-broadcast-pending.json"
      - name: Commit new RSS GUIDs
        run: |
          git add .github/rss-broadcast-guids.json
          if git diff --cached --quiet; then
            echo "No new RSS posts to record."
          else
            git config user.name "github-actions[bot]"
            git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
            git commit -m "chore: record broadcast RSS posts [skip ci]"
            git push
          fi
      - name: Broadcast new RSS posts
        run: >-
          npm run rss:broadcast -- send
          "$RUNNER_TEMP/rss-broadcast-pending.json"
        env:
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          RESEND_FROM_EMAIL: ${{ secrets.RESEND_FROM_EMAIL }}
          RESEND_SEGMENT_ID: ${{ secrets.RESEND_SEGMENT_ID }}
```

Remove the pre-deploy snapshot. Keep `concurrency.group: trigger-deploy` and `cancel-in-progress: false`.

- [ ] **Step 4: Validate the workflow and ledger**

Run:

```bash
ruby -e 'require "yaml"; YAML.load_file(".github/workflows/trigger_deploy.yml", aliases: true)'
node -e 'const ledger=JSON.parse(require("fs").readFileSync(".github/rss-broadcast-guids.json")); if (!Array.isArray(ledger) || ledger.length !== new Set(ledger).size) process.exit(1)'
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add .github/rss-broadcast-guids.json .github/workflows/trigger_deploy.yml test/rss-broadcast.test.mjs
git commit -m "ci: track and broadcast unseen RSS posts"
```

### Task 4: Full verification

**Files:**
- Verify all changed files.

**Interfaces:**
- Consumes the completed script, tests, seed ledger, and workflow.
- Produces evidence that the implementation meets the approved design.

- [ ] **Step 1: Run focused and project checks**

Run:

```bash
npm test
npm run check
npm run build
```

Expected: tests PASS, Astro check reports zero errors, and build exits 0.

- [ ] **Step 2: Validate generated feed, ledger, YAML, and diff**

Run:

```bash
node -e 'import("./scripts/rss-broadcast.mjs").then(async ({parseFeed,parseGuidLedger}) => { const fs = await import("node:fs/promises"); const feed=parseFeed(await fs.readFile("dist/client/feed.xml","utf8")); const ledger=parseGuidLedger(await fs.readFile(".github/rss-broadcast-guids.json","utf8")); const missing=feed.filter(({guid})=>!ledger.includes(guid)); if (missing.length) throw new Error(`Missing ${missing.length} built GUIDs`); console.log(`${feed.length} feed items; ${ledger.length} ledger GUIDs`); })'
ruby -e 'require "yaml"; YAML.load_file(".github/workflows/trigger_deploy.yml", aliases: true)'
git diff --check
git status --short
```

Expected: feed coverage is complete, YAML parses, diff check exits 0, and only intended changes remain before the final commit.

- [ ] **Step 3: Review failure ordering**

Inspect the workflow to confirm `Deploy` precedes `Prepare RSS broadcasts`, ledger commit/push precedes `Broadcast new RSS posts`, and the send step has no `if: always()` override. Inspect `send` to confirm it returns before secret validation and Resend construction when pending is empty.
