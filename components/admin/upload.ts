// Image upload from the admin editors to POST /admin/api/upload (session checked there).
// Shared by the article cover picker and MarkdownEditor's inline images.

export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = "image/jpeg,image/png,image/webp";

export type UploadResult =
  | { ok: true; path: string; width: number; height: number }
  | { ok: false; error: string };

export async function uploadImage(file: File): Promise<UploadResult> {
  if (file.size > UPLOAD_MAX_BYTES) return { ok: false, error: "حجم تصویر بیش از ۵ مگابایت است." };
  const body = new FormData();
  body.set("file", file);
  try {
    const response = await fetch("/admin/api/upload", { method: "POST", body });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.path) {
      return { ok: false, error: data?.error ?? "بارگذاری تصویر انجام نشد." };
    }
    return { ok: true, path: data.path, width: data.width, height: data.height };
  } catch {
    return { ok: false, error: "ارتباط با سرور برقرار نشد." };
  }
}
