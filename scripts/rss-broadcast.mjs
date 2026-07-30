import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { XMLParser } from "fast-xml-parser";
import { SyntaxValidator } from "fast-xml-validator";
import { Resend } from "resend";

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
  let validation;
  try {
    validation = SyntaxValidator.validate(xml);
  } catch (error) {
    throw new Error(
      `Could not parse RSS XML: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }
  if (validation !== true) {
    throw new Error(`Could not parse RSS XML: ${validation.err.msg}`);
  }

  let document;
  try {
    document = xmlParser.parse(xml);
  } catch (error) {
    throw new Error("Could not parse RSS XML", { cause: error });
  }

  const channel = document?.rss?.channel;
  if (typeof channel !== "object" || channel === null) {
    throw new Error("Feed does not contain a non-empty RSS channel");
  }

  const rawItems = channel.item;
  const items = rawItems === undefined
    ? []
    : Array.isArray(rawItems)
    ? rawItems
    : [rawItems];
  if (items.length === 0) {
    throw new Error("Feed does not contain a non-empty RSS channel");
  }
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

function requiredPendingText(value, field, index) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Pending post ${index + 1} has no ${field}`);
  }
  return value;
}

export function parsePendingPosts(json) {
  let value;
  try {
    value = JSON.parse(json);
  } catch (error) {
    throw new Error("Could not parse pending broadcasts as JSON", {
      cause: error,
    });
  }
  if (!Array.isArray(value)) {
    throw new Error("Pending broadcasts must be a JSON array");
  }

  const seenGuids = new Set();
  return value.map((post, index) => {
    if (typeof post !== "object" || post === null || Array.isArray(post)) {
      throw new Error(`Pending post ${index + 1} must be an object`);
    }
    const guid = requiredPendingText(post.guid, "guid", index);
    if (seenGuids.has(guid)) {
      throw new Error(`Duplicate pending post GUID: ${guid}`);
    }
    seenGuids.add(guid);

    const link = requiredPendingText(post.link, "link", index);
    const url = new URL(link);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error(`Pending post ${index + 1} has an invalid link`);
    }

    const pubDate = requiredPendingText(post.pubDate, "pubDate", index);
    if (Number.isNaN(new Date(pubDate).valueOf())) {
      throw new Error(`Pending post ${index + 1} has an invalid pubDate`);
    }
    const publishedAt = new Date(
      requiredPendingText(post.publishedAt, "publishedAt", index),
    );
    if (Number.isNaN(publishedAt.valueOf())) {
      throw new Error(`Pending post ${index + 1} has an invalid publishedAt`);
    }

    return {
      guid,
      title: requiredPendingText(post.title, "title", index),
      link,
      description: requiredPendingText(post.description, "description", index),
      pubDate,
      publishedAt,
    };
  });
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

export async function fetchFeed(feedUrl, {
  fetchImpl = globalThis.fetch,
  cacheBust = Date.now(),
} = {}) {
  const url = new URL(feedUrl);
  url.searchParams.set("deployment_check", String(cacheBust));

  const response = await fetchImpl(url.toString(), {
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
  if (!response.ok) {
    throw new Error(
      `Could not fetch RSS feed: ${response.status} ${response.statusText}`,
    );
  }
  return response.text();
}

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
    const updatedGuids = [
      ...seenGuids,
      ...pending.map(({ guid }) => guid),
    ];
    await writeFile(
      ledgerPath,
      `${JSON.stringify(updatedGuids, null, 2)}\n`,
    );
  }

  logger.log(`Prepared ${pending.length} RSS post(s) for broadcast.`);
  return pending;
}

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
        `Could not send broadcast for ${post.guid}: ${
          error.message ?? String(error)
        }`,
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

function requiredEnvironmentVariable(env, name) {
  const value = env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function sendPendingBroadcasts({
  pendingPath,
  env = process.env,
  resendFactory = (apiKey) => new Resend(apiKey),
  logger = console,
}) {
  const pending = parsePendingPosts(await readFile(pendingPath, "utf8"));
  if (pending.length === 0) {
    logger.log("No new RSS posts to broadcast.");
    return [];
  }

  const apiKey = requiredEnvironmentVariable(env, "RESEND_API_KEY");
  const from = requiredEnvironmentVariable(env, "RESEND_FROM_EMAIL");
  const segmentId = requiredEnvironmentVariable(env, "RESEND_SEGMENT_ID");
  return sendBroadcasts(pending, {
    resend: resendFactory(apiKey),
    segmentId,
    from,
    logger,
  });
}

function usage() {
  return [
    "Usage:",
    "  npm run rss:broadcast -- prepare <feed-url> <ledger-file> <pending-file>",
    "  npm run rss:broadcast -- send <pending-file>",
  ].join("\n");
}

export async function main(argv, {
  fetchImpl = globalThis.fetch,
  env = process.env,
  resendFactory = (apiKey) => new Resend(apiKey),
  logger = console,
} = {}) {
  const [command, ...args] = argv;

  if (command === "prepare") {
    if (args.length !== 3) {
      throw new Error(usage());
    }
    const [feedUrl, ledgerPath, pendingPath] = args;
    await prepareBroadcasts({
      feedUrl,
      ledgerPath,
      pendingPath,
      fetchImpl,
      logger,
    });
    return;
  }

  if (command === "send") {
    if (args.length !== 1) {
      throw new Error(usage());
    }
    await sendPendingBroadcasts({
      pendingPath: args[0],
      env,
      resendFactory,
      logger,
    });
    return;
  }

  throw new Error(usage());
}

const entrypoint = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;

if (entrypoint === import.meta.url) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
