// Uploaded images. Every upload is decoded with sharp and written again as a new WebP
// file under a random name, so what is stored is always a real image without the
// original's metadata (camera, GPS location) and never the bytes the browser sent.
// (Relative imports only: scripts/clean-uploads.ts runs this file with plain Node.)
import { randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type OutputInfo } from "sharp";

export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
/** Longest side of the stored image. Larger uploads are scaled down. */
export const UPLOAD_MAX_SIDE = 2400;
/** Refuse images whose decoded size could exhaust memory (about 50 megapixels). */
const MAX_INPUT_PIXELS = 50_000_000;

const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);
const FILE_NAME = /^[a-f0-9]{32}\.webp$/;

export const UPLOAD_URL_PREFIX = "/uploads/";

export type StoredImage = {
  /** Public path, e.g. "/uploads/<32 hex>.webp". */
  path: string;
  width: number;
  height: number;
  bytes: number;
};

export type UploadError = "too_large" | "not_an_image" | "unsupported_type" | "empty";

export type UploadResult = { ok: true; image: StoredImage } | { ok: false; error: UploadError };

/** The folder from UPLOAD_DIR, absolute. */
export function uploadDir(): string {
  const dir = process.env.UPLOAD_DIR?.trim();
  if (!dir) throw new Error("UPLOAD_DIR is not set (see .env.example)");
  // The comment stops Turbopack from bundling the whole project folder for this path.
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), dir);
}

export function isUploadFileName(name: string): boolean {
  return FILE_NAME.test(name);
}

/**
 * Checks, re-encodes and stores one image. The file name and type the browser claimed
 * are not looked at; only the bytes decide.
 */
export async function storeImage(bytes: Uint8Array, dir = uploadDir()): Promise<UploadResult> {
  if (bytes.byteLength === 0) return { ok: false, error: "empty" };
  if (bytes.byteLength > UPLOAD_MAX_BYTES) return { ok: false, error: "too_large" };

  let output: { data: Buffer; info: OutputInfo };
  try {
    const image = sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" });
    const metadata = await image.metadata();
    if (!metadata.format || !ACCEPTED_FORMATS.has(metadata.format)) {
      return { ok: false, error: "unsupported_type" };
    }
    output = await image
      // Apply the camera's orientation first; the tag itself is dropped with the rest.
      .rotate()
      .resize({
        width: UPLOAD_MAX_SIDE,
        height: UPLOAD_MAX_SIDE,
        fit: "inside",
        withoutEnlargement: true,
      })
      // No withMetadata(): sharp writes no EXIF, ICC, XMP or GPS data unless asked.
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    return { ok: false, error: "not_an_image" };
  }

  await mkdir(dir, { recursive: true });
  const name = `${randomBytes(16).toString("hex")}.webp`;
  // "wx" fails if the name exists, so a file is never overwritten.
  await writeFile(path.join(dir, name), output.data, { flag: "wx" });

  return {
    ok: true,
    image: {
      path: `${UPLOAD_URL_PREFIX}${name}`,
      width: output.info.width,
      height: output.info.height,
      bytes: output.data.byteLength,
    },
  };
}

/**
 * The bytes of a stored image, or null. Only names this module could have produced are
 * looked up, so a request can never reach outside the upload folder.
 */
export async function readStoredImage(name: string, dir = uploadDir()): Promise<Buffer | null> {
  if (!isUploadFileName(name)) return null;
  try {
    return await readFile(path.join(dir, name));
  } catch {
    return null;
  }
}

/** Stored files with their age, for the clean-up script. */
export async function listStoredImages(
  dir = uploadDir(),
): Promise<{ name: string; modifiedAt: Date; bytes: number }[]> {
  let names: string[];
  try {
    names = await readdir(/* turbopackIgnore: true */ dir);
  } catch {
    return [];
  }
  const files = [];
  for (const name of names.filter(isUploadFileName).sort()) {
    const info = await stat(path.join(dir, name));
    files.push({ name, modifiedAt: info.mtime, bytes: info.size });
  }
  return files;
}

export async function deleteStoredImage(name: string, dir = uploadDir()): Promise<void> {
  if (!isUploadFileName(name)) throw new Error("Not an upload file name");
  await unlink(path.join(dir, name));
}
