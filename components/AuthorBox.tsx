// AuthorBox — the author of a blog post: photo, name, grade, license number, a link to the
// About page and the license lookup on the licensing body's site. Usage: <AuthorBox />
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Ltr } from "@/components/Ltr";
import { lawyer } from "@/content/lawyer";
import { toPersianDigits } from "@/lib/format";

export function AuthorBox() {
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
        {lawyer.licenseLookupUrl && (
          <a
            href={lawyer.licenseLookupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
          >
            استعلام پروانه
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        )}
      </div>
    </aside>
  );
}
