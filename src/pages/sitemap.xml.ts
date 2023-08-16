import type { APIContext } from "astro";
import { PER_PAGE } from "../consts";
import { sortedBlogPosts, postPath } from "../utils/blog_posts";

export async function get({
  site,
  url,
}: APIContext): Promise<{ body: string }> {
  const posts = await sortedBlogPosts();
  const pageItems = Array(Math.floor(posts.length / PER_PAGE))
    .fill("")
    .map((_, index) => {
      const loc = new URL(`/blog/page/${index + 2}`, url);
      return `<url><loc>${loc}/</loc></url>`;
    })
    .join("");
  const postItems = posts
    .map(
      (post) =>
        `<url><loc>${new URL(
          postPath(post),
          url
        )}/</loc><lastmod>${post.data.pubDate.toISOString()}</lastmod></url>`
    )
    .join("");
  return {
    body: `
      <?xml version="1.0" encoding="UTF-8"?>
      <urlset xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <url>
          <loc>${site}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <priority>1.00</priority>
        </url>
        <url>
          <loc>${new URL("/speaking/", url)}</loc>
        </url>
        <url>
          <loc>${new URL("/speaking/history/", url)}</loc>
        </url>
        <url>
          <loc>${new URL("/speaking/details/", url)}</loc>
        </url>
        <url>
          <loc>${new URL("/live/", url)}</loc>
        </url>
        <url>
          <loc>${new URL("/blog/", url)}</loc>
        </url>
        ${pageItems}
        ${postItems}
      </urlset>
    `.trim(),
  };
}
