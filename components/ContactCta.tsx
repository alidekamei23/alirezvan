// ContactCta — the closing band of a content page with the three exits: consultation
// request (the primary action), call, and WhatsApp/Bale. Place it once, at the end.
// Usage: <ContactCta /> or <ContactCta title="…" text="…" />
import { BaleButton } from "@/components/BaleButton";
import { CallButton } from "@/components/CallButton";
import { Container } from "@/components/Container";
import { LinkButton } from "@/components/LinkButton";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { requestNav } from "@/content/navigation";

export function ContactCta({
  title = "برای بررسی پرونده خود مشاوره بگیرید",
  text = "موضوع را در چند سطر بنویسید تا دفتر برای هماهنگی زمان مشاوره با شما تماس بگیرد.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section
      aria-labelledby="contact-cta-title"
      className="border-t border-primary-line bg-primary-soft py-12 md:py-16"
    >
      <Container>
        <div className="max-w-reading">
          <h2 id="contact-cta-title" className="text-2xl font-bold text-ink">
            {title}
          </h2>
          <p className="mt-2 text-ink">{text}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <LinkButton href={requestNav.href} size="lg">
              {requestNav.label}
            </LinkButton>
            <CallButton size="lg" />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-2">
            <WhatsAppButton variant="ghost" size="sm" />
            <BaleButton variant="ghost" size="sm" />
          </div>
        </div>
      </Container>
    </section>
  );
}
