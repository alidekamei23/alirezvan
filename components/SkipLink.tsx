// SkipLink — the first focusable element on every page; lets keyboard users jump past
// the header to <main id="main">. Mounted once in the layout.
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:start-4 focus-visible:top-4 focus-visible:z-toast focus-visible:rounded-sm focus-visible:bg-surface focus-visible:px-4 focus-visible:py-3 focus-visible:font-semibold focus-visible:text-primary focus-visible:shadow-md"
    >
      رفتن به محتوای اصلی
    </a>
  );
}
