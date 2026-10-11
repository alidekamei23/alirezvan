// LawyerCard — who the lawyer is and how to verify it: name, grade, licensing body,
// license number and the official lookup link (CLAUDE.md §2.1). All data comes from
// content/lawyer.ts. Usage: <LawyerCard /> or <LawyerCard showPhoto={false} />
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { Card } from "@/components/Card";
import { Ltr } from "@/components/Ltr";
import { lawyer } from "@/content/lawyer";
import { toPersianDigits } from "@/lib/format";

export function LawyerCard({ showPhoto = true }: { showPhoto?: boolean }) {
  return (
    <Card padding="lg">
      <div className="flex flex-col gap-5 xs:flex-row xs:items-start">
        {showPhoto && lawyer.avatar && (
          <Image
            src={lawyer.avatar.src}
            alt={`تصویر ${lawyer.name}`}
            width={lawyer.avatar.width}
            height={lawyer.avatar.height}
            sizes="96px"
            className="size-24 shrink-0 rounded-md border border-line"
          />
        )}
        <div className="min-w-0">
          <p className="text-xl font-bold text-ink">{lawyer.name}</p>
          <p className="text-muted">{lawyer.grade}</p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted">مرجع صدور پروانه</dt>
            <dd className="font-semibold text-ink">{lawyer.licensingBody}</dd>
            <dt className="text-muted">شماره پروانه</dt>
            <dd className="font-semibold text-ink">
              <Ltr>{toPersianDigits(lawyer.licenseNumber)}</Ltr>
            </dd>
          </dl>
          {lawyer.licenseLookupUrl && (
            <a
              href={lawyer.licenseLookupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              استعلام پروانه در سامانه مرجع صدور
              <ExternalLink aria-hidden="true" className="size-4" />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
