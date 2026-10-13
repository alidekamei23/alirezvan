"use server";
// Every Server Action of the admin panel. Each one checks the session itself before
// doing anything (the proxy and the page that rendered the form do not count), parses
// its input with Zod, and answers with Persian messages that reveal nothing internal.
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  ADMIN_LOGIN_PATH,
  clearSessionCookie,
  clientIp,
  requireAdminPage,
  setSessionCookie,
} from "@/lib/auth/admin";
import { getAuthConfig } from "@/lib/auth/config";
import { attemptLogin, logout } from "@/lib/auth/login";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { deleteArticle, saveArticle } from "@/lib/articles/repository";
import { articleInputSchema } from "@/lib/articles/schema";
import { getDb } from "@/lib/db";
import { toPersianDigits } from "@/lib/format";
import { cookies } from "next/headers";

// ---------------------------------------------------------------------------- login

export type LoginState = { error: string | null };

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  let config;
  try {
    config = getAuthConfig();
  } catch (error) {
    // Says which variable is wrong, in the server log only.
    console.error("[admin]", error instanceof Error ? error.message : error);
    return { error: "ورود در حال حاضر ممکن نیست. تنظیمات سرور را بررسی کنید." };
  }

  const result = await attemptLogin(getDb(), config, {
    username: formData.get("username"),
    password: formData.get("password"),
    ip: await clientIp(),
  });

  if (!result.ok) {
    if (result.reason === "rate_limited") {
      const minutes = Math.max(1, Math.ceil(result.retryAfterMs / 60_000));
      return {
        error: `تلاش‌های ناموفق زیاد بود. ${toPersianDigits(minutes)} دقیقه دیگر دوباره امتحان کنید.`,
      };
    }
    // One message for a wrong username and a wrong password.
    return { error: "نام کاربری یا گذرواژه نادرست است." };
  }

  await setSessionCookie(result.cookieValue, result.expiresAt);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  try {
    await logout(getDb(), getAuthConfig(), value);
  } catch (error) {
    console.error("[admin]", error instanceof Error ? error.message : error);
  }
  await clearSessionCookie();
  redirect(ADMIN_LOGIN_PATH);
}

// -------------------------------------------------------------------------- articles

const saveRequestSchema = z.object({
  id: z.uuid().nullable(),
  action: z.enum(["save", "publish", "unpublish"]),
  article: articleInputSchema,
});

export type SaveArticleState =
  | { ok: true; id: string; slug: string; status: "draft" | "published"; created: boolean }
  | {
      ok: false;
      message: string;
      /** Field name → message, for the fields of the editor form. */
      fieldErrors: Record<string, string>;
    };

export async function saveArticleAction(payload: unknown): Promise<SaveArticleState> {
  const session = await requireAdminPage();

  const parsed = saveRequestSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      // ["article", "faqs", 0, "q"] → "faqs"
      const field = String(issue.path[0] === "article" ? (issue.path[1] ?? "") : issue.path[0]);
      fieldErrors[field] ??= issue.message;
    }
    return { ok: false, message: "برخی از فیلدها نیاز به اصلاح دارند.", fieldErrors };
  }

  const { id, action, article } = parsed.data;
  let result;
  try {
    result = await saveArticle(getDb(), { id, input: article, action }, { username: session.username });
  } catch (error) {
    console.error("[admin] save failed:", error);
    return { ok: false, message: "ذخیره انجام نشد. دوباره تلاش کنید.", fieldErrors: {} };
  }

  if (!result.ok) {
    if (result.error === "slug_taken") {
      return {
        ok: false,
        message: "این نشانی را مقاله دیگری دارد.",
        fieldErrors: { slug: "این نشانی تکراری است؛ نشانی دیگری بنویسید." },
      };
    }
    if (result.error === "publish_problems") {
      return {
        ok: false,
        message: "برای انتشار، این موارد را کامل کنید.",
        fieldErrors: Object.fromEntries(result.problems.map((p) => [p.field, p.message])),
      };
    }
    return { ok: false, message: "این مقاله دیگر وجود ندارد.", fieldErrors: {} };
  }

  const { article: saved, created } = result;
  return { ok: true, id: saved.id, slug: saved.slug, status: saved.status, created };
}

export async function deleteArticleAction(id: unknown): Promise<void> {
  await requireAdminPage();
  const parsed = z.uuid().safeParse(id);
  if (parsed.success) await deleteArticle(getDb(), parsed.data);
  redirect("/admin?deleted=1");
}
