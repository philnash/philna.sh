import { DataAPIClient } from "@datastax/astra-db-ts";
import { type CollectionEntry, getEntry } from "astro:content";

const { ASTRADB_APP_TOKEN, ASTRADB_ENDPOINT } = import.meta.env;
const COLLECTION_NAME = "blog";

type BlogEmbeddingDoc = {
  _id: string;
  $vectorize: string;
};
type BlogEmbeddingData = {
  slug: string;
  body?: string;
};

const astraDb = new DataAPIClient(ASTRADB_APP_TOKEN).db(ASTRADB_ENDPOINT);
const blogCollection = astraDb.collection<BlogEmbeddingDoc>(COLLECTION_NAME);

function isPost(
  post: CollectionEntry<"blog"> | undefined,
): post is CollectionEntry<"blog"> {
  return typeof post !== "undefined";
}

export async function getRelatedPosts({
  slug,
  body,
}: BlogEmbeddingData): Promise<CollectionEntry<"blog">[]> {
  if (!body) {
    return [];
  }
  try {
    await blogCollection.updateOne(
      { _id: slug },
      { $set: { $vectorize: body } },
      { upsert: true },
    );

    const filter = { _id: { $ne: slug } };
    const options = { sort: { $vectorize: body }, limit: 4 };

    const cursor = blogCollection.find(filter, options);
    const results = await cursor.toArray();
    const notFoundIds: string[] = [];
    const posts = await Promise.all(
      results.map(async (result) => {
        const entry = await getEntry({ collection: "blog", id: result._id });
        if (entry === undefined) {
          notFoundIds.push(result._id);
        }
        return entry;
      }),
    );
    if (notFoundIds.length > 0) {
      console.warn(`Deleting not found blog posts: ${notFoundIds.join(", ")}`);
      await blogCollection.deleteMany({ _id: { $in: notFoundIds } });
    }
    return posts.filter(isPost);
  } catch (error) {
    console.error(error);
    return [];
  }
}
