---
title: "Generate AI-powered related content for your Astro site"
tags:
  - astro
  - vector embeddings
  - ai
  - transformers.js
image: ../../assets/posts/related/astro-related-posts.jpg
imageAlt: "An abstract image depicting content that is connected or related."
imageWidth: 1500
imageHeight: 500
pubDate: "2026-05-27"
---

Showing related posts beneath a blog post is a great way to give your visitors more to read and encourage them to spend more time on your site.

Existing methods of showing related content include [matching posts by tags](https://www.joshfinnie.com/blog/creating-a-similar-posts-component-in-astrojs/) or by [manually adding related posts to your frontmatter](https://johndalesandro.com/blog/astro-add-related-posts-to-blog-entries/). Both of these work, and I used to use tag-based related posts myself, but I wanted something a bit less manual. It's a perfect use-case for vector embeddings to help tell what content is similar to other content.

I have created an integration for Astro sites called [Astro Related Content (@philnash/astro-related-content)](https://www.npmjs.com/package/@philnash/astro-related-content) that generates related posts for your content collections that you can display in your UI. You can see an example of this in action at the bottom of this post and every blog post on my site. Read on to find out how to use it.

## What are vector embeddings?

A vector embedding is a list of floating-point numbers that represents the meaning of a body of text. Vectors are points in a multidimensional space which means you can measure the distance between them. Content items with vectors that are near each other in this space are more related and vectors that are further away are less related. By creating vector embeddings for each piece of content in a collection we can measure the similarity of pieces of content to suggest semantically related content.

Vector embeddings are created by AI models, and I have written about [how to generate vector embeddings in Node.js](/blog/2024/09/25/how-to-create-vector-embeddings-in-node-js/) on this blog before. One of those techniques is used in the Astro Related Content integration.

## How to use it

The integration runs during the development or build phases, generates embeddings for your configured collections, stores the results in your repo, and exposes a virtual module you can use from your Astro components to retrieve and display the related content.

To use the Astro Related Content integration in your Astro app start by installing the npm module:

```shell
npm install @philnash/astro-related-content
```

Next you need to configure it. In your `astro.config.mjs` file import the package:

```js
import astroRelatedContent from "@philnash/astro-related-content";
```

Then add the `astroRelatedContent` integration to the config via the `integrations` property.

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

Now, when you run your application, in either Astro's dev or build mode, an embedding model will be downloaded and used to generate vector embeddings for each of the items in the collections you specify. This first generation step may take a while to complete, depending on how many items are in your collection and how fast your machine can run the model.

The vectors are stored in a JSON file called `vectors.json` in a directory called `.astro-related-content`. For each collection the five most similar items are pre-calculated and stored in a file called `data.json` in the same directory. Once you have these files, vectors and related items will only be regenerated when a content item changes. It is recommended that you check these files into source control to avoid regenerating embeddings during deployment. Depending on your collection size and embedding model, `vectors.json` can get quite large, so you might want to watch out for that.

### Generation config

There is more you can configure. There are options for the generation:

- `limit`: how many related posts to generate
- `watch`: whether to keep re-generating vectors and related posts while in dev mode, which is `true` by default

You can set these like:

```js
export default defineConfig({
  integrations: [
    astroRelatedContent({
      collections: ["blog"],
      generation: {
        limit: 4,
        watch: false,
      },
    }),
  ],
});
```

### Displaying related content

Now that the integration has generated the related posts you need to display the posts on the site.

To use the generated files, the integration makes available a virtual module: `virtual:astro-related-content`. Import the `getRelatedContent` function, then pass the collection you want to look up and the ID of the content item that you want the related content for.

```js
import { getRelatedContent } from "virtual:astro-related-content";

const { id } = Astro.props;

const relatedContent = await getRelatedContent("blog", id);
```

In the above code, `relatedContent` is an array of objects with an `entry` which is of type `CollectionEntry<"blog">` and a `score`, which is the similarity.

You can now display the related posts however you wish.

```jsx
<h2>Related posts</h2>

<ul>
  {
    relatedContent.map((item) => (
      <li>{item.entry.data.title}</li>
    ))
  }
</ul>
```

### Vector embedding options

Once you have it working, you can tweak the model that you use to generate the vectors for your content items. You can use any of [the models on Hugging Face that work with transformers.js](https://huggingface.co/models?pipeline_tag=feature-extraction&library=transformers.js&sort=trending). On this blog I started off with the [Qwen 3 Embedding 0.6b](https://huggingface.co/onnx-community/Qwen3-Embedding-0.6B-ONNX) model, tried out the much smaller [Granite Embedding Small English R2 from IBM](https://huggingface.co/onnx-community/granite-embedding-small-english-r2-ONNX) and eventually settled on [Google's EmbeddingGemma 300m](https://huggingface.co/onnx-community/embeddinggemma-300m-ONNX).

[EmbeddingGemma](https://ai.google.dev/gemma/docs/embeddinggemma?utm_campaign=deveco_gdemembers&utm_source=deveco) is a great model; it's not very big, it is multilingual, and it has a context size of 2k tokens. It seems to work well for my blog posts.

My config for this site looks like:

```js
export default defineConfig({
  integrations: [
    astroRelatedContent({
      collections: ["blog"],
      generation: {
        limit: 4,
      },
      embeddings: {
        model: "onnx-community/embeddinggemma-300m-ONNX",
        dtype: "fp32",
        pooling: "mean",
        batchSize: 1,
      },
    }),
  ],
});
```

You can read [more about the embeddings options in the project documentation](https://github.com/philnash/astro-components/tree/main/packages/astro-related-content#transformersjs-embeddings).

## Future plans

Currently the package supports running models on your own machine via [transformers.js](https://huggingface.co/docs/transformers.js/en/index), but if there is interest, it should be easy to add support for other local methods of running models, like Ollama, or API-based methods, like using [OpenAI's text-embedding-3-small](https://developers.openai.com/api/docs/models/text-embedding-3-small).

## Try it out today

If you'd like to display related content for an Astro content collection without manually selecting links or relying on tags, check out [`@philnash/astro-related-content`](https://www.npmjs.com/package/@philnash/astro-related-content) and let me know how it goes for you. If there are any problems, let me know with an [issue on the GitHub repo](https://github.com/philnash/astro-components/issues), and if it's any good, [give the repo a star](https://github.com/philnash/astro-components)!
