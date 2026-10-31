// ContactBox — a small contact prompt placed inside a blog post, after its second
// section (CLAUDE.md §5.5). In MDX it is available without an import: <ContactBox />.
// The page-closing band is ContactCta; this one sits within the reading column.
import { CallButton } from "@/components/CallButton";
import { LinkButton } from "@/components/LinkButton";
import { requestNav } from "@/content/navigation";

export function ContactBox() {
  return (
    <aside
      aria-label="درخواست مشاوره"
      className="not-prose rounded-md border border-primary-line bg-primary-soft p-5"
    >
      <p className="font-bold text-ink">پرونده شما شرایط خودش را دارد</p>
      <p className="mt-1 text-sm text-ink">
        مطالب این مقاله جنبه عمومی دارد و جایگزین مشاوره نیست. برای بررسی مدارک و شرایط
        پرونده خود، می‌توانید درخواست مشاوره ثبت کنید یا با دفتر تماس بگیرید.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <LinkButton href={requestNav.href} variant="secondary" size="sm">
          {requestNav.label}
        </LinkButton>
        <CallButton variant="ghost" size="sm" />
      </div>
    </aside>
  );
}
