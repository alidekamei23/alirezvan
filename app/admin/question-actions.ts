"use server";
// Server Actions of the Q&A part of the admin panel. Like every admin action, each checks
// the session itself first (the proxy and the page that rendered the form do not count),
// parses its input with Zod, and refuses status changes the rules do not allow. After any
// change the public Q&A cache is refreshed, so the site shows it on the next request.
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminPage } from "@/lib/auth/admin";
import { getDb } from "@/lib/db";
import { QUESTIONS_TAG } from "@/lib/questions/cached";
import { applyQuestionAction } from "@/lib/questions/repository";
import { fieldErrors, questionEditSchema } from "@/lib/questions/schema";
import type { QuestionStatus } from "@/db/schema";

const requestSchema = z.discriminatedUnion("action", [
  z.object({ id: z.uuid().nullable(), action: z.enum(["save", "publish"]), question: questionEditSchema }),
  z.object({ id: z.uuid(), action: z.enum(["unpublish", "archive", "restore"]) }),
  z.object({ id: z.uuid(), action: z.literal("reject"), reason: z.string().max(1000) }),
]);

export type QuestionActionState =
  | { ok: true; id: string; slug: string; status: QuestionStatus; created: boolean }
  | { ok: false; message: string; fieldErrors: Record<string, string> };

const ERRORS = {
  not_found: "این سؤال دیگر وجود ندارد.",
  invalid_transition: "این کار در وضعیت فعلی سؤال ممکن نیست. صفحه را تازه کنید.",
  needs_answer: "برای انتشار، اول پاسخ را بنویسید.",
  slug_taken: "این نشانی را سؤال دیگری دارد.",
} as const;

export async function questionAction(payload: unknown): Promise<QuestionActionState> {
  const session = await requireAdminPage();

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    // ["question", "title"] → "title"
    const issues = new z.ZodError(
      parsed.error.issues.map((issue) => ({
        ...issue,
        path: issue.path[0] === "question" ? issue.path.slice(1) : issue.path,
      })),
    );
    return { ok: false, message: "برخی از فیلدها نیاز به اصلاح دارند.", fieldErrors: fieldErrors(issues) };
  }

  const request = parsed.data;
  let result;
  try {
    result = await applyQuestionAction(
      getDb(),
      {
        id: request.id,
        action: request.action,
        ...("question" in request && { input: request.question }),
        ...("reason" in request && { reason: request.reason }),
      },
      { username: session.username },
    );
  } catch (error) {
    console.error("[admin] question action failed:", error);
    return { ok: false, message: "ذخیره انجام نشد. دوباره تلاش کنید.", fieldErrors: {} };
  }

  if (!result.ok) {
    return {
      ok: false,
      message: ERRORS[result.error],
      fieldErrors:
        result.error === "slug_taken"
          ? { slug: "این نشانی تکراری است؛ نشانی دیگری بنویسید." }
          : result.error === "needs_answer"
            ? { answer: "پاسخ خالی است." }
            : {},
    };
  }

  updateTag(QUESTIONS_TAG);
  const question = result.question!;
  return { ok: true, id: question.id, slug: question.slug, status: question.status, created: result.created };
}

/** Soft delete; the question disappears everywhere. Then back to the list. */
export async function deleteQuestionAction(id: unknown): Promise<void> {
  const session = await requireAdminPage();
  const parsed = z.uuid().safeParse(id);
  if (parsed.success) {
    await applyQuestionAction(getDb(), { id: parsed.data, action: "delete" }, { username: session.username });
    updateTag(QUESTIONS_TAG);
  }
  redirect("/admin/questions?deleted=1");
}
