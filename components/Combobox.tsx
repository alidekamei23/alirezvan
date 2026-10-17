"use client";
// Combobox — a text field that filters a list as you type and picks one option, for lists
// too long for a plain Select (e.g. the 101 expert-fee subjects). Follows the ARIA
// combobox pattern: arrow keys move through the list, Enter picks, Escape closes. Long
// options wrap instead of being cut, and each can show its group under it. Matching
// ignores ی/ک spelling and zero-width non-joiners, and needs every typed word.
// Usage: <Combobox label="جستجوی سریع موضوع" options={[{ value, label, group }]} onSelect={…} />
import { useId, useState } from "react";
import { Search } from "lucide-react";
import { Field, controlClasses, fieldIds, type FieldBaseProps } from "@/components/Field";
import { cn } from "@/lib/cn";
import { normalizePersian, toPersianDigits } from "@/lib/format";

export type ComboboxOption = { value: string; label: string; group?: string };

const MAX_RESULTS = 50;

function normalize(text: string): string {
  return normalizePersian(text).replace(/‌/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

export function Combobox({
  label,
  hint,
  optional = true,
  placeholder,
  options,
  onSelect,
  noResults = "موردی پیدا نشد. واژه دیگری را امتحان کنید.",
}: Omit<FieldBaseProps, "error"> & {
  placeholder?: string;
  options: ComboboxOption[];
  onSelect: (value: string) => void;
  noResults?: string;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const { describedBy } = fieldIds(id, { hint });
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const words = normalize(query).split(" ").filter(Boolean);
  const matches =
    words.length === 0
      ? []
      : options
          .filter((option) => {
            const haystack = normalize(`${option.label} ${option.group ?? ""}`);
            return words.every((word) => haystack.includes(word));
          })
          .slice(0, MAX_RESULTS);
  const showList = open && words.length > 0;
  const activeIndex = Math.min(active, Math.max(matches.length - 1, 0));

  const pick = (option: ComboboxOption) => {
    onSelect(option.value);
    setQuery("");
    setOpen(false);
    setActive(0);
  };

  return (
    <Field id={id} label={label} hint={hint} optional={optional}>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted"
        />
        <input
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={
            showList && matches.length > 0 ? `${id}-option-${activeIndex}` : undefined
          }
          aria-describedby={describedBy}
          placeholder={placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActive(Math.min(activeIndex + 1, matches.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive(Math.max(activeIndex - 1, 0));
            } else if (event.key === "Enter" && showList && matches[activeIndex]) {
              event.preventDefault();
              pick(matches[activeIndex]);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          className={controlClasses(undefined, "min-h-12 ps-10")}
        />
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          hidden={!showList}
          className="absolute inset-x-0 top-full z-overlay mt-1 max-h-80 overflow-y-auto rounded-sm border border-line-strong bg-surface py-1 shadow-md"
        >
          {matches.map((option, index) => (
            <li
              key={option.value}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              // mousedown, not click: the input would blur and close the list first.
              onMouseDown={(event) => {
                event.preventDefault();
                pick(option);
              }}
              onMouseMove={() => setActive(index)}
              className={cn(
                "flex min-h-11 cursor-pointer flex-col justify-center px-3 py-2",
                index === activeIndex && "bg-primary-soft",
              )}
            >
              <span className="text-ink">{toPersianDigits(option.label)}</span>
              {option.group && <span className="text-sm text-muted">{option.group}</span>}
            </li>
          ))}
          {matches.length === 0 && (
            <li role="presentation" className="px-3 py-2 text-sm text-muted">
              {noResults}
            </li>
          )}
        </ul>
      </div>
      <p className="sr-only" aria-live="polite">
        {showList ? `${toPersianDigits(matches.length)} مورد پیدا شد` : ""}
      </p>
    </Field>
  );
}
