"use client";
// Toast — a short confirmation that disappears by itself ("کپی شد"). Not for errors the
// visitor must act on; use Alert for those. ToastProvider is mounted once in the layout.
// Usage: const toast = useToast(); toast("نتیجه کپی شد");
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleCheck, X } from "lucide-react";

type ToastItem = { id: number; message: string };

const ToastContext = createContext<(message: string) => void>(() => {});

const DURATION_MS = 5000;

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (message: string) => {
      const id = nextId.current++;
      setItems((current) => [...current.slice(-2), { id, message }]);
      window.setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--contact-bar-height)+env(safe-area-inset-bottom)+1rem)] z-toast flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto flex w-full max-w-form items-center gap-3 rounded-sm border border-line bg-surface py-1 ps-4 pe-1 text-sm text-ink shadow-md"
          >
            <CircleCheck aria-hidden="true" className="size-5 shrink-0 text-primary" />
            <p className="min-w-0 flex-1 py-2">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="بستن پیام"
              className="flex size-11 shrink-0 items-center justify-center rounded-sm text-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
