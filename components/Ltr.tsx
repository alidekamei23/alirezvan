// Ltr — isolates left-to-right content (phone numbers, URLs, emails, Latin codes) inside
// Persian text so the bidi algorithm cannot reorder it. Usage: <Ltr>۰۲۱-۱۲۳۴۵۶۷۸</Ltr>.
import type { ReactNode } from "react";

export function Ltr({ children }: { children: ReactNode }) {
  return (
    <bdi dir="ltr" className="inline-block">
      {children}
    </bdi>
  );
}
