// BaleButton — opens a Bale chat with the office in a new tab.
// Usage: <BaleButton /> or <BaleButton variant="ghost" size="sm" />.
import { ContactButton, type ContactButtonProps } from "@/components/ContactButton";

export function BaleButton(props: ContactButtonProps) {
  return <ContactButton channel="bale" {...props} />;
}
