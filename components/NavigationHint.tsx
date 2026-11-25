"use client";

import { useLinkStatus } from "next/link";
import { createPortal } from "react-dom";

// The link owns the pending state. The sticky header stays visible when its menu closes.
export function NavigationHint() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  const status = document.getElementById("header-nav-status");
  return status && createPortal(
    <>
      <span className="sr-only">در حال باز کردن صفحه…</span>
      <span aria-hidden="true" className="navigation-hint" />
    </>,
    status,
  );
}
