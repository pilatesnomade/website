// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import favicons from 'astro-favicons';
import vercel from '@astrojs/vercel';
import { storyblok } from "@storyblok/astro";
import sitemap from '@astrojs/sitemap';
import { loadEnv } from "vite";


const env = loadEnv('', process.cwd(), '');
const isPreview = env.IS_PREVIEW === true || process.env.IS_PREVIEW === true || process.env.IS_PREVIEW === 'true' || import.meta.env.IS_PREVIEW === true || import.meta.env.IS_PREVIEW === 'true';


// https://astro.build/config
export default defineConfig({
  output: isPreview ? "server" : "static",
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,
    imagesConfig: {
      minimumCacheTTL: 86400,
      sizes: [300, 720, 1080, 1560, 1920, 2560],
      remotePatterns: [
        {
          protocol: "https",
          hostname: "a.storyblok.com",
          pathname: `/f/${env.STORYBLOK_SPACE_ID}/**`,
        },
      ],
    },
  }),
  image: {
    service: passthroughImageService(),
    remotePatterns: [
      {
        protocol: "https",
        hostname: "a.storyblok.com",
        pathname: `/f/${env.STORYBLOK_SPACE_ID}/**`,
      },
    ],
  },
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [storyblok({
    componentsDir: "src/components/storyblok",
    components: {
      page: "Page",
      textonly: "TextOnly",
      button: "Button",
      cardsChoices: "CardsChoices",
      hero: "Hero",
      logo: "Logo",
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