import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
});

export const OpenAIEmbeddingModels = {
  ada: "text-embedding-ada-002",
  small3: "text-embedding-3-small",
  large3: "text-embedding-3-large",
};

export async function getEmbeddings(
  text: string,
  model: keyof typeof OpenAIEmbeddingModels = "ada"
) {
  const response = await openai.embeddings.create({
    input: text,
    model: OpenAIEmbeddingModels[model],
  });
  return response.data[0].embedding;
}
