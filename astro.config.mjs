import { defineConfig } from "astro/config";
import yaml from "@rollup/plugin-yaml";
import { DOMAIN } from "./src/consts";

import critters from "astro-critters";

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
  experimental: {
    assets: true,
  },
  markdown: {
    shikiConfig: {
      theme: "slack-dark",
    },
  },
});
