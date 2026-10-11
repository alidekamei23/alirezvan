// AuthorBox — the compact author line on a guide: photo, name, grade, license number,
// last legal review date and a link to the About page.
// Usage: <AuthorBox reviewedAt="1405-07-12" />
import Image from "next/image";
import Link from "next/link";
import { Ltr } from "@/components/Ltr";
import { ReviewedAt } from "@/components/ReviewedAt";
import { lawyer } from "@/content/lawyer";
import { toPersianDigits } from "@/lib/format";

export function AuthorBox({ reviewedAt }: { reviewedAt: string }) {
  return (
    <aside
      aria-label="نویسنده"
      className="flex items-start gap-4 rounded-md border border-line bg-surface p-4"
    >
      {lawyer.avatar && (
        <Image
          src={lawyer.avatar.src}
          alt=""
          width={lawyer.avatar.width}
          height={lawyer.avatar.height}
          sizes="56px"
          className="size-14 shrink-0 rounded-full border border-line"
        />
      )}
      <div className="min-w-0 text-sm">
        <Link
          href="/about"
          className="inline-flex min-h-11 items-center text-base font-bold text-ink underline-offset-4 hover:text-primary hover:underline"
        >
          {lawyer.name}
        </Link>
        <p className="text-muted">
          {lawyer.grade}، شماره پروانه <Ltr>{toPersianDigits(lawyer.licenseNumber)}</Ltr>
        </p>
        <ReviewedAt date={reviewedAt} className="mt-1" />
      </div>
    </aside>
  );
}
