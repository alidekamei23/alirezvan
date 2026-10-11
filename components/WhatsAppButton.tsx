// WhatsAppButton — opens a WhatsApp chat with the office in a new tab.
// Usage: <WhatsAppButton /> or <WhatsAppButton variant="ghost" size="sm" />.
import { ContactButton, type ContactButtonProps } from "@/components/ContactButton";

export function WhatsAppButton(props: ContactButtonProps) {
  return <ContactButton channel="whatsapp" {...props} />;
}
