# RSS Broadcast Design

## Goal

Extend the scheduled `trigger_deploy` workflow so that, after a successful
deployment, each newly deployed blog post is immediately emailed as a separate
Resend broadcast to the segment identified by `RESEND_SEGMENT_ID`.

## Existing Context

- `.github/workflows/trigger_deploy.yml` builds and deploys the static Astro
  site each day and can also be run manually.
- `src/pages/feed.xml.ts` generates `https://philna.sh/feed.xml`.
- Each deployed RSS item contains a title, link, GUID, publication date,
  categories, and an HTML description containing the full post.
- RSS item GUIDs are permalink URLs and are stable identifiers for deduplication.
- The repository already depends on the Resend Node SDK and configures
  `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `RESEND_SEGMENT_ID`.

## Architecture

Add one focused Node script with two command modes:

1. `snapshot` fetches the currently deployed RSS feed and writes it to a local
   file before deployment.
2. `broadcast` runs after deployment. It polls the deployed feed until its GUID
   set matches the GUID set in the locally built `dist/client/feed.xml`,
   compares that deployed feed with the pre-deployment snapshot, and broadcasts
   each new item.

The GitHub Actions workflow will invoke both modes around the existing deployment
step. XML parsing, deployment-readiness checks, deduplication, email construction,
Resend calls, and diagnostic logging will live in the Node script rather than in
workflow shell commands.

Serialize workflow runs in a stable GitHub Actions concurrency group without
cancelling an in-progress run. A queued run must not take its pre-deployment
snapshot until the previous deployment and broadcast sequence has finished.

Add `fast-xml-parser` and `fast-xml-validator` as direct production dependencies.
Use the existing Resend SDK to create and send broadcasts.

## RSS Parsing and Deduplication

Parse each RSS item into:

- `guid`
- `title`
- `link`
- `description`
- `pubDate`

Treat `guid` as the sole identity and deduplication key. Missing, empty, or
duplicate GUIDs are invalid feed data and must fail the script rather than risk
sending the wrong broadcast.

The feed must contain an RSS channel with at least one item. Validate a snapshot
before writing it so a successful HTML error response cannot become an empty
baseline that classifies every historical post as new.

The parser must handle both a single `<item>` object and an array of items.
Descriptions must be decoded to HTML by the XML parser so that the RSS content
can be passed to Resend as email HTML.

After deployment, compare the expected built feed's complete GUID set with the
deployed feed's complete GUID set. Poll with cache-busting and no-cache request
headers until they match or a bounded timeout expires. When the feed did not
change, the first matching response can proceed immediately.

New posts are deployed items whose GUIDs are absent from the pre-deployment
snapshot. Sort them by `pubDate` ascending so that multiple posts are sent
oldest-first.

## Broadcast Content

Create and immediately send one Resend broadcast for each new RSS item:

- `segmentId`: `RESEND_SEGMENT_ID`
- `from`: `RESEND_FROM_EMAIL`
- `subject`: the RSS item title
- `html`: the decoded RSS item description, followed by a link to read the post
  on `philna.sh` and a link using `{{{RESEND_UNSUBSCRIBE_URL}}}`
- `send`: `true`

Do not add a separate text body; Resend can derive it from the HTML broadcast.
Do not transform or re-read the source Markdown. The deployed RSS item is the
source of the email title, link, and body.

## Workflow

Update `.github/workflows/trigger_deploy.yml` to:

1. Install dependencies.
2. Build the site.
3. Snapshot the current deployed feed to a temporary workspace file.
4. Deploy the built site.
5. Run the broadcast command with the snapshot, `dist/client/feed.xml`, and the
   live feed URL.

Pass `RESEND_SEGMENT_ID` into the build because Astro validates configured
secrets. Pass `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `RESEND_SEGMENT_ID` only
to the post-deployment broadcast step where they are required for sending.

No broadcast is sent when there are no new GUIDs. Manual workflow reruns and
deployments without new blog posts therefore remain no-ops.

## Failure Handling

The workflow must fail loudly when:

- the snapshot or deployed feed cannot be fetched;
- a response is not a non-empty RSS feed;
- XML cannot be parsed or required item fields are invalid;
- duplicate GUIDs appear;
- the deployed feed does not converge to the built feed before the timeout;
- required Resend environment variables are absent;
- Resend returns an error or omits the expected broadcast ID.

Send broadcasts sequentially and stop at the first failure. Log the GUID and
title before each send and the returned broadcast ID after success, but never log
secrets or the full post body.

There is deliberately no durable delivery state. If a deployment succeeds but a
broadcast fails, the workflow reports the failure and the missed broadcast is
recovered manually. A partial multi-post send may therefore require checking the
workflow logs before manual recovery.

## Testing

Use Node's built-in test runner for focused script tests. Cover:

- parsing one and multiple RSS items;
- entity-decoded HTML descriptions;
- rejection of missing and duplicate GUIDs;
- GUID-based comparison even when links or titles differ;
- oldest-first ordering of multiple new items;
- no-op behavior when no GUIDs are new;
- email HTML construction, including the post and unsubscribe links;
- polling until the deployed GUID set matches the built feed;
- polling timeout and fetch failures;
- one immediate Resend call per new post;
- sequential stop and surfaced error when Resend fails.

Keep network access and the Resend client behind injected interfaces so tests use
fixtures and fakes. Run these tests, `npm run check`, and `npm run build` as final
verification.

## Out of Scope

- Persistent retry or delivery tracking
- Digest emails combining multiple posts
- Changes to the RSS format or blog source content
- Resend Topics or subscription-preference changes
- Draft broadcasts or scheduled sends
