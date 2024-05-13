import { defineConfig, sharpImageService } from "astro/config";
import yaml from "@rollup/plugin-yaml";
import { DOMAIN } from "./src/consts";
import critters from "astro-critters";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: `https://${DOMAIN}`,
  integrations: [
    critters({
      critters: {
        preload: "media",
      },
    }),
  ],
  vite: {
    plugins: [yaml()],
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
