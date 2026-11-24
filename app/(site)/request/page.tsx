import { connection } from "next/server";
import { Suspense } from "react";
import { BaleButton } from "@/components/BaleButton";
import { CallButton } from "@/components/CallButton";
import { Ltr } from "@/components/Ltr";
import { PageHeader } from "@/components/PageHeader";
import { RequestForm } from "@/components/RequestForm";
import { Section } from "@/components/Section";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { lawyer } from "@/content/lawyer";
import { requestCopy } from "@/content/pages";
import { toPersianDigits } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { getCodeSender } from "@/lib/sms";

export const metadata = pageMetadata({
  title: requestCopy.heading,
  description: requestCopy.metaDescription,
  path: "/request",
});

function OfficeContact({ primary = false }: { primary?: boolean }) {
  return (
    <div className="grid justify-items-start gap-3">
      <p className="text-xl font-bold text-ink"><Ltr>{toPersianDigits(lawyer.phone.display)}</Ltr></p>
      <div className="flex flex-wrap gap-2">
        <CallButton variant={primary ? "primary" : "secondary"} />
        <WhatsAppButton />
        <BaleButton />
      </div>
    </div>
  );
}

export default function RequestPage() {
  return <Suspense>
    <RequestContent />
  </Suspense>;
}

async function RequestContent() {
  await connection();
  const enabled = Boolean(getCodeSender());
  return (
    <>
      <PageHeader title={requestCopy.heading}
        lead={enabled ? requestCopy.lead : requestCopy.contactLead}
        crumbs={[{ label: requestCopy.heading }]}>
        {!enabled && <div className="mt-5"><OfficeContact primary /></div>}
      </PageHeader>

      {enabled ? (
        <Section id="request-details" className="py-8 md:py-12">
          <div className="grid gap-8 md:grid-cols-[minmax(0,var(--container-form))_minmax(0,1fr)] lg:gap-12">
            <RequestForm />
            <aside aria-labelledby="request-office-heading" className="max-w-form border-t border-line pt-5 md:border-s md:border-t-0 md:ps-6 md:pt-0">
              <h2 id="request-office-heading" className="mb-3 text-base font-bold">تماس مستقیم با دفتر</h2>
              <OfficeContact />
            </aside>
          </div>
        </Section>
      ) : (
        <Section id="prepare" title={requestCopy.prepareHeading}>
          <ul className="max-w-reading list-disc ps-6">
            {requestCopy.prepare.map((item) => <li key={item} className="py-1">{item}</li>)}
          </ul>
          <p className="mt-4 max-w-reading text-muted">{requestCopy.note}</p>
        </Section>
      )}
    </>
  );
}
