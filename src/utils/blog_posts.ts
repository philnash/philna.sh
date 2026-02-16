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
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}

export async function localAndExternalBlogPosts(): Promise<
  (CollectionEntry<"blog"> | CollectionEntry<"externalPosts">)[]
> {
  const localPosts = await getCollection("blog");
  const externalPosts = await getCollection("externalPosts");

  const allPosts = [...localPosts, ...externalPosts];

  return allPosts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}

export function postParams(post: CollectionEntry<"blog">) {
  const matchData = post.id.match(
    /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})-(?<slug>[A-Za-z\d-]+)/,
  );
  if (matchData?.groups) {
    const { year, month, day, slug } = matchData.groups;
    return {
      params: { year, month, day, slug },
      props: post,
    };
  } else {
    return {
      params: { slug: post.id },
      props: post,
    };
  }
}

export function viewTransitionName(slug: string, section: string) {
  return `${slug.replace(/^\d{4}-\d{2}-\d{2}-/, "")}-${section}`;
}
