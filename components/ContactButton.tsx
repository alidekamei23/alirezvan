// ContactButton — shared base for CallButton, WhatsAppButton and BaleButton. Reads the
// destination from content/lawyer.ts so numbers are never typed into pages.
// Use the three named buttons in pages; use this directly only to add a new channel.
import type { ReactNode } from "react";
import { MessageCircle, Phone, Send, type LucideIcon } from "lucide-react";
import { LinkButton } from "@/components/LinkButton";
import type { ButtonSize, ButtonVariant } from "@/components/buttonStyles";
import { contactLinks } from "@/content/lawyer";

export type ContactChannel = "call" | "whatsapp" | "bale";

export const contactChannels: Record<
  ContactChannel,
  { href: string; label: string; shortLabel: string; Icon: LucideIcon; external: boolean }
> = {
  call: {
    href: contactLinks.call,
    label: "تماس با دفتر",
    shortLabel: "تماس",
    Icon: Phone,
    external: false,
  },
  whatsapp: {
    href: contactLinks.whatsapp,
    label: "پیام در واتس‌اپ",
    shortLabel: "واتس‌اپ",
    Icon: MessageCircle,
    external: true,
  },
  bale: {
    href: contactLinks.bale,
    label: "پیام در بله",
    shortLabel: "بله",
    Icon: Send,
    external: true,
  },
};

export type ContactButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  /** Replaces the default label. */
  children?: ReactNode;
};

export function ContactButton({
  channel,
  variant = "secondary",
  children,
  ...rest
}: ContactButtonProps & { channel: ContactChannel }) {
  const { href, label, Icon, external } = contactChannels[channel];
  return (
    <LinkButton
      href={href}
      external={external}
      variant={variant}
      icon={<Icon />}
      {...rest}
    >
      {children ?? label}
    </LinkButton>
  );
}
