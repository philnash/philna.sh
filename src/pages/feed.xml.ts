import type { APIContext } from "astro";
import rss from "@astrojs/rss";
import { postPath, sortedBlogPosts } from "../utils/blog_posts";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts";
import sanitize from "sanitize-html";
import MarkdownIt from "markdown-it";
import type { CollectionEntry } from "astro:content";
const parser = new MarkdownIt();

type BlogPostWithBody =
  & Required<Pick<CollectionEntry<"blog">, "body">>
  & CollectionEntry<"blog">;

function filterPostsWithoutBody(
  post: CollectionEntry<"blog">,
): post is BlogPostWithBody {
  return post.body !== undefined;
}

export async function GET({ site, generator }: APIContext) {
  const posts = (await sortedBlogPosts()).filter(filterPostsWithoutBody);
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: site?.toString() ?? "",
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
