import { defineConfig, sharpImageService } from "astro/config";
import yaml from "@rollup/plugin-yaml";
import { DOMAIN } from "./src/consts";
import cloudflare from "@astrojs/cloudflare";
import playformInline from "@playform/inline";

import sentry from "@sentry/astro";

// https://astro.build/config
export default defineConfig({
  site: `https://${DOMAIN}`,
  integrations: [
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
    ssr: {
      external: ["@datastax/astra-db-ts", "openai"],
    },
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
    smartypants: false,
  },
  compressHTML: true,
  output: "static",
  adapter: cloudflare({
    imageService: "passthrough",
  }),
});
