import { connect, getBlogCollection } from "./astradb";
import { getEmbeddings } from "./openai";

const embeddingName = "small3";

export async function findOrCreateBlogEmbedding({
  slug,
  title,
  path,
  body,
}: {
  slug: string;
  title: string;
  path: string;
  body: string;
}) {
  const db = connect();
  const collection = await getBlogCollection(db, embeddingName);
  const item = await collection.findOne({ _id: slug });
  if (item) {
    return item.$vector;
  }
  // create embeddings for blog post content with OpenAI API
  const embeddings = await getEmbeddings(body, embeddingName);
  // save embeddings to Astradb
  await collection.insertOne({
    _id: slug,
    $vector: embeddings,
    title: title,
    path: path,
  });
  return embeddings;
}

export async function getRelatedPosts(embeddings: number[]) {
  const options = {
    sort: {
      $vector: embeddings,
    },
    limit: 5,
  };
  const db = connect();
  const blogCollection = await getBlogCollection(db, embeddingName);
  const results = await blogCollection.find({}, options);
  // The first result is the post itself, so we slice it off
  return (await results.toArray()).slice(1);
}
