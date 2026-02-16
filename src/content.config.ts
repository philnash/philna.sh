import { defineCollection, reference, z } from "astro:content";
import { file, glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/blog" }),
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z.object({
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
      image: image().optional(),
      imageAlt: z.string().optional(),
      imageWidth: z.number().optional(),
      imageHeight: z.number().optional(),
      showImage: z.boolean().optional(),
      socialImage: image().optional(),
      video: z.string().optional(),
      videoWidth: z.number().optional(),
      videoHeight: z.number().optional(),
      tags: z.array(z.string()),
      scripts: z.array(z.string()).optional(),
    }),
});

const publishers = defineCollection({
  loader: file("./src/data/publishers.yml"),
  schema: ({ image }) =>
    z.object({
      id: z.string(),
      name: z.string(),
      link: z.string().url(),
      logo: image(),
    }),
});

const externalPosts = defineCollection({
  loader: file("./src/data/external_posts.yml"),
  schema: z.object({
    title: z.string(),
    link: z.string().url(),
    pubDate: z
      .string()
      .or(z.date())
      .transform((val) => new Date(val)),
    updatedDate: z
      .string()
      .optional()
      .transform((str) => (str ? new Date(str) : undefined)),
    publisher: reference("publishers"),
  }),
});

const appearances = defineCollection({
  loader: file("./src/data/appearances.yml"),
  schema: z.object({
    id: z.string(),
    event: z.object({
      name: z.string(),
      link: z.string().url().optional(),
      start_date: z
        .string()
        .or(z.date())
        .transform((val) => new Date(val)),
      end_date: z
        .string()
        .or(z.date())
        .optional()
        .transform((str) => (str ? new Date(str) : undefined)),
      location: z.string(),
      type: z.enum(["conference", "meetup", "hackathon"]),
    }),
    talks: z.array(
      z.object({
        title: z.string(),
        slides: z.string().url().optional(),
        video: z.string().url().optional(),
        audio: z.string().url().optional(),
      }),
    ).optional(),
    roles: z.array(z.string()).optional(),
  }),
});

export const collections = { blog, externalPosts, publishers, appearances };
