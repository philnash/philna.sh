import { AstraDB, Collection } from "@datastax/astra-db-ts";

const { ASTRADB_APP_TOKEN, ASTRADB_ENDPOINT } = import.meta.env;

let astraDb: null | AstraDB = null;

export function connect() {
  // Initialization
  if (astraDb === null) {
    astraDb = new AstraDB(ASTRADB_APP_TOKEN, ASTRADB_ENDPOINT);
  }
  return astraDb;
}

export const BlogCollectionNames = {
  ada: "philnash_blog",
  small3: "philnash_blog_3_small",
  large3: "philnash_blog_3_large",
};
let blogCollection: null | Collection = null;

export async function getBlogCollection(
  db: AstraDB,
  blogCollectionName: keyof typeof BlogCollectionNames = "ada"
) {
  if (blogCollection === null) {
    return db.collection(BlogCollectionNames[blogCollectionName]);
  }
  return blogCollection;
}
