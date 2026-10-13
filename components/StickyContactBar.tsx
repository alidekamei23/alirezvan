// StickyContactBar — call, WhatsApp and Bale, always within thumb reach below `lg`.
// It never covers content: the layout reserves its height at the bottom of the page,
// and it hides while a text field has focus (rule in app/globals.css) so it cannot sit
// on a field or the OTP boxes above the on-screen keyboard. Mounted once in the layout.
import { contactChannels, type ContactChannel } from "@/components/ContactButton";
import { cn } from "@/lib/cn";

// Channels without details yet (href null) are left out, and the bar keeps equal columns.
const channels = (["call", "whatsapp", "bale"] as ContactChannel[]).filter(
  (channel) => contactChannels[channel].href !== null,
);
const columns = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" }[channels.length];

export function StickyContactBar() {
  return (
    <nav
      data-contact-bar
      aria-label="راه‌های تماس"
      className="fixed inset-x-0 bottom-0 z-bar border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-md lg:hidden"
    >
      <ul
        className={cn(
          "mx-auto grid max-w-page divide-x divide-x-reverse divide-line",
          columns,
        )}
      >
        {channels.map((channel) => {
          const { href, shortLabel, label, Icon, external } = contactChannels[channel];
          return (
            <li key={channel}>
              <a
                href={href ?? undefined}
                aria-label={label}
                {...(external && { target: "_blank", rel: "noopener noreferrer" })}
                className={cn(
                  "flex min-h-(--contact-bar-height) items-center justify-center gap-2 text-sm font-semibold transition-colors -outline-offset-2 hover:bg-primary-soft active:bg-primary-soft-strong",
                  channel === "call" ? "text-primary" : "text-ink",
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
                {shortLabel}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
