import { DataAPIClient } from "@datastax/astra-db-ts";
import type { StrictFilter } from "@datastax/astra-db-ts";
import { getEmbeddings } from "./openai";

import { getEntry } from "astro:content";
import type { CollectionEntry } from "astro:content";

const { ASTRADB_APP_TOKEN, ASTRADB_ENDPOINT } = import.meta.env;
const COLLECTION_NAME = "philnash_blog";

interface BlogEmbeddingDoc {
  _id: string;
  $vector: number[];
}
interface BlogEmbeddingData {
  slug: string;
  body: string;
}

const astraDb = new DataAPIClient(ASTRADB_APP_TOKEN).db(ASTRADB_ENDPOINT);
const blogCollection = astraDb.collection<BlogEmbeddingDoc>(COLLECTION_NAME);

async function findOrCreateBlogEmbedding({ slug, body }: BlogEmbeddingData) {
  const item = await blogCollection.findOne({ _id: slug });
  if (item) {
    return item.$vector;
  }
  // create embeddings for blog post content with OpenAI API
  const embeddings = await getEmbeddings(body);
  // save embeddings to Astradb
  await blogCollection.insertOne({ _id: slug, $vector: embeddings });
  return embeddings;
}

function isPost(
  post: CollectionEntry<"blog"> | undefined
): post is CollectionEntry<"blog"> {
  return typeof post !== "undefined";
}

export async function getRelatedPosts({
  slug,
  body,
}: BlogEmbeddingData): Promise<CollectionEntry<"blog">[]> {
  const embeddings = await findOrCreateBlogEmbedding({ slug, body });

  const filter: StrictFilter<BlogEmbeddingDoc> = { _id: { $ne: slug } };
  const options = { sort: { $vector: embeddings }, limit: 4 };

  const results = await blogCollection.find(filter, options).toArray();
  const posts = await Promise.all(
    results.map((result) => getEntry({ collection: "blog", slug: result._id }))
  );

  return posts.filter(isPost);
}
