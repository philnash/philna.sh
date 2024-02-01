import { getCollection } from "astro:content";

const blogPosts = await getCollection("blog");
console.log(blogPosts[0]);
