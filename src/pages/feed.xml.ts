import type { APIContext } from "astro";
import rss from "@astrojs/rss";
import { sortedBlogPosts, postPath } from "../utils/blog_posts";
import { SITE_TITLE, SITE_DESCRIPTION } from "../consts";
import sanitize from "sanitize-html";
import MarkdownIt from "markdown-it";
const parser = new MarkdownIt();

export async function get({ site, generator }: APIContext) {
  const posts = await sortedBlogPosts();
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: site?.toString() || "",
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    customData: `
      <atom:link href="${site}feed.xml" rel="self" type="application/rss+xml" />
      <pubDate>${posts[0].data.pubDate.toUTCString()}</pubDate>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      <generator>${generator}</generator>
    `,
    items: posts.map((post) => ({
      title: post.data.title,
      description: sanitize(parser.render(post.body)),
      pubDate: post.data.pubDate,
      link: `${postPath(post)}/`,
      customData: post.data.tags
        .map((tag) => `<category>${tag}</category>`)
        .join(""),
    })),
  });
}
