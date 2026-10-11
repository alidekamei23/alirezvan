// DraftNotice — a visible warning on pages whose legal copy the lawyer has not reviewed
// yet. It must not exist on any public page at launch: remove the `reviewed: false`
// flag that triggers it once the copy is approved. Usage: <DraftNotice />
import { Alert } from "@/components/Alert";
import { DRAFT_NOTICE } from "@/content/pages";

export function DraftNotice({ className }: { className?: string }) {
  return (
    <Alert tone="warning" title={DRAFT_NOTICE.title} className={className}>
      {DRAFT_NOTICE.text}
    </Alert>
  );
}
