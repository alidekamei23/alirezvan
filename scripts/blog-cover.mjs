// Prepares a blog post's cover image from any photo:
//   public/images/blog/<slug>.webp     the cover, at most 1600 px wide (next/image makes
//                                      the smaller sizes on request)
//   public/images/blog/og/<slug>.jpg   1200×630 for Open Graph and Twitter cards
// sharp drops all metadata (EXIF, GPS) unless asked to keep it. The original file is
// never copied into the project.
// Usage: npm run blog:cover -- <path-to-photo> <slug>
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [input, slug] = process.argv.slice(2);
if (!input || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug ?? "")) {
  console.error("Usage: npm run blog:cover -- <path-to-photo> <slug>");
  process.exit(1);
}

const MAX_WIDTH = 1600;
const TARGET_BYTES = 200 * 1024;
const blogDir = path.join(process.cwd(), "public", "images", "blog");
const coverPath = path.join(blogDir, `${slug}.webp`);
const ogPath = path.join(blogDir, "og", `${slug}.jpg`);
mkdirSync(path.dirname(ogPath), { recursive: true });

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

// Lower the quality step by step (80 → 70) until the cover fits the size target.
let info;
for (const quality of [80, 78, 75, 72, 70]) {
  info = await sharp(input)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toFile(coverPath);
  if (info.size <= TARGET_BYTES) break;
}

const og = await sharp(input)
  .rotate()
  .resize(1200, 630, { fit: "cover", position: "attention" })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(ogPath);

console.log(
  JSON.stringify({
    slug,
    original: kb(statSync(input).size),
    cover: `${info.width}x${info.height}, ${kb(info.size)}`,
    og: `${og.width}x${og.height}, ${kb(og.size)}`,
  }),
);
