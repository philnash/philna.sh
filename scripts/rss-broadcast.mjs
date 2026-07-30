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
    : Array.isArray(rawItems)
    ? rawItems
    : [rawItems];
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
