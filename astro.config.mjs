// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import favicons from 'astro-favicons';
import vercel from '@astrojs/vercel';
import { storyblok } from "@storyblok/astro";
import sitemap from '@astrojs/sitemap';

const isPreview = process.env.IS_PREVIEW === true || process.env.IS_PREVIEW === 'true' || import.meta.env.IS_PREVIEW === true || import.meta.env.IS_PREVIEW === 'true';


// https://astro.build/config
export default defineConfig({
  output: isPreview ? "server" : "static",
  adapter: vercel({
    webAnalytics: { enabled: true }
  }),
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [storyblok({
    componentsDir: "src/components/storyblok",
    components: {
      page: "Page",
      textonly: "TextOnly",
      button: "Button",
    },
    accessToken: import.meta.env.STORYBLOK_TOKEN || "your_token_here",
    enableFallbackComponent: true,
    customFallbackComponent: "StoryblokFallback",
    bridge: true,
    apiOptions: {
      region: import.meta.env.STORYBLOK_REGION || "eu"
    }
  }),favicons(), sitemap()],
});