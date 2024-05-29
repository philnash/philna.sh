import { DataAPIClient } from "@datastax/astra-db-ts";

import { getEntry } from "astro:content";
import type { CollectionEntry } from "astro:content";
import stringByteSlice from "string-byte-slice";

const { ASTRADB_APP_TOKEN, ASTRADB_ENDPOINT } = import.meta.env;
const COLLECTION_NAME = "blog";

type BlogEmbeddingDoc = {
  _id: string;
  $vectorize: string;
  $vector: number[];
};
type BlogEmbeddingData = {
  slug: string;
  body: string;
};

const astraDb = new DataAPIClient(ASTRADB_APP_TOKEN).db(ASTRADB_ENDPOINT);
const blogCollection = await astraDb.collection<BlogEmbeddingDoc>(
  COLLECTION_NAME
);

function isPost(
  post: CollectionEntry<"blog"> | undefined
): post is CollectionEntry<"blog"> {
  return typeof post !== "undefined";
}

export async function getRelatedPosts({
  slug,
  body,
}: BlogEmbeddingData): Promise<CollectionEntry<"blog">[]> {
  const blogContent = stringByteSlice(body, 0, 8000);

  await blogCollection.findOneAndUpdate(
    { _id: slug },
    { $set: { $vectorize: blogContent } },
    { upsert: true, returnDocument: "after" }
  );

  const filter = { _id: { $ne: slug } };
  const options = { sort: { $vectorize: blogContent }, limit: 4 };

  const cursor = blogCollection.find(filter, options);
  const results = await cursor.toArray();
  const posts = await Promise.all(
    results.map((result) => getEntry({ collection: "blog", slug: result._id }))
  );
  return posts.filter(isPost);
}
