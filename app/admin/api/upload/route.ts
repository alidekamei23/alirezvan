// POST /admin/api/upload — stores one image for an article (cover or inline).
// Form field: "file". Answers { path, width, height } or { error }.
import { requireAdminAction } from "@/lib/auth/admin";
import { isSameOrigin } from "@/lib/auth/origin";
import { UPLOAD_MAX_BYTES, storeImage, type UploadError } from "@/lib/uploads";

const MESSAGES: Record<UploadError, string> = {
  too_large: "حجم تصویر بیش از ۵ مگابایت است.",
  not_an_image: "این فایل یک تصویر سالم نیست.",
  unsupported_type: "فقط تصویر JPEG، PNG یا WebP پذیرفته می‌شود.",
  empty: "فایل خالی است.",
};

function refuse(status: number, error: string) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  try {
    await requireAdminAction();
  } catch {
    return refuse(401, "برای بارگذاری تصویر باید وارد شوید.");
  }
  if (!isSameOrigin(request.headers)) return refuse(403, "درخواست پذیرفته نشد.");

  // Refuse an oversized body before reading it (the form adds a little to the file).
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > UPLOAD_MAX_BYTES + 64 * 1024) return refuse(413, MESSAGES.too_large);

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return refuse(400, "درخواست نامعتبر است.");
  }
  if (!(file instanceof File)) return refuse(400, "فایلی فرستاده نشده است.");
  if (file.size > UPLOAD_MAX_BYTES) return refuse(413, MESSAGES.too_large);

  try {
    const result = await storeImage(new Uint8Array(await file.arrayBuffer()));
    if (!result.ok) {
      return refuse(result.error === "too_large" ? 413 : 415, MESSAGES[result.error]);
    }
    const { path, width, height } = result.image;
    return Response.json({ path, width, height }, { status: 201 });
  } catch (error) {
    // The cause goes to the server log only; the browser gets no path or stack trace.
    console.error("[admin] upload failed:", error);
    return refuse(500, "ذخیره تصویر انجام نشد. دوباره تلاش کنید.");
  }
}
