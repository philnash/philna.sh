import OpenAI from "openai";

const EMBEDDING_MODEL = "text-embedding-3-small";

const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
});

export async function getEmbeddings(text: string) {
  const response = await openai.embeddings.create({
    input: text,
    model: EMBEDDING_MODEL,
  });
  return response.data[0].embedding;
}
