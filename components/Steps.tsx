// Steps — an ordered sequence (a legal route, a process). Numbered because the order is
// real; don't use it for unordered lists of features.
// Usage: <Steps items={[{ title: "…", text: "…" }]} />
import { toPersianDigits } from "@/lib/format";

export type StepItem = { title: string; text: string };

export function Steps({ items }: { items: StepItem[] }) {
  return (
    <ol className="max-w-reading">
      {items.map((item, index) => (
        <li key={item.title} className="group flex gap-4">
          <div className="flex flex-col items-center">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary bg-surface text-lg font-bold text-primary"
            >
              {toPersianDigits(index + 1)}
            </span>
            <span className="w-px flex-1 bg-primary-line group-last:hidden" />
          </div>
          <div className="pb-8 group-last:pb-0">
            <h3 className="pt-1 text-lg font-bold text-ink">{item.title}</h3>
            <p className="mt-1 text-ink">{item.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
