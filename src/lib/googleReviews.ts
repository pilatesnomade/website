import { ApifyClient } from "apify-client";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import https from "https";

const CACHE_FILE = join(process.cwd(), "public", "cache", "google-reviews-cache.json");
const AVATARS_DIR = join(process.cwd(), "public", "cache", "avatars");
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const APIFY_INPUT = {
  startUrls: [
    {
      url: "https://www.google.com/maps/place/Pilates+Nomade/@45.1584955,1.5290747,17z/data=!3m1!4b1!4m6!3m5!1s0x47f8973f3245ac93:0x6cc7ba3f3c57e6d7!8m2!3d45.1584955!4d1.5316496!16s%2Fg%2F11jdcwfp7b?entry=ttu&g_ep=EgoyMDI2MDMyNC4wIKXMDSoASAFQAw%3D%3D"
    }
  ],
  maxReviews: 10,
  reviewsSort: "newest",
  language: "fr",
  reviewsOrigin: "all",
  personalData: true
};

function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const status = res.statusCode ?? 0;

        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          downloadImage(new URL(res.headers.location, url).toString())
            .then(resolve)
            .catch(reject);
          return;
        }

        if (status < 200 || status >= 300) {
          res.resume();
          reject(new Error(`HTTP ${status} for ${url}`));
          return;
        }

        const contentType = res.headers["content-type"] ?? "";
        if (!contentType.startsWith("image/")) {
          res.resume();
          reject(new Error(`Unexpected content-type "${contentType}" for ${url}`));
          return;
        }

        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

async function downloadAvatars(
  reviews: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  if (!existsSync(AVATARS_DIR)) {
    mkdirSync(AVATARS_DIR, { recursive: true });
  }

  const updatedReviews = await Promise.all(
    reviews.map(async (review) => {
      const reviewerId = review.reviewerId as string;
      const photoUrl = review.reviewerPhotoUrl as string;

      if (!reviewerId) {
        return review;
      }

      const localPath = `/cache/avatars/${reviewerId}.jpg`;
      const filePath = join(AVATARS_DIR, `${reviewerId}.jpg`);

      if (existsSync(filePath)) {
        return { ...review, reviewerPhotoUrl: localPath };
      }

      // Nothing to download: the review already points at a local file or has no photo.
      if (typeof photoUrl !== "string" || !photoUrl.startsWith("http")) {
        return review;
      }

      try {
        const buffer = await downloadImage(photoUrl);
        writeFileSync(filePath, buffer);
        console.log(`Downloaded avatar for ${review.name}`);
        return { ...review, reviewerPhotoUrl: localPath };
      } catch (error) {
        console.error(`Failed to download avatar for ${review.name}:`, error);
        // Keep the remote URL so the component can fall back to it.
        return review;
      }
    })
  );

  return updatedReviews;
}

export async function fetchAndCacheGoogleReviews() {
  if (existsSync(CACHE_FILE)) {
    try {
      const cacheData = JSON.parse(readFileSync(CACHE_FILE, "utf8"));
      const cacheTime = new Date(cacheData.timestamp).getTime();

      if (Date.now() - cacheTime < THIRTY_DAYS_MS) {
        console.log("Using cached Google reviews");
        return cacheData.reviews;
      }
    } catch (error) {
      console.error("Error reading cache file:", error);
    }
  }

  console.log("Fetching fresh Google reviews");

  const client = new ApifyClient({
    token: import.meta.env.APIFY_TOKEN
  });

  const run = await client.actor("Xb8osYTtOjlsgI6k9").call(APIFY_INPUT);
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  const filteredItems = items.filter((item) => !!item.text);

  console.log("Downloading reviewer avatars...");
  const reviewsWithLocalAvatars = await downloadAvatars(filteredItems);

  const cacheData = {
    timestamp: new Date().toISOString(),
    reviews: reviewsWithLocalAvatars
  };

  try {
    writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
    console.log("Google reviews cached successfully");
  } catch (error) {
    console.error("Error writing cache file:", error);
  }

  return reviewsWithLocalAvatars;
}
