import sanitize from "sanitize-html";

function absoluteUrl(value: string, baseUrl: URL): string {
  return new URL(value, baseUrl).toString();
}

function absoluteSrcset(value: string, baseUrl: URL): string {
  return value
    .split(",")
    .map((candidate) => {
      const match = candidate.trim().match(/^(\S+)(.*)$/);
      if (!match) return candidate.trim();

      const [, url, descriptor] = match;
      return `${absoluteUrl(url, baseUrl)}${descriptor}`;
    })
    .join(", ");
}

export function sanitizeFeedHtml(html: string, baseUrl: URL): string {
  return sanitize(html, {
    allowedTags: [...sanitize.defaults.allowedTags, "img"],
    allowedSchemesByTag: {
      ...sanitize.defaults.allowedSchemesByTag,
      img: [...sanitize.defaults.allowedSchemes, "data"],
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
