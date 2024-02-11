import { getCollection } from "astro:content";
import { postPath } from "./blog_posts";

function intersects(a: string[], b: string[]) {
  return a.filter(Set.prototype.has, new Set(b)).length;
}

export async function getRelatedPosts(id: string, tags: string[]) {
  const allBlogPosts = await getCollection("blog");
  const relatedPosts = allBlogPosts
    .filter((post) => post.id !== id)
    .filter((post) => intersects(tags, post.data.tags) > 0)
    .sort((a, b) => {
      const sharedTagsWithA = intersects(tags, a.data.tags);
      const sharedTagsWithB = intersects(tags, b.data.tags);
      return (
        sharedTagsWithB - sharedTagsWithA ||
        b.data.pubDate.getTime() - a.data.pubDate.getTime()
      );
    })
    .slice(0, 4);
  return relatedPosts.map((post) => ({
    path: postPath(post),
    title: post.data.title,
  }));
}
