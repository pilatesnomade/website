import type { AstroIntegration } from "astro";
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * `fetchAndCacheGoogleReviews()` downloads reviewer avatars into
 * `public/cache/avatars` while Astro renders pages.
 *
 * Vite copies `public/` into the build output at the start of the client build,
 * which happens before pages are rendered. Files written to `public/` during the
 * build therefore never reach `dist/`, so `/_vercel/image` answers
 * `400 INVALID_IMAGE_OPTIMIZE_REQUEST` for them.
 *
 * Copy the cache folder into the build output once the build is done. This hook
 * runs before the Vercel adapter's `astro:copy-vercel-output` integration, which
 * then moves everything to `.vercel/output/static`.
 */
export default function googleReviewAssets(): AstroIntegration {
  return {
    name: "google-review-assets",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const source = join(process.cwd(), "public", "cache");
        if (!existsSync(source)) return;

        const destination = fileURLToPath(new URL("cache", dir));
        copyRecursively(source, destination);

        logger.info(`Copied Google reviews cache to ${destination}`);
      }
    }
  };
}

function copyRecursively(source: string, destination: string): void {
  if (!existsSync(destination)) {
    mkdirSync(destination, { recursive: true });
  }

  for (const entry of readdirSync(source)) {
    const from = join(source, entry);
    const to = join(destination, entry);

    if (statSync(from).isDirectory()) {
      copyRecursively(from, to);
    } else {
      copyFileSync(from, to);
    }
  }
}
