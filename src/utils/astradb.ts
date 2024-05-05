import { DataAPIClient, Db, Collection } from "@datastax/astra-db-ts";

const { ASTRADB_APP_TOKEN, ASTRADB_ENDPOINT } = import.meta.env;
const COLLECTION_NAME = "philnash_blog_3_small";

export interface BlogEmbeddingDoc {
  _id: string;
  title: string;
  path: string;
  $vector: number[];
}

let astraDb: null | Db = null;
let blogCollection: Collection<BlogEmbeddingDoc> | null = null;

export function connect() {
  // Initialization
  if (astraDb === null) {
    astraDb = new DataAPIClient(ASTRADB_APP_TOKEN).db(ASTRADB_ENDPOINT);
  }
  return astraDb;
}

export function getBlogCollection(db: Db) {
  if (blogCollection === null) {
    blogCollection = db.collection<BlogEmbeddingDoc>(COLLECTION_NAME);
    return blogCollection;
  }
  return blogCollection;
}
