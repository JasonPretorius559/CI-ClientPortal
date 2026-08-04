import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

export function Dialog({
  open,
  title,
  description,
  children,
  onClose,
  size = "md",
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  size?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <>
      <div className="dialog-overlay" aria-hidden="true" onClick={onClose} />
      <div className="dialog-frame flex items-start justify-center" role="dialog" aria-modal="true" aria-labelledby="workspace-dialog-title">
        <section className={`dialog-shell ${size === "lg" ? "!max-w-4xl" : ""}`}>
          <header className="flex items-start justify-between gap-4 border-b border-surface-line px-5 py-5 sm:px-6">
            <div className="min-w-0">
              <h2 id="workspace-dialog-title" className="text-xl font-semibold tracking-[-0.03em] text-ink-950">{title}</h2>
              {description ? <p className="mt-1 text-sm leading-6 text-ink-600">{description}</p> : null}
            </div>
            <Button type="button" variant="ghost" className="shrink-0 px-2" aria-label={`Close ${title}`} onClick={onClose}>
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </header>
          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-5 sm:p-6">{children}</div>
        </section>
      </div>
    </>
  );
}
