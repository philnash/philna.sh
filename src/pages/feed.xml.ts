import type { APIContext } from "astro";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { render } from "astro:content";
import { postPath, sortedBlogPosts } from "../utils/blog_posts";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts";
import {
  rssWithCdataDescriptions,
  sanitizeFeedHtml,
} from "../utils/feed_html";

export async function GET({ site, generator }: APIContext) {
  if (!site) {
    throw new Error(
      "The RSS feed requires Astro's site configuration to generate absolute URLs.",
    );
  }

  const posts = await sortedBlogPosts();
  const container = await AstroContainer.create();
  const items = await Promise.all(
    posts.map(async (post) => {
      const postUrl = new URL(postPath(post), site);
      const { Content } = await render(post);
      const renderedHtml = await container.renderToString(Content, {
        request: new Request(postUrl),
      });

      return {
        title: post.data.title,
        description: sanitizeFeedHtml(renderedHtml, postUrl),
        pubDate: post.data.pubDate,
        link: postPath(post),
        customData: post.data.tags
          .map((tag) => `<category>${tag}</category>`)
          .join(""),
      };
    }),
  );

  return rssWithCdataDescriptions({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site,
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    customData: `
      <atom:link href="${site}feed.xml" rel="self" type="application/rss+xml" />
      <pubDate>${posts[0].data.pubDate.toUTCString()}</pubDate>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      <generator>${generator}</generator>
    `,
    items,
  });
}
