import { defineConfig, sharpImageService } from "astro/config";
import yaml from "@rollup/plugin-yaml";
import { DOMAIN } from "./src/consts";
import cloudflare from "@astrojs/cloudflare";
import playformInline from "@playform/inline";

// https://astro.build/config
export default defineConfig({
  site: `https://${DOMAIN}`,
  integrations: [playformInline({ Critters: { preload: "media" } })],
  vite: {
    plugins: [yaml()],
    ssr: {
      external: ["@datastax/astra-db-ts", "openai"],
    },
  },
  image: {
    service: sharpImageService(),
  },
  markdown: {
    shikiConfig: {
      theme: "slack-dark",
    },
  },
  compressHTML: true,
  output: "hybrid",
  adapter: cloudflare({
    imageService: "compile",
  }),
});
