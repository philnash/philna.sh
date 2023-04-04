import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    // Transform string to Date object
    pubDate: z
      .string()
      .or(z.date())
      .transform((val) => new Date(val)),
    updatedDate: z
      .string()
      .optional()
      .transform((str) => (str ? new Date(str) : undefined)),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    imageWidth: z.number().optional(),
    imageHeight: z.number().optional(),
    showImage: z.boolean().optional(),
    socialImage: z.string().optional(),
    video: z.string().optional(),
    videoWidth: z.number().optional(),
    videoHeight: z.number().optional(),
    tags: z.array(z.string()),
    scripts: z.array(z.string()).optional(),
  }),
});

export const collections = { blog };
