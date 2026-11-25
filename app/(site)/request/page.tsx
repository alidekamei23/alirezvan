import { connection } from "next/server";
import { BaleButton } from "@/components/BaleButton";
import { CallButton } from "@/components/CallButton";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { Ltr } from "@/components/Ltr";
import { RequestForm } from "@/components/RequestForm";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { lawyer } from "@/content/lawyer";
import { requestCopy } from "@/content/pages";
import { toPersianDigits } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/schema";
import { getCodeSender } from "@/lib/sms";

export const metadata = pageMetadata({
  title: requestCopy.heading,
  description: requestCopy.metaDescription,
  path: "/request",
});

const trail = [{ label: "خانه", href: "/" }, { label: requestCopy.heading }];

export default async function RequestPage() {
  await connection();
  const enabled = Boolean(getCodeSender());
  return (
    <Container className="py-3 sm:py-4">
      <div id="request-details" className="mx-auto grid max-w-[64rem] gap-3">
        <JsonLd data={breadcrumbSchema(trail.map(({ label, href }) => ({ name: label, href })))} />
        <RequestForm enabled={enabled} />
        <aside id="office-contact" aria-labelledby="request-office-heading"
          className="flex scroll-mt-24 flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-md border border-line bg-surface px-4 py-2 sm:px-6">
          <h2 id="request-office-heading" className="font-bold">تماس مستقیم با دفتر</h2>
          <div className="flex flex-wrap items-center gap-x-1">
            <CallButton size="sm" variant="ghost"><Ltr>{toPersianDigits(lawyer.phone.display)}</Ltr></CallButton>
            <WhatsAppButton size="sm" variant="ghost">واتس‌اپ</WhatsAppButton>
            <BaleButton size="sm" variant="ghost">بله</BaleButton>
          </div>
        </aside>
        {!enabled && (
          <details className="rounded-md border border-line bg-surface px-4">
            <summary className="cursor-pointer py-3 font-semibold">{requestCopy.prepareHeading}</summary>
            <ul className="list-disc ps-6">{requestCopy.prepare.map(item => <li key={item}>{item}</li>)}</ul>
            <p className="py-3 text-sm text-muted">{requestCopy.note}</p>
          </details>
        )}
      </div>
    </Container>
  );
}
