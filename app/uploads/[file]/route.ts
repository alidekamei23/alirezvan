// GET /uploads/<name> — serves an uploaded image from UPLOAD_DIR. Only names made by
// lib/uploads.ts (32 hex characters + ".webp") are looked up; there is no listing.
import { readStoredImage } from "@/lib/uploads";

export async function GET(_request: Request, { params }: RouteContext<"/uploads/[file]">) {
  const { file } = await params;
  const bytes = await readStoredImage(file);
  if (!bytes) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(bytes), {
    headers: {
      // Fixed type: the stored bytes are always WebP written by sharp.
      "Content-Type": "image/webp",
      "Content-Length": String(bytes.byteLength),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
      // A name is never reused, so the file behind it never changes.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
