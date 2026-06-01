// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      name: "Inter",
      provider: fontProviders.google(),
      cssVariable: "--font-sans",
      weights: [400, 500, 600],
    },
    {
      name: "Zilla Slab",
      provider: fontProviders.google(),
      cssVariable: "--font-serif",
      weights: [400],
    },
  ],
  integrations: [svelte()],
});
