"use client";
// MarkdownEditor — the admin's text editor: a toolbar (section heading, bold, link, list,
// image, and optionally the contact-box marker), the Markdown text box, and a live
// preview beside it rendered by ArticleBody, the same component as the public page.
// Used for article bodies and for the answers of the Q&A section.
// Usage: <MarkdownEditor label="متن" value={text} onChange={setText} error={errors.content} />
import { useDeferredValue, useId, useRef, useState, type ReactNode } from "react";
import { Bold, Heading2, ImagePlus, Link2, List, MessageSquareQuote } from "lucide-react";
import { ArticleBody, CONTACT_BOX_MARKER } from "@/components/ArticleBody";
import { Button } from "@/components/Button";
import { FieldError, FieldHint, FieldLabel, controlClasses } from "@/components/Field";
import { TextField } from "@/components/TextField";
import { IMAGE_TYPES, uploadImage } from "@/components/admin/upload";

const toolButton =
  "inline-flex min-h-11 items-center gap-1.5 rounded-sm border border-line-strong bg-surface px-3 text-sm font-semibold text-ink hover:border-ink disabled:cursor-not-allowed disabled:text-disabled-ink";

export function MarkdownEditor({
  label,
  hint,
  value,
  onChange,
  error,
  disabled = false,
  contactBox = true,
  previewLabel = "پیش‌نمایش متن",
  previewHint = "همان چیزی که خواننده در سایت می‌بیند.",
  emptyPreview = "هنوز متنی نوشته نشده است.",
  rows = 24,
  onUploadingChange,
}: {
  label: string;
  hint?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  /** Offer the contact-box marker and render the box in the preview (articles). */
  contactBox?: boolean;
  previewLabel?: string;
  previewHint?: string;
  emptyPreview?: string;
  rows?: number;
  /** Tells the parent an image is uploading, so it can hold its save buttons. */
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const id = useId();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const preview = useDeferredValue(value);
  const [imagePanel, setImagePanel] = useState(false);
  const [imageAlt, setImageAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  /** Wraps the selection, or inserts `placeholder` wrapped, and keeps the focus. */
  function wrapSelection(before: string, after: string, placeholder: string) {
    const area = textRef.current;
    if (!area) return;
    const { selectionStart: start, selectionEnd: end, value: current } = area;
    const selected = current.slice(start, end) || placeholder;
    onChange(current.slice(0, start) + before + selected + after + current.slice(end));
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  /** Inserts a block on its own line(s) at the cursor. */
  function insertBlock(block: string) {
    const area = textRef.current;
    const current = area?.value ?? value;
    const at = area?.selectionStart ?? current.length;
    const head = current.slice(0, at).replace(/\n*$/, "");
    const tail = current.slice(at).replace(/^\n*/, "");
    onChange(`${head}${head ? "\n\n" : ""}${block}${tail ? "\n\n" : "\n"}${tail}`);
    requestAnimationFrame(() => {
      const position = head.length + (head ? 2 : 0) + block.length;
      area?.focus();
      area?.setSelectionRange(position, position);
    });
  }

  async function onImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    onUploadingChange?.(true);
    setUploadError("");
    const result = await uploadImage(file);
    setUploading(false);
    onUploadingChange?.(false);
    if (!result.ok) {
      setUploadError(result.error);
      return;
    }
    // Brackets in the alt text would end the image syntax early.
    const alt = imageAlt.trim().replace(/[[\]]/g, "");
    insertBlock(`![${alt}](${result.path}#${result.width}x${result.height})`);
    setImageAlt("");
    setImagePanel(false);
  }

  const shownError = error || uploadError;

  return (
    <div className="flex flex-col gap-5">
      <div role="toolbar" aria-label="ابزارهای نگارش" aria-controls={id} className="flex flex-wrap gap-2">
        <button type="button" className={toolButton} onClick={() => insertBlock("## عنوان بخش")}>
          <Heading2 aria-hidden="true" className="size-4" />
          تیتر بخش
        </button>
        <button type="button" className={toolButton} onClick={() => wrapSelection("**", "**", "متن پررنگ")}>
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
        <button type="button" className={toolButton} onClick={() => insertBlock("- مورد نخست\n- مورد دوم")}>
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
        {contactBox && (
          <button type="button" className={toolButton} onClick={() => insertBlock(CONTACT_BOX_MARKER)}>
            <MessageSquareQuote aria-hidden="true" className="size-4" />
            جای کادر تماس
          </button>
        )}
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
            ref={fileRef}
            type="file"
            accept={IMAGE_TYPES}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              void onImage(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="secondary"
            loading={uploading}
            disabled={disabled || uploading}
            icon={<ImagePlus />}
            onClick={() => fileRef.current?.click()}
          >
            انتخاب و درج تصویر
          </Button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          {hint && <FieldHint>{hint}</FieldHint>}
          <textarea
            id={id}
            ref={textRef}
            rows={rows}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={shownError ? true : undefined}
            className={controlClasses(shownError, "min-h-96 resize-y py-2.5 leading-loose")}
          />
          {shownError && <FieldError>{shownError}</FieldError>}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="text-base font-semibold text-ink">{previewLabel}</p>
          <p className="text-sm text-muted">{previewHint}</p>
          <div
            aria-label={previewLabel}
            role="region"
            tabIndex={0}
            className="max-h-[48rem] min-h-96 overflow-y-auto rounded-sm border border-line bg-surface p-4"
          >
            {preview.trim() ? (
              <ArticleBody content={preview} contactBox={contactBox} />
            ) : (
              <p className="text-muted">{emptyPreview}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
