# RSS Broadcast Design

## Goal

Extend the daily `trigger_deploy` workflow so that each blog post which has
appeared in the deployed RSS feed since the previous successful check is sent
once as an immediate Resend broadcast to `RESEND_SEGMENT_ID`.

## Existing Context

- Blog content can be deployed before the daily workflow runs, so comparing the
  live feed immediately before and after the nightly deployment does not detect
  newly published posts.
- RSS `pubDate` values describe post metadata and do not reliably identify when
  a post reached production.
- Each deployed RSS item contains a stable GUID, title, link, publication date,
  categories, and an HTML description containing the full post.
- `.github/workflows/trigger_deploy.yml` builds and deploys the static Astro site
  each day and can also be run manually.
- The repository already depends on the Resend Node SDK and configures
  `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `RESEND_SEGMENT_ID`.

## Durable GUID Ledger

Add `.github/rss-broadcast-guids.json` containing a JSON array of RSS GUID
strings. Seed it with every GUID in the current live feed so the first run cannot
broadcast historical posts.

The ledger is the sole record of whether a post has already been discovered for
broadcast. Preserve GUIDs that later disappear from the feed and append new GUIDs
oldest-first. Reject malformed JSON, non-string values, empty strings, and
duplicates rather than silently replacing or repairing state.

The daily workflow may commit ledger changes directly to `main`. Give the
workflow `contents: write` permission and configure the Git author as
`github-actions[bot]`. Serialize runs in a stable concurrency group without
cancelling an in-progress run.

Only run the deployment and broadcast job on the repository's default branch.
This prevents a manually dispatched feature-branch workflow from comparing the
production feed with an unmerged or stale ledger.

## Node Script

Keep RSS and broadcast behavior in `scripts/rss-broadcast.mjs`, with two command
modes:

1. `prepare <feed-url> <ledger-file> <pending-file>`
   - Fetch and validate the deployed feed.
   - Read and validate the checked-in GUID ledger.
   - Find feed items whose GUIDs are absent from the ledger.
   - Sort unseen items by `pubDate` ascending.
   - Write the unseen items to the temporary pending JSON file.
   - If posts are unseen, append all their GUIDs to the ledger.
2. `send <pending-file>`
   - Read and validate the temporary pending posts.
   - Exit successfully without constructing Resend when it is empty.
   - Send one immediate Resend broadcast per pending item, in file order.

Use `fast-xml-parser` and `fast-xml-validator` to validate and parse the RSS feed.
The feed must contain an RSS channel with at least one item. Missing, empty, or
duplicate RSS GUIDs are invalid.

The pending file is an ephemeral handoff between the prepare and send steps. It
contains only the unseen items needed to construct broadcasts and lives under
`RUNNER_TEMP`; it is never committed or uploaded.

## Workflow and Commit Ordering

Update `.github/workflows/trigger_deploy.yml` to:

1. Check out the default branch and set up Node.
2. Install dependencies and build the site.
3. Deploy the built site.
4. Run `prepare` against `https://philna.sh/feed.xml`, the checked-in ledger, and
   a pending file under `RUNNER_TEMP`.
5. Stage the ledger.
6. If it changed, commit and push it to `main`.
7. Run `send` with the pending file and the three required Resend secrets.

The ledger commit must succeed before any broadcast is sent. Resend idempotency
keys are not supported for broadcasts, so this ordering prioritizes avoiding
duplicate emails:

- If feed preparation or the ledger push fails, send nothing.
- If the ledger push succeeds and sending fails, fail the workflow loudly and
  recover the missed broadcast manually.
- If multiple posts are pending and one send fails, stop immediately. Consult
  the workflow logs to identify successful and missed broadcasts for manual
  recovery.

A ledger-only push may cause a redundant Cloudflare deployment. This is accepted
in exchange for keeping the durable state visible and versioned in the
repository.

## Broadcast Content

Create and immediately send one Resend broadcast for each pending RSS item:

- `segmentId`: `RESEND_SEGMENT_ID`
- `from`: `RESEND_FROM_EMAIL`
- `subject`: the RSS item title
- `html`: the decoded RSS item description, followed by a link to read the post
  on `philna.sh` and a link using `{{{RESEND_UNSUBSCRIBE_URL}}}`
- `send`: `true`

Do not add a separate text body; Resend can derive it from the HTML broadcast.
Do not transform or re-read the source Markdown. The deployed RSS item is the
source of the email title, link, and body.

## Failure Handling

The workflow must fail loudly when:

- the deployed feed cannot be fetched;
- a response is not a non-empty RSS feed;
- RSS XML or required item fields are invalid;
- the GUID ledger or pending file is invalid;
- duplicate GUIDs appear in the feed or ledger;
- updating and pushing the ledger fails;
- required Resend environment variables are absent for a non-empty pending file;
- Resend throws, returns an error, or omits the expected broadcast ID.

Log the GUID and title before each send and the returned broadcast ID after
success, but never log secrets or the full post body.

## Testing

Use Node's built-in test runner with generated RSS fixtures, temporary files,
fake `fetch`, and a fake Resend client. Cover:

- parsing one and multiple RSS items;
- entity-decoded HTML descriptions;
- rejection of malformed, non-RSS, and empty feeds;
- rejection of missing and duplicate RSS GUIDs;
- validation of malformed and duplicate ledger entries;
- GUID-based discovery independent of title, link, or publication date changes;
- oldest-first ordering of multiple unseen items;
- initial seeded-ledger and subsequent no-op behavior;
- appending unseen GUIDs without removing historical ledger entries;
- pending-file creation without committing email content;
- no Resend construction for an empty pending file;
- one immediate Resend call per pending post;
- sequential stop and surfaced error when Resend fails;
- email HTML construction, including the post and unsubscribe links.

Run `npm test`, `npm run check`, `npm run build`, parse the generated
`dist/client/feed.xml`, validate the workflow YAML, and run `git diff --check` as
final verification.

## Out of Scope

- Automatic retry or delivery tracking after the ledger commit
- Digest emails combining multiple posts
- Using RSS publication dates as workflow checkpoints
- Resend Topics or subscription-preference changes
- Draft broadcasts or scheduled sends
- Avoiding the redundant deployment caused by a ledger-only push
