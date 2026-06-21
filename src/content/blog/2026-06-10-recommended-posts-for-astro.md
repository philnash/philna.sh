---
title: "Generate AI-powered recommended content for your Astro site"
tags:
  - astro
  - vector embeddings
  - ai
  - transformers.js
image: ../../assets/posts/ai-assisted/working-with-codex.jpg
imageAlt: " "
imageWidth: 1500
imageHeight: 500
pubDate: "2026-05-27"
---

Showing related posts beneath a blog post is a great way to give your visitors more to read and encourage them to spend more time on your site.

Existing methods of showing related content include [matching posts by tags](https://www.joshfinnie.com/blog/creating-a-similar-posts-component-in-astrojs/) or by [manually adding related posts to your frontmatter](https://johndalesandro.com/blog/astro-add-related-posts-to-blog-entries/). While both of these work, I've even used tag-based related posts myself, I wanted something a bit less manual. It's a perfect use-case for vector embeddings to help tell what content is similar to other content.

I have created a integration for Astro sites called [Astro Related Content (@philnash/astro-related-content)](https://www.npmjs.com/package/@philnash/astro-related-content) that generates related posts for your content collections that you can display in your UI. You can see an example of this in action at the bottom of this post and every blog post on my site. Read on to find out how it works and how to use it.

## What are vector embeddings?

A vector embedding is a list of floating-point numbers that represents the meaning of a body of text. The vector itself is a point in a multidimensional space which means you can measure the distance between them. Strings with vectors that are near each other in this space are more related and vectors that are further away are less related. By creating vector embeddings for each piece of content in a collection we can measure the similarity of pieces of content to suggest genuinely related content.

Vector embeddings are created by AI models, and I have written about [how to generate vector embeddings in Node.js](/blog/2024/09/25/how-to-create-vector-embeddings-in-node-js/) on this blog before. One of those techniques is used in the Astro Related Content integration.

## How to use it

To use the Astro Related Content integration in your Astro app start by installing the npm module:

```shell
npm install @philnash/astro-related-content
```

Next you need to configure it. In your `astro.config.mjs` file import the package:

```js
import astroRelatedContent from "@philnash/astro-related-content";
```

Then add the `astroRelatedContent` integration to the config via the `integrations` property.

```js
export default defineConfig({
  integrations: [astroRelatedContent(config)],
});
```

To configure the integration you need to set the collections for which you want to generate vectors. In this site, the blog post collection is called "blog", so I would use the following configuration:

```js
export default defineConfig({
  integrations: [
    astroRelatedContent({
      collections: ["blog"],
    }),
  ],
});
```

Now, when you run your application, with either `npm run dev` or `npm run build`, an embedding model will be downloaded and used to generate vector embeddings for each of the items in the collections you specify. This first generation step may take a while to complete, depending on how many items are in your collection and how fast your machine can run the model.

The vectors are stored in a JSON file called `vectors.json` in a directory called `.astro-related-content`. For each collection the five most similar items are pre-calculated and stored in a file called `data.json` in the same directory. Once you have these files, vectors and related items will only be regenerated when a content item changes. It is recommended that you check these files into source control so that they can be used during build time for deploying the application, as well as shared with other members of your team.

### Optional config

There is more you can configure, if you want to. Simple config options include `limit`, `artifactDir`

## How it works
