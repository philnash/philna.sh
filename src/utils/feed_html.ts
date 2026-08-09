import rss from "@astrojs/rss";
import type { RSSFeedItem, RSSOptions } from "@astrojs/rss";
import sanitize from "sanitize-html";

function absoluteUrl(value: string, baseUrl: URL): string {
  return new URL(value, baseUrl).toString();
}

function absoluteSrcset(value: string, baseUrl: URL): string {
  const candidates: string[] = [];
  let position = 0;

  while (position < value.length) {
    while (/[\s,]/.test(value[position] ?? "")) position += 1;
    if (position >= value.length) break;

    const urlStart = position;
    while (position < value.length && !/\s/.test(value[position] ?? "")) {
      position += 1;
    }
    let url = value.slice(urlStart, position);

    if (url.endsWith(",")) {
      url = url.replace(/,+$/, "");
      if (url) candidates.push(absoluteUrl(url, baseUrl));
      continue;
    }

    while (/\s/.test(value[position] ?? "")) position += 1;
    const descriptorStart = position;
    while (position < value.length && value[position] !== ",") position += 1;
    const descriptor = value.slice(descriptorStart, position).trim();

    candidates.push(
      `${absoluteUrl(url, baseUrl)}${descriptor ? ` ${descriptor}` : ""}`,
    );
  }

  return candidates.join(", ");
}

export function sanitizeFeedHtml(html: string, baseUrl: URL): string {
  return sanitize(html, {
    allowedTags: [...sanitize.defaults.allowedTags, "img"],
    allowedSchemesByTag: {
      ...sanitize.defaults.allowedSchemesByTag,
      img: [...sanitize.defaults.allowedSchemes, "data"],
      srcset: [...sanitize.defaults.allowedSchemes, "data"],
    },
    transformTags: {
      a(tagName, attribs) {
        return {
          tagName,
          attribs: {
            ...attribs,
            ...(attribs.href
              ? { href: absoluteUrl(attribs.href, baseUrl) }
              : {}),
          },
        };
      },
      img(tagName, attribs) {
        return {
          tagName,
          attribs: {
            ...attribs,
            ...(attribs.src
              ? { src: absoluteUrl(attribs.src, baseUrl) }
              : {}),
            ...(attribs.srcset
              ? { srcset: absoluteSrcset(attribs.srcset, baseUrl) }
              : {}),
          },
        };
      },
    },
  });
}

type RSSOptionsWithItems = Omit<RSSOptions, "items"> & {
  items: RSSFeedItem[];
};

function cdata(value: string): string {
  return `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
}

export async function rssWithCdataDescriptions(
  options: RSSOptionsWithItems,
): Promise<Response> {
  const descriptions = new Map<string, string>();
  const items = options.items.map((item, index) => {
    if (item.description === undefined) return item;

    const placeholder = `__RSS_ITEM_DESCRIPTION_${index}__`;
    descriptions.set(placeholder, item.description);
    return { ...item, description: placeholder };
  });

  const response = await rss({ ...options, items });
  let xml = await response.text();

  for (const [placeholder, description] of descriptions) {
    const serializedPlaceholder =
      `<description>${placeholder}</description>`;
    const firstMatch = xml.indexOf(serializedPlaceholder);
    const secondMatch = xml.indexOf(
      serializedPlaceholder,
      firstMatch + serializedPlaceholder.length,
    );

    if (firstMatch === -1 || secondMatch !== -1) {
      throw new Error(
        `Expected exactly one serialized RSS description placeholder: ${placeholder}`,
      );
    }

    xml = xml.replace(
      serializedPlaceholder,
      `<description>${cdata(description)}</description>`,
    );
  }

  return new Response(xml, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });
}
