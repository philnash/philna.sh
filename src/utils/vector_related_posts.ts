import { DataAPIClient } from "@datastax/astra-db-ts";
import { getEmbeddings } from "./openai";

import { getEntry } from "astro:content";
import type { CollectionEntry } from "astro:content";

const { ASTRADB_APP_TOKEN, ASTRADB_ENDPOINT } = import.meta.env;
const COLLECTION_NAME = "philnash_blog";

type BlogEmbeddingDoc = {
  _id: string;
  $vector: number[];
};
type BlogEmbeddingData = {
  slug: string;
  body: string;
  regenerateVectors: boolean;
};

const astraDb = new DataAPIClient(ASTRADB_APP_TOKEN).db(ASTRADB_ENDPOINT);
const blogCollection = astraDb.collection<BlogEmbeddingDoc>(COLLECTION_NAME);

async function findOrCreateBlogEmbedding({
  slug,
  body,
  regenerateVectors,
}: BlogEmbeddingData) {
  const item = await blogCollection.findOne({ _id: slug });
  if (item) {
    if (regenerateVectors) {
      const embeddings = await getEmbeddings(body);
      await blogCollection.updateOne(
        { _id: slug },
        { $set: { $vector: embeddings } }
      );
      return embeddings;
    }
    return item.$vector;
  }
  const embeddings = await getEmbeddings(body);
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
  regenerateVectors,
}: BlogEmbeddingData): Promise<CollectionEntry<"blog">[]> {
  const embeddings = await findOrCreateBlogEmbedding({
    slug,
    body,
    regenerateVectors,
  });

  const filter = { _id: { $ne: slug } };
  const options = { sort: { $vector: embeddings }, limit: 4 };

  const results = await blogCollection.find(filter, options).toArray();
  const posts = await Promise.all(
    results.map((result) => getEntry({ collection: "blog", slug: result._id }))
  );

  return posts.filter(isPost);
}
