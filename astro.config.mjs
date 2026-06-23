import { defineConfig, sharpImageService } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import yaml from "@rollup/plugin-yaml";
import { DOMAIN } from "./src/consts";
import cloudflare from "@astrojs/cloudflare";
import playformInline from "@playform/inline";
import astroRelatedContent from "@philnash/astro-related-content";

import sentry from "@sentry/astro";

// https://astro.build/config
export default defineConfig({
  site: `https://${DOMAIN}`,
  integrations: [
    astroRelatedContent({
      collections: [{ collection: "blog" }],
      generation: { limit: 4 },
      embeddings: {
        model: "onnx-community/embeddinggemma-300m-ONNX",
        dtype: "fp32",
        pooling: "mean",
        batchSize: 1,
      },
    }),
    playformInline({ Critters: { preload: "media" } }),
    process.env.NODE_ENV === "production"
      ? sentry({
          project: "javascript-astro",
          org: "phil-nash",
          authToken: process.env.SENTRY_AUTH_TOKEN,
          clientInitPath: "./src/utils/sentry.client.config.js",
          serverInitPath: "./src/utils/sentry.server.config.js",
        })
      : null,
  ],
  vite: {
    plugins: [yaml()],
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
        },
      },
    },
  },
  image: {
    service: sharpImageService(),
  },
  markdown: {
    shikiConfig: {
      theme: "slack-dark",
    },
    processor: satteri({}),
  },
  compressHTML: true,
  output: "static",
  adapter: cloudflare({
    imageService: "passthrough",
    prerenderEnvironment: "node",
  }),
});
