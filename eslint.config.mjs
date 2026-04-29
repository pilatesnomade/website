import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      ".astro/",
      ".vercel/",
      "dist/",
      "node_modules/"
    ],
  },
  { files: ["**/*.{js,mjs,ts,astro}"] },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    // Override some Astro rules for this project
    rules: {
      "astro/no-set-html-directive": "warn",
    },
  },
];
