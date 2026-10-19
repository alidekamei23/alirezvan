"use client";
// QuestionEditor — reviewing and answering one question (or adding a question and its
// answer by hand): the question as the visitor sent it next to the editable copy, the
// answer in MarkdownEditor, category, address and SEO fields, related articles, the
// featured flag and a private note, a preview of the public page, and the status actions
// (save, publish, unpublish, reject, archive, restore, delete). Only the actions allowed
// for the current status are offered; the server checks again.
// Usage: <QuestionEditor question={editorQuestion} articles={articleOptions} siteUrl={SITE_URL} />
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ExternalLink,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  Send,
  Trash2,
  Undo2,
  XCircle,
} from "lucide-react";
import { deleteQuestionAction, questionAction } from "@/app/admin/question-actions";
import { Alert } from "@/components/Alert";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { FieldError, FieldHint, FieldLabel, controlClasses } from "@/components/Field";
import { LinkButton } from "@/components/LinkButton";
import { Ltr } from "@/components/Ltr";
import { Select } from "@/components/Select";
import { TextField } from "@/components/TextField";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { QuestionArticle } from "@/components/questions/QuestionArticle";
import type { QuestionStatus } from "@/db/schema";
import { questionCategories } from "@/content/question-categories";
import { normalizeSlug } from "@/lib/articles/slug";
import { toPersianDigits } from "@/lib/format";
import { STATUS_TONES } from "@/lib/questions/admin-view";
import { STATUS_LABELS, allowedActions, type QuestionAction } from "@/lib/questions/core";
import { QUESTION_LIMITS } from "@/lib/questions/schema";
import { questionHref } from "@/lib/questions/view";

export type EditorQuestion = {
  id: string | null;
  status: QuestionStatus;
  everPublished: boolean;
  /** What the visitor sent; null for a question the admin adds. */
  original: { title: string; body: string } | null;
  rejectionReason: string;
  publishedAt: string | null;
  displayName: string;
  category: string;
  title: string;
  body: string;
  answer: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  isFeatured: boolean;
  adminNote: string;
  relatedArticles: string[];
};

export type ArticleOption = { id: string; title: string; published: boolean };

type Form = Pick<
  EditorQuestion,
  | "displayName"
  | "category"
  | "title"
  | "body"
  | "answer"
  | "slug"
  | "metaTitle"
  | "metaDescription"
  | "isFeatured"
  | "adminNote"
  | "relatedArticles"
>;

const toForm = (question: EditorQuestion): Form => ({
  displayName: question.displayName,
  category: question.category,
  title: question.title,
  body: question.body,
  answer: question.answer,
  slug: question.slug,
  metaTitle: question.metaTitle,
  metaDescription: question.metaDescription,
  isFeatured: question.isFeatured,
  adminNote: question.adminNote,
  relatedArticles: question.relatedArticles,
});

const CATEGORY_OPTIONS = questionCategories.map((category) => ({ value: category.slug, label: category.title }));
const SEO_TITLE_GUIDE = 60;
const SEO_DESCRIPTION_GUIDE = 160;

type Pending = QuestionAction | null;

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="rounded-md border border-line bg-surface p-4 md:p-6">
      <h2 id={id} className="text-xl font-bold text-ink">
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-5">{children}</div>
    </section>
  );
}

function CharGuide({ length, guide }: { length: number; guide: number }) {
  return (
    <p className={length > guide ? "text-sm font-semibold text-warning-ink" : "text-sm text-muted"}>
      {toPersianDigits(length)} نویسه
      {length > guide
        ? ` — بلندتر از حدود ${toPersianDigits(guide)} نویسه‌ای است که معمولاً در نتیجه جست‌وجو دیده می‌شود.`
        : ` (راهنما: تا حدود ${toPersianDigits(guide)})`}
    </p>
  );
}

export function QuestionEditor({
  question,
  articles,
  siteUrl,
  justCreated = false,
}: {
  question: EditorQuestion;
  articles: ArticleOption[];
  siteUrl: string;
  justCreated?: boolean;
}) {
  const id = useId();
  const router = useRouter();
  const [form, setForm] = useState<Form>(() => toForm(question));
  const [saved, setSaved] = useState<Form>(() => toForm(question));
  const [status, setStatus] = useState<QuestionStatus>(question.status);
  const [everPublished, setEverPublished] = useState(question.everPublished);
  const [slug, setSlug] = useState(question.slug);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(
    justCreated ? { tone: "success", text: "پرسش ساخته و ذخیره شد." } : null,
  );
  const [pending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<Pending>(null);
  const [uploading, setUploading] = useState(false);
  const [confirm, setConfirm] = useState<"reject" | "archive" | "delete" | null>(null);
  const [reason, setReason] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const isNew = question.id === null;
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);
  const busy = pending || uploading;
  const allowed = isNew ? (["save", "publish"] as QuestionAction[]) : allowedActions(status);
  const can = (action: QuestionAction) => allowed.includes(action);

  // Warn before closing or reloading the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const MESSAGES: Partial<Record<QuestionAction, string>> = {
    save: "تغییرات ذخیره شد.",
    publish: "پرسش و پاسخ منتشر شد و در سایت دیده می‌شود.",
    unpublish: "انتشار لغو شد؛ پرسش دیگر در سایت دیده نمی‌شود.",
    reject: "پرسش رد شد.",
    archive: "پرسش بایگانی شد.",
    restore: "پرسش به بررسی برگشت.",
  };

  function run(action: Exclude<QuestionAction, "delete">) {
    setNotice(null);
    setPendingAction(action);
    startTransition(async () => {
      const editing = action === "save" || action === "publish";
      const result = await questionAction(
        editing
          ? { id: question.id, action, question: form }
          : action === "reject"
            ? { id: question.id, action, reason }
            : { id: question.id, action },
      );
      setPendingAction(null);
      setConfirm(null);
      if (!result.ok) {
        setErrors(result.fieldErrors);
        setNotice({ tone: "danger", text: result.message });
        return;
      }
      setErrors({});
      if (result.created) {
        setForm(toForm(question));
        setSaved(toForm(question));
        router.replace(`/admin/questions/${result.id}?created=1`);
        return;
      }
      const next = { ...form, slug: result.slug };
      if (editing) {
        setForm(next);
        setSaved(next);
      }
      setSlug(result.slug);
      setStatus(result.status);
      if (result.status === "published") setEverPublished(true);
      setNotice({ tone: "success", text: MESSAGES[action] ?? "انجام شد." });
      router.refresh();
    });
  }

  function remove() {
    if (!question.id) return;
    setPendingAction("delete");
    startTransition(async () => {
      setSaved(form);
      await deleteQuestionAction(question.id);
    });
  }

  const slugPreview = normalizeSlug(form.slug) || slug || normalizeSlug(form.title) || "…";
  const canonical = `${siteUrl}${questionHref(slugPreview)}`;
  const slugWillRedirect = everPublished && slug !== "" && form.slug !== "" && normalizeSlug(form.slug) !== slug;
  const originalChanged =
    question.original !== null &&
    (question.original.title !== form.title || question.original.body !== form.body);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (can("save")) run("save");
      }}
      noValidate
    >
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-black text-ink">{isNew ? "افزودن پرسش و پاسخ" : "بررسی و پاسخ"}</h1>
        {!isNew && <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>}
        {dirty && <Badge tone="warning">تغییرات ذخیره‌نشده</Badge>}
      </div>

      {notice && (
        <Alert tone={notice.tone} live>
          {notice.text}
        </Alert>
      )}
      {status === "rejected" && question.rejectionReason && (
        <Alert tone="info" title="دلیل رد (فقط برای شما)">
          {question.rejectionReason}
        </Alert>
      )}

      <Panel title="پرسش">
        <Alert tone="warning" title="پیش از انتشار">
          نام، شماره تماس، کد ملی، شماره پرونده، آدرس و هر جزئیاتی را که پرسشگر یا دیگران را
          قابل شناسایی می‌کند از عنوان و متن حذف کنید.
        </Alert>
        <div className={question.original ? "grid gap-6 lg:grid-cols-2" : "grid gap-6"}>
          <div className="flex min-w-0 flex-col gap-5">
            <TextField
              label="عنوان"
              name="title"
              value={form.title}
              maxLength={QUESTION_LIMITS.titleMax}
              onChange={(event) => set("title", event.target.value)}
              error={errors.title}
            />
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor={`${id}-body`}>متن پرسش</FieldLabel>
              <FieldHint>متن ساده؛ همان‌طور که در سایت نشان داده می‌شود.</FieldHint>
              <textarea
                id={`${id}-body`}
                rows={9}
                maxLength={QUESTION_LIMITS.bodyMax}
                value={form.body}
                onChange={(event) => set("body", event.target.value)}
                aria-invalid={errors.body ? true : undefined}
                className={controlClasses(errors.body, "resize-y py-2.5 leading-loose")}
              />
              <p className="text-sm text-muted">
                {toPersianDigits(form.body.length)} از {toPersianDigits(QUESTION_LIMITS.bodyMax)} نویسه
              </p>
              {errors.body && <FieldError>{errors.body}</FieldError>}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="نام نمایشی"
                name="displayName"
                optional
                maxLength={QUESTION_LIMITS.displayName}
                hint="خالی: «کاربر ناشناس»"
                value={form.displayName}
                onChange={(event) => set("displayName", event.target.value)}
                error={errors.displayName}
              />
              <Select
                label="دسته‌بندی"
                name="category"
                options={CATEGORY_OPTIONS}
                value={form.category}
                onChange={(event) => set("category", event.target.value)}
                error={errors.category}
              />
            </div>
          </div>

          {question.original && (
            <div className="flex min-w-0 flex-col gap-3 rounded-sm border border-dashed border-line-strong bg-surface-muted p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-ink">متن اصلی پرسشگر</p>
                <Badge>{originalChanged ? "ویرایش شده" : "بدون تغییر"}</Badge>
              </div>
              <p className="text-sm text-muted">فقط‌خواندنی؛ هرگز در سایت نشان داده نمی‌شود.</p>
              <p className="font-semibold text-ink">{question.original.title}</p>
              <p className="whitespace-pre-line text-ink">{question.original.body}</p>
            </div>
          )}
        </div>
      </Panel>

      <Panel title="پاسخ وکیل">
        <MarkdownEditor
          label="پاسخ (Markdown)"
          hint="برای انتشار، پاسخ لازم است. کادر تماس خودکار نیست؛ صفحه پرسش، توضیح و دعوت به مشاوره را خودش دارد."
          value={form.answer}
          onChange={(value) => set("answer", value)}
          error={errors.answer}
          disabled={busy}
          contactBox={false}
          rows={16}
          previewLabel="پیش‌نمایش پاسخ"
          emptyPreview="هنوز پاسخی نوشته نشده است."
          onUploadingChange={setUploading}
        />
      </Panel>

      <Panel title="نشانی، سئو و نمایش">
        <TextField
          label="نشانی پرسش"
          name="slug"
          optional
          hint="فارسی یا لاتین. خالی بگذارید تا از عنوان ساخته شود."
          value={form.slug}
          onChange={(event) => set("slug", event.target.value)}
          onBlur={() => set("slug", normalizeSlug(form.slug))}
          error={errors.slug}
        />
        <p className="text-sm text-muted">
          نشانی یکتا (canonical):
          <span className="break-all text-ink">
            <Ltr>{canonical}</Ltr>
          </span>
        </p>
        {slugWillRedirect && (
          <Alert tone="info">
            این پرسش پیش‌تر با نشانی دیگری منتشر شده است. پس از ذخیره، نشانی قبلی برای همیشه به
            نشانی تازه هدایت می‌شود.
          </Alert>
        )}
        <div className="flex flex-col gap-1.5">
          <TextField
            label="عنوان سئو"
            name="metaTitle"
            optional
            hint="خالی: عنوان پرسش به کار می‌رود."
            maxLength={QUESTION_LIMITS.metaTitle}
            value={form.metaTitle}
            onChange={(event) => set("metaTitle", event.target.value)}
            error={errors.metaTitle}
          />
          <CharGuide length={(form.metaTitle || form.title).length} guide={SEO_TITLE_GUIDE} />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={`${id}-meta-description`} optional>
            توضیح سئو
          </FieldLabel>
          <FieldHint>خالی: آغاز پاسخ به کار می‌رود.</FieldHint>
          <textarea
            id={`${id}-meta-description`}
            rows={3}
            maxLength={QUESTION_LIMITS.metaDescription}
            value={form.metaDescription}
            onChange={(event) => set("metaDescription", event.target.value)}
            className={controlClasses(errors.metaDescription, "resize-y py-2.5")}
          />
          <CharGuide length={form.metaDescription.length} guide={SEO_DESCRIPTION_GUIDE} />
        </div>
        <Checkbox
          label="پرسش برگزیده"
          description="در فهرست پرسش‌ها بالاتر از بقیه می‌آید."
          checked={form.isFeatured}
          onCheckedChange={(checked) => set("isFeatured", checked)}
        />
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1.5 text-base font-semibold text-ink">
            مقاله‌های مرتبط <span className="font-normal text-muted">(اختیاری، تا {toPersianDigits(QUESTION_LIMITS.related)})</span>
          </legend>
          <p className="text-sm text-muted">
            فقط مقاله‌های منتشرشده در صفحه پرسش نشان داده می‌شوند، و آن هم پس از آنکه وبلاگ سایت از
            پنل خوانده شود (فاز ۳).
          </p>
          {articles.length === 0 ? (
            <p className="text-sm text-muted">هنوز مقاله‌ای در پنل نیست.</p>
          ) : (
            <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
              {articles.map((article) => {
                const checked = form.relatedArticles.includes(article.id);
                const full = form.relatedArticles.length >= QUESTION_LIMITS.related;
                return (
                  <Checkbox
                    key={article.id}
                    label={article.title}
                    description={article.published ? undefined : "پیش‌نویس"}
                    checked={checked}
                    disabled={!checked && full}
                    onCheckedChange={(next) =>
                      set(
                        "relatedArticles",
                        next
                          ? [...form.relatedArticles, article.id]
                          : form.relatedArticles.filter((other) => other !== article.id),
                      )
                    }
                  />
                );
              })}
            </div>
          )}
        </fieldset>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={`${id}-note`} optional>
            یادداشت داخلی
          </FieldLabel>
          <FieldHint>فقط در پنل دیده می‌شود.</FieldHint>
          <textarea
            id={`${id}-note`}
            rows={3}
            maxLength={QUESTION_LIMITS.note}
            value={form.adminNote}
            onChange={(event) => set("adminNote", event.target.value)}
            className={controlClasses(undefined, "resize-y py-2.5")}
          />
        </div>
      </Panel>

      <Panel title="پیش‌نمایش صفحه در سایت">
        <div>
          <Button
            type="button"
            variant="secondary"
            icon={showPreview ? <EyeOff /> : <Eye />}
            aria-expanded={showPreview}
            onClick={() => setShowPreview((open) => !open)}
          >
            {showPreview ? "بستن پیش‌نمایش" : "نمایش پیش‌نمایش"}
          </Button>
        </div>
        {showPreview && (
          <div className="rounded-sm border border-line bg-page p-4 md:p-8">
            <div className="max-w-reading">
              <QuestionArticle
                question={{
                  ...form,
                  publishedAt: question.publishedAt,
                  answeredAt: null,
                }}
              />
            </div>
          </div>
        )}
      </Panel>

      <Panel title="وضعیت و انتشار">
        <div className="flex flex-wrap gap-3">
          {can("publish") && (
            <Button
              type="button"
              loading={pendingAction === "publish"}
              disabled={busy}
              icon={<Send />}
              onClick={() => run("publish")}
            >
              {everPublished ? "انتشار دوباره" : "انتشار"}
            </Button>
          )}
          {can("save") && (
            <Button
              type="submit"
              variant={status === "published" ? "primary" : "secondary"}
              loading={pendingAction === "save"}
              disabled={busy}
              icon={<Save />}
            >
              {status === "published" ? "ذخیره تغییرات (در سایت هم)" : "ذخیره"}
            </Button>
          )}
          {can("unpublish") && (
            <Button
              type="button"
              variant="secondary"
              loading={pendingAction === "unpublish"}
              disabled={busy}
              icon={<Undo2 />}
              onClick={() => run("unpublish")}
            >
              لغو انتشار
            </Button>
          )}
          {can("restore") && (
            <Button
              type="button"
              variant="secondary"
              loading={pendingAction === "restore"}
              disabled={busy}
              icon={<RotateCcw />}
              onClick={() => run("restore")}
            >
              بازگشت به بررسی
            </Button>
          )}
          {status === "published" && slug && (
            <LinkButton href={questionHref(slug)} variant="ghost" icon={<ExternalLink />} external>
              مشاهده در سایت
            </LinkButton>
          )}
        </div>
        {status !== "published" && !isNew && (
          <p className="text-sm text-muted">
            «ذخیره» پاسخ را نگه می‌دارد و پرسش در سایت نمی‌آید؛ «انتشار» آن را در سایت نشان می‌دهد.
          </p>
        )}

        {!isNew && (can("reject") || can("archive") || can("delete")) && (
          <div className="flex flex-col gap-4 border-t border-line pt-5">
            {confirm === null && (
              <div className="flex flex-wrap gap-3">
                {can("reject") && (
                  <Button type="button" variant="ghost" disabled={busy} icon={<XCircle />} onClick={() => setConfirm("reject")}>
                    رد پرسش…
                  </Button>
                )}
                {can("archive") && (
                  <Button type="button" variant="ghost" disabled={busy} icon={<Archive />} onClick={() => setConfirm("archive")}>
                    بایگانی…
                  </Button>
                )}
                {can("delete") && (
                  <Button type="button" variant="ghost" disabled={busy} icon={<Trash2 />} onClick={() => setConfirm("delete")}>
                    حذف…
                  </Button>
                )}
              </div>
            )}

            {confirm === "reject" && (
              <div role="alertdialog" aria-label="تأیید رد پرسش" className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel htmlFor={`${id}-reason`} optional>
                    دلیل رد
                  </FieldLabel>
                  <FieldHint>فقط در پنل می‌ماند؛ پرسشگر فقط «منتشر نمی‌شود» را می‌بیند.</FieldHint>
                  <textarea
                    id={`${id}-reason`}
                    rows={2}
                    maxLength={1000}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className={controlClasses(undefined, "resize-y py-2.5")}
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="danger" loading={pendingAction === "reject"} disabled={busy} icon={<XCircle />} onClick={() => run("reject")}>
                    بله، رد شود
                  </Button>
                  <Button type="button" variant="secondary" disabled={busy} autoFocus onClick={() => setConfirm(null)}>
                    انصراف
                  </Button>
                </div>
              </div>
            )}

            {confirm === "archive" && (
              <div role="alertdialog" aria-label="تأیید بایگانی" className="flex flex-wrap items-center gap-3">
                <p className="font-bold text-ink">
                  {status === "published" ? "پرسش از سایت برداشته و بایگانی شود؟" : "پرسش بایگانی شود؟"}
                </p>
                <Button type="button" loading={pendingAction === "archive"} disabled={busy} icon={<Archive />} onClick={() => run("archive")}>
                  بله، بایگانی شود
                </Button>
                <Button type="button" variant="secondary" disabled={busy} autoFocus onClick={() => setConfirm(null)}>
                  انصراف
                </Button>
              </div>
            )}

            {confirm === "delete" && (
              <div role="alertdialog" aria-label="تأیید حذف" className="flex flex-wrap items-center gap-3">
                <p className="font-bold text-danger-ink">
                  پرسش از همه‌جا حذف شود؟ {status === "published" && "از سایت هم برداشته می‌شود."}
                </p>
                <Button type="button" variant="danger" loading={pendingAction === "delete"} disabled={busy} icon={<Trash2 />} onClick={remove}>
                  بله، حذف شود
                </Button>
                <Button type="button" variant="secondary" disabled={busy} autoFocus onClick={() => setConfirm(null)}>
                  انصراف
                </Button>
              </div>
            )}
          </div>
        )}

        {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      </Panel>
    </form>
  );
}
