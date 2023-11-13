import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";

export function postPath(post: CollectionEntry<"blog">) {
  const {
    params: { year, month, day, slug },
  } = postParams(post);
  if (year && month && day) {
    return `/blog/${year}/${month}/${day}/${slug}/`;
  } else {
    return `/blog/${slug}/`;
  }
}

export async function sortedBlogPosts(): Promise<CollectionEntry<"blog">[]> {
  return (await getCollection("blog")).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
}

export function postParams(post: CollectionEntry<"blog">) {
  const matchData = post.slug.match(
    /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})-(?<slug>[A-Za-z\d-]+)/
  );
  if (matchData?.groups) {
    const { year, month, day, slug } = matchData.groups;
    return {
      params: { year, month, day, slug },
      props: post,
    };
  } else {
    return {
      params: { slug: post.slug },
      props: post,
    };
  }
}

function intersects(a: string[], b: string[]) {
  return a.filter(Set.prototype.has, new Set(b)).length;
}

export function getRelatedPosts(
  id: string,
  tags: string[],
  allBlogPosts: CollectionEntry<"blog">[]
) {
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
  return relatedPosts;
}

export function viewTransitionName(slug: string, section: string) {
  return `${slug.replace(/^\d{4}-\d{2}-\d{2}-/, "")}-${section}`;
}
