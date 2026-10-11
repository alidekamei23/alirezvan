import { MessageCircle, Phone, Send } from "lucide-react";
import { contactLinks } from "@/content/lawyer";

const actions = [
  { href: contactLinks.call, label: "تماس", Icon: Phone, external: false },
  {
    href: contactLinks.whatsapp,
    label: "واتس‌اپ",
    Icon: MessageCircle,
    external: true,
  },
  { href: contactLinks.bale, label: "بله", Icon: Send, external: true },
];

/** Sticky bottom bar on small screens. The layout reserves space for it (`pb-16`). */
export function ContactBar() {
  return (
    <nav
      aria-label="راه‌های تماس"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-6xl grid-cols-3">
        {actions.map(({ href, label, Icon, external }, index) => (
          <li key={href}>
            <a
              href={href}
              {...(external && { target: "_blank", rel: "noopener noreferrer" })}
              className={`flex min-h-14 items-center justify-center gap-2 text-sm font-semibold ${
                index === 0
                  ? "bg-accent text-on-accent"
                  : "border-s border-line text-ink"
              }`}
            >
              <Icon aria-hidden="true" className="size-5" />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
