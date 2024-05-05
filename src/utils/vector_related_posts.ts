import type { StrictFilter } from "@datastax/astra-db-ts";
import { connect, getBlogCollection } from "./astradb";
import type { BlogEmbeddingDoc } from "./astradb";
import { getEmbeddings } from "./openai";

export interface BlogEmbeddingData {
  slug: string;
  title: string;
  path: string;
  body: string;
};

export async function findOrCreateBlogEmbedding({ slug, title, path, body }: BlogEmbeddingData) {
  const db = connect();
  const collection = getBlogCollection(db);
  const item = await collection.findOne({ _id: slug });
  if (item) {
    return item.$vector;
  }
  // create embeddings for blog post content with OpenAI API
  const embeddings = await getEmbeddings(body);
  // save embeddings to Astradb
  await collection.insertOne({
    _id: slug,
    $vector: embeddings,
    title: title,
    path: path,
  });
  return embeddings;
}

export async function getRelatedPosts(slug: string, embeddings: number[]) {
  const filter: StrictFilter<BlogEmbeddingDoc> = {
    _id: { $ne: slug }
  }
  const options = {
    sort: {
      $vector: embeddings,
    },
    limit: 4,
  };
  const db = connect();
  const blogCollection = getBlogCollection(db);
  const results = await blogCollection.find(filter, options);
  return results.toArray();
}
