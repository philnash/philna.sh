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

export function haveSameGuids(leftItems, rightItems) {
  if (leftItems.length !== rightItems.length) {
    return false;
  }
  const rightGuids = new Set(rightItems.map(({ guid }) => guid));
  return leftItems.every(({ guid }) => rightGuids.has(guid));
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

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function pollForDeployedFeed({
  feedUrl,
  expectedItems,
  fetchImpl = globalThis.fetch,
  delay = sleep,
  maxAttempts = 12,
  pollIntervalMs = 5_000,
}) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const xml = await fetchFeed(feedUrl, {
        fetchImpl,
        cacheBust: `${Date.now()}-${attempt}`,
      });
      const deployedItems = parseFeed(xml);
      if (haveSameGuids(expectedItems, deployedItems)) {
        return deployedItems;
      }
      lastError = new Error("The deployed RSS GUID set does not match");
    } catch (error) {
      lastError = error;
    }

    if (attempt < maxAttempts) {
      await delay(pollIntervalMs);
    }
  }

  throw new Error(
    `Deployed RSS feed did not match the built feed after ${maxAttempts} attempts`,
    { cause: lastError },
  );
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

function usage() {
  return [
    "Usage:",
    "  npm run rss:broadcast -- snapshot <feed-url> <output-file>",
    "  npm run rss:broadcast -- broadcast <snapshot-file> <built-feed-file> <feed-url>",
  ].join("\n");
}

export async function main(argv, {
  fetchImpl = globalThis.fetch,
  delay = sleep,
  env = process.env,
  resendFactory = (apiKey) => new Resend(apiKey),
  logger = console,
  maxAttempts = 12,
  pollIntervalMs = 5_000,
} = {}) {
  const [command, ...args] = argv;

  if (command === "snapshot") {
    if (args.length !== 2) {
      throw new Error(usage());
    }
    const [feedUrl, outputPath] = args;
    const xml = await fetchFeed(feedUrl, { fetchImpl });
    parseFeed(xml);
    await writeFile(outputPath, xml);
    logger.log(`Saved deployed RSS snapshot to ${outputPath}`);
    return;
  }

  if (command === "broadcast") {
    if (args.length !== 3) {
      throw new Error(usage());
    }
    const [snapshotPath, builtFeedPath, feedUrl] = args;
    const [snapshotXml, builtFeedXml] = await Promise.all([
      readFile(snapshotPath, "utf8"),
      readFile(builtFeedPath, "utf8"),
    ]);
    const beforeItems = parseFeed(snapshotXml);
    const expectedItems = parseFeed(builtFeedXml);
    const deployedItems = await pollForDeployedFeed({
      feedUrl,
      expectedItems,
      fetchImpl,
      delay,
      maxAttempts,
      pollIntervalMs,
    });
    const newPosts = findNewPosts(beforeItems, deployedItems);

    if (newPosts.length === 0) {
      logger.log("No new RSS posts to broadcast.");
      return;
    }

    const apiKey = requiredEnvironmentVariable(env, "RESEND_API_KEY");
    const from = requiredEnvironmentVariable(env, "RESEND_FROM_EMAIL");
    const segmentId = requiredEnvironmentVariable(env, "RESEND_SEGMENT_ID");
    await sendBroadcasts(newPosts, {
      resend: resendFactory(apiKey),
      segmentId,
      from,
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
