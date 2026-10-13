"use client";
// ArticleEditor — the whole create/edit form of an article: fields, Markdown editor with
// a live preview beside it, cover and inline image upload, FAQs, references, SEO fields
// with a search-result preview, and the save / publish / unpublish / delete buttons.
// The preview uses ArticleBody, the same component as the public article page.
// Usage: <ArticleEditor article={editorArticle} areas={areas} siteUrl={SITE_URL} siteName="…" />
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bold,
  Eye,
  Heading2,
  ImagePlus,
  Link2,
  List,
  MessageSquareQuote,
  Plus,
  Save,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { deleteArticleAction, saveArticleAction } from "@/app/admin/actions";
import { Alert } from "@/components/Alert";
import { ArticleBody, CONTACT_BOX_MARKER } from "@/components/ArticleBody";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { FieldError, FieldHint, FieldLabel, controlClasses } from "@/components/Field";
import { LinkButton } from "@/components/LinkButton";
import { Ltr } from "@/components/Ltr";
import { Select, type SelectOption } from "@/components/Select";
import { TextField } from "@/components/TextField";
import { normalizeSlug } from "@/lib/articles/slug";
import { toPersianDigits } from "@/lib/format";

export type EditorArticle = {
  id: string | null;
  status: "draft" | "published";
  /** Has been public at some time, so its old address matters. */
  everPublished: boolean;
  title: string;
  slug: string;
  area: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  coverImageAlt: string;
  coverWidth: number | null;
  coverHeight: number | null;
  faqs: { q: string; a: string }[];
  references: { title: string; url?: string }[];
  seoTitle: string;
  seoDescription: string;
};

type Form = Omit<EditorArticle, "id" | "status" | "everPublished">;
type SaveAction = "save" | "publish" | "unpublish";

const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = "image/jpeg,image/png,image/webp";

// Guidance only, never a limit: roughly what a search result shows.
const SEO_TITLE_GUIDE = 60;
const SEO_DESCRIPTION_GUIDE = 160;

function toForm(article: EditorArticle): Form {
  return {
    title: article.title,
    slug: article.slug,
    area: article.area,
    excerpt: article.excerpt,
    content: article.content,
    coverImage: article.coverImage,
    coverImageAlt: article.coverImageAlt,
    coverWidth: article.coverWidth,
    coverHeight: article.coverHeight,
    faqs: article.faqs,
    references: article.references,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
  };
}

async function uploadImage(
  file: File,
): Promise<{ ok: true; path: string; width: number; height: number } | { ok: false; error: string }> {
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

export function ArticleEditor({
  article,
  areas,
  siteUrl,
  siteName,
  justCreated = false,
}: {
  article: EditorArticle;
  areas: SelectOption[];
  /** Public origin, for the address preview. */
  siteUrl: string;
  siteName: string;
  justCreated?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(() => toForm(article));
  const [savedForm, setSavedForm] = useState<Form>(() => toForm(article));
  const [status, setStatus] = useState(article.status);
  const [everPublished, setEverPublished] = useState(article.everPublished);
  const [lawyerApproved, setLawyerApproved] = useState(false);
  const [contentChanged, setContentChanged] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(
    justCreated ? { tone: "success", text: "مقاله ساخته و ذخیره شد." } : null,
  );
  const [pending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<SaveAction | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState<"cover" | "inline" | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [imagePanel, setImagePanel] = useState(false);

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const contentId = useId();
  const previewContent = useDeferredValue(form.content);

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm) || lawyerApproved || contentChanged,
    [form, savedForm, lawyerApproved, contentChanged],
  );

  // Warn before closing or reloading the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  // ------------------------------------------------------------------ Markdown tools

  /** Wraps the selection, or inserts `placeholder` wrapped, and keeps the focus. */
  function wrapSelection(before: string, after: string, placeholder: string) {
    const area = contentRef.current;
    if (!area) return;
    const { selectionStart: start, selectionEnd: end, value } = area;
    const selected = value.slice(start, end) || placeholder;
    set("content", value.slice(0, start) + before + selected + after + value.slice(end));
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  /** Inserts a block on its own line(s) at the cursor. */
  function insertBlock(block: string) {
    const area = contentRef.current;
    const value = area?.value ?? form.content;
    const at = area?.selectionStart ?? value.length;
    const head = value.slice(0, at).replace(/\n*$/, "");
    const tail = value.slice(at).replace(/^\n*/, "");
    const next = `${head}${head ? "\n\n" : ""}${block}${tail ? "\n\n" : "\n"}${tail}`;
    set("content", next);
    requestAnimationFrame(() => {
      const position = head.length + (head ? 2 : 0) + block.length;
      area?.focus();
      area?.setSelectionRange(position, position);
    });
  }

  async function onInlineImage(file: File | undefined) {
    if (!file) return;
    setUploading("inline");
    setErrors((current) => ({ ...current, content: "" }));
    const result = await uploadImage(file);
    setUploading(null);
    if (!result.ok) {
      setErrors((current) => ({ ...current, content: result.error }));
      return;
    }
    // Brackets in the alt text would end the image syntax early.
    const alt = imageAlt.trim().replace(/[[\]]/g, "");
    insertBlock(`![${alt}](${result.path}#${result.width}x${result.height})`);
    setImageAlt("");
    setImagePanel(false);
  }

  async function onCoverImage(file: File | undefined) {
    if (!file) return;
    setUploading("cover");
    setErrors((current) => ({ ...current, coverImage: "" }));
    const result = await uploadImage(file);
    setUploading(null);
    if (!result.ok) {
      setErrors((current) => ({ ...current, coverImage: result.error }));
      return;
    }
    setForm((current) => ({
      ...current,
      coverImage: result.path,
      coverWidth: result.width,
      coverHeight: result.height,
    }));
  }

  // ---------------------------------------------------------------------- saving

  function submit(action: SaveAction) {
    setNotice(null);
    setPendingAction(action);
    startTransition(async () => {
      const result = await saveArticleAction({
        id: article.id,
        action,
        article: {
          ...form,
          // Rows left completely empty are dropped instead of failing validation.
          faqs: form.faqs.filter((faq) => faq.q.trim() || faq.a.trim()),
          references: form.references
            .filter((reference) => reference.title.trim() || reference.url?.trim())
            .map((reference) => ({
              title: reference.title,
              ...(reference.url?.trim() && { url: reference.url.trim() }),
            })),
          contentChanged,
          lawyerApproved,
        },
      });
      setPendingAction(null);

      if (!result.ok) {
        setErrors(result.fieldErrors);
        setNotice({ tone: "danger", text: result.message });
        return;
      }

      setErrors({});
      if (result.created) {
        // The article now lives on its own edit page. This form goes back to empty: Next.js
        // keeps it alive in the background, and coming back to "new" must not offer the
        // same text for saving a second time.
        setForm(toForm(article));
        setSavedForm(toForm(article));
        setLawyerApproved(false);
        router.replace(`/admin/articles/${result.id}/edit?created=1`);
        return;
      }
      const next = { ...form, slug: result.slug };
      setForm(next);
      setSavedForm(next);
      setStatus(result.status);
      if (result.status === "published") setEverPublished(true);
      setLawyerApproved(false);
      setContentChanged(false);
      setNotice({
        tone: "success",
        text:
          action === "publish"
            ? "مقاله منتشر شد."
            : action === "unpublish"
              ? "انتشار مقاله لغو شد و به پیش‌نویس برگشت."
              : "تغییرات ذخیره شد.",
      });
    });
  }

  function remove() {
    if (!article.id) return;
    setPendingAction("delete");
    startTransition(async () => {
      setSavedForm(form);
      await deleteArticleAction(article.id);
    });
  }

  // ------------------------------------------------------------------- derived text

  const slugPreview = normalizeSlug(form.slug) || normalizeSlug(form.title) || "…";
  const canonical = `${siteUrl}/blog/${slugPreview}`;
  const resultTitle = `${form.seoTitle.trim() || form.title.trim() || "عنوان مقاله"} | ${siteName}`;
  const resultDescription =
    form.seoDescription.trim() || form.excerpt.trim() || "توضیح مقاله اینجا دیده می‌شود.";
  const slugWillRedirect =
    everPublished && savedForm.slug !== "" && normalizeSlug(form.slug) !== savedForm.slug && form.slug !== "";

  const warnings = [
    !form.seoTitle.trim() && "عنوان سئو خالی است؛ عنوان مقاله به جای آن به کار می‌رود.",
    !form.seoDescription.trim() && "توضیح سئو خالی است؛ خلاصه مقاله به جای آن به کار می‌رود.",
    !form.coverImage && "تصویر شاخص انتخاب نشده است.",
    form.coverImage && !form.coverImageAlt.trim() && "تصویر شاخص متن جایگزین ندارد.",
    /!\[\]\(/.test(form.content) && "دست‌کم یک تصویر در متن، متن جایگزین ندارد.",
  ].filter((warning): warning is string => Boolean(warning));

  const busy = pending || uploading !== null;
  const toolButton =
    "inline-flex min-h-11 items-center gap-1.5 rounded-sm border border-line-strong bg-surface px-3 text-sm font-semibold text-ink hover:border-ink disabled:cursor-not-allowed disabled:text-disabled-ink";

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        submit("save");
      }}
      noValidate
    >
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-black text-ink">
          {article.id ? "ویرایش مقاله" : "مقاله تازه"}
        </h1>
        {status === "published" ? (
          <Badge tone="success">منتشرشده</Badge>
        ) : (
          <Badge tone="neutral">پیش‌نویس</Badge>
        )}
        {dirty && <Badge tone="warning">تغییرات ذخیره‌نشده</Badge>}
      </div>

      {notice && (
        <Alert tone={notice.tone} live>
          {notice.text}
        </Alert>
      )}

      <Panel title="مشخصات">
        <TextField
          label="عنوان"
          name="title"
          value={form.title}
          onChange={(event) => set("title", event.target.value)}
          error={errors.title}
          maxLength={150}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Select
            label="حوزه"
            name="area"
            options={areas}
            value={form.area}
            onChange={(event) => set("area", event.target.value)}
            error={errors.area}
          />
          <TextField
            label="نشانی مقاله"
            name="slug"
            optional
            hint="فارسی یا لاتین. خالی بگذارید تا از عنوان ساخته شود."
            value={form.slug}
            onChange={(event) => set("slug", event.target.value)}
            onBlur={() => set("slug", normalizeSlug(form.slug))}
            error={errors.slug}
          />
        </div>
        <p className="text-sm text-muted">
          نشانی یکتای این مقاله (canonical): 
          <span className="break-all text-ink">
            <Ltr>{canonical}</Ltr>
          </span>
        </p>
        {slugWillRedirect && (
          <Alert tone="info">
            این مقاله پیش‌تر با نشانی دیگری منتشر شده است. پس از ذخیره، نشانی قبلی برای همیشه
            به نشانی تازه هدایت می‌شود.
          </Alert>
        )}
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={`${contentId}-excerpt`}>خلاصه</FieldLabel>
          <FieldHint>یک یا دو جمله برای کارت مقاله و نتیجه جست‌وجو (حداکثر ۲۲۰ نویسه).</FieldHint>
          <textarea
            id={`${contentId}-excerpt`}
            name="excerpt"
            rows={3}
            maxLength={220}
            value={form.excerpt}
            onChange={(event) => set("excerpt", event.target.value)}
            aria-invalid={errors.excerpt ? true : undefined}
            className={controlClasses(errors.excerpt, "resize-y py-2.5")}
          />
          <p className="text-sm text-muted">
            {toPersianDigits(form.excerpt.length)} از {toPersianDigits(220)} نویسه
          </p>
          {errors.excerpt && <FieldError>{errors.excerpt}</FieldError>}
        </div>
      </Panel>

      <Panel title="متن مقاله">
        <div
          role="toolbar"
          aria-label="ابزارهای نگارش"
          aria-controls={contentId}
          className="flex flex-wrap gap-2"
        >
          <button type="button" className={toolButton} onClick={() => insertBlock("## عنوان بخش")}>
            <Heading2 aria-hidden="true" className="size-4" />
            تیتر بخش
          </button>
          <button
            type="button"
            className={toolButton}
            onClick={() => wrapSelection("**", "**", "متن پررنگ")}
          >
            <Bold aria-hidden="true" className="size-4" />
            پررنگ
          </button>
          <button
            type="button"
            className={toolButton}
            onClick={() => wrapSelection("[", "](https://)", "متن پیوند")}
          >
            <Link2 aria-hidden="true" className="size-4" />
            پیوند
          </button>
          <button
            type="button"
            className={toolButton}
            onClick={() => insertBlock("- مورد نخست\n- مورد دوم")}
          >
            <List aria-hidden="true" className="size-4" />
            فهرست
          </button>
          <button
            type="button"
            className={toolButton}
            aria-expanded={imagePanel}
            onClick={() => setImagePanel((open) => !open)}
          >
            <ImagePlus aria-hidden="true" className="size-4" />
            تصویر
          </button>
          <button
            type="button"
            className={toolButton}
            onClick={() => insertBlock(CONTACT_BOX_MARKER)}
          >
            <MessageSquareQuote aria-hidden="true" className="size-4" />
            جای کادر تماس
          </button>
        </div>

        {imagePanel && (
          <div className="flex flex-col gap-3 rounded-sm border border-line bg-surface-muted p-4 md:flex-row md:items-end">
            <div className="flex-1">
              <TextField
                label="متن جایگزین تصویر"
                hint="آنچه در تصویر دیده می‌شود، برای کسانی که تصویر را نمی‌بینند."
                value={imageAlt}
                onChange={(event) => setImageAlt(event.target.value)}
                maxLength={200}
                optional
              />
            </div>
            <input
              ref={inlineInputRef}
              type="file"
              accept={IMAGE_TYPES}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(event) => {
                void onInlineImage(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="secondary"
              loading={uploading === "inline"}
              disabled={busy}
              icon={<ImagePlus />}
              onClick={() => inlineInputRef.current?.click()}
            >
              انتخاب و درج تصویر
            </Button>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <FieldLabel htmlFor={contentId}>متن (Markdown)</FieldLabel>
            <FieldHint>
              کادر تماس خودکار پس از بخش دوم می‌آید؛ با «جای کادر تماس» می‌توانید جای آن را
              عوض کنید.
            </FieldHint>
            <textarea
              id={contentId}
              ref={contentRef}
              name="content"
              rows={24}
              value={form.content}
              onChange={(event) => set("content", event.target.value)}
              aria-invalid={errors.content ? true : undefined}
              className={controlClasses(errors.content, "min-h-96 resize-y py-2.5 leading-loose")}
            />
            {errors.content && <FieldError>{errors.content}</FieldError>}
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="text-base font-semibold text-ink">پیش‌نمایش زنده</p>
            <p className="text-sm text-muted">همان چیزی که خواننده در صفحه مقاله می‌بیند.</p>
            <div
              aria-label="پیش‌نمایش متن مقاله"
              role="region"
              tabIndex={0}
              className="max-h-[48rem] min-h-96 overflow-y-auto rounded-sm border border-line bg-surface p-4"
            >
              {previewContent.trim() ? (
                <ArticleBody content={previewContent} />
              ) : (
                <p className="text-muted">هنوز متنی نوشته نشده است.</p>
              )}
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="تصویر شاخص">
        <input
          ref={coverInputRef}
          type="file"
          accept={IMAGE_TYPES}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            void onCoverImage(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        {form.coverImage && (
          // A plain <img>: this is the editor's own thumbnail of an already resized file.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.coverImage}
            alt={form.coverImageAlt}
            width={form.coverWidth ?? undefined}
            height={form.coverHeight ?? undefined}
            className="aspect-[16/10] w-full max-w-md rounded-md border border-line bg-surface-muted object-cover"
          />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            loading={uploading === "cover"}
            disabled={busy}
            icon={<ImagePlus />}
            onClick={() => coverInputRef.current?.click()}
          >
            {form.coverImage ? "تعویض تصویر" : "انتخاب تصویر"}
          </Button>
          {form.coverImage && (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  coverImage: null,
                  coverWidth: null,
                  coverHeight: null,
                }))
              }
            >
              برداشتن تصویر
            </Button>
          )}
          <p className="text-sm text-muted">JPEG، PNG یا WebP تا ۵ مگابایت. نسبت ۱۶ به ۱۰ بهتر دیده می‌شود.</p>
        </div>
        {errors.coverImage && <FieldError>{errors.coverImage}</FieldError>}
        <TextField
          label="متن جایگزین تصویر شاخص"
          hint="آنچه در تصویر دیده می‌شود. برای انتشار لازم است."
          name="coverImageAlt"
          value={form.coverImageAlt}
          onChange={(event) => set("coverImageAlt", event.target.value)}
          error={errors.coverImageAlt}
          maxLength={200}
          optional={!form.coverImage}
        />
      </Panel>

      <Panel title="پرسش‌های پرتکرار">
        {form.faqs.length === 0 && <p className="text-muted">پرسشی افزوده نشده است.</p>}
        {form.faqs.map((faq, index) => (
          <fieldset key={index} className="flex flex-col gap-3 rounded-sm border border-line p-4">
            <legend className="px-1 text-sm font-semibold text-muted">
              پرسش {toPersianDigits(index + 1)}
            </legend>
            <TextField
              label="پرسش"
              value={faq.q}
              maxLength={300}
              onChange={(event) =>
                set(
                  "faqs",
                  form.faqs.map((item, i) => (i === index ? { ...item, q: event.target.value } : item)),
                )
              }
            />
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor={`${contentId}-faq-${index}`}>پاسخ</FieldLabel>
              <textarea
                id={`${contentId}-faq-${index}`}
                rows={3}
                maxLength={2000}
                value={faq.a}
                onChange={(event) =>
                  set(
                    "faqs",
                    form.faqs.map((item, i) => (i === index ? { ...item, a: event.target.value } : item)),
                  )
                }
                className={controlClasses(undefined, "resize-y py-2.5")}
              />
            </div>
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<Trash2 />}
                onClick={() => set("faqs", form.faqs.filter((_, i) => i !== index))}
              >
                حذف پرسش {toPersianDigits(index + 1)}
              </Button>
            </div>
          </fieldset>
        ))}
        {errors.faqs && <FieldError>{errors.faqs}</FieldError>}
        <div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Plus />}
            disabled={form.faqs.length >= 20}
            onClick={() => set("faqs", [...form.faqs, { q: "", a: "" }])}
          >
            افزودن پرسش
          </Button>
        </div>
      </Panel>

      <Panel title="منابع">
        {form.references.length === 0 && <p className="text-muted">منبعی افزوده نشده است.</p>}
        {form.references.map((reference, index) => (
          <fieldset
            key={index}
            className="grid gap-3 rounded-sm border border-line p-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
          >
            <legend className="px-1 text-sm font-semibold text-muted">
              منبع {toPersianDigits(index + 1)}
            </legend>
            <TextField
              label="عنوان منبع"
              value={reference.title}
              maxLength={300}
              onChange={(event) =>
                set(
                  "references",
                  form.references.map((item, i) =>
                    i === index ? { ...item, title: event.target.value } : item,
                  ),
                )
              }
            />
            <TextField
              label="پیوند"
              type="url"
              dir="ltr"
              className="text-start"
              placeholder="https://"
              optional
              value={reference.url ?? ""}
              onChange={(event) =>
                set(
                  "references",
                  form.references.map((item, i) =>
                    i === index ? { ...item, url: event.target.value } : item,
                  ),
                )
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<Trash2 />}
              onClick={() => set("references", form.references.filter((_, i) => i !== index))}
            >
              حذف<span className="sr-only"> منبع {toPersianDigits(index + 1)}</span>
            </Button>
          </fieldset>
        ))}
        {errors.references && <FieldError>{errors.references}</FieldError>}
        <div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Plus />}
            disabled={form.references.length >= 30}
            onClick={() => set("references", [...form.references, { title: "" }])}
          >
            افزودن منبع
          </Button>
        </div>
      </Panel>

      <Panel title="سئوی مقاله">
        <div className="flex flex-col gap-1.5">
          <TextField
            label="عنوان سئو"
            name="seoTitle"
            optional
            hint="عنوانی که در نتیجه جست‌وجو دیده می‌شود. خالی بماند، عنوان مقاله به کار می‌رود."
            value={form.seoTitle}
            onChange={(event) => set("seoTitle", event.target.value)}
            error={errors.seoTitle}
            maxLength={150}
          />
          <CharGuide length={form.seoTitle.length} guide={SEO_TITLE_GUIDE} />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={`${contentId}-seo-description`} optional>
            توضیح سئو
          </FieldLabel>
          <FieldHint>خالی بماند، خلاصه مقاله به کار می‌رود.</FieldHint>
          <textarea
            id={`${contentId}-seo-description`}
            name="seoDescription"
            rows={3}
            maxLength={400}
            value={form.seoDescription}
            onChange={(event) => set("seoDescription", event.target.value)}
            className={controlClasses(errors.seoDescription, "resize-y py-2.5")}
          />
          <CharGuide length={form.seoDescription.length} guide={SEO_DESCRIPTION_GUIDE} />
          {errors.seoDescription && <FieldError>{errors.seoDescription}</FieldError>}
        </div>

        <div>
          <p className="text-base font-semibold text-ink">پیش‌نمایش نتیجه جست‌وجو</p>
          <p className="text-sm text-muted">تقریبی است؛ موتور جست‌وجو ممکن است متن دیگری نشان دهد.</p>
          <div className="mt-2 max-w-reading rounded-sm border border-line bg-surface p-4">
            <p className="truncate text-sm text-muted">
              <Ltr>{canonical}</Ltr>
            </p>
            <p className="mt-1 line-clamp-1 text-lg font-semibold text-info-ink">{resultTitle}</p>
            <p className="mt-1 line-clamp-2 text-sm text-ink">{resultDescription}</p>
          </div>
        </div>

        {warnings.length > 0 && (
          <Alert tone="warning" title="پیش از انتشار نگاه کنید">
            <ul className="list-disc ps-5">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </Alert>
        )}
      </Panel>

      <Panel title="انتشار">
        <Alert tone="info" title="بازبینی حقوقی">
          محتوای حقوقی باید پیش از انتشار از نظر درستی توسط وکیل بازبینی شود. این پنل فقط
          تأیید شما را ثبت می‌کند و درستی متن را نمی‌سنجد.
        </Alert>
        <Checkbox
          label="وکیل این متن را تأیید کرده است"
          description="برای انتشار و برای هر تغییر در مقاله منتشرشده لازم است. فقط در همین پنل ثبت می‌شود و در وب‌سایت نمایش داده نمی‌شود."
          checked={lawyerApproved}
          onCheckedChange={setLawyerApproved}
        />
        {errors.lawyerApproved && <FieldError>{errors.lawyerApproved}</FieldError>}
        {everPublished && (
          <Checkbox
            label="محتوا تغییر کرده است"
            description="تاریخ «آخرین به‌روزرسانی» مقاله به امروز تغییر می‌کند. برای اصلاح‌های کوچک مثل غلط تایپی علامت نزنید."
            checked={contentChanged}
            onCheckedChange={setContentChanged}
          />
        )}

        <div className="flex flex-wrap gap-3">
          {status === "published" ? (
            <>
              <Button
                type="submit"
                loading={pendingAction === "save"}
                disabled={busy}
                icon={<Save />}
              >
                ذخیره تغییرات
              </Button>
              <Button
                type="button"
                variant="secondary"
                loading={pendingAction === "unpublish"}
                disabled={busy}
                icon={<Undo2 />}
                onClick={() => submit("unpublish")}
              >
                لغو انتشار
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                loading={pendingAction === "publish"}
                disabled={busy}
                icon={<Send />}
                onClick={() => submit("publish")}
              >
                انتشار
              </Button>
              <Button
                type="submit"
                variant="secondary"
                loading={pendingAction === "save"}
                disabled={busy}
                icon={<Save />}
              >
                ذخیره پیش‌نویس
              </Button>
            </>
          )}
          {article.id && (
            <LinkButton
              href={`/admin/articles/${article.id}/preview`}
              variant="ghost"
              icon={<Eye />}
              external
            >
              پیش‌نمایش صفحه (نسخه ذخیره‌شده)
            </LinkButton>
          )}
        </div>
        {notice && (
          <Alert tone={notice.tone}>
            {notice.text}
          </Alert>
        )}
      </Panel>

      {article.id && (
        <Panel title="حذف مقاله">
          <p className="text-ink">
            مقاله و نشانی‌های قدیمی آن برای همیشه حذف می‌شود و بازگرداندنی نیست. اگر فقط
            می‌خواهید از وب‌سایت برداشته شود، «لغو انتشار» را بزنید.
          </p>
          {confirmDelete ? (
            <div role="alertdialog" aria-label="تأیید حذف مقاله" className="flex flex-wrap items-center gap-3">
              <p className="font-bold text-danger-ink">این مقاله برای همیشه حذف شود؟</p>
              <Button
                type="button"
                variant="danger"
                loading={pendingAction === "delete"}
                disabled={busy}
                icon={<Trash2 />}
                onClick={remove}
              >
                بله، حذف شود
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                autoFocus
                onClick={() => setConfirmDelete(false)}
              >
                انصراف
              </Button>
            </div>
          ) : (
            <div>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                icon={<Trash2 />}
                onClick={() => setConfirmDelete(true)}
              >
                حذف مقاله…
              </Button>
            </div>
          )}
        </Panel>
      )}
    </form>
  );
}
