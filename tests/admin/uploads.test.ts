import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import {
  UPLOAD_MAX_BYTES,
  UPLOAD_MAX_SIDE,
  deleteStoredImage,
  isUploadFileName,
  listStoredImages,
  readStoredImage,
  storeImage,
} from "@/lib/uploads";

const dir = mkdtempSync(path.join(os.tmpdir(), "alirezvan-uploads-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

function picture(width = 400, height = 300) {
  return sharp({ create: { width, height, channels: 3, background: { r: 4, g: 120, b: 87 } } });
}

async function stored(bytes: Uint8Array) {
  const result = await storeImage(bytes, dir);
  if (!result.ok) throw new Error(`upload failed: ${result.error}`);
  return result.image;
}

describe("storing an image", () => {
  it("accepts JPEG, PNG and WebP and always writes WebP under a random name", async () => {
    for (const format of ["jpeg", "png", "webp"] as const) {
      const image = await stored(await picture().toFormat(format).toBuffer());
      expect(image.path).toMatch(/^\/uploads\/[a-f0-9]{32}\.webp$/);
      expect(image).toMatchObject({ width: 400, height: 300 });

      const file = readFileSync(path.join(dir, path.basename(image.path)));
      expect((await sharp(file).metadata()).format).toBe("webp");
    }
  });

  it("gives every upload a different name, also for identical bytes", async () => {
    const bytes = await picture().png().toBuffer();
    const first = await stored(bytes);
    const second = await stored(bytes);
    expect(first.path).not.toBe(second.path);
  });

  it("strips EXIF data, including the GPS position", async () => {
    const withGps = await picture()
      .jpeg()
      .withExif({
        IFD0: { Make: "TestCam", Artist: "Ali Rezvan" },
        // IFD3 is the GPS block of EXIF.
        IFD3: { GPSLatitudeRef: "N", GPSLatitude: "35/1 41/1 0/1", GPSLongitudeRef: "E" },
      })
      .toBuffer();
    expect((await sharp(withGps).metadata()).exif).toBeDefined();
    expect(withGps.includes("TestCam")).toBe(true);

    const image = await stored(withGps);
    const file = readFileSync(path.join(dir, path.basename(image.path)));
    const metadata = await sharp(file).metadata();
    expect(metadata.exif).toBeUndefined();
    expect(metadata.xmp).toBeUndefined();
    expect(metadata.icc).toBeUndefined();
    expect(file.includes("TestCam")).toBe(false);
    expect(file.includes("Ali Rezvan")).toBe(false);
  });

  it("applies the camera orientation before dropping it", async () => {
    const sideways = await picture(400, 300).jpeg().withExif({}).withMetadata({ orientation: 6 }).toBuffer();
    const image = await stored(sideways);
    expect(image).toMatchObject({ width: 300, height: 400 });
  });

  it("scales very large images down and never scales small ones up", async () => {
    const large = await stored(await picture(4000, 1000).jpeg().toBuffer());
    expect(large).toMatchObject({ width: UPLOAD_MAX_SIDE, height: 600 });
    const small = await stored(await picture(50, 40).png().toBuffer());
    expect(small).toMatchObject({ width: 50, height: 40 });
  });
});

describe("refusing an upload", () => {
  const before = () => readdirSync(dir).length;

  it("refuses a file that only claims to be an image", async () => {
    const count = before();
    for (const fake of [
      Buffer.from("<?php echo 1; ?>"),
      Buffer.from("<script>alert(1)</script>"),
      Buffer.from("MZ\x90\x00 not really an exe"),
      // PNG signature followed by nothing useful.
      Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]),
      // JPEG start marker followed by script text.
      Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from("<script>alert(1)</script>")]),
    ]) {
      expect(await storeImage(fake, dir)).toEqual({ ok: false, error: "not_an_image" });
    }
    expect(before()).toBe(count);
  });

  it("refuses real images of other kinds: SVG, GIF, TIFF", async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>',
    );
    const gif = await picture(10, 10).gif().toBuffer();
    const tiff = await picture(10, 10).tiff().toBuffer();
    for (const bytes of [svg, gif, tiff]) {
      expect(await storeImage(bytes, dir)).toEqual({ ok: false, error: "unsupported_type" });
    }
  });

  it("refuses an empty file and one over 5 MB", async () => {
    expect(UPLOAD_MAX_BYTES).toBe(5 * 1024 * 1024);
    expect(await storeImage(new Uint8Array(0), dir)).toEqual({ ok: false, error: "empty" });
    expect(await storeImage(new Uint8Array(UPLOAD_MAX_BYTES + 1), dir)).toEqual({
      ok: false,
      error: "too_large",
    });
  });
});

describe("reading stored images", () => {
  it("returns the bytes of a stored file", async () => {
    const image = await stored(await picture().png().toBuffer());
    const bytes = await readStoredImage(path.basename(image.path), dir);
    expect(bytes?.subarray(0, 4).toString()).toBe("RIFF");
  });

  it("looks up nothing but names it could have produced", async () => {
    writeFileSync(path.join(dir, "secret.txt"), "secret");
    for (const name of [
      "secret.txt",
      "../secret.txt",
      "..\\secret.txt",
      "%2e%2e%2fsecret.txt",
      `${"a".repeat(32)}.webp/../secret.txt`,
      `${"a".repeat(32)}.php`,
      `${"A".repeat(32)}.webp`,
      `${"a".repeat(32)}.webp\0.txt`,
      "",
      ".",
    ]) {
      expect(isUploadFileName(name)).toBe(false);
      expect(await readStoredImage(name, dir)).toBeNull();
    }
    expect(await readStoredImage(`${"a".repeat(32)}.webp`, dir)).toBeNull();
  });

  it("lists only uploads and deletes only uploads", async () => {
    const files = await listStoredImages(dir);
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((file) => isUploadFileName(file.name))).toBe(true);

    await deleteStoredImage(files[0].name, dir);
    expect(await readStoredImage(files[0].name, dir)).toBeNull();
    await expect(deleteStoredImage("../secret.txt", dir)).rejects.toThrow();
    expect(await listStoredImages(path.join(dir, "missing"))).toEqual([]);
  });
});
