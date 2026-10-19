import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { Skeleton } from "@/components/Skeleton";
import { AskForm } from "@/components/questions/AskForm";
import { QUESTIONS_HREF, ASK_HREF, askCopy, questionsCopy } from "@/content/questions";
import { freshFormToken } from "@/lib/questions/config";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: askCopy.metaTitle,
  description: askCopy.metaDescription,
  path: ASK_HREF,
});

/** The form with a timestamp signed now, for this visitor (see lib/questions/secure.ts). */
async function FreshAskForm() {
  await connection();
  return <AskForm token={freshFormToken()} />;
}

export default function AskPage() {
  return (
    <>
      <PageHeader
        title={askCopy.heading}
        lead={askCopy.lead}
        crumbs={[{ label: questionsCopy.heading, href: QUESTIONS_HREF }, { label: askCopy.heading }]}
      />
      <Section width="form">
        <Suspense
          fallback={
            <div aria-busy="true" className="flex flex-col gap-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-56 w-full" />
            </div>
          }
        >
          <FreshAskForm />
        </Suspense>
      </Section>
    </>
  );
}
