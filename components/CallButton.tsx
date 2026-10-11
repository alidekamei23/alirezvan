// CallButton — starts a phone call to the office (tel: link).
// Usage: <CallButton /> or <CallButton variant="ghost" size="sm" />.
import { ContactButton, type ContactButtonProps } from "@/components/ContactButton";

export function CallButton(props: ContactButtonProps) {
  return <ContactButton channel="call" {...props} />;
}
